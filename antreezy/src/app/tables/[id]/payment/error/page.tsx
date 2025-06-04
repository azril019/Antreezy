"use client";

import { useParams, useRouter } from "next/navigation";
import { XCircle } from "lucide-react";

export default function PaymentErrorPage() {
  const params = useParams();
  const router = useRouter();
  const tableId = params.id as string;

  return (
    <div className="min-h-screen bg-orange-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl p-8 shadow-lg text-center max-w-md w-full">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-8 h-8 text-red-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          Pembayaran Gagal
        </h1>

        <p className="text-gray-600 mb-8">
          Terjadi kesalahan dalam proses pembayaran. Silakan coba lagi atau
          hubungi staff kami.
        </p>

        <div className="space-y-3">
          <button
            onClick={() => router.push(`/tables/${tableId}/cart`)}
            className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition-colors font-medium"
          >
            Coba Lagi
          </button>

          <button
            onClick={() => router.push(`/tables/${tableId}`)}
            className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Kembali ke Menu
          </button>
        </div>
      </div>
    </div>
  );
}
