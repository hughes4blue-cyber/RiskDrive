import { db } from "@workspace/db";
import {
  onboardingChecklistsTable,
  claimsTable,
  settlementRecordsTable,
  driverFeedbackTable,
} from "@workspace/db";
import { sql } from "drizzle-orm";
import { logger } from "./lib/logger";

export async function seedDemoDataIfEmpty() {
  try {
    const [obCount, claimsCount, settleCount, feedbackCount] = await Promise.all([
      db.select({ n: sql<number>`count(*)::int` }).from(onboardingChecklistsTable).then(r => r[0]!.n),
      db.select({ n: sql<number>`count(*)::int` }).from(claimsTable).then(r => r[0]!.n),
      db.select({ n: sql<number>`count(*)::int` }).from(settlementRecordsTable).then(r => r[0]!.n),
      db.select({ n: sql<number>`count(*)::int` }).from(driverFeedbackTable).then(r => r[0]!.n),
    ]);

    logger.info({ obCount, claimsCount, settleCount, feedbackCount }, "Demo seed check");

    if (obCount === 0) {
      logger.info("Seeding onboarding_checklists");
      await db.insert(onboardingChecklistsTable).values([
        { facilityId: 1, coiSubmitted: true, coiVerified: true, contractSigned: true, taxStatusVerified: true, articlesOfIncorporationVerified: true, driversLicenseRequirementsVerified: true, vehicleInspectionComplete: true, telematicsAgreementSigned: true, telematicsDeviceInstalled: true, backgroundChecksPassed: true, notes: "All documentation received and verified. Ready for full network deployment.", assignedRepName: "Marcus Webb", completedAt: new Date("2026-01-15T09:00:00Z") },
        { facilityId: 2, coiSubmitted: true, coiVerified: true, contractSigned: true, taxStatusVerified: true, articlesOfIncorporationVerified: true, driversLicenseRequirementsVerified: true, vehicleInspectionComplete: true, telematicsAgreementSigned: true, telematicsDeviceInstalled: true, backgroundChecksPassed: true, notes: "Smooth onboarding. Exemplary compliance team on site.", assignedRepName: "Marcus Webb", completedAt: new Date("2026-01-22T11:00:00Z") },
        { facilityId: 3, coiSubmitted: true, coiVerified: true, contractSigned: true, taxStatusVerified: true, articlesOfIncorporationVerified: false, driversLicenseRequirementsVerified: true, vehicleInspectionComplete: false, telematicsAgreementSigned: true, telematicsDeviceInstalled: true, backgroundChecksPassed: false, notes: "Waiting on updated articles of incorporation after ownership change. 2 drivers still need CDL upgrade.", assignedRepName: "Diana Cho" },
        { facilityId: 4, coiSubmitted: true, coiVerified: true, contractSigned: true, taxStatusVerified: false, articlesOfIncorporationVerified: false, driversLicenseRequirementsVerified: false, vehicleInspectionComplete: false, telematicsAgreementSigned: true, telematicsDeviceInstalled: false, backgroundChecksPassed: false, notes: "New hauler. Tax documents pending IRS verification. Vehicle inspection scheduled for next week.", assignedRepName: "Marcus Webb" },
        { facilityId: 5, coiSubmitted: true, coiVerified: false, contractSigned: true, taxStatusVerified: true, articlesOfIncorporationVerified: true, driversLicenseRequirementsVerified: true, vehicleInspectionComplete: true, telematicsAgreementSigned: true, telematicsDeviceInstalled: true, backgroundChecksPassed: true, notes: "COI verified but limits below AAA threshold. Working with broker to adjust.", assignedRepName: "Diana Cho" },
        { facilityId: 6, coiSubmitted: true, coiVerified: true, contractSigned: true, taxStatusVerified: true, articlesOfIncorporationVerified: true, driversLicenseRequirementsVerified: true, vehicleInspectionComplete: true, telematicsAgreementSigned: true, telematicsDeviceInstalled: true, backgroundChecksPassed: true, notes: "Largest facility in network. All requirements exceeded minimum standards.", assignedRepName: "Sarah Patel", completedAt: new Date("2026-02-01T14:00:00Z") },
        { facilityId: 7, coiSubmitted: false, coiVerified: false, contractSigned: false, taxStatusVerified: false, articlesOfIncorporationVerified: false, driversLicenseRequirementsVerified: false, vehicleInspectionComplete: false, telematicsAgreementSigned: false, telematicsDeviceInstalled: false, backgroundChecksPassed: false, notes: "New application received. Kickoff call scheduled for next week.", assignedRepName: "Sarah Patel" },
        { facilityId: 8, coiSubmitted: true, coiVerified: true, contractSigned: true, taxStatusVerified: true, articlesOfIncorporationVerified: true, driversLicenseRequirementsVerified: true, vehicleInspectionComplete: false, telematicsAgreementSigned: true, telematicsDeviceInstalled: true, backgroundChecksPassed: true, notes: "Vehicle inspection rescheduled twice. All other items complete.", assignedRepName: "Marcus Webb" },
        { facilityId: 9, coiSubmitted: true, coiVerified: true, contractSigned: true, taxStatusVerified: true, articlesOfIncorporationVerified: true, driversLicenseRequirementsVerified: true, vehicleInspectionComplete: true, telematicsAgreementSigned: true, telematicsDeviceInstalled: true, backgroundChecksPassed: true, notes: "Efficient onboarding. Fleet already telematics-equipped from prior carrier.", assignedRepName: "Diana Cho", completedAt: new Date("2026-03-10T10:00:00Z") },
      ]);
    }

    if (settleCount === 0) {
      logger.info("Seeding settlement_records");
      await db.insert(settlementRecordsTable).values([
        { facilityId: 1, periodMonth: "2026-04", grossSettlement: 48200, insurancePremiumDeduction: 6025, netPayout: 42175, status: "paid", paidAt: new Date("2026-05-05") },
        { facilityId: 2, periodMonth: "2026-04", grossSettlement: 31500, insurancePremiumDeduction: 3150, netPayout: 28350, status: "paid", paidAt: new Date("2026-05-05") },
        { facilityId: 3, periodMonth: "2026-04", grossSettlement: 22800, insurancePremiumDeduction: 3238, netPayout: 19562, status: "pending" },
        { facilityId: 4, periodMonth: "2026-03", grossSettlement: 19400, insurancePremiumDeduction: 2289, netPayout: 17111, status: "paid", paidAt: new Date("2026-04-05") },
        { facilityId: 5, periodMonth: "2026-04", grossSettlement: 41000, insurancePremiumDeduction: 3895, netPayout: 37105, status: "paid", paidAt: new Date("2026-05-05") },
        { facilityId: 6, periodMonth: "2026-04", grossSettlement: 67300, insurancePremiumDeduction: 5384, netPayout: 61916, status: "paid", paidAt: new Date("2026-05-05") },
        { facilityId: 7, periodMonth: "2026-04", grossSettlement: 14200, insurancePremiumDeduction: 2556, netPayout: 11644, status: "pending" },
        { facilityId: 8, periodMonth: "2026-04", grossSettlement: 38900, insurancePremiumDeduction: 4279, netPayout: 34621, status: "paid", paidAt: new Date("2026-05-05") },
        { facilityId: 9, periodMonth: "2026-04", grossSettlement: 29700, insurancePremiumDeduction: 2673, netPayout: 27027, status: "paid", paidAt: new Date("2026-05-05") },
      ]);
    }

    // Also reseed if existing claims use old status values (open/under_review)
    // instead of the current pipeline statuses (fnol_received/assigned/etc.)
    const hasNewFormatClaims = claimsCount > 0
      ? await db.select({ n: sql<number>`count(*)::int` })
          .from(claimsTable)
          .where(sql`status IN ('fnol_received','assigned','under_investigation','adjudication')`)
          .then(r => r[0]!.n > 0)
      : false;

    if (claimsCount === 0 || !hasNewFormatClaims) {
      if (claimsCount > 0) {
        logger.info("Claims have stale status values — truncating and reseeding");
        await db.execute(sql`TRUNCATE claims RESTART IDENTITY CASCADE`);
      }
      logger.info("Seeding claims");
      await seedClaims();
    }

    if (feedbackCount === 0) {
      logger.info("Seeding driver_feedback");
      await seedDriverFeedback();
    }

    logger.info("Demo seed complete");
  } catch (err) {
    logger.error({ err }, "Failed to seed demo data — continuing without seed");
  }
}

