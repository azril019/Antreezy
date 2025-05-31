"use client";

import { Dialog } from "@headlessui/react";
import { useState, useEffect } from "react";

interface Table {
  id: string;
  nomor: string;
  nama: string;
  kapasitas: number;
  lokasi: string;
  status: "Tersedia" | "Terisi" | "Dipesan";
  qrCode: string;
}

interface TableFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  table: Table | null;
  onSubmit: (tableData: any) => void;
  isProcessing: boolean;
}

export default function TableFormModal({
  isOpen,
  onClose,
  table,
  onSubmit,
  isProcessing,
}: TableFormModalProps) {
  const [formData, setFormData] = useState({
    nomor: "",
    nama: "",
    kapasitas: 2,
    lokasi: "",
    status: "Tersedia" as "Tersedia" | "Terisi" | "Dipesan",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Populate form when editing
  useEffect(() => {
    if (table) {
      setFormData({
        nomor: table.nomor,
        nama: table.nama,
        kapasitas: table.kapasitas,
        lokasi: table.lokasi,
        status: table.status,
      });
    } else {
      // Reset form for new table
      setFormData({
        nomor: "",
        nama: "",
        kapasitas: 2,
        lokasi: "",
        status: "Tersedia",
      });
    }
    setErrors({});
  }, [table, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nomor.trim()) {
      newErrors.nomor = "Nomor meja wajib diisi";
    }
    if (!formData.nama.trim()) {
      newErrors.nama = "Nama meja wajib diisi";
    }
    if (!formData.lokasi.trim()) {
      newErrors.lokasi = "Lokasi meja wajib diisi";
    }
    if (formData.kapasitas < 1 || formData.kapasitas > 20) {
      newErrors.kapasitas = "Kapasitas harus antara 1-20 orang";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    onSubmit(formData);
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: name === "kapasitas" ? Number(value) : value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="fixed z-10 inset-0 overflow-y-auto"
    >
      <div className="flex items-center justify-center min-h-screen">
        <div className="fixed inset-0 bg-black opacity-30" aria-hidden="true" />

        <div className="relative bg-white rounded-lg max-w-lg w-full mx-auto p-6 shadow-xl max-h-[90vh] overflow-y-auto">
          <Dialog.Title className="text-lg font-medium text-black mb-4">
            {table ? "Edit Meja" : "Tambah Meja Baru"}
          </Dialog.Title>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nomor Meja */}
            <div>
              <label
                htmlFor="nomor"
                className="block text-sm font-medium text-black mb-1"
              >
                Nomor Meja *
              </label>
              <input
                type="text"
                name="nomor"
                id="nomor"
                value={formData.nomor}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded-md text-black ${
                  errors.nomor ? "border-red-500" : "border-gray-300"
                } focus:ring-2 focus:ring-orange-500 focus:border-transparent`}
                placeholder="Contoh: #01, A1, VIP-01"
                disabled={isProcessing}
                required
              />
              {errors.nomor && (
                <p className="text-red-500 text-xs mt-1">{errors.nomor}</p>
              )}
            </div>

            {/* Nama Meja */}
            <div>
              <label
                htmlFor="nama"
                className="block text-sm font-medium text-black mb-1"
              >
                Nama Meja *
              </label>
              <input
                type="text"
                name="nama"
                id="nama"
                value={formData.nama}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded-md text-black ${
                  errors.nama ? "border-red-500" : "border-gray-300"
                } focus:ring-2 focus:ring-orange-500 focus:border-transparent`}
                placeholder="Contoh: Meja Depan Kiri, Meja VIP"
                disabled={isProcessing}
                required
              />
              {errors.nama && (
                <p className="text-red-500 text-xs mt-1">{errors.nama}</p>
              )}
            </div>

            {/* Kapasitas dan Lokasi */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="kapasitas"
                  className="block text-sm font-medium text-black mb-1"
                >
                  Kapasitas *
                </label>
                <input
                  type="number"
                  name="kapasitas"
                  id="kapasitas"
                  value={formData.kapasitas}
                  onChange={handleInputChange}
                  className={`w-full p-2 border rounded-md text-black ${
                    errors.kapasitas ? "border-red-500" : "border-gray-300"
                  } focus:ring-2 focus:ring-orange-500 focus:border-transparent`}
                  min="1"
                  max="20"
                  disabled={isProcessing}
                  required
                />
                {errors.kapasitas && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.kapasitas}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="lokasi"
                  className="block text-sm font-medium text-black mb-1"
                >
                  Lokasi *
                </label>
                <select
                  name="lokasi"
                  id="lokasi"
                  value={formData.lokasi}
                  onChange={handleInputChange}
                  className={`w-full p-2 border rounded-md text-black ${
                    errors.lokasi ? "border-red-500" : "border-gray-300"
                  } focus:ring-2 focus:ring-orange-500 focus:border-transparent`}
                  disabled={isProcessing}
                  required
                >
                  <option value="">Pilih lokasi</option>
                  <option value="Indoor">Indoor</option>
                  <option value="Outdoor">Outdoor</option>
                  <option value="VIP Room">VIP Room</option>
                  <option value="Terrace">Terrace</option>
                  <option value="Private Room">Private Room</option>
                </select>
                {errors.lokasi && (
                  <p className="text-red-500 text-xs mt-1">{errors.lokasi}</p>
                )}
              </div>
            </div>

            {/* Status (only show when editing) */}
            {table && (
              <div>
                <label
                  htmlFor="status"
                  className="block text-sm font-medium text-black mb-1"
                >
                  Status
                </label>
                <select
                  name="status"
                  id="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md text-black focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  disabled={isProcessing}
                >
                  <option value="Tersedia">Tersedia</option>
                  <option value="Terisi">Terisi</option>
                  <option value="Dipesan">Dipesan</option>
                </select>
              </div>
            )}

            {/* Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-black bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                disabled={isProcessing}
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {table ? "Mengupdate..." : "Menambahkan..."}
                  </div>
                ) : table ? (
                  "Update Meja"
                ) : (
                  "Tambah Meja"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Dialog>
  );
}
