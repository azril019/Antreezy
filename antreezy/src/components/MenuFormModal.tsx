"use client";

import { Dialog } from "@headlessui/react";
import { useState, useEffect } from "react";

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
  nutritionalInfo?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sugar: number;
  };
}

interface MenuFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  menuItem: MenuItem | null;
  onSubmit: (menuData: unknown) => void;
  isProcessing: boolean;
}

export default function MenuFormModal({
  isOpen,
  onClose,
  menuItem,
  onSubmit,
  isProcessing,
}: MenuFormModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    composition: "",
    category: "",
    price: 0,
    stock: 0,
    status: "tersedia" as "tersedia" | "habis",
    image: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  // Populate form when editing
  useEffect(() => {
    if (menuItem) {
      setFormData({
        name: menuItem.name,
        description: menuItem.description,
        composition: menuItem.composition || "",
        category: menuItem.category,
        price: menuItem.price,
        stock: menuItem.stock,
        status: menuItem.status,
        image: menuItem.image || "",
      });
      setImagePreview(menuItem.image || "");
    } else {
      // Reset form for new item
      setFormData({
        name: "",
        description: "",
        composition: "",
        category: "",
        price: 0,
        stock: 0,
        status: "tersedia",
        image: "",
      });
      setImagePreview("");
      setSelectedFile(null);
    }
    setErrors({});
  }, [menuItem, isOpen]);
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Nama menu wajib diisi";
    }
    if (!formData.description.trim()) {
      newErrors.description = "Deskripsi menu wajib diisi";
    }
    if (!formData.category.trim()) {
      newErrors.category = "Kategori menu wajib diisi";
    }
    if (formData.price <= 0) {
      newErrors.price = "Harga harus lebih dari 0";
    }
    if (formData.stock < 0) {
      newErrors.stock = "Stok tidak boleh negatif";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setErrors((prev) => ({ ...prev, image: "File harus berupa gambar" }));
        return;
      }
      // Validate file size (2MB max)
      if (file.size > 2 * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, image: "Ukuran file maksimal 2MB" }));
        return;
      }

      setSelectedFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Clear any previous errors
      setErrors((prev) => ({ ...prev, image: "" }));
    }
  };

  const handleImageUpload = async () => {
    if (!selectedFile) return null;

    setIsUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to upload image");
      }

      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error("Image upload error:", error);
      setErrors((prev) => ({ ...prev, image: "Gagal mengupload gambar" }));
      return null;
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    let imageUrl = formData.image;

    // Upload new image if selected
    if (selectedFile) {
      const uploadedUrl = await handleImageUpload();
      if (uploadedUrl) {
        imageUrl = uploadedUrl;
      } else {
        return; // Stop submission if image upload failed
      }
    }

    // Auto set status based on stock
    const finalData = {
      ...formData,
      status: formData.stock > 0 ? "tersedia" : "habis",
      // Only include composition if it's not empty
      composition: formData.composition.trim() || undefined,
      image: imageUrl,
    };

    onSubmit(finalData);
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: name === "price" || name === "stock" ? Number(value) : value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="fixed z-10 inset-0 overflow-y-auto"
    >
      <div className="flex items-center justify-center min-h-screen">
        <div className="fixed inset-0 bg-black opacity-30" aria-hidden="true" />

        <div className="relative bg-white rounded-lg max-w-lg w-full mx-auto p-6 shadow-xl max-h-[90vh] overflow-y-auto">
          <Dialog.Title className="text-lg font-medium text-black mb-4">
            {menuItem ? "Edit Menu Item" : "Add New Menu Item"}
          </Dialog.Title>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nama Menu */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-black mb-1"
              >
                Nama Menu *
              </label>
              <input
                type="text"
                name="name"
                id="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded-md text-black ${
                  errors.name ? "border-red-500" : "border-gray-300"
                } focus:ring-2 focus:ring-orange-500 focus:border-transparent`}
                placeholder="Masukkan nama menu"
                disabled={isProcessing}
                required
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
              )}
            </div>

            {/* Deskripsi */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-black mb-1"
              >
                Deskripsi *
              </label>
              <textarea
                name="description"
                id="description"
                value={formData.description}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded-md text-black ${
                  errors.description ? "border-red-500" : "border-gray-300"
                } focus:ring-2 focus:ring-orange-500 focus:border-transparent`}
                rows={3}
                placeholder="Masukkan deskripsi menu"
                disabled={isProcessing}
                required
              />{" "}
              {errors.description && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.description}
                </p>
              )}
            </div>

            {/* Image Upload */}
            <div>
              <label
                htmlFor="image"
                className="block text-sm font-medium text-black mb-1"
              >
                Gambar Menu
                <span className="text-gray-400 text-xs ml-1">(Opsional)</span>
              </label>

              {/* Image Preview */}
              {imagePreview && (
                <div className="mb-3">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-32 object-cover rounded-md border"
                  />
                </div>
              )}

              {/* File Input */}
              <input
                type="file"
                id="image"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full p-2 border border-gray-300 rounded-md text-black focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                disabled={isProcessing || isUploadingImage}
              />

              {errors.image && (
                <p className="text-red-500 text-xs mt-1">{errors.image}</p>
              )}

              <p className="text-xs text-gray-500 mt-1">
                Format: JPG, PNG, WEBP. Maksimal 5MB
              </p>

              {isUploadingImage && (
                <div className="flex items-center mt-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500 mr-2"></div>
                  <span className="text-sm text-gray-600">
                    Mengupload gambar...
                  </span>
                </div>
              )}
            </div>

            {/* Komposisi/Bahan */}
            <div>
              <label
                htmlFor="composition"
                className="block text-sm font-medium text-black mb-1"
              >
                Komposisi/Bahan
                <span className="text-gray-400 text-xs ml-1">(Opsional)</span>
              </label>
              <textarea
                name="composition"
                id="composition"
                value={formData.composition}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md text-black focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                rows={3}
                placeholder="Contoh: Nasi putih 200g, Ayam goreng 150g, Sambal 2 sdm, Lalapan 50g, Kerupuk 2 lembar"
                disabled={isProcessing}
              />
              <p className="text-xs text-gray-500 mt-1">
                Format: Nama bahan + takaran/jumlah. Pisahkan dengan koma (,)
              </p>
            </div>

            {/* Kategori */}
            <div>
              <label
                htmlFor="category"
                className="block text-sm font-medium text-black mb-1"
              >
                Kategori *
              </label>
              <select
                name="category"
                id="category"
                value={formData.category}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded-md text-black ${
                  errors.category ? "border-red-500" : "border-gray-300"
                } focus:ring-2 focus:ring-orange-500 focus:border-transparent`}
                disabled={isProcessing}
                required
              >
                <option value="">Pilih kategori</option>
                <option value="Makanan">Makanan</option>
                <option value="Minuman">Minuman</option>
                <option value="Dessert">Dessert</option>
                <option value="Snack">Snack</option>
              </select>
              {errors.category && (
                <p className="text-red-500 text-xs mt-1">{errors.category}</p>
              )}
            </div>

            {/* Harga dan Stok */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="price"
                  className="block text-sm font-medium text-black mb-1"
                >
                  Harga *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">
                    Rp
                  </span>
                  <input
                    type="number"
                    name="price"
                    id="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-3 py-2 border rounded-md text-black ${
                      errors.price ? "border-red-500" : "border-gray-300"
                    } focus:ring-2 focus:ring-orange-500 focus:border-transparent`}
                    min="0"
                    step="1000"
                    placeholder="0"
                    disabled={isProcessing}
                    required
                  />
                </div>
                {errors.price && (
                  <p className="text-red-500 text-xs mt-1">{errors.price}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="stock"
                  className="block text-sm font-medium text-black mb-1"
                >
                  Stok *
                </label>
                <input
                  type="number"
                  name="stock"
                  id="stock"
                  value={formData.stock}
                  onChange={handleInputChange}
                  className={`w-full p-2 border rounded-md text-black ${
                    errors.stock ? "border-red-500" : "border-gray-300"
                  } focus:ring-2 focus:ring-orange-500 focus:border-transparent`}
                  min="0"
                  placeholder="0"
                  disabled={isProcessing}
                  required
                />
                {errors.stock && (
                  <p className="text-red-500 text-xs mt-1">{errors.stock}</p>
                )}
              </div>
            </div>

            {/* Status Preview */}
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Status
              </label>
              <div className="p-2 bg-gray-50 rounded-md">
                <span
                  className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    formData.stock > 0
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {formData.stock > 0 ? "Tersedia" : "Habis"}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Status akan otomatis disesuaikan berdasarkan stok
              </p>
            </div>

            {/* Buttons */}
            <div className="flex space-x-3 pt-4">
              {" "}
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-black bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                disabled={isProcessing || isUploadingImage}
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isProcessing || isUploadingImage}
              >
                {isProcessing || isUploadingImage ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {isUploadingImage
                      ? "Mengupload gambar..."
                      : menuItem
                      ? "Mengupdate..."
                      : "Menambahkan..."}
                  </div>
                ) : menuItem ? (
                  "Update Menu"
                ) : (
                  "Tambah Menu"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Dialog>
  );
}