async function seedClaims() {
  const d = (iso: string) => new Date(iso);
  await db.insert(claimsTable).values([
    // FNOL Received
    {
      facilityId: 5, driverId: 9, claimNumber: "CLM-2026-0051", tpaName: "Sedgwick",
      status: "fnol_received", severity: "moderate",
      description: "FleetLytics collision alert auto-triggered FNOL at 2:47 PM. Vehicle struck guardrail during emergency maneuver on I-78 westbound. Dashcam footage already secured by FleetLytics platform. No injuries reported. Reserve based on estimated vehicle damage.",
      reserveAmount: 18500, fnolReceivedAt: d("2026-05-29T14:47:00Z"),
    },
    {
      facilityId: 7, claimNumber: "CLM-2026-0050", tpaName: "Gallagher Bassett",
      status: "fnol_received", severity: "minor",
      description: "Customer reports damage to their vehicle during flatbed tow. Driver denies fault and reports pre-existing damage at pickup. FleetLytics route, speed, and pickup-point footage being pulled to establish timeline and condition at pickup.",
      reserveAmount: 9200, fnolReceivedAt: d("2026-05-28T11:00:00Z"),
    },
    // Assigned
    {
      facilityId: 3, driverId: 5, claimNumber: "CLM-2026-0048", tpaName: "Gallagher Bassett",
      status: "assigned", severity: "moderate",
      description: "Third-party alleges vehicle damage from debris during tow operation. FleetLytics footage shows driver followed all loading protocols and speed was compliant. Adjuster assigned. Likely exoneration based on footage preview.",
      reserveAmount: 15000, adjusterName: "Ray Castillo",
      fnolReceivedAt: d("2026-05-22T09:00:00Z"), assignedAt: d("2026-05-23T08:00:00Z"),
    },
    {
      facilityId: 8, claimNumber: "CLM-2026-0046", tpaName: "Sedgwick",
      status: "assigned", severity: "serious",
      description: "Rear-end collision at red light — third party sustained airbag deployment and reports neck pain. FleetLytics telematics confirm hard braking event 1.4 seconds before impact, confirming driver attempted avoidance. Reviewing third-party brake light footage.",
      reserveAmount: 42000, adjusterName: "Tom Hargrove",
      fnolReceivedAt: d("2026-05-20T15:30:00Z"), assignedAt: d("2026-05-20T17:00:00Z"),
    },
    // Under Investigation
    {
      facilityId: 2, driverId: 3, claimNumber: "CLM-2026-0041", tpaName: "Sedgwick",
      status: "under_investigation", severity: "serious",
      description: "Sideswipe on I-95 during lane change. Third party claims significant damage and soft-tissue injury. FleetLytics dashcam shows merging third-party vehicle cut into our driver's lane first. Pursuing 80/20 shared-fault finding.",
      reserveAmount: 31500, adjusterName: "Lisa Monroe",
      litigationNotes: "Dashcam clearly shows third-party unsafe lane change. Expected to reduce reserve by ~$24K through fault allocation.",
      fnolReceivedAt: d("2026-05-10T12:00:00Z"), assignedAt: d("2026-05-11T09:00:00Z"), investigationStartedAt: d("2026-05-12T09:00:00Z"),
    },
    {
      facilityId: 4, driverId: 7, claimNumber: "CLM-2026-0038", tpaName: "Sedgwick",
      status: "under_investigation", severity: "minor",
      description: "Backing accident in customer driveway — struck low retaining wall at under 4 mph (confirmed by telematics). Customer claims extensive landscaping damage well beyond what on-scene photos support. Investigating inflated damage claim.",
      reserveAmount: 12800, adjusterName: "Tom Hargrove",
      fnolReceivedAt: d("2026-05-08T10:00:00Z"), assignedAt: d("2026-05-08T13:00:00Z"), investigationStartedAt: d("2026-05-09T09:00:00Z"),
    },
    {
      facilityId: 6, driverId: 11, claimNumber: "CLM-2026-0035", tpaName: "Gallagher Bassett",
      status: "under_investigation", severity: "minor",
      description: "Driver slipped on wet pavement while securing tow chain — sprained wrist, no fracture. Workers Compensation claim. Medical treatment and 3-day restricted duty. Safety protocol review underway.",
      reserveAmount: 8500, adjusterName: "Ray Castillo",
      fnolReceivedAt: d("2026-05-05T07:30:00Z"), assignedAt: d("2026-05-06T09:00:00Z"), investigationStartedAt: d("2026-05-07T09:00:00Z"),
    },
    // Adjudication / Litigated
    {
      facilityId: 1, driverId: 1, claimNumber: "CLM-2026-0029", tpaName: "Sedgwick",
      status: "adjudication", severity: "serious", isLitigated: true,
      description: "Red-light intersection collision — third party initially claimed fault was ours. FleetLytics dashcam captured clear footage of third party running the light at full speed. Litigated after third party filed suit.",
      reserveAmount: 68000, adjusterName: "Lisa Monroe",
      litigationNotes: "Trial prep underway. FleetLytics dashcam footage submitted as primary evidence. Defense counsel confident. Expect full exoneration or favorable settlement under $5K based on footage clarity.",
      fnolReceivedAt: d("2026-04-18T14:00:00Z"), assignedAt: d("2026-04-18T16:00:00Z"), investigationStartedAt: d("2026-04-20T09:00:00Z"), adjudicatedAt: d("2026-05-10T09:00:00Z"),
    },
    {
      facilityId: 9, claimNumber: "CLM-2026-0025", tpaName: "Gallagher Bassett",
      status: "adjudication", severity: "moderate", isLitigated: true,
      description: "Multi-vehicle incident during severe weather. Our driver was stationary when struck from behind. FleetLytics GPS confirms zero movement at time of impact. Third party disputing and alleging rear-end liability on our part.",
      reserveAmount: 27000, adjusterName: "Ray Castillo",
      litigationNotes: "GPS and telematics unambiguously show vehicle was stopped. Mediation scheduled. Strong exoneration case — GPS timestamp aligns with third-party impact report to the second.",
      fnolReceivedAt: d("2026-04-10T09:00:00Z"), assignedAt: d("2026-04-11T09:00:00Z"), investigationStartedAt: d("2026-04-14T09:00:00Z"), adjudicatedAt: d("2026-05-01T09:00:00Z"),
    },
    // Closed — Exonerated
    {
      facilityId: 5, driverId: 9, claimNumber: "CLM-2026-0019", tpaName: "Gallagher Bassett",
      status: "closed", severity: "serious", exonerationStatus: "exonerated",
      description: "T-bone collision at intersection. Third party alleged our driver ran red light. FleetLytics dashcam conclusively showed third party entered intersection at 47 mph on red. Full exoneration — $74K reserve fully released.",
      reserveAmount: 74000, settlementAmount: 0, adjusterName: "Lisa Monroe",
      litigationNotes: "FULL EXONERATION. Dashcam footage decisive — third party admitted fault after footage review. Premium impact: none. FleetLytics data directly prevented a major loss. Carrier notified for renewal rate credit.",
      fnolReceivedAt: d("2026-03-12T13:00:00Z"), assignedAt: d("2026-03-12T15:00:00Z"), investigationStartedAt: d("2026-03-14T09:00:00Z"), adjudicatedAt: d("2026-04-02T09:00:00Z"), closedAt: d("2026-04-15T15:00:00Z"),
    },
    {
      facilityId: 1, driverId: 2, claimNumber: "CLM-2026-0014", tpaName: "Sedgwick",
      status: "closed", severity: "moderate", exonerationStatus: "exonerated",
      description: "Claimant alleged our driver failed to yield at intersection. FleetLytics GPS showed our driver was in a dedicated turn lane with right-of-way. Forward dashcam confirmed green turn signal throughout the maneuver.",
      reserveAmount: 29000, settlementAmount: 0, adjusterName: "Tom Hargrove",
      litigationNotes: "EXONERATED. GPS track and dashcam confirmed green signal and proper yielding. Claim withdrawn by claimant. Reserve fully released. No rate impact at renewal.",
      fnolReceivedAt: d("2026-02-25T11:00:00Z"), assignedAt: d("2026-02-25T14:00:00Z"), investigationStartedAt: d("2026-02-27T09:00:00Z"), adjudicatedAt: d("2026-03-15T09:00:00Z"), closedAt: d("2026-03-28T15:00:00Z"),
    },
    // Closed — Settled
    {
      facilityId: 4, driverId: 7, claimNumber: "CLM-2026-0010", tpaName: "Sedgwick",
      status: "closed", severity: "minor",
      description: "Low-speed parking lot contact (3 mph confirmed by telematics). Customer bumper scuffed. Settled for repair cost only. Telematics speed data prevented claimant from inflating allegation to include injury.",
      reserveAmount: 5500, settlementAmount: 1850, adjusterName: "Tom Hargrove",
      litigationNotes: "Nuisance settlement $1,850. Telematics confined claim to physical damage only — saved estimated $8K+ in injury claim exposure.",
      fnolReceivedAt: d("2026-02-14T10:00:00Z"), assignedAt: d("2026-02-14T13:00:00Z"), investigationStartedAt: d("2026-02-17T09:00:00Z"), adjudicatedAt: d("2026-03-01T09:00:00Z"), closedAt: d("2026-03-10T15:00:00Z"),
    },
    {
      facilityId: 3, driverId: 5, claimNumber: "CLM-2026-0007", tpaName: "Gallagher Bassett",
      status: "closed", severity: "minor",
      description: "Customer alleged damage to their vehicle during tow. Dashcam showed clear pre-existing damage at pickup — multiple scratches and dent pre-dated the tow. Partial settlement to close.",
      reserveAmount: 11000, settlementAmount: 3200, adjusterName: "Ray Castillo",
      litigationNotes: "Partial settlement $3,200. Dashcam footage of pre-existing damage significantly reduced claim. Without footage, full $11K exposure likely.",
      fnolReceivedAt: d("2026-01-30T14:00:00Z"), assignedAt: d("2026-01-31T09:00:00Z"), investigationStartedAt: d("2026-02-03T09:00:00Z"), adjudicatedAt: d("2026-02-20T09:00:00Z"), closedAt: d("2026-03-01T15:00:00Z"),
    },
    {
      facilityId: 6, driverId: 12, claimNumber: "CLM-2026-0004", tpaName: "Sedgwick",
      status: "closed", severity: "moderate",
      description: "Driver reported back strain after heavy lift during vehicle recovery. Medical treatment and 3-day restricted duty. Workers Compensation — resolved. Preventive lifting training module added to FleetLytics platform for all recovery drivers.",
      reserveAmount: 14500, settlementAmount: 11200, adjusterName: "Lisa Monroe",
      fnolReceivedAt: d("2026-01-14T08:00:00Z"), assignedAt: d("2026-01-15T09:00:00Z"), investigationStartedAt: d("2026-01-17T09:00:00Z"), adjudicatedAt: d("2026-02-05T09:00:00Z"), closedAt: d("2026-02-20T15:00:00Z"),
    },
    {
      facilityId: 2, driverId: 4, claimNumber: "CLM-2026-0001", tpaName: "Gallagher Bassett",
      status: "closed", severity: "moderate",
      description: "Sideswipe during narrow street maneuver with loaded flatbed. Shared fault acknowledged (50/50). Telematics confirmed posted-speed compliance throughout — prevented worse fault allocation.",
      reserveAmount: 19500, settlementAmount: 9750, adjusterName: "Ray Castillo",
      litigationNotes: "50/50 shared fault settlement. Speed compliance data prevented unfavorable 70/30 finding. Reserve reduced by $9,750 vs original exposure.",
      fnolReceivedAt: d("2026-01-05T12:00:00Z"), assignedAt: d("2026-01-06T09:00:00Z"), investigationStartedAt: d("2026-01-09T09:00:00Z"), adjudicatedAt: d("2026-01-28T09:00:00Z"), closedAt: d("2026-02-10T15:00:00Z"),
    },
  ]);
}

