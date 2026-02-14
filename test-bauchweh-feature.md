# Bauchweh-Tracking Feature Test

## Test-Szenarien

### 1. Benutzereinstellungen
- [ ] Gehe zu den Benutzereinstellungen
- [ ] Aktiviere "Tägliches Bauchweh-Tracking aktivieren (0-10 Skala)"
- [ ] Speichere die Einstellungen
- [ ] Verifiziere, dass die Einstellung gespeichert wurde

### 2. Tagesplanung - Bauchweh-Tracker
- [ ] Gehe zur Tagesplanung
- [ ] Verifiziere, dass der Bauchweh-Tracker oberhalb der Tagesnotiz erscheint
- [ ] Teste den Slider (0-10)
- [ ] Verifiziere, dass sich das Icon und die Beschriftung ändern
- [ ] Teste verschiedene Werte:
  - 0: "Kein Bauchweh" 😊
  - 3: "Leicht bis mäßig" 😐
  - 6: "Mäßig bis stark" 😕
  - 9: "Unerträglich" 😖
  - 10: "Bauchkrämpfe" 😫

### 3. Persistierung
- [ ] Setze einen Bauchweh-Wert
- [ ] Speichere den Tagesplan
- [ ] Lade die Seite neu
- [ ] Verifiziere, dass der Wert korrekt geladen wurde

### 4. Deaktivierung
- [ ] Deaktiviere das Bauchweh-Tracking in den Einstellungen
- [ ] Gehe zur Tagesplanung
- [ ] Verifiziere, dass der Tracker nicht angezeigt wird

### 5. Mobile Optimierung
- [ ] Teste auf Smartphone-Browser
- [ ] Verifiziere, dass der Slider touch-freundlich ist
- [ ] Prüfe, dass alle Elemente gut lesbar sind

## Erwartete Funktionalität

✅ **Bauchweh-Tracker erscheint dauerhaft sichtbar** oberhalb der Tagesnotiz
✅ **Slider funktioniert** von 0-10 mit visuellen Feedback
✅ **Persistierung** in Firebase Firestore
✅ **Aktivierung/Deaktivierung** über Benutzereinstellungen
✅ **Mobile-optimiert** mit touch-freundlichen Elementen
✅ **Keine Linter-Fehler**
