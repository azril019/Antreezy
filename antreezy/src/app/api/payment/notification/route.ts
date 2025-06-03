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
    // Here you would typically update your database or perform actions based on the notification
    console.log("Received notification for order:", notificationData.order_id);
    //Update order status in your database

    await OrderModel.updateOrderStatus(
      notificationData.order_id,
      notificationData.transaction_status
    );
    return Response.json(
      {
        success: true,
        message: "Notification processed successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.log("🚀 ~ POST payment notification ~ error:", error);
  }
}
