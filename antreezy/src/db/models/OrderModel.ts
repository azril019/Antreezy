import { db } from "../config/mongodb";
import { ObjectId } from "mongodb";

const COLLECTION_NAME = "orders";

export interface Order {
  _id?: string;
  orderId: string;
  tableId: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  totalAmount: number;
  status:
    | "pending"
    | "paid"
    | "failed"
    | "cancelled"
    | "settlement"
    | "capture"
    | "queue";
  paymentMethod?: string;
  midtrans: { token: string; redirect_url: string } | null;
  createdAt: string;
  updatedAt: string;
}

export default class OrderModel {
  static collection() {
    // cSpell:ignore antreezy
    return db.collection<Order>("orders");
  }

  static async createOrder(orderData: Omit<Order, "_id">): Promise<Order> {
    const order = {
      ...orderData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = await this.collection().insertOne(order);
    return { ...order, _id: result.insertedId.toString() };
  }

  static async updateOrderStatus(
    orderId: string,
    transactionStatus: string,
    transactionId?: string
  ): Promise<Order | null> {
    // Map Midtrans transaction status to our order status
    let orderStatus: Order["status"];

    switch (transactionStatus) {
      case "settlement":
      case "capture":
        orderStatus = "queue"; // Set to queue when payment is successful
        break;
      case "pending":
        orderStatus = "pending";
        break;
      case "deny":
      case "cancel":
      case "expire":
        orderStatus = "cancelled";
        break;
      case "failure":
        orderStatus = "failed";
        break;
      default:
        orderStatus = "pending";
    }

    const updateData: any = {
      status: orderStatus,
      updatedAt: new Date().toISOString(),
    };

    if (transactionId) {
      updateData.transactionId = transactionId;
    }

    const result = await this.collection().findOneAndUpdate(
      { orderId },
      { $set: updateData },
      { returnDocument: "after" }
    );
    return result as Order | null;
  }

  static async getOrderByOrderId(orderId: string): Promise<Order | null> {
    return (await this.collection().findOne({ orderId })) as Order | null;
  }
  static async getCompletedOrders() {
    try {
      const orders = await db
        .collection(COLLECTION_NAME)
        .find({
          status: { $in: ["settlement", "capture"] },
        })
        .sort({ updatedAt: -1 })
        .toArray();

      return orders.map((order) => ({
        ...order,
        _id: order._id.toString(),
        orderId: order._id.toString(),
        customerDetails: order.customerDetails || {
          name: "Unknown Customer",
          email: "",
          phone: "",
        },
        items: order.items || [],
        totalAmount: order.totalAmount || 0,
        paymentMethod: order.paymentMethod || "Unknown",
        tableId: order.tableId || "Unknown",
      }));
    } catch (error) {
      console.error("Error fetching completed orders:", error);
      throw error;
    }
  }

  static async getOrdersByTableId(tableId: string) {
    try {
      const orders = await db
        .collection(COLLECTION_NAME)
        .find({ tableId })
        .sort({ createdAt: -1 })
        .toArray();

      return orders.map((order) => ({
        ...order,
        _id: order._id.toString(),
        customerDetails: order.customerDetails || {
          name: "Unknown Customer",
          email: "",
          phone: "",
        },
      }));
    } catch (error) {
      console.error("Error fetching orders by table ID:", error);
      throw error;
    }
  }

  static async getOrdersByDateRange(startDate: Date, endDate: Date) {
    try {
      const orders = await this.collection()
        .find({
          createdAt: {
            $gte: startDate.toISOString(),
            $lte: endDate.toISOString(),
          },
          status: { $in: ["settlement", "capture"] },
        })
        .sort({ createdAt: -1 })
        .toArray();

      return orders;
    } catch (error) {
      console.error("Error fetching orders by date range:", error);
      throw error;
    }
  }

  static async getActiveOrders() {
    try {
      const orders = await db
        .collection(COLLECTION_NAME)
        .find({
          status: { $in: ["queue", "processing", "ready"] },
        })
        .sort({ createdAt: -1 })
        .toArray();

      return orders.map((order) => ({
        ...order,
        _id: order._id.toString(),
        customerDetails: order.customerDetails || {
          name: "Unknown Customer",
          email: "",
          phone: "",
        },
      }));
    } catch (error) {
      console.error("Error fetching active orders:", error);
      throw error;
    }
  }
  static async getOrderById(orderId: string): Promise<Order | null> {
    return (await this.collection().findOne({ _id: orderId })) as Order | null;
  }
}
