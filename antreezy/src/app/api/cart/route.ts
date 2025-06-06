import { NextRequest } from "next/server";
import CartModel from "@/db/models/CartModel";
import OrderModel from "@/db/models/OrderModel";
import errHandler from "@/helpers/errHandler";

interface ErrorWithStatus extends Error {
  status?: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tableId = searchParams.get("tableId");

    if (!tableId) {
      return Response.json({ error: "tableId is required" }, { status: 400 });
    }

    // Get cart for the specific table
    const cart = await CartModel.getCartByTableId(tableId);

    // Return consistent format - always return the cart object or null
    if (cart) {
      return Response.json(cart, { status: 200 });
    } else {
      // Return empty cart structure instead of empty array
      return Response.json(
        {
          tableId,
          items: [],
          totalAmount: 0,
          status: "active",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("Error fetching cart:", error);
    return errHandler(error as ErrorWithStatus);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tableId, action } = body;

    // Validate required fields
    if (!tableId || !action) {
      return Response.json(
        { error: "tableId and action are required" },
        { status: 400 }
      );
    }

    // Validate tableId format (assuming it should be a valid string)
    if (typeof tableId !== "string" || tableId.trim().length === 0) {
      return Response.json(
        { error: "Invalid tableId format" },
        { status: 400 }
      );
    }

    switch (action) {
      case "updateStatus": {
        const { status, isActive } = body;
        if (!status) {
          return Response.json(
            { error: "status is required" },
            { status: 400 }
          );
        }

        try {
          const updatedOrder = await OrderModel.updateOrderStatusAndActive(
            tableId,
            status,
            isActive
          );
          return Response.json(
            {
              success: true,
              data: updatedOrder,
            },
            { status: 200 }
          );
        } catch (err) {
          console.error("Error updating order status:", err);
          return Response.json(
            { error: "Failed to update order status" },
            { status: 500 }
          );
        }
      }

      case "add": {
        const { item } = body;
        if (!item || typeof item !== "object") {
          return Response.json(
            { error: "Valid item object is required" },
            { status: 400 }
          );
        }

        // Validate item structure
        if (
          !item.id ||
          !item.name ||
          typeof item.price !== "number" ||
          typeof item.quantity !== "number"
        ) {
          return Response.json(
            {
              error:
                "Item must have id, name, price (number), and quantity (number)",
            },
            { status: 400 }
          );
        }

        try {
          const updatedCart = await CartModel.addToCart(tableId, item);
          return Response.json(
            {
              success: true,
              data: updatedCart,
            },
            { status: 200 }
          );
        } catch (err) {
          console.error("Error adding item to cart:", err);
          return Response.json(
            { error: "Failed to add item to cart" },
            { status: 500 }
          );
        }
      }

      case "remove": {
        const { itemId } = body;
        if (!itemId || typeof itemId !== "string") {
          return Response.json(
            { error: "Valid itemId is required" },
            { status: 400 }
          );
        }

        try {
          const updatedCart = await CartModel.removeCartItem(tableId, itemId);
          return Response.json(
            {
              success: true,
              data: updatedCart,
            },
            { status: 200 }
          );
        } catch (err) {
          console.error("Error removing item from cart:", err);
          return Response.json(
            { error: "Failed to remove item from cart" },
            { status: 500 }
          );
        }
      }

      case "updateQuantity": {
        const { itemId, quantity } = body;
        if (!itemId || typeof itemId !== "string") {
          return Response.json(
            { error: "Valid itemId is required" },
            { status: 400 }
          );
        }
        if (typeof quantity !== "number" || quantity < 0) {
          return Response.json(
            { error: "Valid quantity (number >= 0) is required" },
            { status: 400 }
          );
        }

        try {
          const updatedCart = await CartModel.updateCartItem(
            tableId,
            itemId,
            quantity
          );
          return Response.json(
            {
              success: true,
              data: updatedCart,
            },
            { status: 200 }
          );
        } catch (err) {
          console.error("Error updating quantity:", err);
          return Response.json(
            { error: "Failed to update quantity" },
            { status: 500 }
          );
        }
      }

      case "clear": {
        try {
          const updatedCart = await CartModel.clearCart(tableId);
          return Response.json(
            {
              success: true,
              data: updatedCart,
            },
            { status: 200 }
          );
        } catch (err) {
          console.error("Error clearing cart:", err);
          return Response.json(
            { error: "Failed to clear cart" },
            { status: 500 }
          );
        }
      }

      default:
        return Response.json(
          {
            error:
              "Invalid action. Supported actions: updateStatus, add, remove, updateQuantity, clear",
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error processing cart action:", error);

    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return Response.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    return errHandler(error as ErrorWithStatus);
  }
}
