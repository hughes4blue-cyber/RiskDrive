import { Router, type IRouter } from "express";
import { requireLiveMode, injectScopeParams } from "../middlewares/auth";
import healthRouter from "./health";
import authRouter from "./auth";
import clubsRouter from "./clubs";
import facilitiesRouter from "./facilities";
import driversRouter from "./drivers";
import vehiclesRouter from "./vehicles";
import riskRouter from "./risk";
import certificatesRouter from "./certificates";
import accidentsRouter from "./accidents";
import dashboardRouter from "./dashboard";
import trainingRouter from "./training";
import policiesRouter from "./policies";
import claimsRouter from "./claims";
import settlementsRouter from "./settlements";
import onboardingRouter from "./onboarding";
import telematicsRouter from "./telematics";
import auditRouter from "./audit";
import storageRouter from "./storage";
import insuranceDocumentsRouter from "./insurance_documents";

const router: IRouter = Router();

// Auth + public endpoints — no mode gating
router.use(healthRouter);
router.use(authRouter);

// All data routes: require live-mode auth when mode=live, then inject scope
router.use(requireLiveMode);
router.use(injectScopeParams);

router.use(clubsRouter);
router.use(facilitiesRouter);
router.use(driversRouter);
router.use(vehiclesRouter);
router.use(riskRouter);
router.use(certificatesRouter);
router.use(accidentsRouter);
router.use(dashboardRouter);
router.use(trainingRouter);
router.use(policiesRouter);
router.use(claimsRouter);
router.use(settlementsRouter);
router.use(onboardingRouter);
router.use(telematicsRouter);

// Audit log — super_admin only, no mode gating needed (requireAuth inside)
router.use(auditRouter);

// Object storage — presigned URL generation (public in demo, still gated in live via requireLiveMode above)
router.use(storageRouter);

// Insurance document upload + AI extraction
router.use(insuranceDocumentsRouter);

export default router;
