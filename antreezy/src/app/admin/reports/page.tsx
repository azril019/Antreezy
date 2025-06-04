"use client";

import React, {useState, useEffect} from "react";
import {
  Star,
  Edit,
  Trash2,
  Plus,
  Search,
  Filter,
  Download,
  MessageSquare,
  Calendar,
  User,
  Table,
} from "lucide-react";
import toast, {Toaster} from "react-hot-toast";

interface Review {
  id: string;
  orderId: string;
  tableId: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt?: string;
}

interface NewReview {
  orderId: string;
  tableId: string;
  rating: number;
  comment: string;
}

export default function ReportsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentReview, setCurrentReview] = useState<Review | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");

  // Form states
  const [formData, setFormData] = useState({
    orderId: "",
    tableId: "",
    rating: 0,
    comment: "",
  });

  const fetchReviews = async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/reviews`);
      if (!response.ok) {
        throw new Error("Failed to fetch reviews");
      }
      const data = await response.json();
      setReviews(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching reviews:", err);
      setError("Gagal memuat data review");
      toast.error("Gagal memuat data review");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleAddReview = () => {
    setCurrentReview(null);
    setFormData({
      orderId: "",
      tableId: "",
      rating: 0,
      comment: "",
    });
    setIsModalOpen(true);
  };

  const handleEditReview = (review: Review) => {
    setCurrentReview(review);
    setFormData({
      orderId: review.orderId,
      tableId: review.tableId,
      rating: review.rating,
      comment: review.comment,
    });
    setIsModalOpen(true);
  };

  const handleDeleteReview = async (review: Review) => {
    toast(
      (t) => (
        <div className="flex flex-col">
          <div className="mb-3">
            <p className="font-medium text-gray-900">Hapus Review</p>
            <p className="text-sm text-gray-600">
              Yakin ingin menghapus review dengan rating{" "}
              <span className="font-semibold">{review.rating} bintang</span>?
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => {
                toast.dismiss(t.id);
                confirmDelete(review.id);
              }}
              className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors">
              Hapus
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400 transition-colors">
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

  const confirmDelete = async (reviewId: string) => {
    const deletePromise = async () => {
      setIsLoading(true);
      setError("");

      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/reviews/${reviewId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete review");
      }

      await fetchReviews();
      setIsLoading(false);
      return "Review berhasil dihapus";
    };

    toast.promise(
      deletePromise(),
      {
        loading: "Menghapus review...",
        success: (message) => message,
        error: "Gagal menghapus review",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.orderId.trim() || !formData.tableId.trim()) {
      toast.error("Order ID dan Table ID harus diisi");
      return;
    }

    if (formData.rating < 1 || formData.rating > 5) {
      toast.error("Rating harus antara 1-5");
      return;
    }

    setIsLoading(true);

    try {
      const url = currentReview
        ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/reviews/${currentReview.id}`
        : `${process.env.NEXT_PUBLIC_BASE_URL}/api/reviews`;
      const method = currentReview ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(
          currentReview ? "Failed to update review" : "Failed to add review"
        );
      }

      await fetchReviews();
      setIsModalOpen(false);
      setCurrentReview(null);

      toast.success(
        currentReview
          ? "Review berhasil diperbarui"
          : "Review berhasil ditambahkan"
      );
    } catch (err) {
      toast.error(
        currentReview ? "Gagal memperbarui review" : "Gagal menambahkan review"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const filteredReviews = reviews.filter((review) => {
    const matchesSearch =
      review.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.tableId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.comment.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRating =
      ratingFilter === "all" || review.rating.toString() === ratingFilter;

    return matchesSearch && matchesRating;
  });

  const exportToCSV = () => {
    if (filteredReviews.length === 0) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }

    const headers = ["Order ID", "Table ID", "Rating", "Komentar", "Tanggal"];
    const csvData = filteredReviews.map((review) => [
      review.orderId,
      review.tableId,
      review.rating,
      review.comment || "",
      new Date(review.createdAt).toLocaleDateString("id-ID"),
    ]);

    const csvContent = [headers, ...csvData]
      .map((row) => row.map((field) => `"${field}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], {type: "text/csv;charset=utf-8;"});
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `laporan-review-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast.success("Data berhasil diekspor!");
  };

  const renderStarRating = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${
              i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            }`}
          />
        ))}
        <span className="text-sm text-gray-600 ml-2">({rating})</span>
      </div>
    );
  };

  const stats = {
    total: reviews.length,
    averageRating:
      reviews.length > 0
        ? (
            reviews.reduce((sum, review) => sum + review.rating, 0) /
            reviews.length
          ).toFixed(1)
        : 0,
    excellent: reviews.filter((r) => r.rating === 5).length,
    poor: reviews.filter((r) => r.rating <= 2).length,
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <Toaster position="top-right" />

      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Laporan Review</h1>
            <p className="text-gray-600">
              Kelola dan analisis review pelanggan
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={exportToCSV}
              disabled={filteredReviews.length === 0}
              className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
              <Download size={20} />
              Export CSV
            </button>
            <button
              onClick={handleAddReview}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
              <Plus size={20} />
              Tambah Review
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Review</p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.total}
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rating Rata-rata</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {stats.averageRating}
                </p>
              </div>
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Star className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Review Excellent</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.excellent}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Star className="w-5 h-5 text-green-600 fill-current" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Review Buruk</p>
                <p className="text-2xl font-bold text-red-600">{stats.poor}</p>
              </div>
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <Star className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Filter Review
            </h2>

            <div className="flex flex-wrap gap-4">
              <div className="relative flex-1 min-w-64">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Cari berdasarkan Order ID, Table ID, atau komentar..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-black"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-black"
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value)}>
                <option value="all">Semua Rating</option>
                <option value="5">5 Bintang</option>
                <option value="4">4 Bintang</option>
                <option value="3">3 Bintang</option>
                <option value="2">2 Bintang</option>
                <option value="1">1 Bintang</option>
              </select>
            </div>
          </div>
        </div>

        {/* Reviews Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                <span className="ml-2">Loading...</span>
              </div>
            ) : filteredReviews.length === 0 ? (
              <div className="text-center p-8">
                <div className="text-gray-500 mb-4">
                  {reviews.length === 0
                    ? "Belum ada review yang tersedia"
                    : "Tidak ada review yang sesuai dengan filter"}
                </div>
                {reviews.length === 0 && (
                  <button
                    onClick={handleAddReview}
                    className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
                  >
                    Tambah Review Pertama
                  </button>
                )}
              </div>
            ) : (
              <div className="max-h-[600px] overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Table ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rating
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Komentar
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tanggal
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredReviews.map((review) => (
                      <tr key={review.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">
                            #{review.orderId.slice(-6).toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Meja {review.tableId}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {renderStarRating(review.rating)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div 
                            className="max-w-xs truncate cursor-pointer hover:text-clip hover:whitespace-normal" 
                            title={review.comment}
                          >
                            {review.comment || (
                              <span className="text-gray-400 italic">
                                Tidak ada komentar
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex flex-col">
                            <span>
                              {new Date(review.createdAt).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                            <span className="text-xs text-gray-400">
                              {new Date(review.createdAt).toLocaleTimeString("id-ID", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditReview(review)}
                              className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                              title="Edit Review"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteReview(review)}
                              className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                              title="Hapus Review"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Table Footer with Stats */}
          {filteredReviews.length > 0 && (
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Menampilkan {filteredReviews.length} dari {reviews.length} review
                </p>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium text-gray-700">
                      {stats.averageRating}
                    </span>
                    <span className="text-sm text-gray-500">rata-rata</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {stats.excellent} excellent • {stats.poor} poor
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {currentReview ? "Edit Review" : "Tambah Review"}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Order ID
                  </label>
                  <input
                    type="text"
                    value={formData.orderId}
                    onChange={(e) =>
                      setFormData({...formData, orderId: e.target.value})
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-black"
                    placeholder="Masukkan Order ID"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Table ID
                  </label>
                  <input
                    type="text"
                    value={formData.tableId}
                    onChange={(e) =>
                      setFormData({...formData, tableId: e.target.value})
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-black"
                    placeholder="Masukkan Table ID"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rating (1-5)
                  </label>
                  <div className="flex items-center space-x-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFormData({...formData, rating: star})}
                        className="focus:outline-none">
                        <Star
                          className={`w-8 h-8 ${
                            star <= formData.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-sm text-gray-600 ml-2">
                      ({formData.rating}/5)
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Komentar
                  </label>
                  <textarea
                    value={formData.comment}
                    onChange={(e) =>
                      setFormData({...formData, comment: e.target.value})
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-black"
                    placeholder="Masukkan komentar (opsional)"
                    rows={3}
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors">
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                    {isLoading
                      ? "Menyimpan..."
                      : currentReview
                      ? "Update"
                      : "Simpan"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
