import type { Dish } from "./dish.types";

export interface SharedDish {
  id: string;
  dishId: string;
  dish: Dish;
  sharedBy: string;
  sharedByName: string;
  createdAt: Date;
  expiresAt: Date;
  shareCode: string;
}
