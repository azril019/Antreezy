"use server";

import { cookies } from "next/headers";

export const handleLogout = async () => {
  const cookieStore = await cookies();
  cookieStore.delete("Authorization");
  return;
};
