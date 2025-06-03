"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Plus, ShoppingCart, Star } from "lucide-react";
import { NewTable } from "@/app/types";

interface MenuItem {
  id: string;
  name: string;
  description: string;
  composition?: string;
  category: string;
  price: number;
  stock: number;
  status: "tersedia" | "habis";
  image?: string; // Added image field
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

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
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

export default function MenuPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const tableId = params.id as string;
  const category = searchParams.get("category") || "Semua";

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [table, setTable] = useState<NewTable | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
      setError("Failed to load table data");
      return null;
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
      setError("Failed to load restaurant data");
    }
  };

  // Function to fetch menu items
  const fetchMenuItems = async () => {
    try {
      const response = await fetch("/api/menus");
      if (!response.ok) {
        throw new Error(`Failed to fetch menus: ${response.statusText}`);
      }
      const items = await response.json();
      setMenuItems(items);
    } catch (err) {
      console.error("Error fetching menu items:", err);
      setError("Failed to load menu items");
    }
  };

  // Filter menu items based on selected category
  const getFilteredMenuItems = (): MenuItem[] => {
    if (category === "Semua") {
      return menuItems.filter((item) => item.status === "tersedia");
    }
    return menuItems.filter(
      (item) => item.category === category && item.status === "tersedia"
    );
  };
  // Handle add to cart
  const handleAddToCart = async (menuItem: MenuItem) => {
    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tableId,
          action: "add",
          item: {
            id: menuItem.id,
            name: menuItem.name,
            price: menuItem.price,
          },
        }),
      });

      if (response.ok) {
        const updatedCart = await response.json();
        setCart(updatedCart);
      } else {
        console.error("Failed to add item to cart");
      }
    } catch (error) {
      console.error("Error adding item to cart:", error);
    }
  };

  // Calculate total cart items
  const getTotalCartItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  // Navigate back to table page
  const handleBackToTable = () => {
    router.push(`/tables/${tableId}`);
  };

  // Navigate to cart page
  const handleViewCart = () => {
    router.push(`/tables/${tableId}/cart`);
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        await Promise.all([fetchRestaurantData(), fetchMenuItems()]);
      } catch (err) {
        console.error("Error loading data:", err);
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    if (tableId) {
      loadData();
    }
  }, [tableId]);

  const filteredMenuItems = getFilteredMenuItems();

  if (loading) {
    return (
      <div className="min-h-screen bg-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading menu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-orange-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800">Error</h2>
          <p className="text-gray-600 mt-2">{error}</p>
          <button
            onClick={handleBackToTable}
            className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            Back to Table
          </button>
        </div>
      </div>
    );
  }

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
                  {restaurant?.name || "Restaurant"}
                </h1>
                <p className="text-sm text-gray-500">Meja #{table?.nomor}</p>
              </div>
            </div>
          </div>

          {/* Cart Button */}
          <button onClick={handleViewCart} className="relative">
            <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center hover:bg-orange-600 transition-colors">
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
            {getTotalCartItems() > 0 && (
              <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
                {getTotalCartItems()}
              </div>
            )}
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6">
        {/* Category Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Menu {category}
          </h2>
          <p className="text-gray-600">
            {filteredMenuItems.length} item tersedia
          </p>
        </div>

        {/* Menu Items List */}
        {filteredMenuItems.length > 0 ? (
          <div className="space-y-4">
            {" "}
            {filteredMenuItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200"
              >
                {" "}
                <div className="flex flex-col">
                  {/* Item Name */}
                  <h4 className="font-semibold text-gray-800 text-lg mb-2">
                    {item.name}
                  </h4>

                  {/* Description */}
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {item.description}
                  </p>

                  <div className="flex gap-4">
                    {/* Left Section - Image */}
                    <div className="flex-1">
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-40 rounded-lg object-cover"
                        />
                      )}
                    </div>

                    {/* Right Section - Nutritional Information */}
                    <div className="flex-1">
                      {item.nutritionalInfo && (
                        <div>
                          <h5 className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                            Informasi Nutrisi
                          </h5>
                          <div className="space-y-2">
                            <div className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-xs font-medium inline-block">
                              {item.nutritionalInfo.calories} Kalori
                            </div>
                            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium inline-block">
                              {item.nutritionalInfo.protein}g Protein
                            </div>
                            <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium inline-block">
                              {item.nutritionalInfo.carbs}g Karbohidrat
                            </div>
                            <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-medium inline-block">
                              {item.nutritionalInfo.fat}g Lemak
                            </div>
                            <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-medium inline-block">
                              {item.nutritionalInfo.fiber}g Serat
                            </div>
                            <div className="bg-pink-100 text-pink-800 px-3 py-1 rounded-full text-xs font-medium inline-block">
                              {item.nutritionalInfo.sugar}g Gula
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom Section - Price and Add Button */}
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-xl font-bold text-orange-600">
                      Rp {item.price.toLocaleString()}
                    </span>
                    <button
                      onClick={() => handleAddToCart(item)}
                      className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="font-medium">Tambah</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl p-8 shadow-sm text-center">
            <div className="text-gray-400 text-6xl mb-4">🍽️</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Tidak ada menu tersedia
            </h3>
            <p className="text-gray-500 mb-4">
              Maaf, saat ini tidak ada menu tersedia untuk kategori {category}
            </p>
            <button
              onClick={handleBackToTable}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              Kembali ke Kategori
            </button>
          </div>
        )}

        {/* Floating Cart Summary */}
        {getTotalCartItems() > 0 && (
          <div className="fixed bottom-4 left-4 right-4 max-w-md mx-auto">
            <button
              onClick={handleViewCart}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 px-6 rounded-xl shadow-lg flex items-center justify-between transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="bg-white bg-opacity-20 rounded-full p-2">
                  <ShoppingCart className="text-orange-500 w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-semibold">
                    {getTotalCartItems()} item dalam keranjang
                  </p>
                  <p className="text-sm text-orange-100">
                    Tap untuk lihat keranjang
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg">
                  Rp{" "}
                  {cart
                    .reduce(
                      (total, item) => total + item.price * item.quantity,
                      0
                    )
                    .toLocaleString()}
                </p>
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
