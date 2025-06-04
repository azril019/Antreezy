import { db } from "@/db/config/mongodb";
import { ObjectId, OptionalId } from "mongodb";
import { NewMenuItem, MenuItem } from "@/app/types";

export default class MenuModel {
  static collection() {
    return db.collection<Omit<MenuItem, "id"> & { _id?: ObjectId }>("menus");
  }

  static async getAllMenuItems(): Promise<MenuItem[]> {
    const menus = await this.collection()
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return menus
      .map(
        (menu): MenuItem => ({
          ...menu,
          id: menu._id?.toString() || "", // Gunakan 'id' bukan '_id'
          _id: undefined, // Remove _id dari response
        })
      )
      .filter((menu) => menu.id); // Filter out items without valid id
  }

  static async createMenuItem(newMenuItem: NewMenuItem): Promise<MenuItem> {
    const menuWithTimestamp = {
      ...newMenuItem,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = await this.collection().insertOne(menuWithTimestamp);

    const createdMenu = await this.collection().findOne({
      _id: result.insertedId,
    });

    if (!createdMenu) {
      throw new Error("Failed to retrieve created menu item");
    }

    return {
      ...createdMenu,
      id: createdMenu._id?.toString() || "", // Gunakan 'id' bukan '_id'
      _id: undefined, // Remove _id dari response
    };
  }

  static async updateMenuItem(
    id: string,
    updateData: Partial<NewMenuItem>
  ): Promise<MenuItem | null> {
    const updateWithTimestamp = {
      ...updateData,
      updatedAt: new Date().toISOString(),
    };

    // Fix: gunakan _id bukan id untuk query MongoDB
    const result = await this.collection().findOneAndUpdate(
      { _id: new ObjectId(id) }, // Fix: gunakan _id
      { $set: updateWithTimestamp },
      { returnDocument: "after" }
    );

    if (!result) return null;

    return {
      ...result,
      id: result._id?.toString() || "", // Gunakan 'id' bukan '_id'
      _id: undefined, // Remove _id dari response
    };
  }

  static async deleteMenuItem(id: string): Promise<string | null> {
    // Fix: gunakan _id bukan id untuk query MongoDB
    const result = await this.collection().deleteOne({
      _id: new ObjectId(id), // Fix: gunakan _id
    });

    return result.deletedCount > 0 ? "Menu item deleted successfully" : null;
  }

  static async getMenuItemById(id: string): Promise<MenuItem | null> {
    // Fix: gunakan _id bukan id untuk query MongoDB
    const menu = await this.collection().findOne({ _id: new ObjectId(id) }); // Fix: gunakan _id

    if (!menu) return null;

    return {
      ...menu,
      id: menu._id?.toString() || "", // Gunakan 'id' bukan '_id'
      _id: undefined, // Remove _id dari response
    };
  }
}
