import { Router } from "express";
import { db } from "@workspace/db";
import { certificatesTable, facilitiesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { UploadCertificateBody } from "@workspace/api-zod";

const router = Router();

router.get("/certificates", async (req, res) => {
  const facilityId = req.query.facilityId ? parseInt(req.query.facilityId as string) : undefined;
  let rows;
  if (facilityId) {
    rows = await db.select({ cert: certificatesTable, facilityName: facilitiesTable.name })
      .from(certificatesTable)
      .leftJoin(facilitiesTable, eq(certificatesTable.facilityId, facilitiesTable.id))
      .where(eq(certificatesTable.facilityId, facilityId));
  } else {
    rows = await db.select({ cert: certificatesTable, facilityName: facilitiesTable.name })
      .from(certificatesTable)
      .leftJoin(facilitiesTable, eq(certificatesTable.facilityId, facilitiesTable.id));
  }

  res.json(rows.map(({ cert: c, facilityName }) => ({
    id: c.id, facilityId: c.facilityId, facilityName,
    policyNumber: c.policyNumber, insurer: c.insurer,
    coverageType: c.coverageType, coverageAmount: c.coverageAmount,
    effectiveDate: c.effectiveDate, expirationDate: c.expirationDate,
    status: c.status, fileUrl: c.fileUrl,
    uploadedAt: c.uploadedAt?.toISOString() ?? new Date().toISOString(),
  })));
});

router.post("/certificates", async (req, res) => {
  const parsed = UploadCertificateBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });
  const data = parsed.data;

  const now = new Date();
  const expDate = new Date(data.expirationDate);
  const daysUntilExp = (expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  const status = daysUntilExp < 0 ? "expired" : daysUntilExp < 30 ? "expiring_soon" : "current";

  const [cert] = await db.insert(certificatesTable).values({
    facilityId: data.facilityId,
    policyNumber: data.policyNumber,
    insurer: data.insurer,
    coverageType: data.coverageType,
    coverageAmount: data.coverageAmount,
    effectiveDate: data.effectiveDate,
    expirationDate: data.expirationDate,
    status,
    fileUrl: data.fileUrl ?? null,
  }).returning();

  res.status(201).json({
    ...cert,
    facilityName: null,
    uploadedAt: cert.uploadedAt?.toISOString() ?? new Date().toISOString(),
  });
});

router.get("/certificates/:certificateId", async (req, res) => {
  const certificateId = parseInt(req.params.certificateId);
  const [row] = await db.select({ cert: certificatesTable, facilityName: facilitiesTable.name })
    .from(certificatesTable)
    .leftJoin(facilitiesTable, eq(certificatesTable.facilityId, facilitiesTable.id))
    .where(eq(certificatesTable.id, certificateId));
  if (!row) return res.status(404).json({ error: "Certificate not found" });
  const { cert: c, facilityName } = row;
  res.json({
    id: c.id, facilityId: c.facilityId, facilityName,
    policyNumber: c.policyNumber, insurer: c.insurer,
    coverageType: c.coverageType, coverageAmount: c.coverageAmount,
    effectiveDate: c.effectiveDate, expirationDate: c.expirationDate,
    status: c.status, fileUrl: c.fileUrl,
    uploadedAt: c.uploadedAt?.toISOString() ?? new Date().toISOString(),
  });
});

export default router;
