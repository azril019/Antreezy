"use client";

import { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import UserFormModal from "@/components/UserformModal";

interface User {
  id: string;
  username: string;
  email: string;
  role: "admin" | "staff";
  handle?: string;
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/users`);
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to fetch users");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDeleteUser = async (user: User) => {
    // Menggunakan toast promise untuk konfirmasi
    toast(
      (t) => (
        <div className="flex flex-col">
          <div className="mb-3">
            <p className="font-medium text-gray-900">Hapus User</p>
            <p className="text-sm text-gray-600">
              Yakin ingin menghapus user{" "}
              <span className="font-semibold">&quot;{user.username}&quot;</span>
              ?
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Role: {user.role === "admin" ? "Admin" : "Staff"}
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => {
                toast.dismiss(t.id);
                confirmDelete(user.id);
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

  const confirmDelete = async (userId: string) => {
    const deletePromise = async () => {
      setIsLoading(true);
      setError("");

      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/users/${userId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete user");
      }

      await fetchUsers();
      setIsLoading(false);
      return "User berhasil dihapus";
    };

    toast.promise(
      deletePromise(),
      {
        loading: "Menghapus user...",
        success: (message) => message,
        error: "Gagal menghapus user",
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

  const handleEditUser = (user: User) => {
    setCurrentUser(user);
    setIsModalOpen(true);
  };

  const handleAddUser = () => {
    setCurrentUser(null);
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (userData: unknown) => {
    setIsLoading(true);

    try {
      let url = "/api/users";
      let method = "POST";

      // If we have a currentUser, we're updating
      if (currentUser) {
        url = `${process.env.NEXT_PUBLIC_BASE_URL}/api/users/${currentUser.id}`;
        method = "PUT";
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error(
          currentUser ? "Failed to update user" : "Failed to add user"
        );
      }

      // Refresh the user list
      await fetchUsers();

      // Close the modal and clear the current user
      setIsModalOpen(false);
      setCurrentUser(null);

      toast.success(
        currentUser ? "User berhasil diperbarui" : "User berhasil ditambahkan"
      );
    } catch (error) {
      console.error("Error submitting user form:", error);
      toast.error(
        currentUser ? "Gagal memperbarui user" : "Gagal menambahkan user"
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
          // Default options for all toasts
          className: "",
          duration: 4000,
          style: {
            background: "#363636",
            color: "#fff",
          },
          // Default options for specific types
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
            <h1 className="text-2xl font-bold text-gray-800">Manajemen User</h1>
            <p className="text-gray-600">Kelola akun staff dan izin akses</p>
          </div>
          <button
            onClick={handleAddUser}
            className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors flex items-center"
          >
            <span className="mr-1">+</span> Tambah User
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
          <p>{error}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            <span className="ml-2">Loading...</span>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center p-8">
            <div className="text-gray-500 mb-4">Belum ada user tersedia</div>
            <button
              onClick={handleAddUser}
              className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
            >
              Tambah User Pertama
            </button>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  USER
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ROLE
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  EMAIL
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  AKSI
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-800">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.username}
                        </div>
                        {user.handle && (
                          <div className="text-sm text-gray-500">
                            @{user.handle}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.role === "admin"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {user.role === "admin" ? "Admin" : "Staff"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditUser(user)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit User"
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
                        onClick={() => handleDeleteUser(user)}
                        className="text-red-600 hover:text-red-900"
                        title="Hapus User"
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

      <UserFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        user={currentUser}
        onSubmit={handleModalSubmit}
        isProcessing={isLoading}
      />
    </div>
  );
}
