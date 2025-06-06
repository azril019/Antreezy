import { NextRequest } from "next/server";
import OrderModel from "@/db/models/OrderModel";
import errHandler from "@/helpers/errHandler";

interface ErrorWithStatus extends Error {
  status?: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const tableId = searchParams.get("tableId");

    let orders;

    if (status === "done") {
      // Fetch completed/settled transactions for history
      orders = await OrderModel.getCompletedOrders();
    } else if (tableId) {
      // Fetch orders for specific table
      orders = await OrderModel.getOrdersByTableId(tableId);
    } else {
      // Fetch active orders for admin dashboard
      orders = await OrderModel.getActiveOrders();
    }

    // Ensure orders is always an array and has proper structure
    const formattedOrders = Array.isArray(orders) ? orders : [];

    // Return data directly as array (not wrapped in { data: [] })
    return Response.json(formattedOrders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return errHandler(error as ErrorWithStatus);
  }
}

// Add PUT handler for updating order status
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, status, isActive } = body;

    console.log("PUT /api/orders - Received data:", {
      orderId,
      status,
      isActive,
    });

    if (!orderId || !status) {
      return Response.json(
        { error: "Order ID and status are required" },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = [
      "pending",
      "queue",
      "cooking",
      "served",
      "done",
      "failed",
      "cancelled",
    ];
    if (!validStatuses.includes(status)) {
      return Response.json(
        {
          error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Update order status
    const updatedOrder = await OrderModel.updateOrderStatus(orderId, status);

    if (!updatedOrder) {
      return Response.json({ error: "Order not found" }, { status: 404 });
    }

    console.log("PUT /api/orders - Order updated successfully:", updatedOrder);

    return Response.json({
      success: true,
      message: "Order status updated successfully",
      data: updatedOrder,
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    return Response.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
