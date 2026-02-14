import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

interface IntervalsActivity {
  id: string;
  source?: string;
}

interface IntervalsActivityDetail {
  id: string;
  name: string;
  calories: number;
}

export class IntervalsService {
  private static async getCredentials(): Promise<{ athleteId: string; apiKey: string } | null> {
    if (!auth.currentUser?.email) return null;

    const profileRef = doc(db, "profiles", auth.currentUser.email);
    const profileSnap = await getDoc(profileRef);

    if (!profileSnap.exists()) return null;

    const data = profileSnap.data();
    const athleteId = data['intervals.icu-AthleteID'];
    const apiKey = data['intervals.icu-API-KEY'];

    if (!athleteId || !apiKey) return null;

    return { athleteId, apiKey };
  }

  private static async fetchFromIntervals(endpoint: string): Promise<any> {
    const credentials = await this.getCredentials();
    if (!credentials) {
      console.log('Intervals.icu: Keine Credentials gefunden');
      return null;
    }

    // Basic Auth Header erstellen: Base64(username:password)
    const basicAuth = btoa(`API_KEY:${credentials.apiKey}`);
    console.log(`Intervals.icu: Rufe API-Endpoint auf: ${endpoint}`);

    const response = await fetch(`https://intervals.icu/api/v1/${endpoint}`, {
      headers: {
        'Authorization': `Basic ${basicAuth}`,
      },
    });

    if (!response.ok) {
      console.error(`Intervals.icu: API-Fehler - Status ${response.status}`, await response.text());
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`Intervals.icu: Antwort von ${endpoint}:`, data);
    return data;
  }

  public static async getActivitiesForDate(date: string): Promise<IntervalsActivityDetail[]> {
    console.log(`Intervals.icu: Suche Aktivitäten für Datum ${date}`);
    
    const credentials = await this.getCredentials();
    if (!credentials) {
      console.log('Intervals.icu: Keine Credentials für Aktivitätsabfrage gefunden');
      return [];
    }

    try {
      // Hole alle Aktivitäten für das Datum
      const activities = await this.fetchFromIntervals(
        `athlete/${credentials.athleteId}/activities?oldest=${date}&newest=${date}`
      ) as IntervalsActivity[];

      if (!Array.isArray(activities)) {
        console.log('Intervals.icu: Keine Aktivitäten gefunden');
        return [];
      }

      console.log(`Intervals.icu: ${activities.length} Aktivitäten gefunden (inkl. Quelle)`, activities);

      // Hole Detaildaten für ALLE Aktivitäten (auch STRAVA), damit Kalorien/Name sicher vorliegen
      const detailedActivities = await Promise.all(
        activities.map((activity) => this.fetchFromIntervals(`activity/${activity.id}`))
      );

      // Filtere nur die relevanten Daten
      const result = detailedActivities
        .filter((activity) => activity && typeof activity.calories === 'number')
        .map((activity) => ({
          id: String(activity.id),
          name: activity.name || 'Aktivität',
          calories: activity.calories,
        }));

      console.log(`Intervals.icu: Detail-Aktivitäten nach Filter (mit Kalorien):`, result);

      return result;
    } catch (error) {
      console.error('Intervals.icu: Fehler beim Abrufen der Aktivitäten:', error);
      return [];
    }
  }

  public static async updateWellnessForDate(date: string, kcalConsumed: number): Promise<any> {
    const credentials = await this.getCredentials();
    if (!credentials) {
      throw new Error("Intervals.icu: Keine Credentials für Wellness-Update gefunden");
    }
    const basicAuth = btoa(`API_KEY:${credentials.apiKey}`);
    const endpoint = `athlete/${credentials.athleteId}/wellness/${date}`;
    console.log(`Intervals.icu: Übertrage Wellness-Daten an ${endpoint} mit kcalConsumed: ${kcalConsumed}`);

    const response = await fetch(`https://intervals.icu/api/v1/${endpoint}`, {
      method: "PUT",
      headers: {
        "Authorization": `Basic ${basicAuth}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ kcalConsumed })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Intervals.icu: API-Fehler beim Update Wellness - Status ${response.status}`, errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`Intervals.icu: Wellness-Update erfolgreich:`, data);
    return data;
  }
} 