import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, insuranceDocumentsTable, certificatesTable } from "@workspace/db";
import { CreateInsuranceDocumentBody, ConfirmInsuranceDocumentBody } from "@workspace/api-zod";
import { openai } from "@workspace/integrations-openai-ai-server";
import { ObjectStorageService } from "../lib/objectStorage";

const router = Router();
const objectStorageService = new ObjectStorageService();

const DOC_TYPE_LABELS: Record<string, string> = {
  wc_coi: "Workers Compensation Certificate of Insurance",
  liability_coi: "General Liability Certificate of Insurance",
  loss_run: "Loss Run Report",
  liability_deck: "Liability Declarations Page",
};

/** Download a file from GCS and return its Buffer + content type */
async function downloadFileBuffer(fileKey: string): Promise<{ buffer: Buffer; contentType: string }> {
  const file = await objectStorageService.getObjectEntityFile(fileKey);
  const [contents] = await file.download();
  const [metadata] = await file.getMetadata();
  const contentType = String(metadata.contentType ?? "application/octet-stream");
  return { buffer: Buffer.from(contents), contentType };
}

/** Use GPT to extract insurance fields from text (for PDFs) */
async function extractFromText(text: string, docType: string): Promise<Record<string, unknown>> {
  const label = DOC_TYPE_LABELS[docType] ?? docType;
  const response = await openai.chat.completions.create({
    model: "gpt-5.1",
    max_completion_tokens: 1024,
    messages: [
      {
        role: "system",
        content:
          "You are an insurance document parser. Extract structured fields from the text and return ONLY valid JSON with no markdown.",
      },
      {
        role: "user",
        content: `Extract key fields from this ${label}. Return JSON with these fields (use null if not found):
{
  "policyNumber": string or null,
  "insurer": string or null,
  "insuredName": string or null,
  "coverageType": string or null,
  "effectiveDate": "YYYY-MM-DD" or null,
  "expirationDate": "YYYY-MM-DD" or null,
  "coverageAmount": number (in dollars) or null,
  "claimsCount": integer or null (for loss runs),
  "rawSummary": one-sentence summary,
  "confidence": "high" | "medium" | "low"
}

Document text:
${text.slice(0, 8000)}`,
      },
    ],
  });

  const raw = response.choices[0]?.message?.content ?? "{}";
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return { rawSummary: raw, confidence: "low" };
  }
}

