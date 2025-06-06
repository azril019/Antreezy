import errHandler from "@/helpers/errHandler";
import TableModel from "@/db/models/TableModel";
import { NewTable } from "@/app/types";

type ErrorWithStatus = {
  status?: number;
  message?: string;
};

export async function POST(request: Request) {
  try {
    const body: NewTable = await request.json();

    // Validation
    if (!body.nomor || !body.nama || !body.kapasitas || !body.lokasi) {
      throw {
        status: 400,
        message: "Missing required fields: nomor, nama, kapasitas, lokasi",
      };
    }

    // Check if table number already exists
    const existingTable = await TableModel.getTableByNumber(body.nomor);
    if (existingTable) {
      throw {
        status: 400,
        message: "Table number already exists",
      };
    }

    const result = await TableModel.createTable(body);
    if (!result) throw { status: 400, message: "Failed to create table" };

    return Response.json(
      {
        success: true,
        message: "Table created successfully",
        data: result,
      },
      { status: 201 }
    );
  } catch (error) {
    console.log("🚀 ~ POST tables ~ error:", error);
    return errHandler(error as ErrorWithStatus);
  }
}

export async function GET() {
  try {
    const result = await TableModel.getAllTables();
    return Response.json(result, { status: 200 });
  } catch (error) {
    console.log("🚀 ~ GET tables ~ error:", error);
    return errHandler(error as ErrorWithStatus);
  }
}
