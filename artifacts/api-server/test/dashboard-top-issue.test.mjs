/**
 * Regression tests for the /dashboard/recent-accidents topIssue derivation.
 *
 * Tests that:
 *  1. The highest-severity event for a scoped driver is returned as topIssue.
 *  2. Events belonging to vehicles outside the scoped vehicle set are excluded.
 *  3. A driver with no in-scope events receives "No recent events".
 *
 * These tests exercise the core in-memory logic of the handler in isolation
 * without a database connection.
 */

import { describe, test } from "node:test";
import assert from "node:assert/strict";

// Mirror the top-issue derivation logic from the dashboard handler.
const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };

function getTopIssue(driverId, events) {
  const driverEvents = events.filter((e) => e.driverId === driverId);
  const topEvent = [...driverEvents].sort(
    (a, b) => (severityOrder[b.severity] ?? 0) - (severityOrder[a.severity] ?? 0),
  )[0];
  return topEvent ? topEvent.eventType.replace(/_/g, " ") : "No recent events";
}

/**
 * Simulates the handler's WHERE clause: retain only events whose vehicleId is
 * in the scoped set (matches the `scopeWhere(telematicsEventsTable.vehicleId, vehicleIds)` query).
 */
function scopeEventsByVehicle(events, scopedVehicleIds) {
  if (scopedVehicleIds.length === 0) return [];
  return events.filter((e) => scopedVehicleIds.includes(e.vehicleId));
}

// ---------------------------------------------------------------------------

describe("dashboard recent-accidents — topIssue derivation", () => {
  test("highest-severity event is selected for a scoped driver", () => {
    const events = [
      { driverId: 1, vehicleId: 10, eventType: "hard_braking", severity: "medium" },
      { driverId: 1, vehicleId: 10, eventType: "speeding", severity: "high" },
    ];
    assert.equal(
      getTopIssue(1, events),
      "speeding",
      "should return the event with the highest severity (high > medium)",
    );
  });

  test("critical event ranks above high, high above medium", () => {
    const events = [
      { driverId: 5, vehicleId: 7, eventType: "harsh_acceleration", severity: "medium" },
      { driverId: 5, vehicleId: 7, eventType: "speeding", severity: "high" },
      { driverId: 5, vehicleId: 7, eventType: "phone_usage", severity: "critical" },
    ];
    assert.equal(
      getTopIssue(5, events),
      "phone usage",
      "critical phone_usage should be selected over high speeding",
    );
  });

  test("out-of-scope vehicle events are excluded before topIssue is derived", () => {
    const allEvents = [
      // In scope: vehicle 10 is in the facility's vehicle set
      { driverId: 1, vehicleId: 10, eventType: "speeding", severity: "high" },
      // Out of scope: vehicle 20 belongs to a different facility
      { driverId: 1, vehicleId: 20, eventType: "phone_usage", severity: "critical" },
    ];

    const scopedVehicleIds = [10]; // only vehicle 10 is accessible
    const scopedEvents = scopeEventsByVehicle(allEvents, scopedVehicleIds);

    assert.equal(scopedEvents.length, 1, "out-of-scope event should be filtered out");
    assert.equal(
      getTopIssue(1, scopedEvents),
      "speeding",
      "phone_usage from vehicle 20 must not influence topIssue",
    );
  });

  test("driver with no in-scope events receives 'No recent events'", () => {
    // driver 1 has events only on out-of-scope vehicle 20
    const allEvents = [
      { driverId: 1, vehicleId: 20, eventType: "speeding", severity: "high" },
    ];
    const scopedEvents = scopeEventsByVehicle(allEvents, [10]); // vehicle 20 excluded
    assert.equal(scopedEvents.length, 0);
    assert.equal(
      getTopIssue(1, scopedEvents),
      "No recent events",
    );
  });

  test("events for other drivers in scope do not bleed into driver's topIssue", () => {
    const scopedEvents = [
      { driverId: 2, vehicleId: 10, eventType: "phone_usage", severity: "critical" },
      { driverId: 1, vehicleId: 10, eventType: "speeding", severity: "medium" },
    ];
    assert.equal(
      getTopIssue(1, scopedEvents),
      "speeding",
      "driver 2's critical event must not appear as driver 1's topIssue",
    );
  });
});
