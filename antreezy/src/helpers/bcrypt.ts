import { compareSync, hashSync } from "bcryptjs";

export const hashPassword = (password: string) => hashSync(password, 10);

export const comparePassword = (password: string, hash: string) => {
  return compareSync(password, hash);
};
