import errHandler from "@/helpers/errHandler";
import TableModel from "@/db/models/TableModel";
import QRCode from "qrcode";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get table data
    const table = await TableModel.getTableById(id);
    if (!table) {
      throw {
        status: 404,
        message: "Table not found",
      };
    }

    // Check if QR code already exists
    if (table.qrCodeData) {
      return Response.json(
        {
          success: true,
          message: "QR Code retrieved successfully",
          data: {
            ...table.qrCodeData,
            tableInfo: {
              id: table.id,
              nomor: table.nomor,
              nama: table.nama,
            },
            isExisting: true,
          },
        },
        { status: 200 }
      );
    }

    // Return empty if no QR code exists
    return Response.json(
      {
        success: true,
        message: "No QR Code found",
        data: null,
      },
      { status: 200 }
    );
  } catch (error) {
    console.log("🚀 ~ GET QR ~ error:", error);
    return errHandler(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { action, forceRegenerate } = await request.json();

    if (action !== "generate-qr") {
      throw {
        status: 400,
        message: "Invalid action",
      };
    }

    // Get table data
    const table = await TableModel.getTableById(id);
    if (!table) {
      throw {
        status: 404,
        message: "Table not found",
      };
    }

    // Check if QR code already exists and not forcing regenerate
    if (table.qrCodeData && !forceRegenerate) {
      return Response.json(
        {
          success: true,
          message: "QR Code already exists",
          data: {
            ...table.qrCodeData,
            tableInfo: {
              id: table.id,
              nomor: table.nomor,
              nama: table.nama,
            },
            isExisting: true,
          },
        },
        { status: 200 }
      );
    }

    // Generate QR code data
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const qrData = `${baseUrl}/tables/${table.nomor}`;

    // Generate QR code as data URL
    const qrCodeDataURL = await QRCode.toDataURL(qrData, {
      width: 300,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
      errorCorrectionLevel: "M",
    });

    // Generate QR code as buffer for download
    const qrCodeBuffer = await QRCode.toBuffer(qrData, {
      width: 300,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
      errorCorrectionLevel: "M",
    });

    // Prepare QR code data
    const qrCodeData = {
      qrCodeDataURL,
      qrData,
      qrCodeBase64: qrCodeBuffer.toString("base64"),
      generatedAt: new Date().toISOString(),
    };

    // Save QR code data to database
    await TableModel.updateTableQRCode(id, qrCodeData);

    return Response.json(
      {
        success: true,
        message: forceRegenerate
          ? "QR Code regenerated successfully"
          : "QR Code generated successfully",
        data: {
          ...qrCodeData,
          tableInfo: {
            id: table.id,
            nomor: table.nomor,
            nama: table.nama,
          },
          isExisting: false,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.log("🚀 ~ POST generate QR ~ error:", error);
    return errHandler(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get table data
    const table = await TableModel.getTableById(id);
    if (!table) {
      throw {
        status: 404,
        message: "Table not found",
      };
    }

    // Remove QR code data
    await TableModel.updateTableQRCode(id, null);

    return Response.json(
      {
        success: true,
        message: "QR Code deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.log("🚀 ~ DELETE QR ~ error:", error);
    return errHandler(error);
  }
}
