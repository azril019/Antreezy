"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  CreditCard,
} from "lucide-react";
import { NewTable } from "@/app/types";
import { createPayment, initiateMidtransPayment } from "@/helpers/payment";

interface NutritionalInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  nutritionalInfo?: NutritionalInfo;
}

interface Restaurant {
  id: string;
  name: string;
  address: string;
  logo: string;
  coverImage: string;
  description?: string;
  tagline: string;
}

export default function CartPage() {
  const params = useParams();
  const router = useRouter();

  const tableId = params.id as string;

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [table, setTable] = useState<NewTable | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [customerDetails, setCustomerDetails] = useState({
    name: "",
    email: "",
    phone: "",
  });

  // Add form validation state
  const [formErrors, setFormErrors] = useState({
    name: "",
  });

  // Load cart from API on component mount
  const fetchCart = async () => {
    try {
      const response = await fetch(`/api/cart?tableId=${tableId}`);
      if (response.ok) {
        const cartData = await response.json();
        console.log("Cart data received:", cartData);
        
        // Handle array response
        if (Array.isArray(cartData)) {
          const cartItems = cartData.length > 0 && cartData[0]?.items ? cartData[0].items : [];
          setCart(cartItems);
        } else if (cartData?.items) {
          setCart(cartData.items);
        } else {
          setCart([]);
        }
      }
    } catch (error) {
      console.error("Error fetching cart:", error);
      setCart([]);
    }
  };

  const fetchTableData = async () => {
    try {
      const response = await fetch(`/api/tables/${tableId}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch table: ${response.statusText}`);
      }

      const tableData = await response.json();
      console.log("Fetched table data:", tableData);

      setTable(tableData.data || tableData);
      return tableData;
    } catch (err) {
      console.error("Error fetching table:", err);
    }
  };

  useEffect(() => {
    if (tableId) {
      fetchCart();
      fetchTableData();
    }
  }, [tableId]);

  const fetchRestaurantData = async () => {
    try {
      const response = await fetch("/api/restaurant");
      if (!response.ok) {
        throw new Error(`Failed to fetch restaurants: ${response.statusText}`);
      }
      const restaurants = await response.json();
      if (!restaurants || restaurants.length === 0) {
        throw new Error("No restaurants found in database");
      }
      setRestaurant(restaurants[0]);
    } catch (err) {
      console.error("Error fetching restaurant:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurantData();
  }, []);

  const handleBackToTable = () => {
    router.push(`/tables/${tableId}`);
  };

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    try {
      if (newQuantity <= 0) {
        await removeFromCart(itemId);
        return;
      }

      const response = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tableId,
          action: "updateQuantity",
          itemId,
          quantity: newQuantity,
        }),
      });

      if (response.ok) {
        const updatedCart = await response.json();
        // Handle response properly
        if (updatedCart?.items) {
          setCart(updatedCart.items);
        } else {
          await fetchCart(); // Refetch if response format is unclear
        }
      } else {
        console.error("Failed to update cart quantity");
      }
    } catch (error) {
      console.error("Error updating cart quantity:", error);
    }
  };

  const removeFromCart = async (itemId: string) => {
    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tableId,
          action: "remove",
          itemId,
        }),
      });

      if (response.ok) {
        const updatedCart = await response.json();
        // Handle response properly
        if (updatedCart?.items) {
          setCart(updatedCart.items);
        } else {
          await fetchCart(); // Refetch if response format is unclear
        }
      } else {
        console.error("Failed to remove item from cart");
      }
    } catch (error) {
      console.error("Error removing item from cart:", error);
    }
  };

  const clearCart = async () => {
    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tableId,
          action: "clear",
        }),
      });

      if (response.ok) {
        setCart([]);
      } else {
        console.error("Failed to clear cart");
      }
    } catch (error) {
      console.error("Error clearing cart:", error);
    }
  };

  // Calculate totals with safety checks
  const getTotalItems = () => {
    return cart.reduce((total, item) => {
      return total + (item?.quantity || 0);
    }, 0);
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => {
      const price = item?.price || 0;
      const quantity = item?.quantity || 0;
      return total + (price * quantity);
    }, 0);
  };

  // Calculate nutritional totals
  const calculateTotalNutrition = () => {
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    cart.forEach((item) => {
      if (item?.nutritionalInfo) {
        const {
          calories = 0,
          protein = 0,
          carbs = 0,
          fat = 0,
        } = item.nutritionalInfo;
        const quantity = item?.quantity || 0;
        totalCalories += calories * quantity;
        totalProtein += protein * quantity;
        totalCarbs += carbs * quantity;
        totalFat += fat * quantity;
      }
    });

    return {
      calories: Math.round(totalCalories),
      protein: Math.round(totalProtein * 10) / 10, // Round to 1 decimal
      carbs: Math.round(totalCarbs * 10) / 10,
      fat: Math.round(totalFat * 10) / 10,
    };
  };

  // Handle checkout with Midtrans
  const handleCheckout = async () => {
    if (cart.length === 0) return;

    // Show customer details form first
    setShowCustomerForm(true);
  };

  const processPayment = async () => {
    if (!customerDetails.name.trim()) {
      setFormErrors({ name: "Nama tidak boleh kosong" });
      return;
    }

    setIsProcessingPayment(true);

    try {
      const totalAmount = Math.round(totalPrice * 1.11);

      const paymentData = {
        tableId,
        items: cart.map((item) => ({
          id: item?.id || '',
          name: item?.name || '',
          price: Math.round(item?.price || 0),
          quantity: item?.quantity || 0,
        })),
        totalAmount,
        customerDetails: {
          name: customerDetails.name || `Table ${table?.nomor}`,
          email: customerDetails.email,
          phone: customerDetails.phone,
        },
      };

      console.log("Sending payment data:", paymentData);

      // Create payment token
      const paymentResult = await createPayment(paymentData);

      // Clear cart immediately after successful payment token creation
      await clearCart();

      // Initiate Midtrans payment
      await initiateMidtransPayment(paymentResult.token);

      // Payment success will be handled by Midtrans callbacks
      router.push(`/tables/${tableId}/payment/success`);
    } catch (error) {
      console.error("Payment error:", error);
      alert("Terjadi kesalahan dalam proses pembayaran. Silakan coba lagi.");
      
      // If payment fails, we might want to restore the cart or let user retry
      // For now, we'll leave the cart as is so user can retry
    } finally {
      setIsProcessingPayment(false);
      setShowCustomerForm(false);
    }
  };

  const handleCustomerFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form before processing payment
    if (!customerDetails.name.trim()) {
      setFormErrors((prev) => ({
        ...prev,
        name: "Nama tidak boleh kosong",
      }));
      return;
    }

    // Clear any existing errors
    setFormErrors({ name: "" });

    // Continue with payment processing
    processPayment();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading cart...</p>
        </div>
      </div>
    );
  }

  const nutritionInfo = calculateTotalNutrition();
  const totalPrice = getTotalPrice();
  const totalItems = getTotalItems();

  return (
    <div className="min-h-screen bg-orange-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={handleBackToTable}
              className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>

            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                {restaurant?.logo ? (
                  <img
                    src={restaurant.logo}
                    alt={restaurant.name}
                    className="w-8 h-8 object-cover rounded"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <div className="w-8 h-8 bg-orange-100 rounded flex items-center justify-center">
                    <span className="text-orange-600 font-bold text-sm">
                      {restaurant?.name?.charAt(0) || "R"}
                    </span>
                  </div>
                )}
              </div>
              <div>
                <h1 className="font-bold text-gray-800 text-lg leading-tight">
                  Keranjang
                </h1>
                <p className="text-sm text-gray-500">Meja #{table?.nomor || 'Unknown'}</p>
              </div>
            </div>
          </div>

          {/* Clear Cart Button */}
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="flex items-center space-x-2 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 rounded-lg transition-all duration-200 border border-red-200 hover:border-red-300"
            >
              <Trash2 className="w-4 h-4" />
              <span className="text-sm font-medium">Hapus Semua</span>
            </button>
          )}
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6">
        {cart.length > 0 ? (
          <>
            {/* Cart Items */}
            <div className="space-y-4 mb-6">
              {cart.map((item) => {
                const itemPrice = item?.price || 0;
                const itemQuantity = item?.quantity || 0;
                
                return (
                  <div
                    key={item?.id || Math.random()}
                    className="bg-white rounded-xl p-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800 mb-1">
                          {item?.name || 'Unknown Item'}
                        </h4>
                        <p className="text-orange-600 font-bold">
                          Rp {itemPrice.toLocaleString('id-ID')}
                        </p>
                      </div>

                      <div className="flex items-center space-x-3">
                        {/* Quantity Controls */}
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() =>
                              updateQuantity(item?.id || '', itemQuantity - 1)
                            }
                            className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                          >
                            <Minus className="w-4 h-4 text-gray-600" />
                          </button>

                          <span className="w-8 text-center font-semibold text-gray-800">
                            {itemQuantity}
                          </span>

                          <button
                            onClick={() =>
                              updateQuantity(item?.id || '', itemQuantity + 1)
                            }
                            className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center hover:bg-orange-600 transition-colors"
                          >
                            <Plus className="w-4 h-4 text-white" />
                          </button>
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={() => removeFromCart(item?.id || '')}
                          className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center hover:bg-red-200 transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </div>

                    {/* Item Total */}
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-semibold text-gray-800">
                          Rp {(itemPrice * itemQuantity).toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Nutrition Info Card */}
            <div className="bg-white rounded-xl p-4 shadow-sm mb-6">
              <h2 className="text-lg text-black font-semibold mb-4">
                Total Informasi Gizi
              </h2>

              <div className="grid grid-cols-2 gap-4">
                {/* Calories */}
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-blue-600 text-xl font-bold">
                    {nutritionInfo.calories}
                  </p>
                  <p className="text-gray-600">Kalori</p>
                </div>

                {/* Protein */}
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-green-600 text-xl font-bold">
                    {nutritionInfo.protein}g
                  </p>
                  <p className="text-gray-600">Protein</p>
                </div>

                {/* Carbs */}
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <p className="text-yellow-600 text-xl font-bold">
                    {nutritionInfo.carbs}g
                  </p>
                  <p className="text-gray-600">Karbohidrat</p>
                </div>

                {/* Fat */}
                <div className="bg-red-50 p-3 rounded-lg">
                  <p className="text-red-500 text-xl font-bold">
                    {nutritionInfo.fat}g
                  </p>
                  <p className="text-gray-600">Lemak</p>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-xl p-4 shadow-sm mb-6">
              <h3 className="font-semibold text-gray-800 mb-3">
                Ringkasan Pesanan
              </h3>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Item</span>
                  <span className="text-gray-800">{totalItems} item</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-800">
                    Rp {totalPrice.toLocaleString('id-ID')}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Pajak(11%)</span>
                  <span className="text-gray-800">
                    Rp {Math.round(totalPrice * 0.11).toLocaleString('id-ID')}
                  </span>
                </div>

                <div className="border-t border-gray-200 pt-2 mt-3">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-800">Total</span>
                    <span className="font-bold text-lg text-orange-600">
                      Rp {Math.round(totalPrice * 1.11).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Empty Cart */
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingCart className="w-12 h-12 text-gray-400" />
            </div>

            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Keranjang Kosong
            </h3>

            <p className="text-gray-600 mb-6">
              Belum ada item yang ditambahkan ke keranjang
            </p>

            <button
              onClick={handleBackToTable}
              className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
            >
              Mulai Pesan
            </button>
          </div>
        )}
        
        {/* Checkout Button */}
        {cart.length > 0 && (
          <button
            onClick={handleCheckout}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 px-6 rounded-xl font-semibold text-lg shadow-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            disabled={isProcessingPayment}
          >
            <CreditCard className="w-5 h-5 mr-2" />
            Lanjut Pembayaran
          </button>
        )}
      </div>

      {/* Customer Details Modal */}
      {showCustomerForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-md rounded-xl p-6 w-full max-w-md shadow-2xl border border-white/20">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Detail Pelanggan
            </h3>

            <form onSubmit={handleCustomerFormSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={customerDetails.name}
                  onChange={(e) => {
                    setCustomerDetails((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }));
                    // Clear error when user types
                    if (e.target.value.trim()) {
                      setFormErrors((prev) => ({ ...prev, name: "" }));
                    }
                  }}
                  className={`w-full text-black p-3 border ${
                    formErrors.name
                      ? "border-red-500 ring-1 ring-red-500"
                      : "border-gray-300"
                  } rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white/90 backdrop-blur-sm`}
                  placeholder="Masukkan nama Anda"
                />
                {formErrors.name && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nomor HP (Opsional)
                </label>
                <input
                  type="tel"
                  value={customerDetails.phone}
                  onChange={(e) =>
                    setCustomerDetails((prev) => ({
                      ...prev,
                      phone: e.target.value,
                    }))
                  }
                  className="w-full text-black p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white/90 backdrop-blur-sm"
                  placeholder="08123456789"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCustomerForm(false);
                    setFormErrors({ name: "" }); // Clear errors when closing
                  }}
                  className="flex-1 px-4 py-3 text-gray-700 bg-gray-200/80 backdrop-blur-sm rounded-lg hover:bg-gray-300/80 transition-all duration-200"
                  disabled={isProcessingPayment}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-orange-500/90 backdrop-blur-sm text-white rounded-lg hover:bg-orange-600/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  disabled={isProcessingPayment}
                >
                  {isProcessingPayment ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Memproses...
                    </div>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Bayar Sekarang
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