async function seedDriverFeedback() {
  const now = new Date("2026-05-30T19:00:00Z");
  function hoursAgo(h: number) { return new Date(now.getTime() - h * 3600000); }

  await db.insert(driverFeedbackTable).values([
    // Critical — unacknowledged (most urgent, top of feed)
    {
      driverId: 2, eventType: "phone_use", severity: "critical", triggeredAt: hoursAgo(1),
      message: "Phone detected in hand at 58 mph on I-95. Zero-tolerance event per AAA network policy. Immediate corrective action required — driver must complete distracted driving module before next shift.",
    },
    {
      driverId: 5, eventType: "phone_use", severity: "critical", triggeredAt: hoursAgo(2),
      message: "Inward-facing camera detected phone usage for 14 continuous seconds while towing loaded flatbed at highway speed. Second offense this month — mandatory supervisor review required.",
    },
    {
      driverId: 9, eventType: "speeding", severity: "critical", triggeredAt: hoursAgo(3),
      message: "23 mph over posted limit in school zone (43 mph in 20 mph zone). FleetLytics geofence alert triggered immediately. Supervisor notified in real-time. Third speeding event this quarter.",
    },
    {
      driverId: 13, eventType: "seatbelt_violation", severity: "critical", triggeredAt: hoursAgo(4),
      message: "No seatbelt detected for 47-minute continuous drive. DOT compliance violation — seatbelt required per AAA network contract. Written warning issued. Safety coordinator notified.",
    },
    {
      driverId: 7, eventType: "fatigue_alert", severity: "critical", triggeredAt: hoursAgo(5),
      message: "FleetLytics AI detected 3 microsleep events over 12-minute window — eye-closure patterns exceeded fatigue threshold. Driver instructed to pull over via in-cab alert. Hours-of-service review required.",
      acknowledged: true, acknowledgedAt: hoursAgo(4.5),
    },
    // Warning — unacknowledged
    {
      driverId: 1, eventType: "hard_braking", severity: "warning", triggeredAt: hoursAgo(6),
      message: "Hard brake event at 0.42g deceleration — exceeds 0.35g threshold. Wet road conditions noted. Advise 3-second following distance rule and reduced speed in rain. First event this week.",
    },
    {
      driverId: 3, eventType: "following_distance", severity: "warning", triggeredAt: hoursAgo(7),
      message: "Following distance critically short — under 1.8 seconds at 60 mph for sustained 4-minute period. FleetLytics forward radar flagged as high-risk tailgating. Coaching alert sent in-cab.",
    },
    {
      driverId: 11, eventType: "speeding", severity: "warning", triggeredAt: hoursAgo(8),
      message: "14 mph over posted limit on state highway during peak traffic hours. Elevated risk of reaction-time incident. Automated speed reminder sent to driver mobile app.",
    },
    {
      driverId: 15, eventType: "harsh_acceleration", severity: "warning", triggeredAt: hoursAgo(9),
      message: "Repeated harsh acceleration — 4 events over 90-minute route while towing 3-car hauler. Excessive acceleration with loaded trailer creates significant tire and drivetrain wear. Coaching alert sent.",
    },
    {
      driverId: 6, eventType: "lane_departure", severity: "warning", triggeredAt: hoursAgo(10),
      message: "Lane departure without signaling on two-lane road — twice in 8-minute window. No adjacent traffic at time, but pattern is a statistically significant precursor to serious events. Coaching module sent.",
    },
    // Warning — acknowledged, in progress
    {
      driverId: 4, eventType: "hard_braking", severity: "warning", triggeredAt: hoursAgo(14),
      message: "Hard braking at intersection — possible delayed reaction. Defensive driving refresher recommended. Review scheduled with facility manager this Friday.",
      acknowledged: true, acknowledgedAt: hoursAgo(13),
    },
    {
      driverId: 10, eventType: "speeding", severity: "warning", triggeredAt: hoursAgo(16),
      message: "11 mph over limit on residential street while responding to AAA call. Time pressure noted — driver was on emergency dispatch. Still non-compliant per network policy. Coaching conversation completed.",
      acknowledged: true, acknowledgedAt: hoursAgo(15),
    },
    {
      driverId: 14, eventType: "harsh_acceleration", severity: "warning", triggeredAt: hoursAgo(18),
      message: "New driver (6 weeks on fleet) — harsh acceleration pattern likely technique-related, not behavioral. Enrolled in smooth-driving training module. Monitoring for improvement over next 30 days.",
      acknowledged: true, acknowledgedAt: hoursAgo(17),
    },
    {
      driverId: 8, eventType: "following_distance", severity: "warning", triggeredAt: hoursAgo(20),
      message: "Following distance under 2 seconds during rush hour on elevated highway with loaded tow vehicle. 15-minute coaching call completed. Driver acknowledged extended stopping distance requirement.",
      acknowledged: true, acknowledgedAt: hoursAgo(19),
    },
    // Info — acknowledged and auto-resolved
    {
      driverId: 1, eventType: "hard_braking", severity: "info", triggeredAt: hoursAgo(24),
      message: "Single low-severity braking event in stop-and-go traffic. Contextually acceptable given conditions. Automated nudge sent — no manager action required.",
      acknowledged: true, acknowledgedAt: hoursAgo(23),
    },
    {
      driverId: 16, eventType: "harsh_acceleration", severity: "info", triggeredAt: hoursAgo(26),
      message: "Minor acceleration event when merging onto highway from short on-ramp. Within acceptable range for conditions. Automated system alert only.",
      acknowledged: true, acknowledgedAt: hoursAgo(25),
    },
    {
      driverId: 12, eventType: "hard_braking", severity: "info", triggeredAt: hoursAgo(30),
      message: "Hard brake to avoid stalled vehicle in travel lane — appropriate emergency response. FleetLytics context engine classified as evasive action. No coaching needed.",
      acknowledged: true, acknowledgedAt: hoursAgo(29),
    },
    {
      driverId: 3, eventType: "speeding", severity: "info", triggeredAt: hoursAgo(36),
      message: "6 mph over limit on rural route — borderline event. Automated alert only. Driver has strong overall safety record (score 82/100). Monitoring only, no action required.",
      acknowledged: true, acknowledgedAt: hoursAgo(35),
    },
    // Older resolved events — warning level, fully closed
    {
      driverId: 6, eventType: "seatbelt_violation", severity: "warning", triggeredAt: hoursAgo(48),
      message: "Seatbelt not detected for 8-minute period in facility yard. Written warning issued. Driver completed seatbelt compliance pledge and safety video within 24 hours. Case closed.",
      acknowledged: true, acknowledgedAt: hoursAgo(47),
    },
    {
      driverId: 9, eventType: "hard_braking", severity: "warning", triggeredAt: hoursAgo(52),
      message: "0.48g braking event on gravel access road — unexpected pedestrian crossing. Investigation showed contextually justified. Coaching session completed covering situational awareness. Case closed.",
      acknowledged: true, acknowledgedAt: hoursAgo(51),
    },
    {
      driverId: 11, eventType: "speeding", severity: "warning", triggeredAt: hoursAgo(60),
      message: "12 mph over limit on rural highway. No prior speeding history. Full coaching session completed — driver signed corrective action form. Performance has been clean in 14-day follow-up window. Case closed.",
      acknowledged: true, acknowledgedAt: hoursAgo(59),
    },
    {
      driverId: 7, eventType: "phone_use", severity: "critical", triggeredAt: hoursAgo(72),
      message: "Phone in hand at 42 mph — first offense. Driver completed mandatory distracted driving certification module. 30-day monitoring period assigned. Performance clean since event. Case closed.",
      acknowledged: true, acknowledgedAt: hoursAgo(71),
    },
    {
      driverId: 14, eventType: "lane_departure", severity: "info", triggeredAt: hoursAgo(80),
      message: "Single minor lane departure event. Contextually low risk — wide rural road, no adjacent traffic. Automated alert only, no manager action required.",
      acknowledged: true, acknowledgedAt: hoursAgo(79),
    },
    {
      driverId: 2, eventType: "harsh_acceleration", severity: "info", triggeredAt: hoursAgo(96),
      message: "Acceleration spike on highway on-ramp — merging with fast-moving traffic. Contextually acceptable. Automated system logged only. No action required.",
      acknowledged: true, acknowledgedAt: hoursAgo(95),
    },
    {
      driverId: 5, eventType: "following_distance", severity: "warning", triggeredAt: hoursAgo(120),
      message: "Tailgating on congested bridge approach — under 1.5 seconds following distance. Driver completed following-distance module and responded positively. Significant improvement in subsequent 14-day telematics data. Case closed.",
      acknowledged: true, acknowledgedAt: hoursAgo(119),
    },
  ]);
}
