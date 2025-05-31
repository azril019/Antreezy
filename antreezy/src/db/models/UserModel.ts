import { NewUser } from "@/app/types";
import { db } from "../config/mongodb";
import { z } from "zod";
import { hashPassword } from "@/helpers/bcrypt";
import { ObjectId } from "mongodb";

const NewUserSchema = z.object({
  username: z.string().min(2, "Name must be at least 2 characters long"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  role: z.enum(["admin", "staff"]),
});

class UserModel {
  static collection() {
    return db.collection("users");
  }

  static async create(user: NewUser) {
    NewUserSchema.parse(user);
    const existUser = await this.collection().findOne({
      $or: [
        { email: { $regex: user.email } },
        { username: { $regex: user.email } },
      ],
    });
    if (existUser) throw { status: 400, message: "User already exists" };

    user.password = hashPassword(user.password);

    await this.collection().insertOne(user);
    return "Success register user";
  }

  static async getProfile(userId: string) {
    if (!ObjectId.isValid(userId)) {
      throw { status: 400, message: "Invalid user ID" };
    }
    const user = await this.collection().findOne({ _id: new ObjectId(userId) });
    if (!user) {
      throw { status: 404, message: "User not found" };
    }
    return user;
  }

  static async findByEmail(email: string) {
    const user = await this.collection().findOne({
      email: { $regex: email, $options: "i" },
    });
    return user;
  }

  static async getAllUsers() {
    const users = await this.collection().find().toArray();
    return users.map((user) => ({
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role,
    }));
  }

  static async updateUser(id: string, updateData: Partial<NewUser>) {
    if (!ObjectId.isValid(id)) {
      throw { status: 400, message: "Invalid user ID" };
    }
    if (updateData.password) {
      updateData.password = hashPassword(updateData.password);
    }
    const result = await this.collection().updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    if (result.modifiedCount === 0) {
      throw { status: 404, message: "User not found or no changes made" };
    }
    return "User updated successfully";
  }

  static async deleteUser(id: string) {
    if (!ObjectId.isValid(id)) {
      throw { status: 400, message: "Invalid user ID" };
    }
    const result = await this.collection().deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      throw { status: 404, message: "User not found" };
    }
    return "User deleted successfully";
  }
}

export default UserModel;
