"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const [user, setUser] = useState<{ username: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Example: fetch profile from API
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
        router.push("/admin/login");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [router]);

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
      {/* Tambahkan komponen statistik dan daftar pesanan di sini */}
      <div className="mt-8 text-gray-500 text-center">
        <p>Dashboard admin siap digunakan. Silakan tambahkan fitur sesuai kebutuhan.</p>
      </div>
    </div>
  );
}