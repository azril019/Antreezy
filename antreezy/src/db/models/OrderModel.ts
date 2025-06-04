import { db } from "../config/mongodb";
import { ObjectId } from "mongodb";

const COLLECTION_NAME = "orders";

export interface Order {
  _id?: ObjectId | string;
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
    | "queue"
    | "cooking"
    | "served"
    | "done";
  paymentMethod?: string;
  customerDetails: {
    name: string;
    phone?: string;
  };
  midtrans: { token: string; redirect_url: string } | null;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

export default class OrderModel {
  static collection() {
    return db.collection<Order>("orders");
  }

  static async createOrder(orderData: any): Promise<Order> {
    const newOrder = {
      ...orderData,
      isActive: true,
      status: orderData.status || "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = await this.collection().insertOne(newOrder);
    return { ...newOrder, _id: result.insertedId.toString() } as Order;
  }

  static async getOrdersByTableId(tableId: string): Promise<Order[]> {
    const orders = await this.collection()
      .find({ tableId })
      .sort({
        status: 1, // Sort by status first (active orders first)
        createdAt: -1, // Then by creation time (newest first)
      })
      .toArray();

    return orders.map((order) => ({
      ...order,
      id: order._id?.toString() || "",
      _id: order._id?.toString() || "",
    }));
  }

  static async getActiveOrders(): Promise<Order[]> {
    const orders = await this.collection()
      .find({
        $or: [
          { isActive: true },
          { status: { $in: ["queue", "cooking", "served"] } },
        ],
      })
      .sort({ createdAt: -1 }) // Newest first
      .toArray();

    return orders.map((order) => ({
      ...order,
      id: order._id?.toString() || "",
      _id: order._id?.toString() || "",
    }));
  }

  static async getCompletedOrders(): Promise<Order[]> {
    const orders = await this.collection()
      .find({
        $or: [
          { isActive: false },
          { status: { $in: ["done", "settlement", "capture"] } },
        ],
      })
      .sort({ updatedAt: -1 }) // Newest completed first
      .toArray();

    return orders.map((order) => ({
      ...order,
      id: order._id?.toString() || "",
      _id: order._id?.toString() || "",
    }));
  }

  static async updateOrderStatus(
    orderId: string,
    status: string
  ): Promise<Order | null> {
    try {
      const collection = db.collection("orders");

      // Handle different ID formats
      let query: any;

      // Check if orderId is a valid ObjectId
      if (ObjectId.isValid(orderId)) {
        query = { _id: new ObjectId(orderId) };
      } else {
        // If not valid ObjectId, try to find by orderId field or tableId
        query = {
          $or: [{ orderId: orderId }, { tableId: orderId }],
        };
      }

      const updatedOrder = await collection.findOneAndUpdate(
        query,
        {
          $set: {
            status: status,
            isActive: !["served", "done", "settlement", "capture"].includes(
              status
            ),
            updatedAt: new Date().toISOString(),
          },
        },
        { returnDocument: "after" }
      );

      if (updatedOrder) {
        return {
          ...updatedOrder,
          _id: updatedOrder._id.toString(),
        } as Order;
      }

      return null;
    } catch (error) {
      console.error("Failed to update order status:", error);
      throw new Error(`Failed to update order status: ${error}`);
    }
  }

  static async getAllOrders(): Promise<Order[]> {
    try {
      const orders = await this.collection().find({}).toArray();
      return orders.map((order) => ({
        ...order,
        _id: order._id?.toString() || "",
        customerDetails: order.customerDetails || {
          name: "Unknown Customer",
          phone: "",
        },
      }));
    } catch (error) {
      console.error("Error fetching all orders:", error);
      throw error;
    }
  }

  static async updateOrderStatusAndActive(
    orderId: string,
    status: string,
    isActive: boolean
  ): Promise<Order | null> {
    try {
      const collection = db.collection("orders");

      // Handle different ID formats
      let query: any;

      // Check if orderId is a valid ObjectId
      if (ObjectId.isValid(orderId)) {
        query = { _id: new ObjectId(orderId) };
      } else {
        // If not valid ObjectId, try to find by orderId field or tableId
        query = {
          $or: [{ orderId: orderId }, { tableId: orderId }],
        };
      }

      const updatedOrder = await collection.findOneAndUpdate(
        query,
        {
          $set: {
            status: status,
            isActive: isActive,
            updatedAt: new Date().toISOString(),
          },
        },
        { returnDocument: "after" }
      );

      if (updatedOrder) {
        return {
          ...updatedOrder,
          _id: updatedOrder._id.toString(),
        } as Order;
      }

      return null;
    } catch (error) {
      console.error("Failed to update order status and active:", error);
      throw new Error(`Failed to update order status and active: ${error}`);
    }
  }

  static async deleteOrder(orderId: string): Promise<boolean> {
    try {
      const result = await this.collection().deleteOne({
        $or: [{ _id: new ObjectId(orderId) }, { orderId: orderId }],
      });

      return result.deletedCount > 0;
    } catch (error) {
      console.error("Error deleting order:", error);
      throw error;
    }
  }

  static async getOrderById(orderId: string): Promise<Order | null> {
    try {
      const order = await this.collection().findOne({
        $or: [{ _id: new ObjectId(orderId) }, { orderId: orderId }],
      });

      return order;
    } catch (error) {
      console.error("Error getting order by ID:", error);
      throw error;
    }
  }
}
