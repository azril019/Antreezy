"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import { handleLogout } from "@/actions";
import Image from "next/image";

interface AdminSidebarProps {
  children: React.ReactNode;
  currentPath?: string;
}

const navigationItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  {
    title: "Manajemen Menu",
    url: "/admin/menu",
    icon: ChefHat,
    restrictedFrom: ["staff"],
  },
  {
    title: "Manajemen Meja",
    url: "/admin/manage-tables",
    icon: MapPin,
    restrictedFrom: ["staff"],
  },
  { title: "Riwayat Transaksi", url: "/admin/history", icon: History },
];

const managementItems = [
  { title: "Laporan", url: "/admin/reports", icon: BarChart3 },
  {
    title: "Pengaturan",
    url: "/admin/settings",
    icon: Settings,
    restrictedFrom: ["staff"],
  },
  {
    title: "Manajemen User",
    url: "/admin/manage-users",
    icon: Users,
    requiredRole: "admin",
  },
];

export default function AdminSidebar({
  children,
  currentPath = "/admin",
}: AdminSidebarProps) {
  const [notifications] = useState(3);
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<{ username: string; role: string } | null>(
    null
  );

  useEffect(() => {
    setMounted(true);
    const fetchProfile = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/profile`
        );
        if (!res.ok) throw new Error("Unauthorized");
        const data = await res.json();
        setUser({
          username: data.user.username,
          role: data.user.role,
        });
      } catch (err) {
        console.error("Failed to fetch profile:", err);
        window.location.href = "/admin/login";
      }
    };
    fetchProfile();
  }, []);

  const getInitials = (name?: string) => {
    if (!name) return "AD";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const filteredNavigationItems = navigationItems.filter((item) => {
    if (item.restrictedFrom && user?.role) {
      return !item.restrictedFrom.includes(user.role);
    }
    return true;
  });

  const filteredManagementItems = managementItems.filter((item) => {
    // Check for required role
    if (item.requiredRole) {
      return user?.role === item.requiredRole || user?.role === "admin";
    }

    // Check for restricted roles
    if (item.restrictedFrom && user?.role) {
      return !item.restrictedFrom.includes(user.role);
    }

    return true;
  });

  if (!mounted) return null;

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r flex flex-col h-screen sticky top-0">
        <div className="flex items-center gap-3 px-6 py-2 border-b">
          <div className="flex items-center justify-center w-12 h-12 rounded-lg">
            <Image
              src="/logo.png"
              alt="Antreezy Logo"
              width={50}
              height={50}
              className="rounded-lg w-12 h-12"
            />
          </div>
          <div>
            <div className="font-bold text-black text-lg leading-tight">
              Antreezy
            </div>
            <div className="text-xs text-gray-500">Admin Panel</div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto">
          <div className="px-4 pt-4 pb-2 text-xs font-semibold text-gray-500">
            Menu Utama
          </div>
          <ul>
            {filteredNavigationItems.map((item) => (
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
            {user?.role === "admin" && (
              <span className="ml-2 px-2 py-0.5 rounded bg-orange-100 text-orange-600 text-[10px] border border-orange-200">
                Admin
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
                </a>
              </li>
            ))}
          </ul>
        </nav>
        {/* Footer */}
        <div className="border-t px-6 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-orange-500 text-white flex items-center justify-center font-bold text-lg">
            {user ? getInitials(user.username) : "AD"}
          </div>
          <div className="flex-1">
            <div className="font-semibold text-black text-sm truncate">
              {user?.username || "Admin User"}
            </div>
            <div className="text-xs text-gray-500 truncate">
              {user?.role === "admin" ? "Admin" : "Staff"}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="ml-2 p-2 rounded hover:bg-orange-100 text-gray-600 hover:text-orange-600 transition"
            title="Keluar"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-auto">
        {/* Top Header */}
        <header className="flex h-16 items-center gap-2 border-b bg-white px-6">
          <div className="flex flex-1 items-center justify-between">
            <div className="flex items-center gap-2">
              <h1 className="text-lg text-black font-semibold">
                Admin Dashboard
              </h1>
              {user && (
                <span className="ml-2 px-2 py-0.5 rounded bg-orange-100 text-orange-600 text-xs border border-orange-200">
                  {user?.role === "admin" ? "Admin" : "Staff"}
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
