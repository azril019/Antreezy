"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import {
  ArrowLeft,
  Clock,
  ChefHat,
  CheckCircle,
  XCircle,
  Package,
  RefreshCw,
  Check,
} from "lucide-react";

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  _id: string;
  tableId: string;
  items: OrderItem[];
  status: "pending" | "queue" | "cooking" | "served" | "done" | "cancelled";
  createdAt: string;
  updatedAt: string;
}

interface Table {
  _id: string;
  nomor: number;
  nama: string;
}

export default function OrderStatusPage() {
  const params = useParams();
  const router = useRouter();
  const tableId = params.id as string;
  
  // Refs for cleanup
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const [orders, setOrders] = useState<Order[]>([]);
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);
  const [table, setTable] = useState<Table | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isCompletingOrder, setIsCompletingOrder] = useState<string | null>(null);

  const statusConfig = {
    pending: {
      icon: Clock,
      color: "bg-yellow-500",
      textColor: "text-yellow-600",
      bgColor: "bg-yellow-50",
      label: "Menunggu Pembayaran",
      description: "Pesanan belum dibayar",
    },
    queue: {
      icon: Package,
      color: "bg-blue-500",
      textColor: "text-blue-600",
      bgColor: "bg-blue-50",
      label: "Dalam Antrian",
      description: "Pesanan sedang menunggu untuk diproses",
    },
    cooking: {
      icon: ChefHat,
      color: "bg-orange-500",
      textColor: "text-orange-600",
      bgColor: "bg-orange-50",
      label: "Sedang Dimasak",
      description: "Pesanan sedang disiapkan oleh chef",
    },
    served: {
      icon: CheckCircle,
      color: "bg-green-500",
      textColor: "text-green-600",
      bgColor: "bg-green-50",
      label: "Siap Disajikan",
      description: "Pesanan sudah siap dan akan segera diantar",
    },
    done: {
      icon: Check,
      color: "bg-gray-500",
      textColor: "text-gray-600",
      bgColor: "bg-gray-50",
      label: "Selesai",
      description: "Pesanan telah selesai dan diterima",
    },
    cancelled: {
      icon: XCircle,
      color: "bg-red-500",
      textColor: "text-red-600",
      bgColor: "bg-red-50",
      label: "Dibatalkan",
      description: "Pesanan telah dibatalkan",
    },
  };

  const fetchData = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) setIsRefreshing(true);
      
      // Cancel previous request if still pending
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Create new abort controller
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      // Fetch orders for this table
      const ordersRes = await fetch(`/api/cart?tableId=${tableId}`, { signal });
      if (!ordersRes.ok && !signal.aborted) {
        throw new Error("Failed to fetch orders");
      }
      
      if (signal.aborted) return;
      
      const ordersData = await ordersRes.json();

      // Filter orders that have items
      const allOrders = Array.isArray(ordersData)
        ? ordersData.filter(
            (order: Order) => order.items && order.items.length > 0
          )
        : [];
      
      // Separate active and completed orders
      const activeOrders = allOrders.filter((order: Order) => 
        order.status !== "done" && order.status !== "cancelled"
      );
      const doneOrders = allOrders.filter((order: Order) => 
        order.status === "done"
      );
      
      setOrders(activeOrders);
      setCompletedOrders(doneOrders);
      setLastUpdated(new Date());

      // Fetch table info (only on first load)
      if (!table) {
        const tableRes = await fetch(`/api/tables/${tableId}`, { signal });
        if (!tableRes.ok && !signal.aborted) {
          throw new Error("Failed to fetch table info");
        }
        
        if (!signal.aborted) {
          const tableData = await tableRes.json();
          setTable(tableData);
        }
      }

      setError(null);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error("Error fetching data:", err);
        setError("Gagal memuat data pesanan");
      }
    } finally {
      setLoading(false);
      if (showRefreshIndicator) setIsRefreshing(false);
    }
  };

  const startPolling = () => {
    // Clear existing interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // Start new polling interval
    pollingIntervalRef.current = setInterval(() => {
      fetchData(false); // Don't show refresh indicator for auto-refresh
    }, 3000); // Poll every 3 seconds
  };

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  useEffect(() => {
    if (tableId) {
      // Initial fetch
      fetchData(true);
      
      // Start polling
      startPolling();

      // Handle visibility change to pause/resume polling
      const handleVisibilityChange = () => {
        if (document.hidden) {
          stopPolling();
        } else {
          fetchData(false);
          startPolling();
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);

      // Cleanup function
      return () => {
        stopPolling();
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [tableId]);

  const handleManualRefresh = () => {
    fetchData(true);
  };

  const handleCompleteOrder = async (orderId: string) => {
    try {
      setIsCompletingOrder(orderId);
      
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tableId,
          action: "updateStatus",
          status: "done",
          isActive: false,
        }),
      });

      if (response.ok) {
        // Refresh data to show updated status
        await fetchData(false);
      } else {
        throw new Error("Failed to complete order");
      }
    } catch (error) {
      console.error("Error completing order:", error);
      alert("Gagal menyelesaikan pesanan. Silakan coba lagi.");
    } finally {
      setIsCompletingOrder(null);
    }
  };

  const getEstimatedTime = (status: string, createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const elapsed = Math.floor((now.getTime() - created.getTime()) / 1000 / 60); // minutes

    switch (status) {
      case "queue":
        return `${Math.max(15 - elapsed, 0)} menit lagi`;
      case "cooking":
        return `${Math.max(20 - elapsed, 0)} menit lagi`;
      case "served":
        return "Siap disajikan";
      case "done":
        return "Selesai";
      default:
        return "-";
    }
  };

  const renderOrderCard = (order: Order, isCompleted = false) => {
    const status = statusConfig[order.status as keyof typeof statusConfig];
    const StatusIcon = status?.icon || Clock;
    
    return (
      <div
        key={order._id}
        className={`bg-white rounded-xl shadow-sm overflow-hidden ${
          isCompleted ? 'opacity-75' : ''
        }`}
      >
        {/* Order Header */}
        <div className={`${status?.bgColor} p-4 border-l-4 ${status?.color}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-full ${status?.color}`}>
                <StatusIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className={`font-semibold ${status?.textColor}`}>
                  {status?.label}
                </h3>
                <p className="text-sm text-gray-600">
                  {status?.description}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-700">
                Order #{order._id.slice(-6).toUpperCase()}
              </p>
              <p className="text-xs text-gray-500">
                {getEstimatedTime(order.status, order.createdAt)}
              </p>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="p-4">
          <h4 className="font-medium text-gray-800 mb-3">
            Detail Pesanan:
          </h4>
          <div className="space-y-2">
            {order.items.map((item, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center"
              >
                <div className="flex-1">
                  <p className="text-gray-800">{item.name}</p>
                  <p className="text-sm text-gray-500">
                    {item.quantity}x @ Rp{" "}
                    {item.price.toLocaleString()}
                  </p>
                </div>
                <p className="font-medium text-gray-800">
                  Rp {(item.quantity * item.price).toLocaleString()}
                </p>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="border-t border-gray-200 pt-3 mt-3">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-800">
                Total:
              </span>
              <span className="font-bold text-lg text-orange-600">
                Rp{" "}
                {order.items
                  .reduce(
                    (sum, item) => sum + item.quantity * item.price,
                    0
                  )
                  .toLocaleString()}
              </span>
            </div>
          </div>

          {/* Time Info */}
          <div className="bg-gray-50 rounded-lg p-3 mt-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Waktu Pesan:</span>
              <span className="text-gray-800">
                {new Date(order.createdAt).toLocaleTimeString(
                  "id-ID",
                  {
                    hour: "2-digit",
                    minute: "2-digit",
                  }
                )}
              </span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-600">Update Terakhir:</span>
              <span className="text-gray-800">
                {new Date(order.updatedAt).toLocaleTimeString(
                  "id-ID",
                  {
                    hour: "2-digit",
                    minute: "2-digit",
                  }
                )}
              </span>
            </div>
          </div>

          {/* Done Button for Served Orders */}
          {order.status === "served" && !isCompleted && (
            <div className="mt-4">
              <button
                onClick={() => handleCompleteOrder(order._id)}
                disabled={isCompletingOrder === order._id}
                className="w-full bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isCompletingOrder === order._id ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Menyelesaikan...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5 mr-2" />
                    Pesanan Diterima
                  </>
                )}
              </button>
              <p className="text-xs text-gray-500 text-center mt-2">
                Klik jika pesanan sudah diterima dengan baik
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat status pesanan...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-orange-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-xl p-8 shadow-lg text-center max-w-md w-full">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-800 mb-2">Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={handleManualRefresh}
              className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Coba Lagi
            </button>
            <button
              onClick={() => router.push(`/tables/${tableId}`)}
              className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition-colors"
            >
              Kembali ke Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-orange-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push(`/tables/${tableId}`)}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Kembali</span>
            </button>
            <div className="text-center">
              <h1 className="font-bold text-gray-800">Status Pesanan</h1>
              <p className="text-sm text-gray-500">Meja #{table?.nomor}</p>
            </div>
            <button
              onClick={handleManualRefresh}
              className={`p-2 rounded-full hover:bg-gray-100 transition-colors ${
                isRefreshing ? 'animate-spin' : ''
              }`}
              disabled={isRefreshing}
            >
              <RefreshCw className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6">
        {/* Active Orders */}
        {orders.length > 0 ? (
          <div className="space-y-4 mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Pesanan Aktif
            </h2>
            {orders.map((order) => renderOrderCard(order, false))}
          </div>
        ) : (
          <div className="text-center py-8 mb-8">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Belum Ada Pesanan Aktif
            </h3>
            <p className="text-gray-600 mb-6">
              Anda belum memiliki pesanan aktif saat ini
            </p>
            <button
              onClick={() => router.push(`/tables/${tableId}`)}
              className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
            >
              Mulai Pesan Sekarang
            </button>
          </div>
        )}

        {/* Completed Orders */}
        {completedOrders.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 border-t border-gray-200 pt-6">
              Pesanan Selesai
            </h2>
            {completedOrders.map((order) => renderOrderCard(order, true))}
          </div>
        )}

        {/* Status Info */}
        {(orders.length > 0 || completedOrders.length > 0) && (
          <div className="mt-6 text-center space-y-2">
            <div className="flex items-center justify-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isRefreshing ? 'bg-blue-500 animate-pulse' : 'bg-green-500'}`}></div>
              <p className="text-sm text-gray-500">
                Update otomatis setiap 3 detik
              </p>
            </div>
            <p className="text-xs text-gray-400">
              Terakhir diperbarui: {lastUpdated.toLocaleTimeString('id-ID')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
