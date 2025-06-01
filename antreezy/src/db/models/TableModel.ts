import { db } from "@/db/config/mongodb";
import { ObjectId } from "mongodb";
import { NewTable, Table } from "@/app/types";

export default class TableModel {
  static collection() {
    return db.collection<Omit<Table, "id"> & { _id?: ObjectId }>("tables");
  }

  static async getAllTables(): Promise<Table[]> {
    const tables = await this.collection()
      .find()
      .sort({ createdAt: -1 })
      .toArray();

    return tables
      .map(
        (table): Table => ({
          ...table,
          id: table._id?.toString() || "",
          _id: undefined,
        })
      )
      .filter((table) => table.id);
  }

  static async createTable(newTable: NewTable): Promise<Table> {
    const tableWithTimestamp = {
      ...newTable,
      status: "Tersedia" as const,
      orderAktif: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = await this.collection().insertOne(tableWithTimestamp);

    const createdTable = await this.collection().findOne({
      _id: result.insertedId,
    });

    if (!createdTable) {
      throw new Error("Failed to retrieve created table");
    }

    return {
      ...createdTable,
      id: createdTable._id?.toString() || "",
      _id: undefined,
    };
  }
  static async getTableByNumber(nomor: string): Promise<Table | null> {
    const table = await this.collection().findOne({
      nomor,
    });

    if (!table) return null;

    return {
      ...table,
      id: table._id?.toString() || "",
      _id: undefined,
    };
  }

  static async updateTableQRCode(
    id: string,
    qrCodeData: {
      qrCodeDataURL: string;
      qrData: string;
      qrCodeBase64: string;
      generatedAt: string;
    } | null
  ): Promise<Table | null> {
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    if (qrCodeData !== null) {
      updateData.qrCodeData = qrCodeData;
    }

    const result = await this.collection().findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: "after" }
    );

    if (!result) return null;

    return {
      ...result,
      id: result._id?.toString() || "",
      _id: undefined,
    };
  }

  static async getTableById(id: string): Promise<Table | null> {
    try {
      const table = await this.collection().findOne({
        _id: new ObjectId(id),
      });

      if (!table) return null;

      return {
        ...table,
        id: table._id?.toString() || "",
        _id: undefined,
      };
    } catch (error) {
      console.error("Error getting table by ID:", error);
      return null;
    }
  }

  static async updateTable(
    id: string,
    updatedData: NewTable
  ): Promise<Table | null> {
    const result = await this.collection().findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: {
          ...updatedData,
          updatedAt: new Date().toISOString(),
        },
      },
      { returnDocument: "after" }
    );

    if (!result) return null;

    return {
      ...result,
      id: result._id?.toString() || "",
      _id: undefined,
    };
  }

  static async deleteTable(id: string): Promise<boolean> {
    const result = await this.collection().findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { updatedAt: new Date().toISOString() } },
      { returnDocument: "after" }
    );

    return !!result;
  }
}
