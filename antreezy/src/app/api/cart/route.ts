import { NextRequest } from "next/server";
import CartModel from "@/db/models/CartModel";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tableId = searchParams.get("tableId");

    if (!tableId) {
      return Response.json({ error: "Table ID is required" }, { status: 400 });
    }

    const cart = await CartModel.getCartByTableId(tableId);
    return Response.json(cart);
  } catch (error) {
    console.error("Error fetching cart:", error);
    return Response.json({ error: "Failed to fetch cart" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tableId, action, item, itemId, quantity } = body;

    if (!tableId) {
      return Response.json({ error: "Table ID is required" }, { status: 400 });
    }

    let updatedCart;

    switch (action) {
      case "add":
        if (!item) {
          return Response.json(
            { error: "Item is required for add action" },
            { status: 400 }
          );
        }

        updatedCart = await CartModel.addToCart(tableId, item);
        break;

      case "update":
        if (!itemId || quantity === undefined) {
          return Response.json(
            { error: "Item ID and quantity are required for update action" },
            { status: 400 }
          );
        }

        updatedCart = await CartModel.updateCartItem(tableId, itemId, quantity);
        break;

      case "remove":
        if (!itemId) {
          return Response.json(
            { error: "Item ID is required for remove action" },
            { status: 400 }
          );
        }

        updatedCart = await CartModel.removeCartItem(tableId, itemId);
        break;

      case "clear":
        updatedCart = await CartModel.clearCart(tableId);
        break;

      case "updateStatus":
        if (body.status === undefined || body.isActive === undefined) {
          return Response.json(
            { error: "Status and isActive are required for updateStatus action" },
            { status: 400 }
          );
        }

        updatedCart = await CartModel.updateCartStatus(
          tableId,
          body.status,
          body.isActive
        );
        break;

      default:
        return Response.json({ error: "Invalid action" }, { status: 400 });
    }

    return Response.json(updatedCart);
  } catch (error) {
    console.error("Error updating cart:", error);
    return Response.json({ error: "Failed to update cart" }, { status: 500 });
  }
}
