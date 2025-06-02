"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Star,
  Users,
  MapPin,
  Phone,
  Instagram,
  Facebook,
  Menu,
  MessageCircle,
  TwitterIcon,
  ShoppingCart,
  LucideGlobe,
  AtSign,
} from "lucide-react";
import Link from "next/link";
import { NewTable } from "@/app/types";

interface Restaurant {
  id: string;
  name: string;
  address: string;
  logo: string;
  coverImage: string;
  description?: string;
  tagline: string;
  contact?: {
    phone?: string;
    email?: string;
    website?: string;
    instagram?: string;
    facebook?: string;
    twitter?: string;
    whatsapp?: string;
  };
}

interface MenuCategory {
  name: string;
  icon: string;
  count: number;
}

interface Review {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  timeAgo: string;
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  composition?: string;
  category: string;
  price: number;
  stock: number;
  status: "tersedia" | "habis";
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

export default function TablePage() {
  const params = useParams();
  const router = useRouter();
  const tableId = params.id as string;
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [table, setTable] = useState<NewTable | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
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

  useEffect(() => {
    if (tableId) {
      fetchCart();
    }
  }, [tableId]);

  // Function to fetch restaurant data by ID, with fallback to first restaurant
  const fetchRestaurantData = async () => {
    try {
      let response = await fetch("/api/restaurant");

      if (!response.ok) {
        throw new Error(`Failed to fetch restaurants: ${response.statusText}`);
      }

      const restaurants = await response.json();
      if (!restaurants || restaurants.length === 0) {
        throw new Error("No restaurants found in database");
      }

      setRestaurant(restaurants[0]);
      return;
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

  // Calculate menu categories from actual menu items
  const getMenuCategories = (): MenuCategory[] => {
    const categoryCounts = menuItems.reduce((acc, item) => {
      const category = item.category || "Lainnya";
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const categoryIcons: Record<string, string> = {
      Makanan: "🍽️",
      Minuman: "🥤",
      Snack: "🍿",
      Dessert: "🍰",
      Lainnya: "🍴",
    };

    return Object.entries(categoryCounts).map(([name, count]) => ({
      name,
      icon: categoryIcons[name] || "🍴",
      count,
    }));
  };
  // Handle category click - navigate to menu page
  const handleCategoryClick = (categoryName: string) => {
    if (categoryName === "Semua") {
      router.push(`/tables/${tableId}/menu`);
    } else {
      router.push(`/tables/${tableId}/menu?category=${categoryName}`);
    }
  };

  // Navigate to cart page
  const handleCartClick = () => {
    router.push(`/tables/${tableId}/cart`);
  };
  // Calculate total cart items
  const getTotalCartItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };
  const menuCategories = getMenuCategories();

  // Calculate statistics from real data
  const stats = {
    rating: 4.8, // This could come from a reviews API in the future
    totalMenus: menuItems.length,
    totalReviews: 150, // This could come from a reviews API in the future
  };

  const reviews: Review[] = [
    {
      id: "1",
      customerName: "Ahmad Rizki",
      rating: 5,
      comment: "Makanannya enak banget! Pelayanan cepat dan ramah.",
      timeAgo: "2 jam lalu",
    },
    {
      id: "2",
      customerName: "Sari Dewi",
      rating: 4,
      comment: "Nasi gorengnya recommended, porsi besar dan harga terjangkau.",
      timeAgo: "5 jam lalu",
    },
    {
      id: "3",
      customerName: "Budi Santoso",
      rating: 5,
      comment: "Suasana nyaman, cocok untuk makan bersama keluarga.",
      timeAgo: "1 hari lalu",
    },
  ];
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        await Promise.all([
          fetchTableData(),
          fetchRestaurantData(),
          fetchMenuItems(),
        ]);
      } catch (err) {
        console.error("Error loading data:", err);
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    if (tableId) {
      loadData();
    } else {
      setError("No table ID provided");
      setLoading(false);
    }
  }, [tableId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-orange-50 flex items-center justify-center">
        <div className="loading loading-spinner loading-lg text-orange-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-orange-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600">Error</h2>
          <p className="text-gray-600 mt-2">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!restaurant || !table) {
    return (
      <div className="min-h-screen bg-orange-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800">Data not found</h2>
          <p className="text-gray-600 mt-2">
            Please check the table number and try again.
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
      {/* Header - Sticky Navigation */}
      <header className="bg-white/95 backdrop-blur-md shadow-lg sticky top-0 z-50 border-b border-orange-100">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center overflow-hidden shadow-md">
                {restaurant.logo ? (
                  <img
                    src={restaurant.logo}
                    alt={restaurant.name}
                    className="w-8 h-8 object-cover rounded-lg"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21,15 16,10 5,21"/></svg>';
                    }}
                  />
                ) : (
                  <div className="w-8 h-8 bg-white/20 rounded-lg"></div>
                )}
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-800">
                  {restaurant.name}
                </h1>
                <p className="text-sm text-orange-600 font-medium">
                  Meja #{table.nomor}
                </p>
              </div>
            </div>
            <div className="relative">
              <button
                onClick={handleCartClick}
                className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center hover:bg-orange-600 transition-colors"
              >
                <ShoppingCart className="w-5 h-5 text-white" />
              </button>
              {getTotalCartItems() > 0 && (
                <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
                  {getTotalCartItems()}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 pb-8">
        {/* Restaurant Info Section with cover image background */}
        <div className="py-6">
          <div className="rounded-2xl p-6 text-white relative overflow-hidden min-h-[200px]">
            {/* Background image */}
            {restaurant.coverImage ? (
              <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${restaurant.coverImage})` }}
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-gray-400 via-gray-500 to-gray-600" />
            )}
            <div className="relative z-10 flex flex-col justify-end h-full">
              <div className="mt-20">
                <h2 className="text-2xl font-bold mb-1">
                  <span className="bg-white bg-opacity-20 text-orange-600 px-3 py-1 rounded-full">
                    {restaurant.name}
                  </span>
                </h2>
                <p className="text-white mb-4">{restaurant.tagline}</p>

                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span>{stats.rating}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>3 antrian</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>{" "}
        {/* Menu Categories */}
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Kategori Menu
          </h3>
          {menuCategories.length > 0 ? (
            <div>
              {/* "Semua" Category Card */}{" "}
              <div className="mb-4">
                <div
                  onClick={() => handleCategoryClick("Semua")}
                  className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:-translate-y-0.5 border-2 border-transparent hover:border-orange-300"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="text-3xl mr-3">🍽️</div>
                      <div>
                        <h4 className="font-semibold text-gray-800 text-lg">
                          Semua Menu
                        </h4>
                        <p className="text-sm text-gray-500">
                          {
                            menuItems.filter(
                              (item) => item.status === "tersedia"
                            ).length
                          }{" "}
                          item
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Category Grid */}{" "}
              <div className="grid grid-cols-2 gap-4">
                {menuCategories.map((category, index) => (
                  <div
                    key={index}
                    onClick={() => handleCategoryClick(category.name)}
                    className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:-translate-y-0.5 border-2 border-transparent hover:border-orange-300"
                  >
                    <div className="text-center">
                      <div className="text-5xl mb-3">{category.icon}</div>
                      <h4 className="font-semibold text-gray-800 mb-1 text-lg">
                        {category.name}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {category.count} item
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl p-6 shadow-sm text-center">
              <p className="text-gray-500">Belum ada menu tersedia</p>
            </div>
          )}{" "}
        </div>
        {/* Statistics Cards */}
        <div className="mb-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-4 text-center shadow-sm">
              <Star className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
              <div className="text-xl font-bold text-gray-800">
                {stats.rating}
              </div>
              <div className="text-sm text-gray-500">Rating</div>
            </div>
            <div className="bg-white rounded-xl p-4 text-center shadow-sm">
              <Menu className="w-6 h-6 text-orange-500 mx-auto mb-2" />
              <div className="text-xl font-bold text-gray-800">
                {stats.totalMenus}
              </div>
              <div className="text-sm text-gray-500">Menu</div>
            </div>
            <div className="bg-white rounded-xl p-4 text-center shadow-sm">
              <Users className="w-6 h-6 text-blue-500 mx-auto mb-2" />
              <div className="text-xl font-bold text-gray-800">
                {stats.totalReviews}+
              </div>
              <div className="text-sm text-gray-500">Review</div>
            </div>
          </div>
        </div>
        {/* Reviews Section */}
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Review Pelanggan
          </h3>

          <div className="space-y-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="bg-white rounded-xl p-4 shadow-sm"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-gray-600">
                        {review.customerName.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">
                        {review.customerName}
                      </h4>
                      <div className="flex items-center space-x-1 mt-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.rating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">
                    {review.timeAgo}
                  </span>
                </div>
                <p className="text-gray-700">{review.comment}</p>
              </div>
            ))}
          </div>
        </div>
        {/* About Restaurant */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Tentang Kami</h3>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-gray-700 mb-4">
              {restaurant.description || "Deskripsi restoran belum tersedia."}
            </p>

            <div className="space-y-3 mb-4">
              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <span className="text-gray-700">{restaurant.address}</span>
              </div>
              {restaurant.contact?.website && (
                <div className="flex items-center space-x-3">
                  <LucideGlobe className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-700">
                    {restaurant.contact.website}
                  </span>
                </div>
              )}

              {restaurant.contact?.email && (
                <div className="flex items-center space-x-3">
                  <AtSign className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-700">
                    {restaurant.contact.email}
                  </span>
                </div>
              )}

              {restaurant.contact?.phone && (
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-700">
                    {restaurant.contact.phone}
                  </span>
                </div>
              )}
            </div>

            {/* Social Media Links */}
            <div className="flex items-center space-x-4 pt-3 border-t border-gray-100">
              {restaurant.contact?.instagram && (
                <button
                  onClick={() =>
                    openSocialMedia("instagram", restaurant.contact?.instagram!)
                  }
                  className="p-2 rounded-full hover:bg-pink-50 transition-colors"
                  title={`Follow us on Instagram: ${restaurant.contact.instagram}`}
                >
                  <Instagram className="w-6 h-6 text-pink-500 cursor-pointer hover:text-pink-600 transition-colors" />
                </button>
              )}

              {restaurant.contact?.facebook && (
                <button
                  onClick={() =>
                    openSocialMedia("facebook", restaurant.contact?.facebook!)
                  }
                  className="p-2 rounded-full hover:bg-blue-50 transition-colors"
                  title={`Visit our Facebook: ${restaurant.contact.facebook}`}
                >
                  <Facebook className="w-6 h-6 text-blue-600 cursor-pointer hover:text-blue-700 transition-colors" />
                </button>
              )}

              {restaurant.contact?.whatsapp && (
                <button
                  onClick={() =>
                    openSocialMedia("whatsapp", restaurant.contact?.whatsapp!)
                  }
                  className="p-2 rounded-full hover:bg-green-50 transition-colors"
                  title={`Chat us on WhatsApp: ${restaurant.contact.whatsapp}`}
                >
                  <MessageCircle className="w-6 h-6 text-green-500 cursor-pointer hover:text-green-600 transition-colors" />
                </button>
              )}

              {restaurant.contact?.twitter && (
                <button
                  onClick={() =>
                    openSocialMedia("twitter", restaurant.contact?.twitter!)
                  }
                  className="p-2 rounded-full hover:bg-gray-50 transition-colors"
                  title={`Follow us on Twitter: ${restaurant.contact.twitter}`}
                >
                  <TwitterIcon className="w-6 h-6 text-black cursor-pointer hover:text-gray-600 transition-colors" />
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Add helper functions for social media links
const getSocialMediaLink = (platform: string, handle: string) => {
  const baseUrls = {
    instagram: "https://www.instagram.com/",
    facebook: "https://www.facebook.com/",
    twitter: "https://twitter.com/",
    whatsapp: "https://wa.me/",
  };

  // Remove @ symbol if present
  const cleanHandle = handle.replace("@", "");

  switch (platform) {
    case "instagram":
      return `${baseUrls.instagram}${cleanHandle}`;
    case "facebook":
      return `${baseUrls.facebook}${cleanHandle}`;
    case "twitter":
      return `${baseUrls.twitter}${cleanHandle}`;
    case "whatsapp":
      // For WhatsApp, handle should be phone number
      const phoneNumber = cleanHandle.replace(/\D/g, ""); // Remove non-digits
      return `${baseUrls.whatsapp}${phoneNumber}`;
    default:
      return "#";
  }
};

const openSocialMedia = (platform: string, handle: string) => {
  const url = getSocialMediaLink(platform, handle);
  window.open(url, "_blank", "noopener,noreferrer");
};
