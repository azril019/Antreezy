import errHandler from "@/helpers/errHandler";
import UserModel from "@/db/models/UserModel";

export async function GET(request: Request) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      throw { status: 400, message: "User ID header is missing" };
    }

    const userLogin = await UserModel.getProfile(userId);

    if (!userLogin) {
      throw { status: 404, message: "User not found" };
    }

    return Response.json({
      user: {
        id: userLogin._id.toString(),
        email: userLogin.email,
        username: userLogin.username,
        role: userLogin.role,
      },
    });
  } catch (error) {
    return errHandler(error);
  }
}
