import { NextRequest } from "next/server";
import CartModel from "@/db/models/CartModel";
import errHandler from "@/helpers/errHandler";


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tableId = searchParams.get("tableId");

    if (tableId) {
      // Jika ada tableId, ambil cart untuk table tersebut
      const cart = await CartModel.getCartByTableId(tableId);
      // Return as array untuk konsistensi dengan orders page
      return Response.json(cart ? [cart] : []);
    } else {
      // Jika tidak ada tableId, ambil semua cart aktif
      const carts = await CartModel.getActiveCarts();
      return Response.json({ data: carts });
    }
  } catch (error) {
    console.error("Error fetching cart:", error);
    return errHandler(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tableId, action } = body;

    if (!tableId || !action) {
      return Response.json({ error: "tableId and action are required" }, { status: 400 });
    }

    switch (action) {
      case "updateStatus": {
        const { status, isActive } = body;
        if (!status) {
          return Response.json({ error: "status is required" }, { status: 400 });
        }
        
        // Check if method exists before calling
        if (typeof CartModel.updateCartStatus === 'function') {
          const updatedCart = await CartModel.updateCartStatus(tableId, status, isActive);
          return Response.json(updatedCart);
        } else {
          // Fallback: use activateCartForQueue for queue status
          if (status === "queue" && isActive) {
            await CartModel.activateCartForQueue(tableId);
            const cart = await CartModel.getCartByTableId(tableId);
            return Response.json(cart);
          }
          return Response.json({ error: "updateCartStatus method not available" }, { status: 500 });
        }
      }

      case "add": {
        const { item } = body;
        if (!item) {
          return Response.json({ error: "item is required" }, { status: 400 });
        }
        const updatedCart = await CartModel.addToCart(tableId, item);
        return Response.json(updatedCart);
      }

      case "remove": {
        const { itemId } = body;
        if (!itemId) {
          return Response.json({ error: "itemId is required" }, { status: 400 });
        }
        const updatedCart = await CartModel.removeFromCart(tableId, itemId);
        return Response.json(updatedCart);
      }

      case "updateQuantity": {
        const { itemId, quantity } = body;
        if (!itemId || quantity === undefined) {
          return Response.json({ error: "itemId and quantity are required" }, { status: 400 });
        }
        const updatedCart = await CartModel.updateQuantity(tableId, itemId, quantity);
        return Response.json(updatedCart);
      }

      case "clear": {
        const updatedCart = await CartModel.clearCart(tableId);
        return Response.json(updatedCart);
      }

      default:
        return Response.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error processing cart action:", error);
    return errHandler(error);
  }
}
