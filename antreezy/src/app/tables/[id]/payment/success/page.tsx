"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle } from "lucide-react";

export default function PaymentSuccessPage() {
  const params = useParams();
  const router = useRouter();
  const tableId = params.id as string;

  useEffect(() => {
    // Clear cart after successful payment
    const clearCart = async () => {
      try {
        await fetch("/api/cart", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tableId,
            action: "clear",
          }),
        });
      } catch (error) {
        console.error("Error clearing cart:", error);
      }
    };

    clearCart();
  }, [tableId]);

  return (
    <div className="min-h-screen bg-orange-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl p-8 shadow-lg text-center max-w-md w-full">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          Pembayaran Berhasil!
        </h1>

        <p className="text-gray-600 mb-8">
          Terima kasih atas pembayaran Anda. Pesanan Anda sedang diproses dan
          akan segera disiapkan.
        </p>

        <div className="space-y-3">
          <button
            onClick={() => router.push(`/tables/${tableId}`)}
            className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition-colors font-medium"
          >
            Kembali ke Menu
          </button>

          <button
            onClick={() => router.push(`/tables/${tableId}/orders`)}
            className="w-full border border-orange-500 text-orange-500 py-3 rounded-lg hover:bg-orange-50 transition-colors font-medium"
          >
            Lihat Status Pesanan
          </button>
        </div>
      </div>
    </div>
  );
}
