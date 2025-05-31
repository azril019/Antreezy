export type CustomError = {
  status?: number;
  message?: string;
};

export type NewUser = {
  email: string;
  password: string;
  username: string;
  role: string;
};

export type NewRestaurant = {
  id?: string;
  name: string;
  address: string;
  tagline?: string;
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
};
