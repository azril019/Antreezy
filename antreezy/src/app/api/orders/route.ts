import { NextRequest } from "next/server";
import OrderModel from "@/db/models/OrderModel";
import errHandler from "@/helpers/errHandler";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const tableId = searchParams.get("tableId");

    let orders;

    if (status === "completed") {
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
    
    return Response.json(formattedOrders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return errHandler(error);
  }
}
