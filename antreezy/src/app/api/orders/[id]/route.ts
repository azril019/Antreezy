import { NextRequest } from "next/server";
import OrderModel from "@/db/models/OrderModel";
import errHandler from "@/helpers/errHandler";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const orderId = (await params).id;

    // First check if order exists and is in pending status
    const existingOrder = await OrderModel.getOrderById(orderId);

    if (!existingOrder) {
      return Response.json({ error: "Order not found" }, { status: 404 });
    }

    // Only allow deletion of pending orders
    if (existingOrder.status !== "pending") {
      return Response.json(
        { error: "Only pending orders can be deleted" },
        { status: 400 }
      );
    }

    const result = await OrderModel.deleteOrder(orderId);

    if (!result) {
      throw { status: 400, message: "Failed to delete order" };
    }

    return Response.json(
      { message: "Order deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.log("🚀 ~ DELETE order ~ error:", error);
    return errHandler(error);
  }
}
