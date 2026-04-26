export type Recipe = {
  id: number;
  title: string;
  description: string;
  source: string | null;
  foodItems: string[];
  createdAt: string;
  author: {
    id: number;
    displayName: string;
  };
};

export type AuthUser = {
  id: number;
  email: string;
  displayName: string;
};

export type KitchenFoodItem = {
  id: number;
  foodItemId: number;
  name: string;
  isLow: boolean;
  updatedAt: string;
};

export type AuthResponse = {
  token: string;
  user: AuthUser;
};

export type AuthPayload = {
  email: string;
  password: string;
  displayName: string;
};
