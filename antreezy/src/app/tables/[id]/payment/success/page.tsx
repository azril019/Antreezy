"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { CheckCircle, CreditCard } from "lucide-react";

export default function PaymentSuccessPage() {
  const params = useParams();
  const router = useRouter();
  const tableId = params.id as string;

  // Clear cart when payment is successful
  useEffect(() => {
    const clearCartAfterSuccess = async () => {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/cart`, {
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
        console.error("Error clearing cart after successful payment:", error);
      }
    };

    clearCartAfterSuccess();
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
            onClick={() => router.push(`/tables/${tableId}/orders`)}
            className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition-colors font-medium flex items-center justify-center"
          >
            <CreditCard className="w-5 h-5 mr-2" />
            Lihat Status Pesanan
          </button>

          <button
            onClick={() => router.push(`/tables/${tableId}`)}
            className="w-full border border-orange-500 text-orange-500 py-3 rounded-lg hover:bg-orange-50 transition-colors font-medium"
          >
            Kembali ke Menu
          </button>
        </div>
      </div>
    </div>
  );
}
