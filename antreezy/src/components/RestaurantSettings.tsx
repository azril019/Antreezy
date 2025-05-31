"use client";

import React, { useState, useRef, useEffect } from "react";
import { NewRestaurant } from "@/app/types";
import {
  Save,
  Upload,
  Image,
  Phone,
  Mail,
  Globe,
  Instagram,
  Facebook,
  Twitter,
  MessageCircle,
} from "lucide-react";

interface RestaurantSettingsProps {
  restaurant?: NewRestaurant | null;
  onSave: (restaurant: NewRestaurant) => void;
  isUpdate?: boolean;
}

const RestaurantSettings: React.FC<RestaurantSettingsProps> = ({
  restaurant,
  onSave,
  isUpdate = false,
}) => {
  const [activeTab, setActiveTab] = useState("umum");
  const [restaurantData, setRestaurantData] = useState<NewRestaurant>(
    restaurant || {
      name: "",
      address: "",
      tagline: "",
      logo: "",
      coverImage: "",
      description: "",
      contact: {
        phone: "",
        email: "",
        website: "",
        instagram: "",
        facebook: "",
        twitter: "",
        whatsapp: "",
      },
    }
  );
  const [tagline, setTagline] = useState(restaurant?.tagline || "");
  const [isUploading, setIsUploading] = useState({
    logo: false,
    coverImage: false,
  });
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Update form data when restaurant prop changes
  useEffect(() => {
    if (restaurant) {
      setRestaurantData(restaurant);
      setTagline(restaurant.tagline || "");
    }
  }, [restaurant]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setRestaurantData({
      ...restaurantData,
      [name]: value,
    });
  };

  const handleLogoUpload = () => {
    if (!isUploading.logo) {
      logoInputRef.current?.click();
    }
  };

  const handleCoverUpload = () => {
    if (!isUploading.coverImage) {
      coverInputRef.current?.click();
    }
  };

  const uploadToCatbox = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Upload failed");
    }

    const data = await response.json();
    return data.url;
  };

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "logo" | "coverImage"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Set uploading state
      setIsUploading((prev) => ({ ...prev, [type]: true }));

      // Show preview immediately
      const previewUrl = URL.createObjectURL(file);
      setRestaurantData((prev) => ({
        ...prev,
        [type]: previewUrl,
      }));

      // Upload to catbox
      const uploadedUrl = await uploadToCatbox(file);

      // Update with uploaded URL
      setRestaurantData((prev) => ({
        ...prev,
        [type]: uploadedUrl,
      }));

      // Clean up preview URL
      URL.revokeObjectURL(previewUrl);
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload image. Please try again.");

      // Reset to previous state
      setRestaurantData((prev) => ({
        ...prev,
        [type]: restaurant?.[type] || "",
      }));
    } finally {
      setIsUploading((prev) => ({ ...prev, [type]: false }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Update tagline in restaurant data before saving
    const dataToSave = {
      ...restaurantData,
      tagline: tagline,
    };
    onSave(dataToSave);
  };  return (
    <>      {/* Upload Loading Overlay */}
      {(isUploading.logo || isUploading.coverImage) && (
        <div className="fixed top-0 left-0 w-full h-full backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg border">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
              <p className="text-black font-medium">
                Uploading {isUploading.logo ? "logo" : "cover image"}...
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="container mx-auto p-4">

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-black">
            {isUpdate ? "Update Restaurant" : "Pengaturan Restaurant"}
          </h1>
          <p className="text-black">
            {isUpdate
              ? "Update informasi dan pengaturan restaurant Anda"
              : "Kelola informasi dan pengaturan restaurant Anda"}
          </p>
        </div>
        <button
          onClick={handleSubmit}
          className="px-4 py-2 bg-orange-500 text-black rounded-md flex items-center hover:bg-orange-600 transition-colors"
          disabled={isUploading.logo || isUploading.coverImage}
        >
          <Save className="mr-1 text-black h-5 w-5" />
          {isUpdate ? "Update Pengaturan" : "Simpan Pengaturan"}
        </button>
      </div>

      <div className="bg-gray-100 rounded-md mb-6">
        <div className="flex">
          <button
            className={`px-6 py-3 text-black ${
              activeTab === "umum" ? "bg-white rounded-t-md" : ""
            }`}
            onClick={() => setActiveTab("umum")}
          >
            Umum
          </button>
          <button
            className={`px-6 py-3 text-black ${
              activeTab === "kontak" ? "bg-white rounded-t-md" : ""
            }`}
            onClick={() => setActiveTab("kontak")}
          >
            Kontak
          </button>
        </div>
      </div>

      {activeTab === "umum" && (
        <form className="bg-white border rounded-md p-6">
          <h2 className="text-xl font-semibold mb-6 text-black">
            Informasi Dasar
          </h2>

          <div className="mb-6">
            <label className="block mb-2 text-black">Logo Restaurant</label>
            <div
              className={`w-24 h-24 bg-gray-100 border flex items-center justify-center cursor-pointer relative overflow-hidden ${
                isUploading.logo ? "opacity-50" : "hover:bg-gray-200"
              }`}
              onClick={handleLogoUpload}
            >
              {isUploading.logo && (
                <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                </div>
              )}
              {restaurantData.logo ? (
                <img
                  src={restaurantData.logo}
                  alt="Logo"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <Image className="text-gray-400 h-8 w-8" />
                </div>
              )}
            </div>
            <input
              type="file"
              ref={logoInputRef}
              className="hidden"
              accept="image/png,image/jpeg,image/jpg"
              onChange={(e) => handleFileChange(e, "logo")}
              disabled={isUploading.logo}
            />            <button
              type="button"
              className={`mt-2 flex items-center px-3 py-2 rounded-md transition-colors ${
                isUploading.logo
                  ? "opacity-50 cursor-not-allowed bg-gray-300 text-gray-500"
                  : "bg-orange-500 text-white hover:bg-orange-600"
              }`}
              onClick={handleLogoUpload}
              disabled={isUploading.logo}
            >
              <Upload className="mr-1 h-4 w-4" />
              {isUploading.logo ? "Uploading..." : "Upload Logo"}
            </button>
            <p className="text-xs text-black mt-1">PNG, JPG hingga 2MB</p>
          </div>

          <div className="mb-6">
            <label className="block mb-2 text-black">Cover Image</label>
            <div
              className={`w-full h-32 bg-gray-100 border flex items-center justify-center cursor-pointer relative overflow-hidden ${
                isUploading.coverImage ? "opacity-50" : "hover:bg-gray-200"
              }`}
              onClick={handleCoverUpload}
            >
              {isUploading.coverImage && (
                <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                </div>
              )}
              {restaurantData.coverImage ? (
                <img
                  src={restaurantData.coverImage}
                  alt="Cover"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <Image className="text-gray-400 h-12 w-12" />
                </div>
              )}            </div>
            <input
              type="file"
              ref={coverInputRef}
              className="hidden"
              accept="image/png,image/jpeg,image/jpg"
              onChange={(e) => handleFileChange(e, "coverImage")}
              disabled={isUploading.coverImage}
            />
            <button
              type="button"
              className={`mt-2 flex items-center px-3 py-2 rounded-md transition-colors ${
                isUploading.coverImage
                  ? "opacity-50 cursor-not-allowed bg-gray-300 text-gray-500"
                  : "bg-orange-500 text-white hover:bg-orange-600"
              }`}
              onClick={handleCoverUpload}
              disabled={isUploading.coverImage}
            >
              <Upload className="mr-1 h-4 w-4" />
              {isUploading.coverImage ? "Uploading..." : "Upload Cover"}
            </button>
          </div>

          <div className="mb-6">
            <label className="block mb-2 text-black">
              Nama Restaurant <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={restaurantData.name}
              onChange={handleInputChange}
              className="w-full border p-2 rounded text-black focus:border-orange-500 focus:outline-none"
              placeholder="Contoh: Antri Boss"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block mb-2 text-black">Tagline</label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="w-full border p-2 rounded text-black focus:border-orange-500 focus:outline-none"
              placeholder="Contoh: Restoran Digital Terdepan"
            />
          </div>

          <div className="mb-6">
            <label className="block mb-2 text-black">
              Deskripsi Restaurant
            </label>
            <textarea
              name="description"
              value={restaurantData.description || ""}
              onChange={handleInputChange}
              className="w-full border p-2 rounded h-32 text-black focus:border-orange-500 focus:outline-none"
              placeholder="Nikmati pengalaman kuliner terbaik dengan sistem pemesanan digital yang mudah dan cepat. Kami menyajikan berbagai hidangan lezat dengan pelayanan terbaik."
            />
          </div>

          <div className="mb-6">
            <label className="block mb-2 text-black">Alamat Lengkap</label>
            <textarea
              name="address"
              value={restaurantData.address}
              onChange={handleInputChange}
              className="w-full border p-2 rounded h-32 text-black focus:border-orange-500 focus:outline-none"
              placeholder="Jl. Merdeka No. 123, Jakarta Pusat"
              required
            />
          </div>
        </form>
      )}

      {activeTab === "kontak" && (
        <div className="bg-white border rounded-md p-6">
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-black mb-6">
              Informasi Kontak
            </h2>

            <div className="mb-6">
              <label className="block mb-2 text-black">Nomor Telepon</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Phone className="text-black h-4 w-4" />
                </div>
                <input
                  type="text"
                  name="phone"
                  value={restaurantData.contact?.phone || ""}
                  onChange={(e) => {
                    setRestaurantData({
                      ...restaurantData,
                      contact: {
                        ...restaurantData.contact,
                        phone: e.target.value,
                      },
                    });
                  }}
                  className="w-full border p-2 pl-10 rounded text-black focus:border-orange-500 focus:outline-none"
                  placeholder="+62 21 1234 5678"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block mb-2 text-black">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Mail className="text-black h-4 w-4" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={restaurantData.contact?.email || ""}
                  onChange={(e) => {
                    setRestaurantData({
                      ...restaurantData,
                      contact: {
                        ...restaurantData.contact,
                        email: e.target.value,
                      },
                    });
                  }}
                  className="w-full border p-2 pl-10 rounded text-black focus:border-orange-500 focus:outline-none"
                  placeholder="info@antriboss.com"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block mb-2 text-black">Website</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Globe className="text-black h-4 w-4" />
                </div>
                <input
                  type="text"
                  name="website"
                  value={restaurantData.contact?.website || ""}
                  onChange={(e) => {
                    setRestaurantData({
                      ...restaurantData,
                      contact: {
                        ...restaurantData.contact,
                        website: e.target.value,
                      },
                    });
                  }}
                  className="w-full border p-2 pl-10 rounded text-black focus:border-orange-500 focus:outline-none"
                  placeholder="www.antriboss.com"
                />
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-black mb-6">
              Media Sosial
            </h2>

            <div className="mb-6">
              <label className="block mb-2 text-black">Instagram</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Instagram className="text-black h-4 w-4" />
                </div>
                <input
                  type="text"
                  name="instagram"
                  value={restaurantData.contact?.instagram || ""}
                  onChange={(e) => {
                    setRestaurantData({
                      ...restaurantData,
                      contact: {
                        ...restaurantData.contact,
                        instagram: e.target.value,
                      },
                    });
                  }}
                  className="w-full border p-2 pl-10 rounded text-black focus:border-orange-500 focus:outline-none"
                  placeholder="@antriboss"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block mb-2 text-black">Facebook</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Facebook className="text-black h-4 w-4" />
                </div>
                <input
                  type="text"
                  name="facebook"
                  value={restaurantData.contact?.facebook || ""}
                  onChange={(e) => {
                    setRestaurantData({
                      ...restaurantData,
                      contact: {
                        ...restaurantData.contact,
                        facebook: e.target.value,
                      },
                    });
                  }}
                  className="w-full border p-2 pl-10 rounded text-black focus:border-orange-500 focus:outline-none"
                  placeholder="Antri Boss Restaurant"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block mb-2 text-black">Twitter</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Twitter className="text-black h-4 w-4" />
                </div>
                <input
                  type="text"
                  name="twitter"
                  value={restaurantData.contact?.twitter || ""}
                  onChange={(e) => {
                    setRestaurantData({
                      ...restaurantData,
                      contact: {
                        ...restaurantData.contact,
                        twitter: e.target.value,
                      },
                    });
                  }}
                  className="w-full border p-2 pl-10 rounded text-black focus:border-orange-500 focus:outline-none"
                  placeholder="@antriboss"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block mb-2 text-black">WhatsApp</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <MessageCircle className="text-black h-4 w-4" />
                </div>
                <input
                  type="text"
                  name="whatsapp"
                  value={restaurantData.contact?.whatsapp || ""}
                  onChange={(e) => {
                    setRestaurantData({
                      ...restaurantData,
                      contact: {
                        ...restaurantData.contact,
                        whatsapp: e.target.value,
                      },
                    });
                  }}
                  className="w-full border p-2 pl-10 rounded text-black focus:border-orange-500 focus:outline-none"
                  placeholder="+6281234567890"
                />
              </div>
            </div>          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default RestaurantSettings;
