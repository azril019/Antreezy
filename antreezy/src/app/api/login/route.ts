import { comparePassword } from "@/helpers/bcrypt";
import errHandler from "@/helpers/errHandler";
import { generateToken } from "@/helpers/jwt";
import UserModel from "@/db/models/UserModel";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;
    if (!email || !password) {
      throw { status: 400, message: "Email and password are required" };
    }

    const user = await UserModel.findByEmail(email);

    if (!user) {
      throw { status: 401, message: "Invalid email or password" };
    }

    const isValid = comparePassword(password, user.password);
    if (!isValid) {
      throw { status: 401, message: "Invalid email or password" };
    }
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      username: user.username,
      role: user.role,
    });

    const cookieStore = await cookies();
    cookieStore.set("Authorization", `Bearer ${token}`);

    return Response.json({
      accessToken: token,
    });
  } catch (error) {
    return errHandler(error);
  }
}
