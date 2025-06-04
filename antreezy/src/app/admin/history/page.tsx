"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Download,
  Eye,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  CheckCircle,
  XCircle,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

interface OrderHistory {
  _id: string;
  orderId: string;
  tableId: string;
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
  status: string;
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
  const [filteredTransactions, setFilteredTransactions] = useState<OrderHistory[]>([]);
  const [stats, setStats] = useState<TransactionStats>({
    totalTransactions: 0,
    totalRevenue: 0,
    totalItems: 0,
    successfulTransactions: 0,
    averageOrderValue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [selectedTransaction, setSelectedTransaction] = useState<OrderHistory | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Fetch hanya status "done"
  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/orders");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log("API DATA:", data);
      const orders = Array.isArray(data) ? data : [];

      // Filter hanya status "done"
      const doneOrders = orders
        .filter((order: any) => order?.status === "done")
        .map((order: any) => ({
          _id: order._id || order.id || "",
          orderId: order.orderId || order._id || order.id || "",
          tableId: order.tableId || "Unknown",
          items: Array.isArray(order.items)
            ? order.items.map((item: any) => ({
                id: item.id || item._id || "",
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
          status: order.status || "unknown",
          paymentMethod: order.paymentMethod || "Unknown",
          createdAt: order.createdAt || new Date().toISOString(),
          updatedAt: order.updatedAt || new Date().toISOString(),
          completedAt: order.completedAt || order.updatedAt || new Date().toISOString(),
        }));
        console.log("Fetched transactions:", doneOrders);

      setTransactions(doneOrders);
      setFilteredTransactions(doneOrders);
      calculateStats(doneOrders);
    } catch (error) {
      toast.error("Gagal memuat riwayat transaksi. Silakan coba lagi.");
      setTransactions([]);
      setFilteredTransactions([]);
    } finally {
      setLoading(false);
    }
  };

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
    const totalRevenue = orders.reduce((sum, order) => sum + (Number(order.totalAmount) || 0), 0);
    const totalItems = orders.reduce(
      (sum, order) =>
        sum +
        (Array.isArray(order.items)
          ? order.items.reduce((itemSum, item) => itemSum + (Number(item.quantity) || 0), 0)
          : 0),
      0
    );
    const successfulTransactions = orders.length; // semua "done"
    const averageOrderValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

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
        const customerName = (transaction.customerDetails?.name || "").toLowerCase();
        const tableId = (transaction.tableId || "").toString().toLowerCase();
        return (
          orderId.includes(searchLower) ||
          customerName.includes(searchLower) ||
          tableId.includes(searchLower)
        );
      });
    }
    if (statusFilter !== "all") {
      filtered = filtered.filter((transaction) => transaction.status === statusFilter);
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
  }, [transactions, searchTerm, statusFilter, dateFilter]);

  useEffect(() => {
    fetchTransactions();
  }, []);

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
      return "Invalid Date";
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      done: {
        color: "bg-green-100 text-green-800",
        icon: CheckCircle,
        label: "Selesai",
      },
      failed: {
        color: "bg-red-100 text-red-800",
        icon: XCircle,
        label: "Gagal",
      },
      cancelled: {
        color: "bg-gray-100 text-gray-800",
        icon: XCircle,
        label: "Dibatalkan",
      },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.failed;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    );
  };

  const exportToCSV = () => {
    if (!Array.isArray(filteredTransactions) || filteredTransactions.length === 0) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }
    const headers = [
      "ID Pesanan",
      "Meja",
      "Pelanggan",
      "Total",
      "Status",
      "Tanggal",
    ];
    const csvData = filteredTransactions.map((transaction) => [
      transaction.orderId || "",
      `Meja ${transaction.tableId || ""}`,
      transaction.customerDetails?.name || "",
      transaction.totalAmount || 0,
      transaction.status || "",
      formatDate(transaction.createdAt),
    ]);
    const csvContent = [headers, ...csvData]
      .map((row) => row.map((field) => `"${field}"`).join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `riwayat-transaksi-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast.success("Data berhasil diekspor!");
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <Toaster position="top-right" />

      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Riwayat Transaksi
            </h1>
            <p className="text-gray-600">
              Kelola dan analisis riwayat transaksi restoran
            </p>
          </div>
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

        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Filter Transaksi
            </h2>

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
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Semua Status</option>
                <option value="done">Selesai</option>
              </select>

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
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
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
                        Meja {transaction.tableId || "N/A"}
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {formatCurrency(transaction.totalAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(transaction.status)}
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
                    <p>
                      <span className="text-gray-500">ID:</span>{" "}
                      {selectedTransaction.orderId || "N/A"}
                    </p>
                    <p>
                      <span className="text-gray-500">Meja:</span>{" "}
                      {selectedTransaction.tableId || "N/A"}
                    </p>
                    <p>
                      <span className="text-gray-500">Status:</span>{" "}
                      {getStatusBadge(selectedTransaction.status)}
                    </p>
                    <p>
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
                    <p>
                      <span className="text-gray-500">Nama:</span>{" "}
                      {selectedTransaction.customerDetails?.name || "Unknown"}
                    </p>

                    {selectedTransaction.customerDetails?.phone && (
                      <p>
                        <span className="text-gray-500">HP:</span>{" "}
                        {selectedTransaction.customerDetails.phone}
                      </p>
                    )}
                    <p>
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
                            <td className="px-4 py-2 text-sm text-gray-500">
                              {item.quantity || 0}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-500">
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