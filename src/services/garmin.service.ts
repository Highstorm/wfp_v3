import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "../lib/firebase";

const functions = getFunctions(app);

export interface GarminConnectResponse {
  success?: boolean;
  error?: string;
}

export interface GarminDailySummaryResponse {
  totalCalories?: number;
  activeCalories?: number;
  bmrCalories?: number;
  error?: string;
}

export async function connectGarmin(
  garminEmail: string,
  garminPassword: string
): Promise<GarminConnectResponse> {
  const callable = httpsCallable<
    { garminEmail: string; garminPassword: string },
    GarminConnectResponse
  >(functions, "garmin_connect");
  const result = await callable({ garminEmail, garminPassword });
  return result.data;
}

export async function fetchGarminDailySummary(
  date: string
): Promise<GarminDailySummaryResponse> {
  const callable = httpsCallable<
    { date: string },
    GarminDailySummaryResponse
  >(functions, "garmin_daily_summary");
  const result = await callable({ date });
  return result.data;
}

export async function disconnectGarmin(): Promise<GarminConnectResponse> {
  const callable = httpsCallable<void, GarminConnectResponse>(
    functions,
    "garmin_disconnect"
  );
  const result = await callable();
  return result.data;
}
