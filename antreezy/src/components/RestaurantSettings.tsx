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
    logoInputRef.current?.click();
  };

  const handleCoverUpload = () => {
    coverInputRef.current?.click();
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "logo" | "coverImage"
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      // In a real app, you would upload to a server and get a URL back
      // Here we're just creating a local URL for preview
      const imageUrl = URL.createObjectURL(file);
      setRestaurantData({
        ...restaurantData,
        [type]: imageUrl,
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(restaurantData);
  };

  return (
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
          className="px-4 py-2 bg-orange-500 text-black rounded-md flex items-center"
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
              className="w-24 h-24 bg-gray-100 border flex items-center justify-center cursor-pointer"
              onClick={handleLogoUpload}
            >
              {restaurantData.logo ? (
                <img
                  src={restaurantData.logo}
                  alt="Logo"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200"></div>
              )}
            </div>
            <input
              type="file"
              ref={logoInputRef}
              className="hidden"
              accept="image/png,image/jpeg"
              onChange={(e) => handleFileChange(e, "logo")}
            />
            <button
              type="button"
              className="mt-2 flex items-center text-black"
              onClick={handleLogoUpload}
            >
              <Upload className="mr-1 text-black h-4 w-4" />
              Upload Logo
            </button>
            <p className="text-xs text-black mt-1">PNG, JPG hingga 2MB</p>
          </div>

          <div className="mb-6">
            <label className="block mb-2 text-black">Cover Image</label>
            <div
              className="w-full h-32 bg-gray-100 border flex items-center justify-center cursor-pointer"
              onClick={handleCoverUpload}
            >
              {restaurantData.coverImage ? (
                <img
                  src={restaurantData.coverImage}
                  alt="Cover"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <Image className="text-black h-12 w-12" />
                </div>
              )}
            </div>
            <input
              type="file"
              ref={coverInputRef}
              className="hidden"
              accept="image/png,image/jpeg"
              onChange={(e) => handleFileChange(e, "coverImage")}
            />
          </div>

          <div className="mb-6">
            <label className="block mb-2 text-black">
              Nama Restaurant <span className="text-black">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={restaurantData.name}
              onChange={handleInputChange}
              className="w-full border p-2 rounded text-black"
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
              className="w-full border p-2 rounded text-black"
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
              className="w-full border p-2 rounded h-32 text-black"
              placeholder="Nikmati pengalaman kuliner terbaik dengan sistem pemesanan digital yang mudah dan cepat. Kami menyajikan berbagai hidangan lezat dengan pelayanan terbaik."
            />
          </div>

          <div className="mb-6">
            <label className="block mb-2 text-black">Alamat Lengkap</label>
            <textarea
              name="address"
              value={restaurantData.address}
              onChange={handleInputChange}
              className="w-full border p-2 rounded h-32 text-black"
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
                  className="w-full border p-2 pl-10 rounded text-black"
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
                  className="w-full border p-2 pl-10 rounded text-black"
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
                  className="w-full border p-2 pl-10 rounded text-black"
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
                  className="w-full border p-2 pl-10 rounded text-black"
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
                  className="w-full border p-2 pl-10 rounded text-black"
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
                  className="w-full border p-2 pl-10 rounded text-black"
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
                  className="w-full border p-2 pl-10 rounded text-black"
                  placeholder="+6281234567890"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantSettings;
