import OrderModel from "@/db/models/OrderModel";
import CartModel from "@/db/models/CartModel";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("🚀 ~ POST payment notification ~ body:", body);

    const notificationData = body;

    if (!notificationData || !notificationData.order_id) {
      throw { status: 400, message: "Invalid notification data" };
    }

    // Process the notification data
    console.log("Received notification for order:", notificationData.order_id);
    
    // Update order status in your database
    const updatedOrder = await OrderModel.updateOrderStatus(
      notificationData.order_id,
      notificationData.transaction_status
    );

    // If payment is successful, activate cart for queue
    if (notificationData.transaction_status === "settlement" || 
        notificationData.transaction_status === "capture") {
      
      if (updatedOrder) {
        // Activate cart and set status to queue
        await CartModel.activateCartForQueue(updatedOrder.tableId);
        console.log(`Cart activated for table ${updatedOrder.tableId}`);
      }
    }

    return Response.json(
      {
        success: true,
        message: "Notification processed successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.log("🚀 ~ POST payment notification ~ error:", error);
    return Response.json(
      {
        success: false,
        message: "Error processing notification",
      },
      { status: 500 }
    );
  }
}
