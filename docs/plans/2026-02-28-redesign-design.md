# WFP Redesign - Design Document

## Ziel

Umbau der App basierend auf dem neuen Pencil-Design (.pen Datei). Mix-Ansatz: bestehendes Teal-Farbschema + neue Typografie (Outfit/Inter) + neues Layout.

## Stil-Entscheidungen

- **Fonts**: Outfit (Display/Headlines, 800-900 weight) + Inter (Body, bereits vorhanden)
- **Farben beibehalten**: Teal Primary, Nutrition-Farben (Orange/Blau/Gruen/Rot)
- **Neue Elemente**: Zinc-Surface-Cards (#F4F4F5), schwarze Quantity-Badges, Pill-Chips, invertierte Bereiche
- **Layout**: Mobile-first, 402px Referenzbreite aus Pencil

## Screen-Aenderungen

### 1. Day Planning (Hauptscreen)
- Grosser Kalorien-Hero: 96px Zahl (Outfit 900), "von X kcal" darunter (Outfit 300)
- Wochenkalender: horizontal, aktiver Tag schwarz ausgefuellt mit weisser Schrift
- Makro-Bar: 3 Spalten (Protein blau, Carbs gruen, Fett rot) mit grossen Zahlen (Outfit 800)
- Mahlzeit-Sektionen: Titel (Outfit 800) + kcal rechts, Items in Zinc-Cards mit schwarzem Qty-Badge
- "Gericht hinzufuegen" als gestrichelte Outline-Box
- Speichern/Loeschen Buttons am Ende

### 2. Dishes List
- Runde Suchleiste (cornerRadius 24, Zinc-Hintergrund)
- Kategorie-Filter-Chips (Pill-Style, aktiver Chip schwarz)
- Dish-Cards: flach auf Zinc, Name + Actions oben, Sterne-Bewertung, Naehrwert-Zeile unten

### 3. Dish Form
- Zurueck-Pfeil + Titel
- KI-Scan-Bereich: invertiert (schwarzer Hintergrund, weisse Schrift, Kamera-Icon)
- 2x2 Naehrwert-Grid (Kalorien/Protein links/rechts, Kohlenhydrate/Fett links/rechts)
- Rezept-Textarea + URL-Input

### 4. Profile
- Avatar-Sektion: Kreis + Name + E-Mail zentriert
- Naehrwertziele: 2x2 Grid + Grundumsatz darunter
- Feature-Toggles: Zinc-Surface-Rows mit Toggle-Switches

### 5. Login
- Zentriert, Logo (Utensils-Icon) + App-Name (Outfit 800) + Subtitle
- E-Mail/Passwort Inputs + Anmelden Button

## Reihenfolge

1. Globale Styles (Outfit Font laden, CSS-Variablen)
2. Day Planning Screen
3. Dishes List Screen
4. Dish Form Screen
5. Profile Screen
6. Login Screen

## Beibehalten

- Alle funktionale Logik (Hooks, Services, Repositories)
- Teal Primary Farbschema
- Nutrition-Farben
- Bestehende Tailwind-Utilities (.btn, .card, .input)
- Dark Mode Support
