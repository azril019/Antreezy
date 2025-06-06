import { items } from "@/app/types";
import OrderModel, { Order } from "@/db/models/OrderModel";
import midtransClient from "midtrans-client";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  console.log("Payment API called");

  try {
    // Check environment variables
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    const clientKey = process.env.MIDTRANS_CLIENT_KEY;
    const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";

    console.log("Environment check:", {
      hasServerKey: !!serverKey,
      hasClientKey: !!clientKey,
      isProduction,
      serverKeyPrefix: serverKey ? serverKey.substring(0, 15) : "missing",
      clientKeyPrefix: clientKey ? clientKey.substring(0, 15) : "missing",
    });

    if (!serverKey || !clientKey) {
      console.error("Midtrans keys not configured");
      return Response.json(
        {
          error: "Payment service not configured",
          details: "Midtrans API keys are missing",
        },
        { status: 500 }
      );
    }

    // Validate key format
    if (!isProduction) {
      // Sandbox keys validation
      if (!serverKey.startsWith("SB-Mid-server-")) {
        console.error("Invalid sandbox server key format");
        return Response.json(
          {
            error: "Invalid server key format",
            details: "Sandbox server key should start with 'SB-Mid-server-'",
          },
          { status: 500 }
        );
      }

      if (!clientKey.startsWith("SB-Mid-client-")) {
        console.error("Invalid sandbox client key format");
        return Response.json(
          {
            error: "Invalid client key format",
            details: "Sandbox client key should start with 'SB-Mid-client-'",
          },
          { status: 500 }
        );
      }
    }

    // Parse request body with error handling
    let body;
    try {
      body = await request.json();
      console.log("Request body parsed successfully");
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError);
      return Response.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const {
      tableId,
      items,
      totalAmount,
      customerDetails,
      orderId,
      paymentType,
    } = body;

    // Enhanced validation
    if (!tableId || !items || !totalAmount) {
      console.error("Missing required fields:", {
        tableId,
        items: !!items,
        totalAmount,
      });
      return Response.json(
        { error: "Missing required fields: tableId, items, or totalAmount" },
        { status: 400 }
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      console.error("Invalid items array:", items);
      return Response.json(
        { error: "Items must be a non-empty array" },
        { status: 400 }
      );
    }

    // Initialize Midtrans with better error handling
    let snap;
    try {
      const Snap = midtransClient.Snap;
      snap = new Snap({
        isProduction,
        serverKey,
        clientKey,
      });
      console.log("Midtrans Snap initialized successfully");
    } catch (midtransError) {
      console.error("Failed to initialize Midtrans:", midtransError);
      return Response.json(
        { error: "Payment service initialization failed" },
        { status: 500 }
      );
    }

    // Generate unique order ID
    const finalOrderId = orderId || `ORDER-${tableId}-${Date.now()}`;

    // Process items with validation
    let processedItems;
    try {
      processedItems = items.map((item: items, index: number) => {
        if (!item.id || !item.name || !item.price || !item.quantity) {
          throw new Error(
            `Invalid item at index ${index}: missing required fields`
          );
        }
        return {
          id: String(item.id),
          price: Math.round(Number(item.price)),
          quantity: parseInt(String(item.quantity)),
          name: String(item.name).substring(0, 50),
        };
      });
      console.log("Items processed successfully:", processedItems.length);
    } catch (itemError) {
      console.error("Error processing items:", itemError);
      return Response.json(
        {
          error: "Invalid item data",
          details:
            itemError instanceof Error ? itemError.message : "Unknown error",
        },
        { status: 400 }
      );
    }

    // Calculate amounts
    const subtotal = processedItems.reduce((total, item) => {
      return total + item.price * item.quantity;
    }, 0);

    // Don't add tax separately - let Midtrans handle it or include it in item prices
    const grossAmount = subtotal; // Remove tax calculation here

    console.log("Payment calculation:", {
      subtotal,
      grossAmount,
      providedTotalAmount: totalAmount,
      itemsCount: processedItems.length,
    });

    // Debug: Log the exact amounts
    console.log(
      "Processed items with amounts:",
      processedItems.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        total: item.price * item.quantity,
      }))
    );

    // Get base URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    // Prepare transaction parameters
    const parameter = {
      transaction_details: {
        order_id: finalOrderId,
        gross_amount: grossAmount,
      },
      item_details: processedItems,
      customer_details: {
        first_name: customerDetails?.name || `Table-${tableId}`,
        email: customerDetails?.email || `table${tableId}@restaurant.com`,
        phone: customerDetails?.phone || "+62000000000",
      },
      callbacks: {
        finish: `${baseUrl}/tables/${tableId}/payment/success`,
        error: `${baseUrl}/tables/${tableId}/payment/error`,
        pending: `${baseUrl}/tables/${tableId}/payment/pending`,
      },
      expiry: {
        unit: "minutes",
        duration: 30,
      },
    };

    // Debug: Verify amounts match
    const itemDetailsSum = processedItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    console.log("Amount verification:", {
      grossAmount,
      itemDetailsSum,
      match: grossAmount === itemDetailsSum,
    });

    console.log("Creating Midtrans transaction with order_id:", finalOrderId);
    console.log("Transaction parameter:", JSON.stringify(parameter, null, 2));

    // Create transaction with Midtrans
    let response;
    try {
      response = await snap.createTransaction(parameter);
      console.log("✅ Midtrans transaction created successfully");
    } catch (midtransError) {
      console.error("❌ Midtrans transaction failed:", midtransError);
      return Response.json(
        {
          error: "Failed to create payment transaction",
          details:
            midtransError instanceof Error
              ? midtransError.message
              : "Midtrans API error",
        },
        { status: 500 }
      );
    }

    // Get table data
    let tableData;
    try {
      const resTable = await fetch(`${baseUrl}/api/tables/${tableId}`);
      if (!resTable.ok) {
        throw new Error(`Table API returned ${resTable.status}`);
      }
      tableData = await resTable.json();
      console.log("Table data retrieved successfully");
    } catch (tableError) {
      console.error("Failed to fetch table data:", tableError);
      // Continue without table data, use fallback
      tableData = { data: { nomor: tableId } };
    }

    // Create order in database
    try {
      const orderData: Omit<Order, "_id"> = {
        orderId: finalOrderId,
        tableId,
        tableNumber: tableData?.data?.nomor || tableId,
        items: processedItems,
        totalAmount: grossAmount,
        status: "pending",
        paymentMethod: paymentType || "qris",
        paymentType: paymentType || "qris",
        customerDetails: {
          name: customerDetails?.name || `Table-${tableId}`,
          phone: customerDetails?.phone || "",
        },
        midtrans: {
          token: response.token,
          redirect_url: response.redirect_url,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await OrderModel.createOrder(orderData);
      console.log("✅ Order saved to database successfully");
    } catch (dbError) {
      console.error("❌ Failed to save order to database:", dbError);
      return Response.json(
        {
          error: "Failed to save order",
          details:
            dbError instanceof Error ? dbError.message : "Database error",
        },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      token: response.token,
      redirect_url: response.redirect_url,
      order_id: finalOrderId,
      amount: grossAmount,
    });
    console.log("✅ Payment API response sent successfully");
  } catch (error) {
    console.error("❌ Unexpected error in payment API:", error);

    // Enhanced error response
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    const errorStack = error instanceof Error ? error.stack : undefined;

    console.error("Error stack:", errorStack);

    return Response.json(
      {
        error: "Internal server error",
        details: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
