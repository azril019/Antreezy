"use client";

import { Dialog } from "@headlessui/react";
import { useState, useEffect } from "react";
import {
  Download,
  X,
  QrCode as QrIcon,
  Copy,
  RotateCcw,
  Trash2,
  Calendar,
} from "lucide-react";
import toast from "react-hot-toast";

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  table: {
    id: string;
    nomor: string;
    nama: string;
  } | null;
}

interface QRData {
  qrCodeDataURL: string;
  qrData: string;
  qrCodeBase64: string;
  generatedAt?: string;
  tableInfo: {
    id: string;
    nomor: string;
    nama: string;
  };
  isExisting?: boolean;
}

export default function QRCodeModal({
  isOpen,
  onClose,
  table,
}: QRCodeModalProps) {
  const [qrData, setQrData] = useState<QRData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check for existing QR code when modal opens
  useEffect(() => {
    if (isOpen && table) {
      checkExistingQRCode();
    }
  }, [isOpen, table]);

  const checkExistingQRCode = async () => {
    if (!table) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/tables/${table.id}/qr`);

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setQrData(result.data);
        }
      }
    } catch (error) {
      console.error("Error checking existing QR code:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateQRCode = async (forceRegenerate = false) => {
    if (!table) return;

    setIsGenerating(true);
    try {
      const response = await fetch(`/api/tables/${table.id}/qr`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "generate-qr",
          forceRegenerate,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to generate QR code");
      }

      const result = await response.json();

      if (result.success) {
        setQrData(result.data);
        toast.success(
          forceRegenerate
            ? "QR Code berhasil dibuat ulang!"
            : result.data.isExisting
            ? "QR Code sudah ada!"
            : "QR Code berhasil dibuat!"
        );
      } else {
        throw new Error(result.message || "Failed to generate QR code");
      }
    } catch (error: any) {
      console.error("Error generating QR code:", error);
      toast.error(error.message || "Gagal membuat QR Code");
    } finally {
      setIsGenerating(false);
    }
  };

  const deleteQRCode = async () => {
    if (!table || !qrData) return;

    try {
      const response = await fetch(`/api/tables/${table.id}/qr`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete QR code");
      }

      setQrData(null);
      toast.success("QR Code berhasil dihapus!");
    } catch (error: any) {
      console.error("Error deleting QR code:", error);
      toast.error("Gagal menghapus QR Code");
    }
  };

  const downloadQRCode = () => {
    if (!qrData || !table) return;

    try {
      const link = document.createElement("a");
      link.href = qrData.qrCodeDataURL;
      link.download = `QR_Table_${table.nomor}_${
        new Date().toISOString().split("T")[0]
      }.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("QR Code berhasil didownload!");
    } catch (error) {
      toast.error("Gagal mendownload QR Code");
    }
  };

  const copyQRLink = async () => {
    if (!qrData) return;

    try {
      await navigator.clipboard.writeText(qrData.qrData);
      toast.success("Link berhasil disalin!");
    } catch (error) {
      toast.error("Gagal menyalin link");
    }
  };

  const handleClose = () => {
    setQrData(null);
    onClose();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!isOpen || !table) return null;

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      className="fixed z-50 inset-0 overflow-y-auto"
    >
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black opacity-30" aria-hidden="true" />

        <div className="relative bg-white rounded-lg max-w-md w-full mx-auto p-6 shadow-xl">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <Dialog.Title className="text-lg font-medium text-black">
              QR Code - {table.nama}
            </Dialog.Title>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Memeriksa QR Code...</p>
            </div>
          )}

          {/* Content */}
          {!isLoading && (
            <div className="text-center">
              {!qrData ? (
                <div className="py-8">
                  <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <QrIcon className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Generate QR Code
                  </h3>
                  <p className="text-gray-500 mb-6">
                    QR Code untuk meja {table.nomor} - {table.nama}
                  </p>
                  <button
                    onClick={() => generateQRCode(false)}
                    disabled={isGenerating}
                    className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isGenerating ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Generating...
                      </div>
                    ) : (
                      "Generate QR Code"
                    )}
                  </button>
                </div>
              ) : (
                <div className="py-4">
                  {/* Status Badge */}
                  {qrData.isExisting && (
                    <div className="mb-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        QR Code Sudah Ada
                      </span>
                    </div>
                  )}

                  {/* QR Code Display */}
                  <div className="mb-4 bg-white p-4 rounded-lg border">
                    <img
                      src={qrData.qrCodeDataURL}
                      alt={`QR Code for table ${table.nomor}`}
                      className="mx-auto rounded"
                    />
                  </div>

                  {/* Table Info */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">
                      Detail Meja
                    </h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>
                        <span className="font-medium">Nomor:</span>{" "}
                        {table.nomor}
                      </p>
                      <p>
                        <span className="font-medium">Nama:</span> {table.nama}
                      </p>
                      {qrData.generatedAt && (
                        <p className="flex items-center justify-center gap-1 text-xs text-gray-500 mt-2">
                          <Calendar size={12} />
                          Dibuat: {formatDate(qrData.generatedAt)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* QR Link */}
                  <div className="bg-blue-50 rounded-lg p-3 mb-4">
                    <p className="text-xs text-blue-600 font-medium mb-1">
                      QR Code Link:
                    </p>
                    <p className="text-xs text-blue-800 break-all">
                      {qrData.qrData}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <button
                        onClick={downloadQRCode}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                      >
                        <Download size={16} />
                        Download
                      </button>
                      <button
                        onClick={copyQRLink}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        <Copy size={16} />
                        Copy Link
                      </button>
                    </div>

                    <div className="flex gap-2">
                      {/* Regenerate */}
                      <button
                        onClick={() => generateQRCode(true)}
                        disabled={isGenerating}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-orange-600 border border-orange-600 rounded-lg hover:bg-orange-50 transition-colors disabled:opacity-50"
                      >
                        <RotateCcw size={16} />
                        {isGenerating ? "Generating..." : "Generate Ulang"}
                      </button>

                      {/* Delete */}
                      <button
                        onClick={deleteQRCode}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={16} />
                        Hapus
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
}
