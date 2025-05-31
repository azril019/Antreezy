import { ObjectId } from "mongodb";

export type CustomError = {
  status?: number;
  message?: string;
};

export type NewUser = {
  email: string;
  password: string;
  username: string;
  role: string;
};

export type NewRestaurant = {
  id?: string;
  name: string;
  address: string;
  tagline?: string;
  logo: string;
  coverImage: string;
  description?: string;
  contact?: {
    phone?: string;
    email?: string;
    website?: string;
    instagram?: string;
    facebook?: string;
    twitter?: string;
    whatsapp?: string;
  };
};

export interface NewMenuItem {
  name: string;
  description: string;
  composition?: string;
  category: string;
  price: number;
  stock: number;
  status: "tersedia" | "habis";
  nutritionalInfo?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sugar: number;
  };
}

export interface MenuItem extends NewMenuItem {
  id: string; // Frontend menggunakan string id
  _id?: ObjectId | string; // MongoDB _id (optional untuk response)
  createdAt?: string;
  updatedAt?: string;
}

// Type untuk database operations
export interface MenuItemDB extends NewMenuItem {
  _id?: ObjectId;
  createdAt?: string;
  updatedAt?: string;
}
