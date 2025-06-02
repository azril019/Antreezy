"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Plus, Minus, Trash2, ShoppingCart } from "lucide-react";
import { NewTable } from "@/app/types";

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
  // Load cart from API on component mount
  const fetchCart = async () => {
    try {
      const response = await fetch(`/api/cart?tableId=${tableId}`);
      if (response.ok) {
        const cartData = await response.json();
        setCart(cartData);
      }
    } catch (error) {
      console.error("Error fetching cart:", error);
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

      setTable(tableData.data);
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

  // Function to fetch restaurant data
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

  // Navigate back to table page
  const handleBackToTable = () => {
    router.push(`/tables/${tableId}`);
  };
  // Update quantity in cart
  const updateQuantity = async (itemId: string, newQuantity: number) => {
    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tableId,
          action: "update",
          itemId,
          quantity: newQuantity,
        }),
      });

      if (response.ok) {
        const updatedCart = await response.json();
        setCart(updatedCart);
      } else {
        console.error("Failed to update cart quantity");
      }
    } catch (error) {
      console.error("Error updating cart quantity:", error);
    }
  };

  // Remove item from cart
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
        setCart(updatedCart);
      } else {
        console.error("Failed to remove item from cart");
      }
    } catch (error) {
      console.error("Error removing item from cart:", error);
    }
  };

  // Clear entire cart
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
        const updatedCart = await response.json();
        setCart(updatedCart);
      } else {
        console.error("Failed to clear cart");
      }
    } catch (error) {
      console.error("Error clearing cart:", error);
    }
  };

  // Calculate totals
  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  // Calculate nutritional totals
  const calculateTotalNutrition = () => {
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    cart.forEach((item) => {
      if (item.nutritionalInfo) {
        const {
          calories = 0,
          protein = 0,
          carbs = 0,
          fat = 0,
        } = item.nutritionalInfo;
        totalCalories += calories * item.quantity;
        totalProtein += protein * item.quantity;
        totalCarbs += carbs * item.quantity;
        totalFat += fat * item.quantity;
      }
    });

    return {
      calories: Math.round(totalCalories),
      protein: Math.round(totalProtein * 10) / 10, // Round to 1 decimal
      carbs: Math.round(totalCarbs * 10) / 10,
      fat: Math.round(totalFat * 10) / 10,
    };
  };

  // Handle checkout
  const handleCheckout = async () => {
    if (cart.length === 0) return;

    try {
      // Update cart status to active and queue
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tableId,
          action: "updateStatus",
          status: "queue",
          isActive: true,
        }),
      });

      if (!response.ok) {
        console.error("Failed to update cart status");
        return;
      }

      // Navigate to checkout page after successful status update
      router.push(`/tables/${tableId}/checkout`);
    } catch (error) {
      console.error("Error during checkout process:", error);
    }
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
                <p className="text-sm text-gray-500">Meja #{table?.nomor}</p>
              </div>
            </div>
          </div>

          {/* Clear Cart Button */}
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-red-500 hover:text-red-700 text-sm font-medium"
            >
              Hapus Semua
            </button>
          )}
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6">
        {cart.length > 0 ? (
          <>
            {/* Cart Items */}
            <div className="space-y-4 mb-6">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800 mb-1">
                        {item.name}
                      </h4>
                      <p className="text-orange-600 font-bold">
                        Rp {item.price.toLocaleString()}
                      </p>
                    </div>

                    <div className="flex items-center space-x-3">
                      {/* Quantity Controls */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                          className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                        >
                          <Minus className="w-4 h-4 text-gray-600" />
                        </button>

                        <span className="w-8 text-center font-semibold text-gray-800">
                          {item.quantity}
                        </span>

                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                          className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center hover:bg-orange-600 transition-colors"
                        >
                          <Plus className="w-4 h-4 text-white" />
                        </button>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeFromCart(item.id)}
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
                        Rp {(item.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}

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
            <div className="bg-white rounded-xl p-4 shadow-sm mb-6">
              <h3 className="font-semibold text-gray-800 mb-3">
                Ringkasan Pesanan
              </h3>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Item</span>
                  <span className="text-gray-800">{getTotalItems()} item</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-800">
                    Rp {getTotalPrice().toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Pajak(11%)</span>
                  <span className="text-gray-800">
                    Rp {Math.round(getTotalPrice() * 0.11).toLocaleString()}
                  </span>
                </div>

                <div className="border-t border-gray-200 pt-2 mt-3">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-800">Total</span>
                    <span className="font-bold text-lg text-orange-600">
                      Rp {Math.round(getTotalPrice() * 1.1).toLocaleString()}
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
        <button
          onClick={handleCheckout}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 px-6 rounded-xl font-semibold text-lg shadow-lg transition-colors"
        >
          Lanjut Pembayaran
        </button>
      </div>
    </div>
  );
}