/** Use GPT vision to extract insurance fields from an image */
async function extractFromImage(buffer: Buffer, contentType: string, docType: string): Promise<Record<string, unknown>> {
  const label = DOC_TYPE_LABELS[docType] ?? docType;
  const base64 = buffer.toString("base64");
  const dataUrl = `data:${contentType};base64,${base64}`;

  const response = await openai.chat.completions.create({
    model: "gpt-5.1",
    max_completion_tokens: 1024,
    messages: [
      {
        role: "system",
        content:
          "You are an insurance document parser. Extract structured fields from the image and return ONLY valid JSON with no markdown.",
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Extract key fields from this ${label}. Return JSON with these fields (use null if not found):
{
  "policyNumber": string or null,
  "insurer": string or null,
  "insuredName": string or null,
  "coverageType": string or null,
  "effectiveDate": "YYYY-MM-DD" or null,
  "expirationDate": "YYYY-MM-DD" or null,
  "coverageAmount": number (in dollars) or null,
  "claimsCount": integer or null (for loss runs),
  "rawSummary": one-sentence summary,
  "confidence": "high" | "medium" | "low"
}`,
          },
          {
            type: "image_url",
            image_url: { url: dataUrl, detail: "high" },
          },
        ],
      },
    ],
  });

  const raw = response.choices[0]?.message?.content ?? "{}";
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return { rawSummary: raw, confidence: "low" };
  }
}

// GET /insurance-documents?facilityId=X
router.get("/insurance-documents", async (req, res): Promise<void> => {
  const facilityId = parseInt(req.query.facilityId as string, 10);
  if (!facilityId) {
    res.status(400).json({ error: "facilityId is required" });
    return;
  }
  const rows = await db
    .select()
    .from(insuranceDocumentsTable)
    .where(eq(insuranceDocumentsTable.facilityId, facilityId))
    .orderBy(insuranceDocumentsTable.uploadedAt);

  res.json(
    rows.map((r) => ({
      ...r,
      uploadedAt: r.uploadedAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    })),
  );
});

// POST /insurance-documents — save record after client-side upload
router.post("/insurance-documents", async (req, res): Promise<void> => {
  const parsed = CreateInsuranceDocumentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.issues });
    return;
  }
  const [row] = await db
    .insert(insuranceDocumentsTable)
    .values({
      facilityId: parsed.data.facilityId,
      documentType: parsed.data.documentType,
      fileName: parsed.data.fileName,
      fileKey: parsed.data.fileKey,
      contentType: parsed.data.contentType,
      status: "uploaded",
    })
    .returning();

  res.status(201).json({
    ...row!,
    uploadedAt: row!.uploadedAt.toISOString(),
    updatedAt: row!.updatedAt.toISOString(),
  });
});

// POST /insurance-documents/:id/extract — AI extraction
router.post("/insurance-documents/:documentId/extract", async (req, res): Promise<void> => {
  const id = parseInt(String(req.params.documentId), 10);
  const [doc] = await db
    .select()
    .from(insuranceDocumentsTable)
    .where(eq(insuranceDocumentsTable.id, id))
    .limit(1);

  if (!doc) {
    res.status(404).json({ error: "Document not found" });
    return;
  }

  // Mark as extracting
  await db
    .update(insuranceDocumentsTable)
    .set({ status: "extracting" })
    .where(eq(insuranceDocumentsTable.id, id));

  try {
    const { buffer, contentType } = await downloadFileBuffer(doc.fileKey);

    let extracted: Record<string, unknown>;

    const isPdf =
      contentType.includes("pdf") ||
      doc.fileName.toLowerCase().endsWith(".pdf");

    if (isPdf) {
      // Dynamically require pdf-parse (CJS module) inside ESM context
      const { createRequire } = await import("node:module");
      const require = createRequire(import.meta.url);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const parseFn = require("pdf-parse") as (buf: Buffer) => Promise<{ text: string }>;
      const parsed = await parseFn(buffer);
      extracted = await extractFromText(parsed.text, doc.documentType);
    } else {
      extracted = await extractFromImage(buffer, contentType, doc.documentType);
    }

    await db
      .update(insuranceDocumentsTable)
      .set({ status: "extracted", extractedData: extracted })
      .where(eq(insuranceDocumentsTable.id, id));

    res.json(extracted);
  } catch (err) {
    req.log.error({ err }, "AI extraction failed");
    await db
      .update(insuranceDocumentsTable)
      .set({ status: "error" })
      .where(eq(insuranceDocumentsTable.id, id));
    res.status(500).json({ error: "Extraction failed", details: String(err) });
  }
});

// POST /insurance-documents/:id/confirm — confirm extracted data + create cert if COI
router.post("/insurance-documents/:documentId/confirm", async (req, res): Promise<void> => {
  const id = parseInt(String(req.params.documentId), 10);
  const parsed = ConfirmInsuranceDocumentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.issues });
    return;
  }

  const [doc] = await db
    .select()
    .from(insuranceDocumentsTable)
    .where(eq(insuranceDocumentsTable.id, id))
    .limit(1);

  if (!doc) {
    res.status(404).json({ error: "Document not found" });
    return;
  }

  const { extractedData } = parsed.data;
  let certificateId: number | null = doc.certificateId;

  // For COI types, create/update a certificate record
  if (doc.documentType === "wc_coi" || doc.documentType === "liability_coi") {
    const coverageType =
      doc.documentType === "wc_coi"
        ? "Workers Compensation"
        : extractedData?.coverageType ?? "General Liability";

    if (
      extractedData?.policyNumber &&
      extractedData?.insurer &&
      extractedData?.effectiveDate &&
      extractedData?.expirationDate
    ) {
      const fileUrl = `/api/storage/objects/${doc.fileKey.replace(/^\/objects\//, "")}`;
      const [cert] = await db
        .insert(certificatesTable)
        .values({
          facilityId: doc.facilityId,
          policyNumber: String(extractedData.policyNumber),
          insurer: String(extractedData.insurer),
          coverageType: String(coverageType),
          coverageAmount: Number(extractedData.coverageAmount ?? 0),
          effectiveDate: String(extractedData.effectiveDate),
          expirationDate: String(extractedData.expirationDate),
          status: "current",
          fileUrl,
        })
        .returning();
      certificateId = cert!.id;
    }
  }

  const [updated] = await db
    .update(insuranceDocumentsTable)
    .set({
      status: "confirmed",
      extractedData: extractedData as Record<string, unknown>,
      certificateId,
    })
    .where(eq(insuranceDocumentsTable.id, id))
    .returning();

  res.json({
    ...updated!,
    uploadedAt: updated!.uploadedAt.toISOString(),
    updatedAt: updated!.updatedAt.toISOString(),
  });
});

export default router;
