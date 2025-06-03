import OrderModel from "@/db/models/OrderModel";
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

    // Validate key format for sandbox
    if (!isProduction) {
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

    // Import and initialize Midtrans
    let Snap: any;
    try {
      const midtransClient = require("midtrans-client");
      Snap = midtransClient.Snap;
    } catch (error) {
      console.error("Failed to import midtrans-client:", error);
      return Response.json(
        { error: "Midtrans client not available" },
        { status: 500 }
      );
    }

    const snap = new Snap({
      isProduction,
      serverKey,
      clientKey,
    });

    const body = await request.json();
    console.log("Request body received");

    const { tableId, items, totalAmount, customerDetails, orderId } = body;

    // Validate required fields
    if (!tableId || !items || !totalAmount) {
      console.error("Missing required fields");
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate items array
    if (!Array.isArray(items) || items.length === 0) {
      console.error("Invalid items array");
      return Response.json({ error: "Invalid items data" }, { status: 400 });
    }

    // Generate unique order ID
    const finalOrderId = orderId || `ORDER-${tableId}-${Date.now()}`;

    // Process items and calculate total
    const processedItems = items.map((item: any) => ({
      id: String(item.id),
      price: Math.round(item.price),
      quantity: parseInt(String(item.quantity)),
      name: String(item.name).substring(0, 50),
    }));

    // Calculate subtotal from items
    const subtotal = processedItems.reduce((total, item) => {
      return total + item.price * item.quantity;
    }, 0);

    // Calculate tax (11%)
    const tax = Math.round(subtotal * 0.11);

    // Add tax as separate item for transparency
    const itemsWithTax = [
      ...processedItems,
      {
        id: "tax",
        price: tax,
        quantity: 1,
        name: "Pajak (11%)",
      },
    ];

    // Calculate final gross amount
    const grossAmount = subtotal + tax;

    console.log("Payment calculation:", {
      subtotal,
      tax,
      grossAmount,
      providedTotalAmount: totalAmount,
      itemsCount: processedItems.length,
    });

    // Prepare transaction details
    const parameter = {
      transaction_details: {
        order_id: finalOrderId,
        gross_amount: grossAmount,
      },
      credit_card: {
        secure: true,
      },
      item_details: itemsWithTax,
      customer_details: {
        first_name: customerDetails?.name || `Table-${tableId}`,
        email: customerDetails?.email || `table${tableId}@restaurant.com`,
        phone: customerDetails?.phone || "08123456789",
        billing_address: {
          first_name: customerDetails?.name || `Table-${tableId}`,
          address: "Restaurant Address",
          city: "Jakarta",
          postal_code: "12345",
          country_code: "IDN",
        },
      },
      callbacks: {
        finish: `${process.env.NEXT_PUBLIC_BASE_URL}/tables/${tableId}/payment/success`,
        error: `${process.env.NEXT_PUBLIC_BASE_URL}/tables/${tableId}/payment/error`,
        pending: `${process.env.NEXT_PUBLIC_BASE_URL}/tables/${tableId}/payment/pending`,
      },
      expiry: {
        unit: "minutes",
        duration: 30,
      },
    };

    // Validate that gross_amount equals sum of item_details
    const calculatedTotal = parameter.item_details.reduce((total, item) => {
      return total + item.price * item.quantity;
    }, 0);

    if (parameter.transaction_details.gross_amount !== calculatedTotal) {
      console.error("Amount mismatch:", {
        gross_amount: parameter.transaction_details.gross_amount,
        calculated_total: calculatedTotal,
        difference:
          parameter.transaction_details.gross_amount - calculatedTotal,
      });

      // Fix the gross amount to match calculated total
      parameter.transaction_details.gross_amount = calculatedTotal;
    }

    console.log("Creating transaction with order_id:", finalOrderId);
    console.log(
      "Final transaction amount:",
      parameter.transaction_details.gross_amount
    );
    console.log("Items total verification:", calculatedTotal);

    // Create transaction token
    const transaction = await snap.createTransaction(parameter);
    // save to data base order
    await OrderModel.createOrder({
      orderId: finalOrderId,
      tableId: tableId,
      items: processedItems,
      totalAmount: parameter.transaction_details.gross_amount,
      status: "pending",
      paymentMethod: "midtrans",
      midtrans: {
        token: transaction.token,
        redirect_url: transaction.redirect_url,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    console.log("Transaction created successfully");

    return Response.json({
      success: true,
      token: transaction.token,
      redirect_url: transaction.redirect_url,
      order_id: finalOrderId,
      amount: parameter.transaction_details.gross_amount,
    });
  } catch (error: any) {
    console.error("Detailed Midtrans payment error:", {
      message: error.message,
      stack: error.stack,
      response: error.response?.data,
      status: error.response?.status,
    });

    // Handle specific Midtrans API errors
    if (error.response?.status === 401) {
      return Response.json(
        {
          error: "Unauthorized - Invalid API keys",
          details: "Please check your Midtrans server key and client key",
          midtransError: error.response?.data,
        },
        { status: 401 }
      );
    }

    if (error.response?.status === 400) {
      return Response.json(
        {
          error: "Bad Request",
          details:
            error.response?.data?.error_messages?.join(", ") ||
            "Invalid request data",
          midtransError: error.response?.data,
        },
        { status: 400 }
      );
    }

    return Response.json(
      {
        error: "Failed to create payment",
        details: error.message || "Unknown error occurred",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
