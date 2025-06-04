import { cookies } from "next/headers";
import errHandler from "./helpers/errHandler";
import { verifyTokenJose } from "./helpers/jwt";
import { NextResponse } from "next/server";

export async function middleware(request: Request) {
  console.log("masuk middleware");

  const pathname = new URL(request.url).pathname;

  try {
    const cookieStore = await cookies();
    const authorization = cookieStore.get("Authorization");

    if (!authorization) throw { status: 401, message: "Please login first!" };

    const [type, token] = authorization.value.split(" ");
    if (type !== "Bearer") throw { status: 401, message: "Invalid token" };

    const decoded = await verifyTokenJose<{ userId: string; email: string }>(
      token
    );

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", decoded.userId);

    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
    return response;
  } catch (error) {
    console.error("Error in middleware:", error);
    return errHandler(error);
  }
}

export const config = {
  matcher: ["/api/profile"],
};
