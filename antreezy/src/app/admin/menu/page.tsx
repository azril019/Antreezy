"use client";

import { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import MenuFormModal from "@/components/MenuFormModal";

interface MenuItem {
  id: string;
  name: string;
  description: string;
  composition?: string;
  category: string;
  price: number;
  stock: number;
  status: "tersedia" | "habis";
  image?: string; // New field for image URL
  createdAt?: string;
  updatedAt?: string;
  nutritionalInfo?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sugar: number;
  };
}

export default function MenuManagementPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentMenuItem, setCurrentMenuItem] = useState<MenuItem | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState({
    total: 0,
    available: 0,
    outOfStock: 0,
    categories: 0,
  });

  const fetchMenuItems = async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/menus`);
      if (!response.ok) {
        throw new Error("Failed to fetch menu items");
      }
      const data = await response.json();

      // Pastikan data yang diterima adalah array
      const items = Array.isArray(data)
        ? data
        : data.menuItems || data.data || [];

      // Sort items by createdAt (newest first) or by id as fallback
      const sortedItems = items.sort((a: MenuItem, b: MenuItem) => {
        // Jika ada field createdAt, gunakan itu
        if (a.createdAt && b.createdAt) {
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        }
        // Jika ada field updatedAt, gunakan itu sebagai alternatif
        if (a.updatedAt && b.updatedAt) {
          return (
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
        }
        // Fallback: sort by id (pastikan id tidak undefined)
        if (a.id && b.id) {
          return b.id.localeCompare(a.id);
        }
        // Jika salah satu id undefined, prioritaskan yang ada id
        if (a.id && !b.id) return -1;
        if (!a.id && b.id) return 1;
        // Jika keduanya undefined, return 0 (equal)
        return 0;
      });

      setMenuItems(sortedItems);

      // Calculate stats
      const categories: number = new Set(
        sortedItems.map((item: MenuItem) => item.category)
      ).size;
      const available: number = sortedItems.filter(
        (item: MenuItem) => item.status === "tersedia"
      ).length;
      const outOfStock: number = sortedItems.filter(
        (item: MenuItem) => item.status === "habis"
      ).length;

      setStats({
        total: sortedItems.length,
        available: available,
        outOfStock: outOfStock,
        categories: categories,
      });
    } catch (err) {
      console.error("Error fetching menu items:", err);
      setError("Failed to fetch menu items");
      toast.error("Failed to fetch menu items");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const filteredMenuItems = menuItems
    .filter(
      (item) =>
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a: MenuItem, b: MenuItem) => {
      // Re-apply sorting after filtering
      if (a.createdAt && b.createdAt) {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
      if (a.updatedAt && b.updatedAt) {
        return (
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      }
      // Safe comparison untuk id
      if (a.id && b.id) {
        return b.id.localeCompare(a.id);
      }
      if (a.id && !b.id) return -1;
      if (!a.id && b.id) return 1;
      return 0;
    });

  const handleDeleteMenuItem = async (menuItem: MenuItem) => {
    toast(
      (t) => (
        <div className="flex flex-col">
          <div className="mb-3">
            <p className="font-medium text-gray-900">Hapus Menu</p>
            <p className="text-sm text-gray-600">
              Yakin ingin menghapus{" "}
              <span className="font-semibold">&quot;{menuItem.name}&quot;</span>
              ?
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => {
                toast.dismiss(t.id);
                confirmDelete(menuItem.id);
              }}
              className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
            >
              Hapus
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400 transition-colors"
            >
              Batal
            </button>
          </div>
        </div>
      ),
      {
        duration: 8000,
        style: {
          background: "#fff",
          color: "#374151",
          border: "1px solid #d1d5db",
          borderRadius: "8px",
          padding: "16px",
          maxWidth: "400px",
        },
      }
    );
  };

  const confirmDelete = async (menuId: string) => {
    const deletePromise = async () => {
      setIsLoading(true);
      setError("");

      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/menus/${menuId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete menu item");
      }

      await fetchMenuItems();
      setIsLoading(false);
      return "Menu berhasil dihapus";
    };

    toast.promise(
      deletePromise(),
      {
        loading: "Menghapus menu...",
        success: (message) => message,
        error: "Gagal menghapus menu",
      },
      {
        style: {
          minWidth: "250px",
        },
        success: {
          duration: 3000,
          iconTheme: {
            primary: "#10B981",
            secondary: "#fff",
          },
        },
        error: {
          duration: 4000,
          iconTheme: {
            primary: "#EF4444",
            secondary: "#fff",
          },
        },
      }
    );
  };

  const handleEditMenuItem = (menuItem: MenuItem) => {
    setCurrentMenuItem(menuItem);
    setIsModalOpen(true);
  };

  const handleAddMenuItem = () => {
    setCurrentMenuItem(null);
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (menuData: unknown) => {
    setIsLoading(true);

    try {
      let url = `${process.env.NEXT_PUBLIC_BASE_URL}/api/menus`;
      let method = "POST";
      if (currentMenuItem) {
        url = `${process.env.NEXT_PUBLIC_BASE_URL}/api/menus/${currentMenuItem.id}`;
        method = "PUT";
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(menuData),
      });

      if (!response.ok) {
        throw new Error(
          currentMenuItem
            ? "Failed to update menu item"
            : "Failed to add menu item"
        );
      }
      await fetchMenuItems();
      setIsModalOpen(false);
      setCurrentMenuItem(null);

      toast.success(
        currentMenuItem
          ? "Menu berhasil diperbarui"
          : "Menu berhasil ditambahkan"
      );
    } catch (err) {
      console.error("Error submitting menu item:", err);
      toast.error(
        currentMenuItem ? "Gagal memperbarui menu" : "Gagal menambahkan menu"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={8}
        containerClassName=""
        containerStyle={{}}
        toastOptions={{
          className: "",
          duration: 4000,
          style: {
            background: "#363636",
            color: "#fff",
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: "#10B981",
              secondary: "#fff",
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: "#EF4444",
              secondary: "#fff",
            },
          },
        }}
      />

      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Manajemen Menu</h1>
            <p className="text-gray-600">Kelola menu dan stok makanan</p>
          </div>
          <button
            onClick={handleAddMenuItem}
            className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors flex items-center"
          >
            <span className="mr-1">+</span> Tambah Menu
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-500">Total Menu</p>
            <h2 className="text-2xl text-blue-600 font-bold">{stats.total}</h2>
          </div>
          <div className="bg-blue-100 p-2 rounded-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-500">Tersedia</p>
            <h2 className="text-2xl font-bold text-green-600">
              {stats.available}
            </h2>
          </div>
          <div className="bg-green-100 p-2 rounded-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-500">Stok Habis</p>
            <h2 className="text-2xl font-bold text-red-600">
              {stats.outOfStock}
            </h2>
          </div>
          <div className="bg-red-100 p-2 rounded-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-500">Kategori</p>
            <h2 className="text-2xl text-purple-600 font-bold">
              {stats.categories}
            </h2>
          </div>
          <div className="bg-purple-100 p-2 rounded-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-purple-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
              />
            </svg>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
          <p>{error}</p>
        </div>
      )}

      <div className="mb-4">
        <h2 className="text-xl text-black font-semibold mb-2">
          Daftar Menu
          <span className="text-sm text-gray-500 ml-2">(Terbaru di atas)</span>
        </h2>
        <div className="text-black relative">
          <input
            type="text"
            placeholder="Cari menu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-black md:w-64 p-2 pl-8 border rounded-lg"
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-gray-400 absolute left-2 top-2.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            <span className="ml-2">Loading...</span>
          </div>
        ) : filteredMenuItems.length === 0 ? (
          <div className="text-center p-8">
            <div className="text-gray-500 mb-4">
              {menuItems.length === 0
                ? "Belum ada menu tersedia"
                : "Tidak ada menu yang sesuai dengan pencarian"}
            </div>
            {menuItems.length === 0 && (
              <button
                onClick={handleAddMenuItem}
                className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
              >
                Tambah Menu Pertama
              </button>
            )}
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Menu
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kategori
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Harga
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stok
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMenuItems.map((menuItem, index) => (
                <tr
                  key={menuItem.id}
                  className={index === 0 ? "bg-orange-50" : ""}
                >
                  {" "}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {menuItem.image ? (
                          <img
                            src={menuItem.image}
                            alt={menuItem.name}
                            className="h-10 w-10 rounded-lg object-cover"
                          />
                        ) : (
                          <div
                            className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                              index === 0
                                ? "bg-orange-200 text-orange-900"
                                : "bg-orange-100 text-orange-800"
                            }`}
                          >
                            {menuItem.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div
                          className={`text-sm font-medium ${
                            index === 0 ? "text-orange-900" : "text-gray-900"
                          }`}
                        >
                          {menuItem.name}
                          {index === 0 && (
                            <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                              Terbaru
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {menuItem.description &&
                            menuItem.description.substring(0, 40)}
                          {menuItem.description &&
                          menuItem.description.length > 40
                            ? "..."
                            : ""}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {menuItem.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    Rp {menuItem.price.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {menuItem.stock} pcs
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        menuItem.status === "tersedia"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {menuItem.status === "tersedia" ? "Tersedia" : "Habis"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditMenuItem(menuItem)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteMenuItem(menuItem)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <MenuFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          menuItem={currentMenuItem}
          onSubmit={handleModalSubmit}
          isProcessing={isLoading}
        />
      )}
    </div>
  );
}
