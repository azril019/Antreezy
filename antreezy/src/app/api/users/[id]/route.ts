import errHandler from "@/helpers/errHandler";
import UserModel from "@/db/models/UserModel";

type ErrorWithStatus = {
  status?: number;
  message: string;
};

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await context.params;
    const { ...updateData } = await request.json();
    const result = await UserModel.updateUser(userId, updateData);
    return Response.json({ message: result });
  } catch (error) {
    return errHandler(error as ErrorWithStatus);
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await context.params;
    const result = await UserModel.deleteUser(userId);
    return Response.json({ message: result });
  } catch (error) {
    return errHandler(error as ErrorWithStatus);
  }
}
