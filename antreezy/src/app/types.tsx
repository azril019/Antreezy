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
