import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock firebase/functions before import
const mockHttpsCallable = vi.fn();
vi.mock("firebase/functions", () => ({
  getFunctions: vi.fn(() => ({})),
  httpsCallable: (...args: unknown[]) => mockHttpsCallable(...args),
}));

vi.mock("../../lib/firebase", () => ({
  app: {},
}));

describe("garmin.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("connectGarmin calls garmin_connect callable", async () => {
    const callFn = vi.fn().mockResolvedValue({ data: { success: true } });
    mockHttpsCallable.mockReturnValue(callFn);

    const { connectGarmin } = await import("../garmin.service");
    const result = await connectGarmin("test@email.com", "password123");

    expect(mockHttpsCallable).toHaveBeenCalledWith(expect.anything(), "garmin_connect");
    expect(callFn).toHaveBeenCalledWith({
      garminEmail: "test@email.com",
      garminPassword: "password123",
    });
    expect(result).toEqual({ success: true });
  });

  it("fetchGarminDailySummary calls garmin_daily_summary callable", async () => {
    const callFn = vi.fn().mockResolvedValue({
      data: { totalCalories: 2500, activeCalories: 800, bmrCalories: 1700 },
    });
    mockHttpsCallable.mockReturnValue(callFn);

    const { fetchGarminDailySummary } = await import("../garmin.service");
    const result = await fetchGarminDailySummary("2026-03-14");

    expect(mockHttpsCallable).toHaveBeenCalledWith(expect.anything(), "garmin_daily_summary");
    expect(callFn).toHaveBeenCalledWith({ date: "2026-03-14" });
    expect(result).toEqual({ totalCalories: 2500, activeCalories: 800, bmrCalories: 1700 });
  });

  it("disconnectGarmin calls garmin_disconnect callable", async () => {
    const callFn = vi.fn().mockResolvedValue({ data: { success: true } });
    mockHttpsCallable.mockReturnValue(callFn);

    const { disconnectGarmin } = await import("../garmin.service");
    const result = await disconnectGarmin();

    expect(mockHttpsCallable).toHaveBeenCalledWith(expect.anything(), "garmin_disconnect");
    expect(result).toEqual({ success: true });
  });
});
