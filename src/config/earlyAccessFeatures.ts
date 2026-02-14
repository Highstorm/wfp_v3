/**
 * Early Access Features Configuration
 * 
 * Die Konfiguration wird aus der JSON-Datei earlyAccessConfig.json geladen.
 * Diese Datei kann einfach bearbeitet werden, ohne den Code zu ändern.
 * 
 * Um die Konfiguration zu ändern, bearbeite: src/config/earlyAccessConfig.json
 */

import earlyAccessConfigJson from "./earlyAccessConfig.json";

/**
 * Typ-Definition für die Early Access Konfiguration
 */
export interface EarlyAccessConfig {
  enabled: boolean;
  allowedEmails: string[];
}

/**
 * Early Access Konfiguration geladen aus JSON
 */
export const earlyAccessConfig: EarlyAccessConfig = earlyAccessConfigJson as EarlyAccessConfig;

/**
 * Prüft, ob ein Nutzer Zugriff auf ein Early Access Feature hat
 * Alle Features verwenden die gleiche Liste von erlaubten E-Mails
 * @param featureName - Name des Features (wird ignoriert, da alle Features die gleiche Liste verwenden)
 * @param userEmail - E-Mail-Adresse des Nutzers
 */
export const hasEarlyAccess = (
  _featureName: string,
  userEmail: string | null | undefined
): boolean => {
  if (!userEmail) return false;
  if (!earlyAccessConfig.enabled) return false;
  
  return earlyAccessConfig.allowedEmails.includes(userEmail);
};

