"use client";

import React, { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import RestaurantSettings from "@/components/RestaurantSettings";
import { NewRestaurant } from "@/app/types";

const RestaurantSettingsPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [restaurant, setRestaurant] = useState<NewRestaurant | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    const fetchRestaurantData = async () => {
      try {
        setIsInitialLoading(true);
        const response = await fetch("/api/restaurant");
        if (response.ok) {
          const data = await response.json();
          console.log("Fetched restaurant data:", data[0]);

          setRestaurant(data[0]);
        }
      } catch (error) {
        console.error("Error fetching restaurant data:", error);
      } finally {
        setIsInitialLoading(false);
      }
    };

    fetchRestaurantData();
  }, []);

  const handleSaveRestaurant = async (restaurantData: NewRestaurant) => {
    try {
      setIsLoading(true);
      console.log("Saving restaurant data:", restaurantData);

      let response;

      if (restaurant?.id) {
        // Update existing restaurant
        response = await fetch(`/api/restaurant/${restaurant.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(restaurantData),
        });
      } else {
        // Create new restaurant
        response = await fetch(`/api/restaurant`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(restaurantData),
        });
      }      if (response.ok) {
        const result = await response.json();
        toast.success(
          restaurant?.id
            ? "Restaurant settings updated successfully!"
            : "Restaurant created successfully!",
          {
            duration: 4000,
            position: "top-right",
          }
        );

        // If it was a create operation, update the local state with the new restaurant data
        if (!restaurant?.id && result.data) {
          setRestaurant(result.data);
        }
      } else {
        throw new Error("Failed to save restaurant data");
      }
    } catch (error) {
      console.error("Error saving restaurant data:", error);
      toast.error("Failed to save restaurant settings", {
        duration: 4000,
        position: "top-right",
      });
    } finally {
      setIsLoading(false);
    }
  };
  if (isInitialLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-white/95 backdrop-blur-sm p-6 rounded-lg shadow-xl border border-white/20">
          <div className="flex items-center space-x-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            <div>
              <p className="text-gray-800 font-medium">Loading restaurant data...</p>
              <p className="text-gray-600 text-sm">Please wait while we fetch your settings</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="relative">
      {/* Toast Container */}
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={8}
        containerClassName=""
        containerStyle={{}}
        toastOptions={{
          // Default options for all toasts
          className: "",
          duration: 4000,
          style: {
            background: "#fff",
            color: "#374151",
            border: "1px solid #d1d5db",
            borderRadius: "8px",
            fontSize: "14px",
            padding: "12px 16px",
            maxWidth: "400px",
          },
          // Default options for specific types
          success: {
            duration: 4000,
            iconTheme: {
              primary: "#10B981",
              secondary: "#fff",
            },
            style: {
              background: "#F0FDF4",
              color: "#065F46",
              border: "1px solid #10B981",
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: "#EF4444",
              secondary: "#fff",
            },
            style: {
              background: "#FEF2F2",
              color: "#991B1B",
              border: "1px solid #EF4444",
            },
          },
        }}
      />

      {/* Blurred Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Blurred background */}
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm"></div>
          
          {/* Loading content */}
          <div className="relative bg-white/95 backdrop-blur-sm p-6 rounded-lg shadow-xl border border-white/20">
            <div className="flex items-center space-x-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
              <div>
                <p className="text-gray-800 font-medium">
                  {restaurant?.id ? "Updating Restaurant..." : "Creating Restaurant..."}
                </p>
                <p className="text-gray-600 text-sm">Please wait while we save your settings</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <RestaurantSettings
        restaurant={restaurant}
        onSave={handleSaveRestaurant}
        isUpdate={!!restaurant?.id}
      />
    </div>
  );
};

export default RestaurantSettingsPage;
