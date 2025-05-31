"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  QrCode,
  Edit,
  Trash2,
  Filter,
  Users,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";

type TableStatus = "Tersedia" | "Terisi" | "Dipesan";

interface Table {
  id: number;
  nomor: string;
  nama: string;
  kapasitas: number;
  lokasi: string;
  status: TableStatus;
  orderAktif: string | null;
  qrCode: string;
}

const TableManagement = () => {
  const [tables, setTables] = useState<Table[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("Semua Status");
  const [locationFilter, setLocationFilter] = useState("Semua Lokasi");
  const [viewMode, setViewMode] = useState("Table");

  // Sample data - replace with actual API call
  useEffect(() => {
    const sampleTables: Table[] = [
      {
        id: 1,
        nomor: "#01",
        nama: "Meja Depan Kiri",
        kapasitas: 4,
        lokasi: "Indoor",
        status: "Tersedia",
        orderAktif: null,
        qrCode: "QR001",
      },
      {
        id: 2,
        nomor: "#02",
        nama: "Meja VIP",
        kapasitas: 6,
        lokasi: "VIP Room",
        status: "Terisi",
        orderAktif: "ORD-001234",
        qrCode: "QR002",
      },
      {
        id: 3,
        nomor: "#03",
        nama: "Meja Outdoor",
        kapasitas: 2,
        lokasi: "Outdoor",
        status: "Dipesan",
        orderAktif: null,
        qrCode: "QR003",
      },
      {
        id: 4,
        nomor: "#04",
        nama: "Meja Tengah",
        kapasitas: 4,
        lokasi: "Indoor",
        status: "Tersedia",
        orderAktif: null,
        qrCode: "QR004",
      },
    ];
    setTables(sampleTables);
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

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Meja</h1>
          <p className="text-gray-600">Kelola meja dan QR code restoran</p>
        </div>
        <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
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
            <h2 className="text-xl font-semibold">Daftar Meja</h2>
            <div className="flex gap-2">
              <button
                className={`px-3 py-1 rounded ${
                  viewMode === "Grid" ? "bg-gray-200" : "bg-gray-100"
                }`}
                onClick={() => setViewMode("Grid")}
              >
                Grid
              </button>
              <button
                className={`px-3 py-1 rounded ${
                  viewMode === "Table" ? "bg-gray-200" : "bg-gray-100"
                }`}
                onClick={() => setViewMode("Table")}
              >
                Table
              </button>
            </div>
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
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option>Semua Status</option>
              <option>Tersedia</option>
              <option>Terisi</option>
              <option>Dipesan</option>
            </select>
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
            >
              <option>Semua Lokasi</option>
              <option>Indoor</option>
              <option>Outdoor</option>
              <option>VIP Room</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
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
                    <button className="flex items-center gap-1 text-blue-600 hover:text-blue-800">
                      <QrCode size={16} />
                      Generate
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button className="text-blue-600 hover:text-blue-800">
                        <Edit size={16} />
                      </button>
                      <button className="text-red-600 hover:text-red-800">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TableManagement;
