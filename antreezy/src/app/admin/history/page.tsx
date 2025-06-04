"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Download,
  Search,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  CheckCircle,
  Eye,
  RefreshCw,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { Order } from "@/db/models/OrderModel";
import { items } from "@/app/types";

interface OrderHistory {
  _id: string;
  orderId: string;
  tableId: string;
  tableNumber?: string; // Optional, if you want to display table number
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  totalAmount: number;
  customerDetails: {
    name: string;
    phone?: string;
  };
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

interface TransactionStats {
  totalTransactions: number;
  totalRevenue: number;
  totalItems: number;
  successfulTransactions: number;
  averageOrderValue: number;
}

export default function TransactionHistoryPage() {
  const [transactions, setTransactions] = useState<OrderHistory[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<
    OrderHistory[]
  >([]);
  const [stats, setStats] = useState<TransactionStats>({
    totalTransactions: 0,
    totalRevenue: 0,
    totalItems: 0,
    successfulTransactions: 0,
    averageOrderValue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [selectedTransaction, setSelectedTransaction] =
    useState<OrderHistory | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Add polling refs
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch hanya status "done" with polling support
  const fetchTransactions = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) setIsRefreshing(true);

      // Cancel previous request only if it exists and is not already aborted
      if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      const response = await fetch("/api/orders?status=done", { signal });
      
      // Check if request was aborted before checking response
      if (signal.aborted) {
        return; // Exit early if aborted
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const orders = Array.isArray(data) ? data : [];

      // Check again if request was aborted before processing data
      if (signal.aborted) {
        return;
      }

      // Filter hanya status "done"
      const doneOrders = orders
        .filter((order: Order) => order?.status === "done")
        .map((order: OrderHistory) => ({
          _id: order._id || "",
          orderId: order.orderId || order._id || "",
          tableId: order.tableId || "Unknown",
          tableNumber: order.tableNumber || "Unknown",
          items: Array.isArray(order.items)
            ? order.items.map((item: items) => ({
                id: item.id || "",
                name: item.name || "Unknown Item",
                price: Number(item.price) || 0,
                quantity: Number(item.quantity) || 0,
              }))
            : [],
          totalAmount: Number(order.totalAmount) || 0,
          customerDetails: {
            name: order.customerDetails?.name || "Unknown Customer",
            phone: order.customerDetails?.phone || "",
          },
          paymentMethod: order.paymentMethod || "Unknown",
          createdAt: order.createdAt || new Date().toISOString(),
          updatedAt: order.updatedAt || new Date().toISOString(),
          completedAt:
            order.completedAt || order.updatedAt || new Date().toISOString(),
        }));

      setTransactions(doneOrders);
      setFilteredTransactions(doneOrders);
      calculateStats(doneOrders);
      setLastUpdated(new Date());
    } catch (error: unknown) {
      // Check if error is due to abort
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Request was aborted');
        return; // Don't show error for aborted requests
      }
      
      if (error instanceof Error) {
        console.error("Error fetching transactions:", error);
        if (showRefreshIndicator) {
          toast.error("Gagal memuat riwayat transaksi. Silakan coba lagi.");
        }
      }
    } finally {
      setLoading(false);
      if (showRefreshIndicator) setIsRefreshing(false);
    }
  };

  // Start polling
  const startPolling = () => {
    // Clear existing interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // Start new polling interval - every 10 seconds for transaction history
    pollingIntervalRef.current = setInterval(() => {
      fetchTransactions(false); // Don't show refresh indicator for auto-refresh
    }, 5000); // Poll every 5 seconds
  };

  // Stop polling
  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  // Handle manual refresh
  const handleManualRefresh = () => {
    fetchTransactions(true);
  };

  useEffect(() => {
    // Initial fetch
    fetchTransactions(true);

    // Start polling
    startPolling();

    // Handle visibility change to pause/resume polling
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        fetchTransactions(false);
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

  // Statistik hanya status "done"
  const calculateStats = (orders: OrderHistory[]) => {
    if (!Array.isArray(orders) || orders.length === 0) {
      setStats({
        totalTransactions: 0,
        totalRevenue: 0,
        totalItems: 0,
        successfulTransactions: 0,
        averageOrderValue: 0,
      });
      return;
    }
    const totalTransactions = orders.length;
    const totalRevenue = orders.reduce(
      (sum, order) => sum + (Number(order.totalAmount) || 0),
      0
    );
    const totalItems = orders.reduce(
      (sum, order) =>
        sum +
        (Array.isArray(order.items)
          ? order.items.reduce(
              (itemSum, item) => itemSum + (Number(item.quantity) || 0),
              0
            )
          : 0),
      0
    );
    const successfulTransactions = orders.length; // semua "done"
    const averageOrderValue =
      totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    setStats({
      totalTransactions,
      totalRevenue,
      totalItems,
      successfulTransactions,
      averageOrderValue,
    });
  };

  useEffect(() => {
    if (!Array.isArray(transactions)) return;
    let filtered = [...transactions];
    if (searchTerm && searchTerm.trim()) {
      filtered = filtered.filter((transaction) => {
        const searchLower = searchTerm.toLowerCase();
        const orderId = (transaction.orderId || "").toLowerCase();
        const customerName = (
          transaction.customerDetails?.name || ""
        ).toLowerCase();
        const tableId = (transaction.tableId || "").toString().toLowerCase();
        return (
          orderId.includes(searchLower) ||
          customerName.includes(searchLower) ||
          tableId.includes(searchLower)
        );
      });
    }
    if (dateFilter !== "all") {
      const now = new Date();
      const filterDate = new Date();
      switch (dateFilter) {
        case "today":
          filterDate.setHours(0, 0, 0, 0);
          break;
        case "week":
          filterDate.setDate(now.getDate() - 7);
          break;
        case "month":
          filterDate.setMonth(now.getMonth() - 1);
          break;
        default:
          break;
      }
      if (dateFilter !== "all") {
        filtered = filtered.filter((transaction) => {
          const transactionDate = new Date(transaction.createdAt);
          return transactionDate >= filterDate;
        });
      }
    }
    setFilteredTransactions(filtered);
    calculateStats(filtered);
  }, [transactions, searchTerm, dateFilter]);

  const formatCurrency = (amount: number) => {
    const numAmount = Number(amount) || 0;
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(numAmount);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("id-ID", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid Date";
    }
  };

  const exportToCSV = () => {
    if (
      !Array.isArray(filteredTransactions) ||
      filteredTransactions.length === 0
    ) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }
    const headers = [
      "ID Pesanan",
      "Meja",
      "Pelanggan",
      "Metode Bayar",
      "Total",
      "Tanggal",
    ];
    const csvData = filteredTransactions.map((transaction) => [
      transaction.orderId || "".slice(-6).toUpperCase(),
      `Meja ${transaction.tableNumber || ""}`,
      transaction.customerDetails?.name || "",
      transaction.paymentMethod === "cash"
        ? "Tunai"
        : transaction.paymentMethod === "qris"
        ? "QRIS"
        : transaction.paymentMethod || "Unknown",
      transaction.totalAmount.toLocaleString("id-ID") || 0,
      formatDate(transaction.createdAt),
    ]);
    const csvContent = [headers, ...csvData]
      .map((row) => row.map((field) => `"${field}"`).join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `riwayat-transaksi-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast.success("Data berhasil diekspor!");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat riwayat transaksi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <Toaster position="top-right" />

      <div className="max-w-7xl mx-auto">
        {/* Header with refresh button */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Riwayat Transaksi
            </h1>
            <p className="text-gray-600">
              Kelola dan analisis riwayat transaksi restoran
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleManualRefresh}
              className={`p-2 rounded-full hover:bg-gray-100 transition-colors ${
                isRefreshing ? "animate-spin" : ""
              }`}
              disabled={isRefreshing}
              title="Refresh Data"
            >
              <RefreshCw className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={exportToCSV}
              disabled={
                !filteredTransactions || filteredTransactions.length === 0
              }
              className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Download size={20} />
              Export CSV
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Transaksi</p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.totalTransactions}
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Pendapatan</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(stats.totalRevenue)}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rata-rata Pesanan</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatCurrency(stats.averageOrderValue)}
                </p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Transaksi Selesai</p>
                <p className="text-2xl font-bold text-orange-600">
                  {stats.successfulTransactions}
                </p>
              </div>
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filter section with polling indicator */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">
                Filter Transaksi
              </h2>
              {/* Polling status indicator */}
              <div className="flex items-center space-x-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    isRefreshing ? "bg-blue-500 animate-pulse" : "bg-green-500"
                  }`}
                ></div>
                <span className="text-sm text-gray-500">
                  Update otomatis setiap 5 detik
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <div className="relative flex-1 min-w-64">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Cari berdasarkan ID, nama pelanggan, atau meja..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-black"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-black"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              >
                <option value="all">Semua Waktu</option>
                <option value="today">Hari Ini</option>
                <option value="week">7 Hari Terakhir</option>
                <option value="month">30 Hari Terakhir</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            {!Array.isArray(filteredTransactions) ||
            filteredTransactions.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">📊</div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Tidak ada transaksi ditemukan
                </h3>
                <p className="text-gray-500">
                  {transactions.length === 0
                    ? "Belum ada transaksi yang tercatat"
                    : "Coba ubah filter untuk melihat lebih banyak data"}
                </p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID Pesanan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Meja
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pelanggan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Items
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Metode Bayar
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tanggal
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTransactions.map((transaction) => (
                    <tr key={transaction._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #
                        {(transaction.orderId || "").slice(-6).toUpperCase() ||
                          "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        Meja {transaction.tableNumber || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaction.customerDetails?.name || "Unknown"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {Array.isArray(transaction.items)
                          ? transaction.items.reduce(
                              (sum, item) => sum + (Number(item.quantity) || 0),
                              0
                            )
                          : 0}{" "}
                        item
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            transaction.paymentMethod === "cash"
                              ? "bg-green-100 text-green-800"
                              : transaction.paymentMethod === "qris"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {transaction.paymentMethod === "cash"
                            ? "Tunai"
                            : transaction.paymentMethod === "qris"
                            ? "QRIS"
                            : transaction.paymentMethod || "Unknown"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {formatCurrency(transaction.totalAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(transaction.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => {
                            setSelectedTransaction(transaction);
                            setShowDetails(true);
                          }}
                          className="text-orange-600 hover:text-orange-800 flex items-center"
                        >
                          <Eye size={16} className="mr-1" />
                          Detail
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Add last updated timestamp */}
          {filteredTransactions.length > 0 && (
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Menampilkan {filteredTransactions.length} dari{" "}
                  {transactions.length} transaksi
                </p>
                <p className="text-xs text-gray-400">
                  Terakhir diperbarui: {lastUpdated.toLocaleTimeString("id-ID")}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {showDetails && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-90vh overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  Detail Transaksi #
                  {(selectedTransaction.orderId || "")
                    .slice(-6)
                    .toUpperCase() || "N/A"}
                </h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Informasi Pesanan
                  </h4>
                  <div className="space-y-1 text-sm">
                    <p className="text-gray-900">
                      <span className="text-gray-500">ID:</span>{" "}
                      {selectedTransaction.orderId || "N/A"}
                    </p>
                    <p className="text-gray-900">
                      <span className="text-gray-500">Meja:</span>{" "}
                      {selectedTransaction.tableNumber || "N/A"}
                    </p>
                    <p className="text-gray-900">
                      <span className="text-gray-500">Metode Bayar:</span>{" "}
                      {selectedTransaction.paymentMethod || "Unknown"}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Informasi Pelanggan
                  </h4>
                  <div className="space-y-1 text-sm">
                    <p className="text-gray-900">
                      <span className="text-gray-500">Nama:</span>{" "}
                      {selectedTransaction.customerDetails?.name || "Unknown"}
                    </p>

                    {selectedTransaction.customerDetails?.phone && (
                      <p className="text-gray-900">
                        <span className="text-gray-500">HP:</span>{" "}
                        {selectedTransaction.customerDetails.phone}
                      </p>
                    )}
                    <p className="text-gray-900">
                      <span className="text-gray-500">Tanggal:</span>{" "}
                      {formatDate(selectedTransaction.createdAt)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">
                  Detail Pesanan
                </h4>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Item
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Qty
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Harga
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Subtotal
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {Array.isArray(selectedTransaction.items) &&
                      selectedTransaction.items.length > 0 ? (
                        selectedTransaction.items.map((item, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2 text-sm text-gray-900">
                              {item.name || "Unknown Item"}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-900">
                              {item.quantity || 0}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-900">
                              {formatCurrency(item.price || 0)}
                            </td>
                            <td className="px-4 py-2 text-sm font-medium text-gray-900">
                              {formatCurrency(
                                (item.price || 0) * (item.quantity || 0)
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-4 py-2 text-sm text-gray-500 text-center"
                          >
                            Tidak ada item
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">
                    Total Pembayaran
                  </span>
                  <span className="text-xl font-bold text-orange-600">
                    {formatCurrency(selectedTransaction.totalAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
