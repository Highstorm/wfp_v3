import { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, onSnapshot } from "firebase/firestore";
import { hasEarlyAccess } from "../config/earlyAccessFeatures";

interface FeatureAccess {
  porridgeCalculator: boolean;
  dishIngredientBuilder: boolean;
  isLoading: boolean;
  reload: () => void;
}

/**
 * Hook um zu prüfen, ob ein Nutzer Zugriff auf bestimmte Features hat
 * Kombiniert Early Access Check mit User-Toggle aus dem Profil
 * Lädt Daten in Echtzeit wenn Profil-Änderungen stattfinden
 */
export const useFeatureAccess = (): FeatureAccess => {
  const [featureAccess, setFeatureAccess] = useState<FeatureAccess>({
    porridgeCalculator: false,
    dishIngredientBuilder: false,
    isLoading: true,
    reload: () => {},
  });

  const auth = getAuth();

  useEffect(() => {
    if (!auth.currentUser?.email) {
      setFeatureAccess({ 
        porridgeCalculator: false,
        dishIngredientBuilder: false,
        isLoading: false,
        reload: () => {}
      });
      return;
    }

    const email = auth.currentUser.email;
    const hasPorridgeEarlyAccess = hasEarlyAccess("porridgeCalculator", email);
    const hasDishIngredientBuilderEarlyAccess = hasEarlyAccess("dishIngredientBuilder", email);

    // Wenn kein Early Access für beide Features, dann auch kein Zugriff
    if (!hasPorridgeEarlyAccess && !hasDishIngredientBuilderEarlyAccess) {
      setFeatureAccess({ 
        porridgeCalculator: false,
        dishIngredientBuilder: false,
        isLoading: false,
        reload: () => {}
      });
      return;
    }

    // Echtzeit-Listener für Profil-Änderungen
    const db = getFirestore();
    const profileRef = doc(db, "profiles", email);
    
    const unsubscribe = onSnapshot(profileRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const porridgeEnabled = data.porridgeCalculatorEnabled !== undefined 
          ? data.porridgeCalculatorEnabled 
          : true;
        const dishIngredientBuilderEnabled = data.dishIngredientBuilderEnabled !== undefined
          ? data.dishIngredientBuilderEnabled
          : true;

        setFeatureAccess({
          porridgeCalculator: hasPorridgeEarlyAccess && porridgeEnabled,
          dishIngredientBuilder: hasDishIngredientBuilderEarlyAccess && dishIngredientBuilderEnabled,
          isLoading: false,
          reload: () => {}
        });
      } else {
        setFeatureAccess({
          porridgeCalculator: hasPorridgeEarlyAccess,
          dishIngredientBuilder: hasDishIngredientBuilderEarlyAccess,
          isLoading: false,
          reload: () => {}
        });
      }
    });

    return () => unsubscribe();
  }, [auth.currentUser]);

  return featureAccess;
};

