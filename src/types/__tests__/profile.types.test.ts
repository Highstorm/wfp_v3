import { describe, it, expect } from "vitest";
import type { UserProfile, GarminDailySummary } from "../profile.types";

describe("UserProfile Garmin fields", () => {
  it("should allow garmin fields on UserProfile", () => {
    const summary: GarminDailySummary = {
      totalCalories: 2500,
      activeCalories: 800,
      bmrCalories: 1700,
      syncedAt: new Date() as unknown,
    };

    const profile: UserProfile = {
      garminConnected: true,
      useGarminTargetCalories: true,
      garminDailySummaries: {
        "2026-03-14": summary,
      },
    };

    expect(profile.garminConnected).toBe(true);
    expect(profile.useGarminTargetCalories).toBe(true);
    expect(profile.garminDailySummaries?.["2026-03-14"].totalCalories).toBe(2500);
  });
});
