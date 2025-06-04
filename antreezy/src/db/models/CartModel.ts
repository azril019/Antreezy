import { ObjectId } from "mongodb";
import { db } from "../config/mongodb";

interface NutritionalInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  nutritionalInfo?: NutritionalInfo;
}

export interface Cart {
  _id?: string;
  tableId: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  status: "pending" | "queue" | "cooking" | "served" | "done";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default class CartModel {
  static collection() {
    return db.collection("carts");
  }

  static async getCartByTableId(tableId: string): Promise<any> {
    const cart = await this.collection().findOne({ tableId });
    return cart;
  }

  static async addToCart(tableId: string, item: any): Promise<CartItem[]> {
    const cart = await this.collection().findOne({ tableId });
    let updatedItems = [];

    if (!cart) {
      // Create new cart if it doesn't exist
      const newCart = {
        tableId,
        items: [
          {
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: 1,
            nutritionalInfo: item.nutritionalInfo || {
              calories: 450,
              protein: 18,
              carbs: 65,
              fat: 12,
            },
          },
        ],
        // Remove isActive and status from cart level
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await this.collection().insertOne(newCart);
      return newCart.items;
    } else {
      // Update existing cart
      const existingItemIndex = cart.items.findIndex(
        (cartItem: CartItem) => cartItem.id === item.id
      );

      if (existingItemIndex >= 0) {
        // Item exists, increase quantity
        cart.items[existingItemIndex].quantity += 1;
      } else {
        // Add new item
        cart.items.push({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: 1,
          nutritionalInfo: item.nutritionalInfo || {
            calories: 450,
            protein: 18,
            carbs: 65,
            fat: 12,
          },
        });
      }

      await this.collection().updateOne(
        { tableId },
        {
          $set: {
            items: cart.items,
            updatedAt: new Date().toISOString(),
          },
        }
      );

      return cart.items;
    }
  }

  // Remove updateCartStatus method as it's no longer needed

  static async getActiveCarts(): Promise<any[]> {
    const carts = await this.collection()
      .find({
        $and: [{ items: { $exists: true } }, { items: { $ne: [] } }],
      })
      .sort({ updatedAt: -1 })
      .toArray();

    return carts;
  }

  static async updateCartItem(
    tableId: string,
    itemId: string,
    quantity: number
  ): Promise<CartItem[]> {
    const cart = await this.collection().findOne({ tableId });

    if (!cart) return [];

    if (quantity <= 0) {
      // Remove item if quantity is 0 or negative
      cart.items = cart.items.filter((item: CartItem) => item.id !== itemId);
    } else {
      // Update quantity
      const itemIndex = cart.items.findIndex(
        (item: CartItem) => item.id === itemId
      );
      if (itemIndex >= 0) {
        cart.items[itemIndex].quantity = quantity;
      }
    }

    await this.collection().updateOne(
      { tableId },
      {
        $set: {
          items: cart.items,
          updatedAt: new Date().toISOString(),
        },
      }
    );

    return cart.items;
  }

  static async removeCartItem(
    tableId: string,
    itemId: string
  ): Promise<CartItem[]> {
    const cart = await this.collection().findOne({ tableId });

    if (!cart) return [];

    cart.items = cart.items.filter((item: CartItem) => item.id !== itemId);

    await this.collection().updateOne(
      { tableId },
      {
        $set: {
          items: cart.items,
          updatedAt: new Date().toISOString(),
        },
      }
    );

    return cart.items;
  }

  static async clearCart(tableId: string): Promise<CartItem[]> {
    await this.collection().updateOne(
      { tableId },
      {
        $set: {
          items: [],
          updatedAt: new Date().toISOString(),
        },
      },
      { upsert: true }
    );

    return [];
  }
}
