"use client";

import { CardContent } from "@/components/CardContentStatus";
import { Card } from "@/components/CardStatus";
import { CheckCircle, ChefHat, Clock, Check } from "lucide-react";
import { useEffect, useState } from "react";

export default function AdminDashboard() {
  const statusConfig = {
    queue: { label: "Queue In", color: "bg-yellow-500", icon: Clock },
    cooking: { label: "Cooking", color: "bg-blue-500", icon: ChefHat },
    served: { label: "Served", color: "bg-green-500", icon: CheckCircle },
    done: { label: "Done", color: "bg-purple-500", icon: Check },
  };

  const [orders, setOrders] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [user, setUser] = useState<{ username: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);

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

    const fetchOrders = async () => {
      try {
        const res = await fetch("/api/cart");
        const data = await res.json();
        setOrders(data.data || []);
      } catch (err) {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    const fetchTables = async () => {
      try {
        const res = await fetch("/api/tables");
        const data = await res.json();
        setTables(Array.isArray(data) ? data : data.data || []);
      } catch (err) {
        setTables([]);
      }
    };

    fetchProfile();
    fetchOrders();
    fetchTables();
  }, []);

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

  return (
    <div className="p-6 space-y-6">
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-6 rounded-lg">
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
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Pesanan</p>
                <p className="text-2xl font-bold text-gray-800">{orders.length}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Dalam Antrian</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {orders.filter(order => order.status === "queue").length}
                </p>
              </div>
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Sedang Dimasak</p>
                <p className="text-2xl font-bold text-blue-600">
                  {orders.filter(order => order.status === "cooking").length}
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <ChefHat className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Selesai</p>
                <p className="text-2xl font-bold text-green-600">
                  {orders.filter(order => order.status === "served").length}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Order ID</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Meja</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Items</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Total</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Waktu</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {orders.map((order) => {
              const StatusIcon = statusConfig[order.status as keyof typeof statusConfig]?.icon || Clock;
              const statusColor = statusConfig[order.status as keyof typeof statusConfig]?.color || "bg-gray-400";
              const statusLabel = statusConfig[order.status as keyof typeof statusConfig]?.label || order.status;

              // Cari data meja berdasarkan order.tableId
              const tableData = tables.find(
                (t: any) => t._id === order.tableId || t.id === order.tableId
              );
              const tableNumber = tableData ? tableData.nomor : order.tableId;

              return (
                <tr key={order._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">{order._id}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm text-gray-800">
                      #{tableNumber}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 max-w-xs">
                    <ul className="space-y-1">
                      {order.items?.map((item: any, idx: number) => (
                        <li key={idx}>
                          {item.quantity}x {item.name}
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    Rp {order.items?.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-white text-sm ${statusColor}`}>
                      <StatusIcon className="w-4 h-4 mr-1" />
                      {statusLabel}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {order.updatedAt ? new Date(order.updatedAt).toLocaleTimeString() : "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {/* Tambahkan aksi jika perlu */}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}