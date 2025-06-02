import { Db, MongoClient, WithId, Document } from "mongodb";

const uri = process.env.MONGODB_URI || "";
const client = new MongoClient(uri);

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
  status: "pending" | "paid" | "failed" | "cancelled";
  paymentMethod?: string;
  transactionId?: string;
  createdAt: string;
  updatedAt: string;
}

export default class OrderModel {
  static collection() {
    // cSpell:ignore antreezy
    const db: Db = client.db("antreezy");
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
    status: Order["status"],
    transactionId?: string
  ): Promise<Order | null> {
    const updateData: any = {
      status,
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
  static async getOrdersByTableId(tableId: string): Promise<Order[]> {
    return await this.collection()
      .find({ tableId })
      .sort({ createdAt: -1 })
      .toArray();
  }
}
