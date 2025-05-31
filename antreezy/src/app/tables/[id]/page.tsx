"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Star,
  Clock,
  Users,
  MapPin,
  Phone,
  Wifi,
  Car,
  Truck,
  Calendar,
  Instagram,
  Facebook,
  MessageSquare,
  Menu,
  MessageSquareX,
  MessageCircle,
  Twitter,
  X,
  Cross,
  XIcon,
  XCircleIcon,
  TwitterIcon,
} from "lucide-react";

interface Restaurant {
  id: string;
  name: string;
  address: string;
  logo: string;
  coverImage: string;
  description?: string;
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

export default function TablePage() {
  const params = useParams();
  const tableId = params.id as string;

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
      // Don't set error here as menu items are not critical
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
      count: count as number,
    }));
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
        // Use the table ID as restaurant ID, or default to "1" for demo
        const restaurantId = tableId || "1";

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

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-orange-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800">
            Restaurant not found
          </h2>
          <p className="text-gray-600 mt-2">
            Please check the table number and try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-orange-50">
      {/* Header - matching the exact design */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
              {restaurant.logo ? (
                <img
                  src={restaurant.logo}
                  alt={restaurant.name}
                  className="w-8 h-8 object-cover rounded"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21,15 16,10 5,21"/></svg>';
                  }}
                />
              ) : (
                <div className="w-8 h-8 bg-gray-300 rounded"></div>
              )}
            </div>
            <div>
              <h1 className="text-lg font-bold text-orange-600">
                {restaurant.name}
              </h1>
              <p className="text-sm text-gray-500">Meja #{tableId}</p>
            </div>
          </div>
          <div className="relative">
            <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">3</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4">
        {/* Restaurant Info Section with gradient background */}
        <div className="py-6">
          <div className="bg-gradient-to-br from-gray-400 via-gray-500 to-gray-600 rounded-2xl p-6 text-white relative overflow-hidden">
            {/* Background image placeholder */}
            <div className="absolute inset-0 bg-black bg-opacity-20"></div>

            <div className="relative z-10">
              <h2 className="text-2xl font-bold mb-1">{restaurant.name}</h2>
              <p className="text-gray-200 mb-4">Restoran Digital Terdepan</p>

              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>Tutup</span>
                </div>
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

        {/* Menu Categories */}
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Kategori Menu
          </h3>

          {menuCategories.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {menuCategories.map((category, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:-translate-y-0.5"
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
          ) : (
            <div className="bg-white rounded-xl p-6 shadow-sm text-center">
              <p className="text-gray-500">Belum ada menu tersedia</p>
            </div>
          )}
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

              {restaurant.contact?.phone && (
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-700">
                    {restaurant.contact.phone}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-4 pt-3 border-t border-gray-100">
              {restaurant.contact?.instagram && (
                <Instagram className="w-6 h-6 text-pink-500 cursor-pointer hover:text-pink-600 transition-colors" />
              )}
              {restaurant.contact?.facebook && (
                <Facebook className="w-6 h-6 text-blue-600 cursor-pointer hover:text-blue-700 transition-colors" />
              )}
              {restaurant.contact?.whatsapp && (
                <MessageCircle className="w-6 h-6 text-green-500 cursor-pointer hover:text-green-600 transition-colors" />
              )}
              {restaurant.contact?.whatsapp && (
                <TwitterIcon className="w-6 h-6 text-black cursor-pointer hover:text-gray-600 transition-colors" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
