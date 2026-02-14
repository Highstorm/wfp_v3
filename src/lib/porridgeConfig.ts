export interface PorridgeConfig {
  liquids: {
    [key: string]: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      label: string;
    };
  };
  oats: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  fruits: {
    [key: string]: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      label: string;
    };
  };
  wheyProtein: {
    [key: string]: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      label: string;
    };
  };
  peanutButter: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  defaults: {
    liquid: {
      type: string;
      amount: number;
    };
    oats: {
      amount: number;
    };
    peanutButter: {
      amount: number;
    };
    wheyProtein: {
      type: string;
      amount: number;
    };
    fruits: {
      [key: string]: {
        amount: number;
        selected: boolean;
      };
    };
  };
}

export const porridgeConfig: PorridgeConfig = {
  liquids: {
    wasser: {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      label: "Wasser",
    },
    milch: {
      calories: 42,
      protein: 3.3,
      carbs: 5,
      fat: 1,
      label: "Milch",
    },
    hafermilch: {
      calories: 40,
      protein: 1,
      carbs: 7,
      fat: 1.5,
      label: "Hafermilch",
    },
    mandelmilch: {
      calories: 13,
      protein: 0.4,
      carbs: 0.6,
      fat: 1.1,
      label: "Mandelmilch",
    },
  },
  oats: {
    calories: 372,
    protein: 13.5,
    carbs: 58.7,
    fat: 7,
  },
  fruits: {
    banane: {
      calories: 88,
      protein: 1.1,
      carbs: 22.8,
      fat: 0.3,
      label: "🍌 Banane",
    },
    blaubeeren: {
      calories: 57,
      protein: 0.7,
      carbs: 14.5,
      fat: 0.3,
      label: "🫐 Blaubeeren",
    },
    erdbeeren: {
      calories: 32,
      protein: 0.7,
      carbs: 7.7,
      fat: 0.3,
      label: "🍓 Erdbeeren",
    },
    apfel: {
      calories: 52,
      protein: 0.3,
      carbs: 13.8,
      fat: 0.2,
      label: "🍎 Apfel",
    },
    himbeeren: {
      calories: 52,
      protein: 1.2,
      carbs: 11.9,
      fat: 0.7,
      label: "🍒 Himbeeren",
    },
    pflaumen: {
      calories: 46,
      protein: 0.7,
      carbs: 11.4,
      fat: 0.3,
      label: "🍑 Pflaumen",
    },
  },
  wheyProtein: {
    schoko: {
      calories: 376,
      protein: 73,
      carbs: 6.5,
      fat: 6.2,
      label: "MyProtein Schokolade",
    },
    honeyMilkCereal: {
      calories: 369,
      protein: 76,
      carbs: 7.2,
      fat: 4.4,
      label: "ESN Honey Milk Cereal",
    },
  },
  peanutButter: {
    calories: 614,
    protein: 30,
    carbs: 12,
    fat: 48,
  },
  defaults: {
    liquid: {
      type: "wasser",
      amount: 250,
    },
    oats: {
      amount: 50,
    },
    peanutButter: {
      amount: 0,
    },
    wheyProtein: {
      type: "honeyMilkCereal",
      amount: 30,
    },
    fruits: {
      banane: {
        amount: 100,
        selected: true,
      },
      blaubeeren: {
        amount: 50,
        selected: false,
      },
      erdbeeren: {
        amount: 50,
        selected: false,
      },
      apfel: {
        amount: 50,
        selected: false,
      },
      himbeeren: {
        amount: 50,
        selected: false,
      },
      pflaumen: {
        amount: 50,
        selected: false,
      },
    },
  },
}; 