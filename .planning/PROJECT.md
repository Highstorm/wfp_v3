# WFP – Weekly Food Planner

## What This Is

Eine persönliche Web-App zum täglichen Tracking von Mahlzeiten, Kalorien und Makronährstoffen. Sebastian nutzt sie, um seine Ernährung zu planen, Nährwertziele einzuhalten und den Überblick über Kalorienaufnahme, Sport und Defizit/Überschuss zu behalten. Die App läuft als React-SPA mit Firebase-Backend.

## Core Value

Ich weiß jederzeit, was ich gegessen habe und ob ich meine Nährwertziele einhalte.

## Requirements

### Validated

<!-- Bestehende, funktionierende Features -->

- ✓ Tagesplanung mit Mahlzeiten (Frühstück, Mittag, Abendessen, Snacks) — existing
- ✓ Gerichte erstellen, bearbeiten, löschen mit Nährwertdaten — existing
- ✓ Gerichte mit Zutaten und automatischer Nährwertberechnung — existing
- ✓ Kalorientracking pro Tag mit Tagesziel — existing
- ✓ Makronährstoff-Tracking (Protein, Kohlenhydrate, Fett) mit Tageszielen — existing
- ✓ Sport-Aktivitäten tracken (Intervals.icu Sync + manuell) — existing
- ✓ KI-gestützte Snack-Suche via Gemini — existing
- ✓ OpenFoodFacts-Integration für Nährwert-Lookup — existing
- ✓ Benutzerprofil mit Nährwertzielen — existing
- ✓ Firebase Auth (Login/Registrierung) — existing
- ✓ Gericht-Import via Share-Codes — existing
- ✓ Porridge Calculator — existing
- ✓ Responsive Design (Mobile + Desktop) — existing

### Active

<!-- Neuer Scope: Statistik-Seite -->

- [ ] Wochenstatistik-Seite mit Übersicht über Kalorienverlauf
- [ ] Wochennavigation (zwischen Kalenderwochen wechseln)
- [ ] Summary-Karten: Kalorien gesamt, kumuliertes Defizit/Überschuss, Sportkalorien
- [ ] Balkendiagramm: Kalorien pro Tag (Mo–So) mit Tagesziel-Referenzlinie
- [ ] Makronährstoff-Durchschnitt als % des Tagesziels (Protein, KH, Fett)
- [ ] Defizit-Berechnung: (Tagesziel + Sportkalorien) − gegessene Kalorien
- [ ] Neuer Navigations-Eintrag (Bottom-Nav + Sidebar) für Statistik

### Out of Scope

- Monats- oder Jahresansicht — Wochenansicht reicht erstmal
- Export/Download der Statistikdaten — nicht benötigt
- Vergleich zwischen Wochen — einfache Wochenansicht zuerst
- Gewichtstracking — separate Funktion, nicht Teil dieser Statistik

## Context

- Datenquelle: Alle Daten kommen aus bestehenden MealPlan-Dokumenten in Firestore (Kalorien, Makros, Sport)
- Tagesziel und Makroziele kommen aus dem UserProfile / WeeklyGoals
- Sport ist bereits in der App als Teil der MealPlans gespeichert (SportActivity-Objekte mit Kalorienverbrauch)
- Bestehende Repository-Schicht (`mealplan.repository.ts`, `profile.repository.ts`, `weekly-goals.repository.ts`) kann genutzt werden
- Wochennavigation: Kalenderwochen (Mo–So), analog zur bestehenden Tagesnavigation
- Stack: React 18, TypeScript, Tailwind CSS, Firebase/Firestore, TanStack React Query, date-fns

## Constraints

- **Tech Stack**: Bestehender Stack (React, Tailwind, Firebase) — keine neuen Frameworks
- **Chart-Library**: Leichtgewichtige Lösung bevorzugt (z.B. Recharts) — kein D3.js Overhead
- **Datenmodell**: Bestehende Firestore-Struktur nutzen, kein Schema-Migration nötig
- **Performance**: Nur 7 Tage laden pro Wochenansicht, kein Pre-Loading

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Balkendiagramm statt Linien | Besserer Tagesvergleich, klarer auf Mobile | — Pending |
| Makros als %-Durchschnitt | Prozent des Ziels ist aussagekräftiger als Gramm | — Pending |
| Defizit = (Ziel + Sport) − Gegessen | Sebastians bevorzugtes Berechnungsmodell | — Pending |
| Eigener Nav-Eintrag | Statistik ist wichtig genug für eigenen Menüpunkt | — Pending |

---
*Last updated: 2026-03-12 after initialization*
