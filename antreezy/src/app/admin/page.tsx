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
  }

  const orders = [
    {
      id: "ORD-001234",
      table: 12,
      customer: "Ahmad Rizki",
      items: "2x Nasi Goreng, 1x Ayam Bakar",
      total: "Rp 109,000",
      status: "queue",
      time: "14:30",
      action: "Mulai Masak",
    },
    {
      id: "ORD-001235",
      table: 8,
      customer: "Sari Dewi",
      items: "1x Gado-gado, 2x Jus Jeruk",
      total: "Rp 45,000",
      status: "cooking",
      time: "14:25",
      action: "Selesai",
    },
    {
      id: "ORD-001236",
      table: 15,
      customer: "Budi Santoso",
      items: "3x Soto Ayam, 1x Es Campur",
      total: "Rp 75,000",
      status: "served",
      time: "14:15",
      action: "",
    },
    {
      id: "ORD-001237",
      table: 3,
      customer: "Lisa Permata",
      items: "2x Rendang, 2x Nasi Putih",
      total: "Rp 95,000",
      status: "queue",
      time: "14:35",
      action: "Mulai Masak",
    },
  ];

  const [user, setUser] = useState<{ username: string; role: string } | null>(
    null
  );
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
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
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
              const StatusIcon = statusConfig[order.status as keyof typeof statusConfig].icon;
              const statusColor = statusConfig[order.status as keyof typeof statusConfig].color;
              const statusLabel = statusConfig[order.status as keyof typeof statusConfig].label;

              return (
                <tr key={order.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">{order.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm text-gray-800">
                      #{order.table}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 truncate max-w-xs">{order.items}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{order.total}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-white text-sm ${statusColor}`}>
                      <StatusIcon className="w-4 h-4 mr-1" />
                      {statusLabel}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{order.time}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {order.action && (
                      <button className="bg-orange-500 hover:bg-orange-600 text-white text-sm px-4 py-2 rounded-lg">
                        {order.action}
                      </button>
                    )}
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
