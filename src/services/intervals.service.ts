import { logger } from "../utils/logger";

export interface IntervalsCredentials {
  athleteId: string;
  apiKey: string;
}

interface IntervalsActivityRaw {
  id: string;
  source?: string;
  _note?: string;
  name?: string;
  calories?: number;
  [key: string]: unknown;
}

export interface IntervalsActivityDetail {
  id: string;
  name: string;
  calories: number;
}

interface IntervalsWellnessResponse {
  id?: string;
  kcalConsumed?: number;
  [key: string]: unknown;
}

export class IntervalsService {
  private static async fetchFromIntervals(
    endpoint: string,
    credentials: IntervalsCredentials,
    options?: RequestInit
  ): Promise<unknown> {
    const basicAuth = btoa(`API_KEY:${credentials.apiKey}`);
    logger.debug(`Intervals.icu: calling ${endpoint}`);

    const response = await fetch(`https://intervals.icu/api/v1/${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        ...options?.headers,
      },
    });

    if (!response.ok) {
      logger.error(`Intervals.icu: API error - status ${response.status}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  public static async getActivitiesForDate(
    date: string,
    credentials: IntervalsCredentials
  ): Promise<IntervalsActivityDetail[]> {
    const activities = await this.fetchFromIntervals(
      `athlete/${credentials.athleteId}/activities?oldest=${date}&newest=${date}`,
      credentials
    ) as IntervalsActivityRaw[];

    if (!Array.isArray(activities) || activities.length === 0) {
      return [];
    }

    // Strava activities are not available via the intervals.icu API
    const stravaBlocked = activities.filter(a => a.source === 'STRAVA');
    if (stravaBlocked.length > 0) {
      const nonStrava = activities.filter(a => a.source !== 'STRAVA');
      if (nonStrava.length === 0) {
        throw new Error('STRAVA_RESTRICTED');
      }
    }

    const detailedActivities = await Promise.all(
      activities
        .filter(a => a.source !== 'STRAVA')
        .map((activity) =>
          this.fetchFromIntervals(`activity/${activity.id}`, credentials)
        )
    ) as IntervalsActivityRaw[];

    return detailedActivities
      .filter((activity) => activity && typeof activity.calories === 'number')
      .map((activity) => ({
        id: String(activity.id),
        name: activity.name || 'Aktivität',
        calories: activity.calories!,
      }));
  }

  public static async updateWellnessForDate(
    date: string,
    kcalConsumed: number,
    credentials: IntervalsCredentials
  ): Promise<IntervalsWellnessResponse> {
    const endpoint = `athlete/${credentials.athleteId}/wellness/${date}`;

    const data = await this.fetchFromIntervals(endpoint, credentials, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ kcalConsumed }),
    });

    return data as IntervalsWellnessResponse;
  }
}
