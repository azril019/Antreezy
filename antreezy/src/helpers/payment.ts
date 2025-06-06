export interface PaymentData {
  tableId: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  totalAmount: number;
  paymentType?: "qris" | "cash" | "bank_transfer" | "credit_card" | "e_wallet"; // Add payment_type field
  customerDetails?: {
    name?: string;
    phone?: string;
  };
}

export interface PaymentResult {
  success: boolean;
  token: string;
  redirect_url: string;
  order_id: string;
}

export const createPayment = async (
  paymentData: PaymentData
): Promise<PaymentResult> => {
  try {
    console.log("Creating payment with data:", {
      tableId: paymentData.tableId,
      itemsCount: paymentData.items.length,
      totalAmount: paymentData.totalAmount,
    });

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/payment`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentData),
      }
    );

    console.log("Payment API response status:", response.status);

    const result = await response.json();
    console.log("Payment API response:", {
      success: result.success,
      hasToken: !!result.token,
      error: result.error,
      details: result.details,
    });

    if (!response.ok) {
      throw new Error(
        result.details ||
          result.error ||
          `HTTP ${response.status}: Failed to create payment`
      );
    }

    if (!result.success || !result.token) {
      throw new Error("Invalid payment response: Missing token");
    }

    return result;
  } catch (error) {
    console.error("Payment creation error:", error);
    throw error;
  }
};

export const initiateMidtransPayment = (token: string): Promise<unknown> => {
  return new Promise((resolve, reject) => {
    console.log(
      "Initiating Midtrans payment with token:",
      token ? "present" : "missing"
    );

    // Check if Midtrans script is already loaded
    if (typeof window !== "undefined" && window.snap) {
      console.log("Using existing Midtrans Snap");
      window.snap.pay(token, {
        onSuccess: (result: unknown) => {
          console.log("Payment success:", result);
          resolve(result);
        },
        onPending: (result: unknown) => {
          console.log("Payment pending:", result);
          resolve(result);
        },
        onError: (result: unknown) => {
          console.error("Payment error:", result);
          reject(
            new Error(
              (result as { message?: string }).message || "Payment failed"
            )
          );
        },
        onClose: () => {
          console.log("Payment popup closed");
          reject(new Error("Payment cancelled by user"));
        },
      });
      return;
    }

    // Load Midtrans Snap script
    console.log("Loading Midtrans Snap script");
    const script = document.createElement("script");
    script.src =
      process.env.MIDTRANS_IS_PRODUCTION === "production"
        ? "https://app.midtrans.com/snap/snap.js"
        : "https://app.sandbox.midtrans.com/snap/snap.js";

    const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;
    if (!clientKey) {
      reject(new Error("Midtrans client key not configured"));
      return;
    }

    script.setAttribute("data-client-key", clientKey);

    script.onload = () => {
      console.log("Midtrans script loaded successfully");
      if (window.snap) {
        window.snap.pay(token, {
          onSuccess: (result: unknown) => {
            console.log("Payment success:", result);
            resolve(result);
          },
          onPending: (result: unknown) => {
            console.log("Payment pending:", result);
            resolve(result);
          },
          onError: (result: unknown) => {
            console.error("Payment error:", result);
            reject(
              new Error(
                (result as { message?: string }).message || "Payment failed"
              )
            );
          },
          onClose: () => {
            console.log("Payment popup closed");
            reject(new Error("Payment cancelled by user"));
          },
        });
      } else {
        reject(new Error("Midtrans Snap not available after script load"));
      }
    };

    script.onerror = () => {
      console.error("Failed to load Midtrans script");
      reject(new Error("Failed to load Midtrans script"));
    };

    document.head.appendChild(script);
  });
};

// Extend Window interface for TypeScript
declare global {
  interface Window {
    snap: {
      pay: (
        token: string,
        options: {
          onSuccess: (result: unknown) => void;
          onPending: (result: unknown) => void;
          onError: (result: unknown) => void;
          onClose: () => void;
        }
      ) => void;
    };
  }
}
