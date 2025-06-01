import errHandler from "@/helpers/errHandler";
import TableModel from "@/db/models/TableModel";
import { NewTable } from "@/app/types";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const tableId = (await params).id;

  try {
    const body: NewTable = await req.json();

    // Validation
    if (!body.nomor || !body.nama || !body.kapasitas || !body.lokasi) {
      throw {
        status: 400,
        message: "Missing required fields: nomor, nama, kapasitas, lokasi",
      };
    }

    // Check if table number already exists
    const existingTable = await TableModel.getTableById(tableId);
    if (existingTable && existingTable.id !== tableId) {
      throw {
        status: 400,
        message: "Table number already exists",
      };
    }

    const updatedTable = await TableModel.updateTable(tableId, body);
    if (!updatedTable) throw { status: 400, message: "Failed to update table" };

    return Response.json(
      {
        success: true,
        message: "Table updated successfully",
        data: updatedTable,
      },
      { status: 200 }
    );
  } catch (error) {
    console.log("🚀 ~ PUT tables ~ error:", error);
    return errHandler(error);
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const tableId = (await params).id;

  try {
    const table = await TableModel.getTableById(tableId);
    if (!table) throw { status: 404, message: "Table not found" };

    return Response.json(
      {
        success: true,
        message: "Table retrieved successfully",
        data: table,
      },
      { status: 200 }
    );
  } catch (error) {
    console.log("🚀 ~ GET tables ~ error:", error);
    return errHandler(error);
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const tableId = (await params).id;

  try {
    const result = await TableModel.deleteTable(tableId);
    if (!result) throw { status: 400, message: "Failed to delete table" };

    return Response.json(
      {
        success: true,
        message: "Table deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.log("🚀 ~ DELETE tables ~ error:", error);
    return errHandler(error);
  }
}
