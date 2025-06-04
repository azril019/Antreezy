"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  QrCode,
  Edit,
  Trash2,
  Users,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { NewTable, Table } from "@/app/types";
import TableFormModal from "@/components/TableFormModal";
import QRCodeModal from "@/components/QRCodeModal";
import toast, { Toaster } from "react-hot-toast";

type TableStatus = "Tersedia" | "Terisi" | "Dipesan";

const TableManagement = () => {
  const [tables, setTables] = useState<Table[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("Semua Status");
  const [locationFilter, setLocationFilter] = useState("Semua Lokasi");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTable, setCurrentTable] = useState<Table | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedTableForQR, setSelectedTableForQR] = useState<{
    id: string;
    nomor: string;
    nama: string;
  } | null>(null);

  // Fetch tables from database
  const fetchTables = async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/tables`);
      if (!response.ok) {
        throw new Error("Failed to fetch tables");
      }
      const data = await response.json();

      // Pastikan data yang diterima adalah array
      const tablesData = Array.isArray(data)
        ? data
        : data.tables || data.data || [];

      setTables(tablesData);
    } catch (err) {
      console.error("Error fetching tables:", err);
      setError("Failed to fetch tables");
      toast.error("Gagal memuat data meja");
    } finally {
      setIsLoading(false);
    }
  };

  // Load tables on component mount
  useEffect(() => {
    fetchTables();
  }, []);

  const getStatusBadge = (status: TableStatus) => {
    const statusClasses: Record<TableStatus, string> = {
      Tersedia: "bg-green-100 text-green-800",
      Terisi: "bg-red-100 text-red-800",
      Dipesan: "bg-yellow-100 text-yellow-800",
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${statusClasses[status]}`}
      >
        {status}
      </span>
    );
  };

  const getStatusCount = (status: TableStatus): number => {
    return tables.filter((table: Table) => table.status === status).length;
  };

  const getTotalTables = () => tables.length;

  const filteredTables = tables.filter((table) => {
    const matchesSearch =
      table.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      table.nomor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "Semua Status" || table.status === statusFilter;
    const matchesLocation =
      locationFilter === "Semua Lokasi" || table.lokasi === locationFilter;

    return matchesSearch && matchesStatus && matchesLocation;
  });

  // Handle add table
  const handleAddTable = () => {
    setCurrentTable(null);
    setIsModalOpen(true);
  };

  // Handle edit table
  const handleEditTable = (table: Table) => {
    setCurrentTable(table);
    setIsModalOpen(true);
  };

  // Handle modal submit (create or update)
  const handleModalSubmit = async (tableData: NewTable) => {
    setIsProcessing(true);

    try {
      let url = `${process.env.NEXT_PUBLIC_BASE_URL}/api/tables`;
      let method = "POST";

      if (currentTable) {
        url = `${process.env.NEXT_PUBLIC_BASE_URL}/api/tables/${currentTable.id}`;
        method = "PUT";
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(tableData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message ||
            (currentTable ? "Failed to update table" : "Failed to add table")
        );
      }

      // Refresh tables list
      await fetchTables();

      // Close modal
      setIsModalOpen(false);
      setCurrentTable(null);

      // Show success message
      toast.success(
        currentTable
          ? "Meja berhasil diperbarui!"
          : "Meja berhasil ditambahkan!"
      );
    } catch (err) {
      console.error("Error submitting table:", err);
      toast.error(
        (err as Error).message ||
          (currentTable ? "Gagal memperbarui meja" : "Gagal menambahkan meja")
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle delete table
  const handleDeleteTable = async (tableId: string) => {
    // Using toast for confirmation instead of alert
    toast(
      (t) => (
        <div className="flex flex-col">
          <div className="mb-3">
            <p className="font-medium text-gray-900">Hapus Meja</p>
            <p className="text-sm text-gray-600">
              Apakah Anda yakin ingin menghapus meja ini?
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => {
                toast.dismiss(t.id);
                confirmDelete(tableId);
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

  const confirmDelete = async (tableId: string) => {
    const deletePromise = async () => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/tables/${tableId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete table");
      }

      await fetchTables();
      return "Meja berhasil dihapus";
    };

    toast.promise(
      deletePromise(),
      {
        loading: "Menghapus meja...",
        success: (message) => message,
        error: "Gagal menghapus meja",
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

  const handleGenerateQR = (table: Table) => {
    setSelectedTableForQR({
      id: table.id,
      nomor: table.nomor,
      nama: table.nama,
    });
    setQrModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading tables...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchTables}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Toast Container */}
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={8}
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

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Meja</h1>
          <p className="text-gray-600">Kelola meja dan QR code restoran</p>
        </div>
        <button
          onClick={handleAddTable}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={20} />
          Tambah Meja
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Meja</p>
              <p className="text-2xl text-blue-600 font-bold">
                {getTotalTables()}
              </p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-500" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Tersedia</p>
              <p className="text-2xl font-bold text-green-600">
                {getStatusCount("Tersedia")}
              </p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Terisi</p>
              <p className="text-2xl font-bold text-red-600">
                {getStatusCount("Terisi")}
              </p>
            </div>
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="w-6 h-6 text-red-500" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Dipesan</p>
              <p className="text-2xl font-bold text-yellow-600">
                {getStatusCount("Dipesan")}
              </p>
            </div>
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-lg shadow-sm">
        {/* Table Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl text-black font-semibold">Daftar Meja</h2>
          </div>

          {/* Filters */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Cari meja..."
                className="w-full pl-10 text-black pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="px-4 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option>Semua Status</option>
              <option>Tersedia</option>
              <option>Terisi</option>
              <option>Dipesan</option>
            </select>
            <select
              className="px-4 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
            >
              <option>Semua Lokasi</option>
              <option>Indoor</option>
              <option>Outdoor</option>
              <option>VIP Room</option>
              <option>Terrace</option>
              <option>Private Room</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          {filteredTables.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">🪑</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Tidak ada meja ditemukan
              </h3>
              <p className="text-gray-500 mb-4">
                {tables.length === 0
                  ? "Belum ada meja yang ditambahkan"
                  : "Tidak ada meja yang sesuai dengan filter"}
              </p>
              {tables.length === 0 && (
                <button
                  onClick={handleAddTable}
                  className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
                >
                  Tambah Meja Pertama
                </button>
              )}
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nomor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nama
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kapasitas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lokasi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order Aktif
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    QR Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTables.map((table) => (
                  <tr key={table.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {table.nomor}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {table.nama}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <span className="mr-1">👥</span>
                        {table.kapasitas}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {table.lokasi}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(table.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {table.orderAktif || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleGenerateQR(table)}
                        className={`flex items-center gap-1 hover:text-blue-800 transition-colors ${
                          table.qrCodeData ? "text-green-600" : "text-blue-600"
                        }`}
                        title={
                          table.qrCodeData
                            ? "QR Code sudah ada"
                            : "Generate QR Code"
                        }
                      >
                        <QrCode size={16} />
                        {table.qrCodeData ? "View QR" : "Generate"}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditTable(table)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Edit Meja"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteTable(table.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Hapus Meja"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Table Form Modal */}
      <TableFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setCurrentTable(null);
        }}
        table={currentTable}
        onSubmit={handleModalSubmit}
        isProcessing={isProcessing}
      />

      {/* QR Code Modal */}
      <QRCodeModal
        isOpen={qrModalOpen}
        onClose={() => {
          setQrModalOpen(false);
          setSelectedTableForQR(null);
        }}
        table={selectedTableForQR}
      />
    </div>
  );
};

export default TableManagement;
