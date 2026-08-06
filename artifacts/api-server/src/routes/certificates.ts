import { Router } from "express";
import { db } from "@workspace/db";
import { certificatesTable, facilitiesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { UploadCertificateBody } from "@workspace/api-zod";
import { scopeWhere, inScope } from "../lib/scope";

const router = Router();

router.get("/certificates", async (req, res) => {
  const where = scopeWhere(certificatesTable.facilityId, req.scopeFacilityIds);
  const rows = where
    ? await db.select({ cert: certificatesTable, facilityName: facilitiesTable.name })
        .from(certificatesTable)
        .leftJoin(facilitiesTable, eq(certificatesTable.facilityId, facilitiesTable.id))
        .where(where)
    : await db.select({ cert: certificatesTable, facilityName: facilitiesTable.name })
        .from(certificatesTable)
        .leftJoin(facilitiesTable, eq(certificatesTable.facilityId, facilitiesTable.id));

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

  if (!inScope(req.scopeFacilityIds, data.facilityId)) {
    return res.status(403).json({ error: "Access denied" });
  }

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

  return res.status(201).json({
    ...cert,
    facilityName: null,
    uploadedAt: cert.uploadedAt?.toISOString() ?? new Date().toISOString(),
  });
});

router.get("/certificates/:certificateId", async (req, res) => {
  const certificateId = parseInt(req.params.certificateId as string);
  const [row] = await db.select({ cert: certificatesTable, facilityName: facilitiesTable.name })
    .from(certificatesTable)
    .leftJoin(facilitiesTable, eq(certificatesTable.facilityId, facilitiesTable.id))
    .where(eq(certificatesTable.id, certificateId));
  if (!row) return res.status(404).json({ error: "Certificate not found" });
  if (!inScope(req.scopeFacilityIds, row.cert.facilityId)) {
    return res.status(403).json({ error: "Access denied" });
  }
  const { cert: c, facilityName } = row;
  return res.json({
    id: c.id, facilityId: c.facilityId, facilityName,
    policyNumber: c.policyNumber, insurer: c.insurer,
    coverageType: c.coverageType, coverageAmount: c.coverageAmount,
    effectiveDate: c.effectiveDate, expirationDate: c.expirationDate,
    status: c.status, fileUrl: c.fileUrl,
    uploadedAt: c.uploadedAt?.toISOString() ?? new Date().toISOString(),
  });
});

export default router;
