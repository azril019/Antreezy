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

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  _id: string;
  orderId?: string;
  tableId: string;
  tableNumber: string;
  items: OrderItem[];
  totalAmount?: number;
  status: string;
  isActive?: boolean;
  customerDetails?: {
    name: string;
    email?: string;
    phone?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface User {
  username: string;
  role: string;
}

export default function AdminDashboard() {
  // Refs for cleanup
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const statusConfig = {
    pending: {
      icon: Clock,
      color: "bg-yellow-500",
      bgColor: "bg-yellow-100",
      textColor: "text-yellow-800",
      label: "Pending",
    },
    queue: {
      icon: Clock,
      color: "bg-blue-500",
      bgColor: "bg-blue-100",
      textColor: "text-blue-800",
      label: "Dalam Antrian",
    },
    cooking: {
      icon: ChefHat,
      color: "bg-orange-500",
      bgColor: "bg-orange-100",
      textColor: "text-orange-800",
      label: "Sedang Dimasak",
    },
    served: {
      icon: CheckCircle,
      color: "bg-green-500",
      bgColor: "bg-green-100",
      textColor: "text-green-800",
      label: "Siap Disajikan",
    },
    done: {
      icon: Check,
      color: "bg-gray-500",
      bgColor: "bg-gray-100",
      textColor: "text-gray-800",
      label: "Selesai",
    },
  };

  const [orders, setOrders] = useState<Order[]>([]);
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  console.log(completedOrders, "completedOrders");

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

      // Fetch orders
      const ordersRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/orders`, { signal });
      const completedOrdersRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/orders?status=done`);
      const tablesRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/tables`, { signal });

      if (
        !signal.aborted &&
        ordersRes.ok &&
        completedOrdersRes.ok &&
        tablesRes.ok
      ) {
        const activeOrdersData = await ordersRes.json();
        const completedOrdersData = await completedOrdersRes.json();
        const tablesData = await tablesRes.json();

        setOrders(activeOrdersData);
        setCompletedOrders(completedOrdersData);
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
        const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/profile`);
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
      console.log("Updating order:", orderId, "to status:", newStatus);

      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/orders`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId,
          status: newStatus,
          isActive: !["done"].includes(newStatus),
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Order updated successfully:", result);

        // Refresh data after update
        fetchData(false);
      } else {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { error: errorText || "Unknown error" };
        }
        console.error("Error updating order:", {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        });
        alert("Gagal mengupdate status pesanan");
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      alert("Terjadi kesalahan saat mengupdate status pesanan");
    }
  };
  const renderOrderTable = (
    ordersList: Order[],
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
                Pemesan
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Waktu
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
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
              const status = statusConfig[
                order.status as keyof typeof statusConfig
              ] || {
                icon: Clock,
                color: "bg-gray-500",
                bgColor: "bg-gray-100",
                textColor: "text-gray-800",
                label: "Unknown",
              };
              const StatusIcon = status.icon;

              return (
                <tr
                  key={order._id}
                  className={`hover:bg-gray-50 ${
                    isCompleted ? "opacity-75" : ""
                  }`}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{(order._id || "").slice(-6).toUpperCase()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    Meja {order.tableNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {order.customerDetails?.name ||
                          `Table-${order.tableId}`}
                      </div>
                      {order.customerDetails?.phone && (
                        <div className="text-sm text-gray-500">
                          {order.customerDetails.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.bgColor} ${status.textColor}`}
                    >
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {status.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.createdAt
                      ? new Date(order.createdAt).toLocaleTimeString("id-ID")
                      : "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Rp {order.totalAmount?.toLocaleString("id-ID")}
                  </td>
                  {!isCompleted && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {order.status === "queue" && (
                          <button
                            onClick={() =>
                              updateOrderStatus(order._id, "cooking")
                            }
                            className="bg-orange-500 text-white px-3 py-1 rounded text-xs hover:bg-orange-600 transition-colors disabled:bg-gray-400"
                          >
                            Mulai Masak
                          </button>
                        )}
                        {order.status === "cooking" && (
                          <button
                            onClick={() =>
                              updateOrderStatus(order._id, "served")
                            }
                            className="bg-green-500 text-white px-3 py-1 rounded text-xs hover:bg-green-600 transition-colors disabled:bg-gray-400"
                          >
                            Siap Saji
                          </button>
                        )}
                        {order.status === "served" && (
                          <button
                            onClick={() => updateOrderStatus(order._id, "done")}
                            className="bg-gray-500 text-white px-3 py-1 rounded text-xs hover:bg-gray-600 transition-colors disabled:bg-gray-400"
                          >
                            Selesai
                          </button>
                        )}
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
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pesanan Selesai</p>
              <p className="text-2xl font-bold text-gray-600">
                {totalCompletedOrders}
              </p>
            </div>
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <Check className="w-5 h-5 text-gray-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Active Orders Table */}
      {renderOrderTable(orders, "Pesanan Aktif", false)}

      {/* Completed Orders Table - Always show this section */}
      {renderOrderTable(completedOrders, "Pesanan Selesai", true)}
    </div>
  );
}
