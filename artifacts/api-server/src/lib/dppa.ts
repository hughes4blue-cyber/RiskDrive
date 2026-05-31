/**
 * DPPA — Driver's Privacy Protection Act field masking
 *
 * MVR-derived fields (licenseNumber, phone) are protected under 18 U.S.C. § 2721.
 * All authenticated users on this platform have a valid permissible purpose
 * (insurance underwriting, §2721(b)(6)) and receive full data.
 *
 * Unauthenticated viewers (Demo mode, req.appUser === undefined) receive
 * masked values because permissible purpose cannot be verified.
 *
 * The audit log provides the compliance trail showing every access.
 */

import type { usersTable } from "@workspace/db";

type AppUser = typeof usersTable.$inferSelect;

/** Returns true when the requester has a verified permissible purpose. */
export function hasDppaPermissiblePurpose(
  appUser: AppUser | undefined,
): boolean {
  return appUser != null;
}

/** Mask all but the last 4 characters of a driver licence number. */
export function maskLicenseNumber(license: string): string {
  if (license.length <= 4) return "****";
  return "*".repeat(license.length - 4) + license.slice(-4);
}

/** Mask phone to ***-***-XXXX format. */
export function maskPhone(phone: string | null | undefined): string | null {
  if (!phone) return phone ?? null;
  const digits = phone.replace(/\D/g, "");
  return `***-***-${digits.slice(-4)}`;
}

/**
 * Apply DPPA masking to a driver-shaped object.
 * Pass the full DB row; the function returns a response-safe object.
 */
export function applyDppaDriverMask<
  T extends { licenseNumber: string; phone?: string | null },
>(driver: T, appUser: AppUser | undefined): T {
  if (hasDppaPermissiblePurpose(appUser)) return driver;
  return {
    ...driver,
    licenseNumber: maskLicenseNumber(driver.licenseNumber),
    phone: maskPhone(driver.phone),
  };
}
