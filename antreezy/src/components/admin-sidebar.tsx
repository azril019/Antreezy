"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ChefHat,
  History,
  Settings,
  Users,
  BarChart3,
  Bell,
  LogOut,
  MapPin,
  UserPlus,
} from "lucide-react";

interface AdminSidebarProps {
  children: React.ReactNode;
  currentPath?: string;
}

const navigationItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Manajemen Menu", url: "/admin/menu", icon: ChefHat },
  { title: "Manajemen Meja", url: "/admin/tables", icon: MapPin },
  { title: "Riwayat Transaksi", url: "/admin/history", icon: History },
];

const managementItems = [
  { title: "Laporan", url: "/admin/reports", icon: BarChart3 },
  { title: "Pengaturan", url: "/admin/settings", icon: Settings },
  { title: "Manajemen User", url: "/admin/users", icon: Users, requiredRole: "super_admin" },
  { title: "Tambah User", url: "/admin/users/add", icon: UserPlus, badge: "New", requiredRole: "super_admin" },
];

export default function AdminSidebar({ children, currentPath = "/admin" }: AdminSidebarProps) {
  const [notifications] = useState(3);
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    // Simulasi user, ganti dengan logic auth Anda
    const adminUser = localStorage.getItem("adminUser");
    if (adminUser) {
      setUser(JSON.parse(adminUser));
    } else {
      setUser({ name: "Admin User", role: "admin" });
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("adminUser");
    router.push("/admin/login");
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();

  const filteredManagementItems = managementItems.filter((item) => {
    if (item.requiredRole) {
      return user?.role === item.requiredRole || user?.role === "super_admin";
    }
    return true;
  });

  if (!mounted) return null;

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r flex flex-col">
        <div className="flex items-center gap-3 px-6 py-4 border-b">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-orange-500 text-white">
            <ChefHat className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-lg leading-tight">Antri Boss</div>
            <div className="text-xs text-gray-400">Admin Panel</div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto">
          <div className="px-4 pt-4 pb-2 text-xs font-semibold text-gray-500">Menu Utama</div>
          <ul>
            {navigationItems.map((item) => (
              <li key={item.title}>
                <a
                  href={item.url}
                  className={`flex items-center gap-3 px-6 py-2 rounded-lg transition-colors ${
                    currentPath === item.url
                      ? "bg-orange-100 text-orange-600 font-semibold"
                      : "hover:bg-orange-50 text-gray-700"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.title}
                </a>
              </li>
            ))}
          </ul>
          <div className="px-4 pt-6 pb-2 text-xs font-semibold text-gray-500 flex items-center gap-2">
            Manajemen
            {user?.role === "super_admin" && (
              <span className="ml-2 px-2 py-0.5 rounded bg-orange-100 text-orange-600 text-[10px] border border-orange-200">
                Super Admin
              </span>
            )}
          </div>
          <ul>
            {filteredManagementItems.map((item) => (
              <li key={item.title}>
                <a
                  href={item.url}
                  className={`flex items-center gap-3 px-6 py-2 rounded-lg transition-colors ${
                    currentPath === item.url
                      ? "bg-orange-100 text-orange-600 font-semibold"
                      : "hover:bg-orange-50 text-gray-700"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.title}
                  {item.badge && (
                    <span className="ml-auto px-2 py-0.5 rounded bg-orange-100 text-orange-600 text-[10px] border border-orange-200">
                      {item.badge}
                    </span>
                  )}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        {/* Footer */}
        <div className="border-t px-6 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-orange-500 text-white flex items-center justify-center font-bold text-lg">
            {user ? getInitials(user.name) : "AD"}
          </div>
          <div className="flex-1">
            <div className="font-semibold text-sm truncate">{user?.name || "Admin User"}</div>
            <div className="text-xs text-gray-400 truncate">
              {user?.role === "super_admin" ? "Super Admin" : "Admin"}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="ml-2 p-2 rounded hover:bg-orange-100 text-gray-500 hover:text-orange-600 transition"
            title="Keluar"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="flex h-16 items-center gap-2 border-b bg-white px-6">
          <div className="flex flex-1 items-center justify-between">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold">Admin Dashboard</h1>
              {user && (
                <span className="ml-2 px-2 py-0.5 rounded bg-orange-100 text-orange-600 text-xs border border-orange-200">
                  {user.role === "super_admin" ? "Super Admin" : "Admin"}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button className="relative p-2 rounded hover:bg-orange-100 transition">
                <Bell className="h-5 w-5 text-gray-500" />
                {notifications > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                    {notifications}
                  </span>
                )}
              </button>
            </div>
          </div>
        </header>
        <main className="flex-1 bg-gray-50">{children}</main>
      </div>
    </div>
  );
}