"use client";

import {
  CheckCircle,
  ChefHat,
  Clock,
  Check,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { useEffect, useState, useRef } from "react";

export default function AdminDashboard() {
  // Refs for cleanup
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const statusConfig = {
    pending: {
      icon: Clock,
      color: "bg-yellow-500",
      label: "Pending",
    },
    queue: {
      icon: Clock,
      color: "bg-blue-500",
      label: "Dalam Antrian",
    },
    cooking: {
      icon: ChefHat,
      color: "bg-orange-500",
      label: "Sedang Dimasak",
    },
    served: {
      icon: CheckCircle,
      color: "bg-green-500",
      label: "Siap Disajikan",
    },
    done: {
      icon: Check,
      color: "bg-gray-500",
      label: "Selesai",
    },
    paid: {
      icon: CheckCircle,
      color: "bg-green-500",
      label: "Dibayar",
    },
    settlement: {
      icon: CheckCircle,
      color: "bg-green-500",
      label: "Selesai",
    },
    capture: {
      icon: CheckCircle,
      color: "bg-green-500",
      label: "Selesai",
    },
    failed: {
      icon: XCircle,
      color: "bg-red-500",
      label: "Gagal",
    },
    cancelled: {
      icon: XCircle,
      color: "bg-gray-500",
      label: "Dibatalkan",
    },
  };

  const [orders, setOrders] = useState<any[]>([]);
  const [completedOrders, setCompletedOrders] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [user, setUser] = useState<{ username: string; role: string } | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

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

      const [ordersRes, tablesRes] = await Promise.all([
        fetch("/api/cart", { signal }),
        fetch("/api/tables", { signal }),
      ]);

      if (signal.aborted) return;

      const [ordersData, tablesData] = await Promise.all([
        ordersRes.ok ? ordersRes.json() : { data: [] },
        tablesRes.ok ? tablesRes.json() : [],
      ]);

      if (!signal.aborted) {
        const allOrders = ordersData.data || [];

        // Separate active and completed orders
        const activeOrders = allOrders.filter(
          (order: any) => order.status !== "done"
        );
        const doneOrders = allOrders.filter(
          (order: any) => order.status === "done"
        );

        setOrders(activeOrders);
        setCompletedOrders(doneOrders);
        setTables(
          Array.isArray(tablesData) ? tablesData : tablesData.data || []
        );
        setLastUpdated(new Date());
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("Error fetching data:", err);
        setOrders([]);
        setCompletedOrders([]);
        setTables([]);
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
    }, 5000); // Poll every 5 seconds
  };

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/profile");
        if (!res.ok) throw new Error("Unauthorized");
        const data = await res.json();
        setUser({
          username: data.user.username,
          role: data.user.role,
        });
      } catch (err) {
        window.location.href = "/admin/login";
      }
    };

    fetchProfile();

    // Initial data fetch
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

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Cleanup function
    return () => {
      stopPolling();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const handleManualRefresh = () => {
    fetchData(true);
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tableId: orderId, // Assuming orderId is tableId for cart updates
          action: "updateStatus",
          status: newStatus,
          isActive: newStatus !== "served" && newStatus !== "done",
        }),
      });

      if (response.ok) {
        // Refresh data after update
        fetchData(false);
      }
    } catch (error) {
      console.error("Error updating order status:", error);
    }
  };

  const renderOrderTable = (
    ordersList: any[],
    title: string,
    isCompleted = false
  ) => (
    <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
          {!isCompleted && (
            <div className="flex items-center space-x-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  isRefreshing ? "bg-blue-500 animate-pulse" : "bg-green-500"
                }`}
              ></div>
              <span className="text-sm text-gray-500">
                Auto-refresh setiap 5 detik
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Order ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Meja
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Item
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Waktu
              </th>
              {!isCompleted && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {ordersList.map((order) => {
              const status =
                statusConfig[order.status as keyof typeof statusConfig];
              const StatusIcon = status?.icon || Clock;

              return (
                <tr
                  key={order._id}
                  className={`hover:bg-gray-50 ${isCompleted ? "opacity-75" : ""}`}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{order._id?.slice(-6).toUpperCase()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    Meja {order.tableId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div
                        className={`p-1 rounded-full ${status?.color} mr-2`}
                      >
                        <StatusIcon className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {status?.label}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.items?.length || 0} item
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  {!isCompleted && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {order.status === "queue" && (
                          <button
                            onClick={() =>
                              updateOrderStatus(order.tableId, "cooking")
                            }
                            className="bg-orange-500 text-white px-3 py-1 rounded text-xs hover:bg-orange-600"
                          >
                            Mulai Masak
                          </button>
                        )}
                        {order.status === "cooking" && (
                          <button
                            onClick={() =>
                              updateOrderStatus(order.tableId, "served")
                            }
                            className="bg-green-500 text-white px-3 py-1 rounded text-xs hover:bg-green-600"
                          >
                            Siap Saji
                          </button>
                        )}
                        {/* Served orders akan tetap ditampilkan sampai user klik Done */}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>

        {ordersList.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">
              {isCompleted
                ? "Belum ada pesanan yang selesai"
                : "Tidak ada pesanan aktif"}
            </p>
          </div>
        )}
      </div>

      {/* Status Footer */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
        <p className="text-xs text-gray-400">
          Terakhir diperbarui: {lastUpdated.toLocaleTimeString("id-ID")}
        </p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const totalActiveOrders = orders.length;
  const totalCompletedOrders = completedOrders.length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-6 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              Selamat Datang, {user?.username || "Admin"}!
            </h1>
            <p className="text-orange-100">
              Kelola pesanan dan operasional restaurant Antri Boss dengan mudah.
            </p>
            <div className="mt-2 text-sm text-orange-100">
              Role: {user?.role === "admin" ? "Admin" : user?.role}
            </div>
          </div>
          <button
            onClick={handleManualRefresh}
            className={`p-3 bg-white/20 rounded-full hover:bg-white/30 transition-all ${
              isRefreshing ? "animate-spin" : ""
            }`}
            disabled={isRefreshing}
          >
            <RefreshCw className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Pesanan Aktif</p>
              <p className="text-2xl font-bold text-blue-600">
                {totalActiveOrders}
              </p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Dalam Antrian</p>
              <p className="text-2xl font-bold text-blue-600">
                {orders.filter((order) => order.status === "queue").length}
              </p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Sedang Dimasak</p>
              <p className="text-2xl font-bold text-orange-600">
                {orders.filter((order) => order.status === "cooking").length}
              </p>
            </div>
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <ChefHat className="w-5 h-5 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Siap Disajikan</p>
              <p className="text-2xl font-bold text-green-600">
                {orders.filter((order) => order.status === "served").length}
              </p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Active Orders Table */}
      {renderOrderTable(orders, "Pesanan Aktif", false)}

      {/* Completed Orders Table */}
      {completedOrders.length > 0 &&
        renderOrderTable(completedOrders, "Pesanan Selesai", true)}
    </div>
  );
}
