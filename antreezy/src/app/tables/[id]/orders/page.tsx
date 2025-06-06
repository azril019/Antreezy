"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import {
  ArrowLeft,
  Clock,
  ChefHat,
  CheckCircle,
  XCircle,
  Package,
  RefreshCw,
  Check,
  Star,
  X,
  MessageSquare,
  CreditCard,
} from "lucide-react";
import { NewReview } from "@/db/models/ReviewModel";
import toast, { Toaster } from "react-hot-toast";

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  _id: string;
  tableId: string;
  items: OrderItem[];
  totalAmount: number;
  status: "pending" | "queue" | "cooking" | "served" | "done";
  customerDetails: {
    name: string;
    phone?: string;
  };
  midtrans?: {
    token: string;
    redirect_url: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

interface Table {
  _id: string;
  nomor: number;
  nama: string;
}

export default function OrderStatusPage() {
  const params = useParams();
  const router = useRouter();
  const tableId = params.id as string;

  // Refs for cleanup
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const [orders, setOrders] = useState<Order[]>([]);
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);
  const [table, setTable] = useState<Table | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isCompletingOrder, setIsCompletingOrder] = useState<string | null>(
    null
  );
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewOrderId, setReviewOrderId] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isCancellingOrder, setIsCancellingOrder] = useState<string | null>(
    null
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);

  const statusConfig = {
    pending: {
      icon: Clock,
      color: "bg-yellow-500",
      textColor: "text-yellow-600",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-500",
      label: "Menunggu Pembayaran",
      description: "Pesanan belum dibayar",
      estimateText: "Silakan lakukan pembayaran",
      stepNumber: 1,
    },
    queue: {
      icon: Package,
      color: "bg-blue-500",
      textColor: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-500",
      label: "Dalam Antrian",
      description: "Pesanan sedang menunggu untuk diproses",
      estimateText: "Estimasi 5-10 menit",
      stepNumber: 2,
    },
    cooking: {
      icon: ChefHat,
      color: "bg-orange-500",
      textColor: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-500",
      label: "Sedang Dimasak",
      description: "Chef sedang menyiapkan pesanan Anda",
      estimateText: "Estimasi 15-20 menit",
      stepNumber: 3,
    },
    served: {
      icon: CheckCircle,
      color: "bg-green-500",
      textColor: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-500",
      label: "Siap Disajikan",
      description: "Pesanan sudah siap dan akan segera diantar",
      estimateText: "Pesanan siap diambil",
      stepNumber: 4,
    },
    done: {
      icon: Check,
      color: "bg-gray-500",
      textColor: "text-gray-600",
      bgColor: "bg-gray-50",
      borderColor: "border-gray-500",
      label: "Selesai",
      description: "Pesanan telah selesai dan diterima",
      estimateText: "Terima kasih",
      stepNumber: 5,
    },
  };

  const fetchData = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) setIsRefreshing(true);

      // Cancel previous request if still pending
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      // Fetch orders for this table from orders collection
      const ordersRes = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/orders?tableId=${tableId}`,
        {
          signal,
        }
      );

      if (!ordersRes.ok && !signal.aborted) {
        throw new Error("Failed to fetch orders");
      }

      if (!signal.aborted) {
        const ordersData = await ordersRes.json();

        console.log("Fetched orders data:", ordersData); // Debug log

        // Filter orders that have items
        const allOrders = Array.isArray(ordersData)
          ? ordersData.filter(
              (order: Order) => order.items && order.items.length > 0
            )
          : [];

        console.log("Filtered orders:", allOrders); // Debug log

        // Separate active and completed orders
        const activeOrders = allOrders.filter(
          (order: Order) => order.status !== "done"
        );

        const doneOrders = allOrders.filter(
          (order: Order) => order.status === "done"
        );

        // Sort active orders by creation time (newest first)
        const sortedActiveOrders = activeOrders.sort((a: Order, b: Order) => {
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        });

        // Sort completed orders by completion time (newest first) - these will be shown at bottom
        const sortedCompletedOrders = doneOrders.sort((a: Order, b: Order) => {
          return (
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
        });

        console.log("Active orders:", sortedActiveOrders); // Debug log
        console.log("Done orders:", sortedCompletedOrders); // Debug log

        setOrders(sortedActiveOrders);
        setCompletedOrders(sortedCompletedOrders);
        setLastUpdated(new Date());

        // Fetch table info (only on first load)
        if (!table) {
          const tableRes = await fetch(
            `${process.env.NEXT_PUBLIC_BASE_URL}/api/tables/${tableId}`,
            { signal }
          );
          if (!tableRes.ok && !signal.aborted) {
            throw new Error("Failed to fetch table info");
          }

          if (!signal.aborted) {
            const tableData = await tableRes.json();
            setTable(tableData);
          }
        }

        setError(null);
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError") {
        console.error("Error fetching data:", err);
        setError("Gagal memuat data pesanan");
      }
    } finally {
      setLoading(false);
      if (showRefreshIndicator) setIsRefreshing(false);
    }
  };

  const startPolling = () => {
    // Clear existing interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // Start new polling interval
    // Polling setiap 3 detik untuk update status
    pollingIntervalRef.current = setInterval(() => {
      fetchData(false);
    }, 3000); // Poll every 3 seconds
  };

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  useEffect(() => {
    if (tableId) {
      // Initial fetch
      fetchData(true);

      // Start polling
      startPolling();

      // Handle visibility change to pause/resume polling
      const handleVisibilityChange = () => {
        if (document.hidden) {
          stopPolling();
        } else {
          fetchData(false);
          startPolling();
        }
      };

      document.addEventListener("visibilitychange", handleVisibilityChange);

      // Cleanup function
      return () => {
        stopPolling();
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange
        );
      };
    }
  }, [tableId]);

  const handleManualRefresh = () => {
    fetchData(true);
  };

  const handleCompleteOrder = async (orderId: string) => {
    try {
      setIsCompletingOrder(orderId);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/orders`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderId: orderId,
            status: "done",
            isActive: false,
          }),
        }
      );

      if (response.ok) {
        setReviewOrderId(orderId);
        setShowReviewModal(true);
        await fetchData(false);
        toast.success("Pesanan berhasil diselesaikan!", {
          duration: 3000,
          position: "top-center",
        });
      } else {
        throw new Error("Failed to complete order");
      }
    } catch (error) {
      console.error("Error completing order:", error);
      toast.error("Gagal menyelesaikan pesanan. Silakan coba lagi.", {
        duration: 4000,
        position: "top-center",
      });
    } finally {
      setIsCompletingOrder(null);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    setOrderToDelete(orderId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteOrder = async () => {
    if (!orderToDelete) return;

    try {
      setIsCancellingOrder(orderToDelete);
      setShowDeleteConfirm(false);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/orders/${orderToDelete}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        // Refresh data to remove deleted order
        await fetchData(false);
        toast.success("Pesanan berhasil dihapus", {
          duration: 3000,
          position: "top-center",
        });
      } else {
        throw new Error("Failed to delete order");
      }
    } catch (error) {
      console.error("Error deleting order:", error);
      toast.error("Gagal menghapus pesanan. Silakan coba lagi.", {
        duration: 4000,
        position: "top-center",
      });
    } finally {
      setIsCancellingOrder(null);
      setOrderToDelete(null);
    }
  };

  const cancelDeleteOrder = () => {
    setShowDeleteConfirm(false);
    setOrderToDelete(null);
  };

  const handleSubmitReview = useCallback(async () => {
    if (rating === 0) {
      toast.error("Silakan berikan rating untuk pesanan Anda", {
        duration: 3000,
        position: "top-center",
      });
      return;
    }

    try {
      setIsSubmittingReview(true);

      const reviewData: NewReview = {
        orderId: reviewOrderId!,
        rating,
        comment,
        tableId,
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/reviews`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(reviewData),
        }
      );

      if (response.ok) {
        setShowReviewModal(false);
        setReviewOrderId(null);
        setRating(0);
        setComment("");

        toast.success("Terima kasih atas review Anda!", {
          duration: 4000,
          position: "top-center",
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit review");
      }
    } catch (error: unknown) {
      console.error("Error submitting review:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Gagal mengirim review. Silakan coba lagi.";
      toast.error(errorMessage, {
        duration: 4000,
        position: "top-center",
      });
    } finally {
      setIsSubmittingReview(false);
    }
  }, [rating, reviewOrderId, comment, tableId]);

  const handleSkipReview = useCallback(() => {
    setShowReviewModal(false);
    setReviewOrderId(null);
    setRating(0);
    setComment("");
  }, []);

  const handleRatingClick = useCallback((star: number) => {
    setRating(star);
  }, []);

  const handleCommentChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setComment(e.target.value);
    },
    []
  );

  const renderStarRating = useCallback(() => {
    return (
      <div className="flex justify-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleRatingClick(star)}
            className={`p-1 transition-colors ${
              star <= rating ? "text-yellow-400" : "text-gray-300"
            } hover:text-yellow-400 focus:outline-none`}
          >
            <Star
              className={`w-8 h-8 ${star <= rating ? "fill-current" : ""}`}
            />
          </button>
        ))}
      </div>
    );
  }, [rating, handleRatingClick]);

  const ReviewModal = useMemo(() => {
    if (!showReviewModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
          {/* Modal Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-full">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    Pesanan Selesai!
                  </h3>
                  <p className="text-sm text-gray-600">
                    Bagaimana pengalaman Anda?
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleSkipReview}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors focus:outline-none"
                disabled={isSubmittingReview}
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Modal Content */}
          <div className="p-6">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmitReview();
              }}
            >
              {/* Rating Section */}
              <div className="text-center mb-6">
                <h4 className="text-base font-medium text-gray-800 mb-3">
                  Berikan Rating Anda
                </h4>
                {renderStarRating()}
                <div className="mt-2">
                  {rating > 0 && (
                    <p className="text-sm text-gray-600">
                      {rating === 1 && "Sangat Buruk"}
                      {rating === 2 && "Buruk"}
                      {rating === 3 && "Cukup"}
                      {rating === 4 && "Baik"}
                      {rating === 5 && "Sangat Baik"}
                    </p>
                  )}
                </div>
              </div>

              {/* Comment Section */}
              <div className="mb-6">
                <label
                  htmlFor="review-comment"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Komentar (Opsional)
                </label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-black pointer-events-none" />
                  <textarea
                    id="review-comment"
                    name="comment"
                    value={comment}
                    onChange={handleCommentChange}
                    placeholder="Ceritakan pengalaman Anda..."
                    className="w-full pl-10 pr-4 py-3 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none transition-colors"
                    rows={4}
                    maxLength={500}
                    disabled={isSubmittingReview}
                  />
                </div>
                <p className="text-xs text-black mt-1">
                  {comment.length}/500 karakter
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={isSubmittingReview || rating === 0}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {isSubmittingReview ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Mengirim Review...
                    </>
                  ) : (
                    <>
                      <Star className="w-5 h-5 mr-2" />
                      Kirim Review
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleSkipReview}
                  disabled={isSubmittingReview}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  Lewati untuk Sekarang
                </button>
              </div>

              <p className="text-xs text-gray-500 text-center mt-4">
                Review Anda akan membantu meningkatkan kualitas layanan kami
              </p>
            </form>
          </div>
        </div>
      </div>
    );
  }, [
    showReviewModal,
    rating,
    comment,
    isSubmittingReview,
    handleSubmitReview,
    handleSkipReview,
    handleCommentChange,
    renderStarRating,
  ]);

  const DeleteConfirmModal = useMemo(() => {
    if (!showDeleteConfirm) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-sm w-full mx-4">
          <div className="p-6">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
            </div>

            <h3 className="text-lg font-semibold text-gray-800 text-center mb-2">
              Batalkan Pesanan?
            </h3>

            <p className="text-gray-600 text-center mb-6">
              Apakah Anda yakin ingin membatalkan pesanan ini? Tindakan ini
              tidak dapat dibatalkan.
            </p>

            <div className="space-y-3">
              <button
                onClick={confirmDeleteOrder}
                disabled={isCancellingOrder === orderToDelete}
                className="w-full bg-red-500 hover:bg-red-600 text-white py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isCancellingOrder === orderToDelete ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Membatalkan...
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 mr-2" />
                    Ya, Batalkan Pesanan
                  </>
                )}
              </button>

              <button
                onClick={cancelDeleteOrder}
                disabled={isCancellingOrder === orderToDelete}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Tidak, Kembali
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }, [showDeleteConfirm, orderToDelete, isCancellingOrder]);

  const renderProgressSteps = (currentStatus: string) => {
    const steps = [
      { key: "queue", label: "Antrian" },
      { key: "cooking", label: "Dimasak" },
      { key: "served", label: "Siap" },
      { key: "done", label: "Selesai" },
    ];

    const currentStep =
      statusConfig[currentStatus as keyof typeof statusConfig]?.stepNumber || 0;

    return (
      <div className="flex items-center justify-between mb-4 px-2">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber <= currentStep;
          const isCurrent = stepNumber === currentStep;
          const isLast = index === steps.length - 1;

          return (
            <div key={step.key} className="flex items-center flex-1">
              {/* Step Circle */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                    isCompleted
                      ? "bg-green-500 text-white"
                      : isCurrent
                      ? "bg-orange-500 text-white"
                      : "bg-gray-200 text-gray-400"
                  }`}
                >
                  {isCompleted && stepNumber < currentStep ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    stepNumber
                  )}
                </div>
                <span
                  className={`text-xs mt-1 text-center ${
                    isCompleted || isCurrent
                      ? "text-gray-700 font-medium"
                      : "text-gray-400"
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {/* Progress Line */}
              {!isLast && (
                <div className="flex-1 h-1 mx-2 mt-[-12px]">
                  <div
                    className={`h-full rounded transition-colors ${
                      stepNumber < currentStep ? "bg-green-500" : "bg-gray-200"
                    }`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderOrderCard = (order: Order, isCompleted = false) => {
    const status = statusConfig[order.status as keyof typeof statusConfig];
    const StatusIcon = status?.icon || Clock;

    return (
      <div
        key={order._id}
        className={`bg-white rounded-xl shadow-sm overflow-hidden border-2 ${
          status?.borderColor || "border-gray-200"
        } ${isCompleted ? "opacity-75" : ""}`}
      >
        {/* Progress Steps for Active Orders */}
        {!isCompleted && order.status !== "pending" && (
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Progress Pesanan
            </h4>
            {renderProgressSteps(order.status)}
          </div>
        )}

        {/* Order Header */}
        <div className={`${status?.bgColor} p-4`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-3 rounded-full ${status?.color}`}>
                <StatusIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className={`font-bold text-lg ${status?.textColor}`}>
                  {status?.label}
                </h3>
                <p className="text-sm text-gray-600">{status?.description}</p>
                <p className={`text-sm font-medium ${status?.textColor} mt-1`}>
                  {status?.estimateText}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-gray-700">
                #{order._id.slice(-6).toUpperCase()}
              </p>
              <p className="text-xs text-gray-500">
                {getEstimatedTime(order.status, order.createdAt)}
              </p>
            </div>
          </div>
        </div>

        {/* Customer Details Section */}
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <h4 className="font-medium text-gray-800 mb-2">Detail Pelanggan:</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Nama:</span>
              <p className="font-medium text-gray-700">
                {order.customerDetails?.name || "Unknown Customer"}
              </p>
            </div>
            {order.customerDetails?.phone && (
              <div>
                <span className="text-gray-500">HP:</span>
                <p className="font-medium text-gray-700">
                  {order.customerDetails.phone}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Order Items */}
        <div className="p-4">
          <h4 className="font-medium text-gray-800 mb-3">Detail Pesanan:</h4>
          <div className="space-y-3">
            {order.items.map((item, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{item.name}</p>
                  <p className="text-sm text-gray-500">
                    {item.quantity}x @ Rp {item.price.toLocaleString()}
                  </p>
                </div>
                <p className="font-bold text-gray-800">
                  Rp {(item.quantity * item.price).toLocaleString()}
                </p>
              </div>
            ))}
          </div>

          {/* Subtotal dan Pajak */}
          <div className="border-t border-gray-200 pt-4 mt-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Pajak (11%):</span>
              <span className="font-medium text-gray-800">
                Rp
                {(
                  (11 / 100) *
                  order.items.reduce(
                    (total, item) => total + item.price * item.quantity,
                    0
                  )
                )
                  .toFixed(0)
                  .replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
              </span>
            </div>
            <div className="flex justify-between items-center border-t border-gray-200 pt-2">
              <span className="font-bold text-lg text-gray-800">Total:</span>
              <span className="font-bold text-xl text-orange-600">
                Rp {order.totalAmount.toLocaleString("id-ID")}
              </span>
            </div>
          </div>

          {/* Time Info */}
          <div className="bg-gray-50 rounded-lg p-3 mt-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Waktu Pesan:</span>
                <p className="font-medium text-gray-800">
                  {new Date(order.createdAt).toLocaleString("id-ID", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Update Terakhir:</span>
                <p className="font-medium text-gray-800">
                  {new Date(order.updatedAt).toLocaleString("id-ID", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {order.status === "served" && !isCompleted && (
            <div className="mt-4 space-y-3">
              {/* Main Done Button */}
              <button
                onClick={() => handleCompleteOrder(order._id)}
                disabled={isCompletingOrder === order._id}
                className="w-full bg-green-500 hover:bg-green-600 text-white py-4 px-4 rounded-lg font-bold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg"
              >
                {isCompletingOrder === order._id ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Menyelesaikan Pesanan...
                  </>
                ) : (
                  <>
                    <Check className="w-6 h-6 mr-3" />
                    Tandai Selesai
                  </>
                )}
              </button>

              {/* Info Text */}
              <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div className="text-sm">
                    <p className="font-medium text-green-800">
                      Pesanan siap disajikan!
                    </p>
                    <p className="text-green-600">
                      Klik tombol di atas jika pesanan sudah diterima dengan
                      baik
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Alternative: Add Done button for other statuses if needed */}
          {(order.status === "cooking" || order.status === "queue") &&
            !isCompleted && (
              <div className="mt-4">
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-800">
                        Pesanan sedang diproses
                      </p>
                      <p className="text-blue-600">
                        Tombol &quot;Selesai&quot; akan muncul ketika pesanan
                        siap
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

          {/* Payment Button for Pending Orders */}
          {order.status === "pending" && order.midtrans?.redirect_url && (
            <div className="mt-4 space-y-3">
              <a
                href={order.midtrans.redirect_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center"
              >
                <CreditCard className="w-5 h-5 mr-2" />
                Lanjutkan Pembayaran
              </a>

              {/* Cancel Order Button */}
              <button
                onClick={() => handleDeleteOrder(order._id)}
                disabled={isCancellingOrder === order._id}
                className="w-full bg-red-500 hover:bg-red-600 text-white py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isCancellingOrder === order._id ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Membatalkan...
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 mr-2" />
                    Batalkan Pesanan
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Add this function to calculate estimated time
  const getEstimatedTime = (status: string, createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - created.getTime()) / (1000 * 60)
    );

    switch (status) {
      case "pending":
        return "Menunggu pembayaran";
      case "queue":
        if (diffInMinutes < 10) {
          return `${10 - diffInMinutes} menit lagi`;
        }
        return "Segera diproses";
      case "cooking":
        if (diffInMinutes < 20) {
          return `${20 - diffInMinutes} menit lagi`;
        }
        return "Hampir selesai";
      case "served":
        return "Siap diambil";
      case "done":
        return "Selesai";
      default:
        return `${diffInMinutes} menit yang lalu`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat status pesanan...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-orange-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-xl p-8 shadow-lg text-center max-w-md w-full">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-800 mb-2">Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={handleManualRefresh}
              className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Coba Lagi
            </button>
            <button
              onClick={() => router.push(`/tables/${tableId}`)}
              className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition-colors"
            >
              Kembali ke Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-orange-50">
      {/* Toast Container */}
      <Toaster
        position="top-center"
        reverseOrder={false}
        gutter={8}
        containerClassName=""
        containerStyle={{}}
        toastOptions={{
          // Default options
          duration: 4000,
          style: {
            background: "#363636",
            color: "#fff",
          },
          // Success
          success: {
            duration: 3000,
            style: {
              background: "#10B981",
              color: "#fff",
            },
          },
          // Error
          error: {
            duration: 4000,
            style: {
              background: "#EF4444",
              color: "#fff",
            },
          },
        }}
      />

      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push(`/tables/${tableId}`)}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Kembali</span>
            </button>
            <div className="text-center">
              <h1 className="font-bold text-gray-800">Status Pesanan</h1>
              <p className="text-sm text-gray-500">Meja #{table?.nomor}</p>
            </div>
            <button
              onClick={handleManualRefresh}
              className={`p-2 rounded-full hover:bg-gray-100 transition-colors ${
                isRefreshing ? "animate-spin" : ""
              }`}
              disabled={isRefreshing}
            >
              <RefreshCw className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6">
        {/* Active Orders */}
        {orders.length > 0 ? (
          <div className="space-y-4 mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Pesanan Aktif
            </h2>
            {orders.map((order) => renderOrderCard(order, false))}
          </div>
        ) : (
          <div className="text-center py-8 mb-8">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Belum Ada Pesanan Aktif
            </h3>
            <p className="text-gray-600 mb-6">
              Anda belum memiliki pesanan aktif saat ini
            </p>
            <button
              onClick={() => router.push(`/tables/${tableId}`)}
              className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
            >
              Mulai Pesan Sekarang
            </button>
          </div>
        )}

        {/* Status Info */}
        {(orders.length > 0 || completedOrders.length > 0) && (
          <div className="mt-6 text-center space-y-2">
            <div className="flex items-center justify-center space-x-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  isRefreshing ? "bg-blue-500 animate-pulse" : "bg-green-500"
                }`}
              ></div>
              <p className="text-sm text-gray-500">
                Update otomatis setiap 3 detik
              </p>
            </div>
            <p className="text-xs text-gray-400">
              Terakhir diperbarui: {lastUpdated.toLocaleTimeString("id-ID")}
            </p>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {ReviewModal}

      {/* Delete Confirmation Modal */}
      {DeleteConfirmModal}
    </div>
  );
}
