import { useState, useEffect } from "react";

interface User {
  id?: string;
  username: string;
  email: string;
  role: "admin" | "staff";
  password?: string;
}

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSubmit: (userData: Omit<User, "id">) => void;
  isProcessing: boolean;
}

export default function UserFormModal({
  isOpen,
  onClose,
  user,
  onSubmit,
  isProcessing,
}: UserFormModalProps) {
  const [userData, setUserData] = useState<Omit<User, "id">>({
    username: "",
    email: "",
    role: "staff",
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  // Reset form when modal opens/closes or user changes
  useEffect(() => {
    if (isOpen) {
      if (user) {
        // Edit mode - pre-fill form with user data
        setUserData({
          username: user.username,
          email: user.email,
          role: user.role,
          password: "", // Don't pre-fill password for security reasons
        });
      } else {
        // Add mode - reset form
        setUserData({
          username: "",
          email: "",
          role: "staff",
          password: "",
        });
      }
      setErrors({});
    }
  }, [isOpen, user]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!userData.username.trim()) {
      newErrors.username = "Username is required";
    }

    if (!userData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(userData.email)) {
      newErrors.email = "Email format is invalid";
    }

    // Only require password for new users
    if (!user && !userData.password) {
      newErrors.password = "Password is required for new users";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setUserData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear specific field error when user types
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validate()) {
      // If updating and password is empty, remove it from the payload
      if (user && !userData.password) {
        const { ...dataWithoutPassword } = userData;
        onSubmit(dataWithoutPassword);
      } else {
        onSubmit(userData);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-xs overflow-y-auto h-full w-full flex items-center justify-center z-50">
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex justify-between items-center border-b p-4">
          <h3 className="text-xl font-semibold text-gray-800">
            {user ? "Edit User" : "Add New User"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          <div className="space-y-4">
            <div>
              <label
                htmlFor="username"
                className="block font-bold text-sm text-black"
              >
                Username
              </label>
              {/* Username input */}
              <input
                id="username"
                name="username"
                type="text"
                value={userData.username}
                onChange={handleChange}
                className={`mt-1 text-black block w-full py-2 px-3 rounded-md border-2 border-black shadow-sm focus:border-orange-500 focus:ring-orange-500 ${
                  errors.username ? "border-red-500" : ""
                }`}
                placeholder="Enter username"
              />
              {errors.username && (
                <p className="mt-1 text-sm text-red-600">{errors.username}</p>
              )}
            </div>

            <div>
              {/* Email label */}
              <label
                htmlFor="email"
                className="block text-sm font-bold text-black"
              >
                Email
              </label>
              {/* Email input */}
              <input
                id="email"
                name="email"
                type="email"
                value={userData.email}
                onChange={handleChange}
                className={`mt-1 text-black block w-full py-2 px-3 rounded-md border-2 border-black shadow-sm focus:border-orange-500 focus:ring-orange-500 ${
                  errors.email ? "border-red-500" : ""
                }`}
                placeholder="user@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              {/* Password label */}
              <label
                htmlFor="password"
                className="block text-sm font-bold text-black"
              >
                {user ? "Password (leave blank to keep current)" : "Password"}
              </label>
              {/* Password input */}
              <input
                id="password"
                name="password"
                type="password"
                value={userData.password}
                onChange={handleChange}
                className={`mt-1 text-black block w-full py-2 px-3 rounded-md border-2 border-black shadow-sm focus:border-orange-500 focus:ring-orange-500 ${
                  errors.password ? "border-red-500" : ""
                }`}
                placeholder={
                  user
                    ? "Leave blank to keep current password"
                    : "Enter password"
                }
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            <div>
              {/* Role label */}
              <label
                htmlFor="role"
                className="block text-sm font-bold text-black"
              >
                Role
              </label>
              {/* Role select */}
              <select
                id="role"
                name="role"
                value={userData.role}
                onChange={handleChange}
                className="mt-1 text-black block w-full py-2 px-3 rounded-md border-2 border-black shadow-sm focus:border-orange-500 focus:ring-orange-500"
              >
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing...
                </span>
              ) : user ? (
                "Update User"
              ) : (
                "Add User"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
