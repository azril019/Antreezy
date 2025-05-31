"use client";

import React, { useState, useEffect } from "react";
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
      }

      if (response.ok) {
        const result = await response.json();
        alert(
          restaurant?.id
            ? "Restaurant settings updated successfully!"
            : "Restaurant created successfully!"
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
      alert("Failed to save restaurant settings");
    } finally {
      setIsLoading(false);
    }
  };

  if (isInitialLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-white p-4 rounded-md shadow-md">
          <p className="text-black">Loading restaurant data...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {isLoading && (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-md">
            <p className="text-black">
              {restaurant?.id ? "Updating..." : "Creating..."}
            </p>
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
