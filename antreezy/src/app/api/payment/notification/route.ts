import OrderModel from "@/db/models/OrderModel";

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

    // Extract payment type from notification
    const paymentType = notificationData.payment_type || "qris";

    // Update order status and payment type in your database
    const updatedOrder = await OrderModel.updateOrderStatus(
      notificationData.order_id,
      notificationData.transaction_status
    );

    // If payment is successful, set status to queue and isActive to true
    if (notificationData.transaction_status === "capture") {
      if (updatedOrder && updatedOrder._id) {
        await OrderModel.updateOrderStatus(
          updatedOrder._id.toString(),
          "queue"
        );
        console.log(`Order ${updatedOrder._id} status updated to queue`);
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
