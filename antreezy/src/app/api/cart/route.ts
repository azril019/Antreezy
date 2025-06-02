import { NextRequest, NextResponse } from "next/server";

// In-memory storage for carts (in production, use database)
const carts = new Map<string, any[]>();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tableId = searchParams.get("tableId");

    if (!tableId) {
      return NextResponse.json(
        { error: "Table ID is required" },
        { status: 400 }
      );
    }

    const cart = carts.get(tableId) || [];
    return NextResponse.json(cart);
  } catch (error) {
    console.error("Error fetching cart:", error);
    return NextResponse.json(
      { error: "Failed to fetch cart" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tableId, action, item, itemId, quantity } = body;

    if (!tableId) {
      return NextResponse.json(
        { error: "Table ID is required" },
        { status: 400 }
      );
    }

    let cart = carts.get(tableId) || [];

    switch (action) {
      case "add":
        if (!item) {
          return NextResponse.json(
            { error: "Item is required for add action" },
            { status: 400 }
          );
        }

        const existingItemIndex = cart.findIndex(
          (cartItem) => cartItem.id === item.id
        );
        if (existingItemIndex >= 0) {
          cart[existingItemIndex].quantity += 1;
        } else {
          cart.push({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: 1,
          });
        }
        break;

      case "update":
        if (!itemId || quantity === undefined) {
          return NextResponse.json(
            { error: "Item ID and quantity are required for update action" },
            { status: 400 }
          );
        }

        if (quantity <= 0) {
          cart = cart.filter((cartItem) => cartItem.id !== itemId);
        } else {
          const itemIndex = cart.findIndex(
            (cartItem) => cartItem.id === itemId
          );
          if (itemIndex >= 0) {
            cart[itemIndex].quantity = quantity;
          }
        }
        break;

      case "remove":
        if (!itemId) {
          return NextResponse.json(
            { error: "Item ID is required for remove action" },
            { status: 400 }
          );
        }

        cart = cart.filter((cartItem) => cartItem.id !== itemId);
        break;

      case "clear":
        cart = [];
        break;

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    carts.set(tableId, cart);
    return NextResponse.json(cart);
  } catch (error) {
    console.error("Error updating cart:", error);
    return NextResponse.json(
      { error: "Failed to update cart" },
      { status: 500 }
    );
  }
}
