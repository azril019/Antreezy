import { NewRestaurant } from "@/app/types";
import { db } from "../config/mongodb";
import { z } from "zod";
import { ObjectId } from "mongodb";

const NewRestaurantSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Name must be at least 2 characters long"),
  address: z.string().min(5, "Address must be at least 5 characters long"),
  logo: z.string().optional(),
  coverImage: z.string().optional(),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
  contact: z
    .object({
      phone: z.string().optional(),
      email: z.string().email("Invalid email address").optional(),
      website: z.string().optional(),
      instagram: z.string().optional(),
      facebook: z.string().optional(),
      twitter: z.string().optional(),
      whatsapp: z.string().optional(),
    })
    .optional(),
});

class RestaurantModel {
  static collection() {
    return db.collection("restaurants");
  }

  static async create(restaurant: NewRestaurant) {
    NewRestaurantSchema.parse(restaurant);
    const existRestaurant = await this.collection().findOne({
      name: { $regex: restaurant.name, $options: "i" },
    });
    if (existRestaurant)
      throw { status: 400, message: "Restaurant already exists" };

    await this.collection().insertOne(restaurant);
    return "Success register restaurant";
  }

  static async getAllRestaurants() {
    const restaurants = await this.collection().find().toArray();
    return restaurants.map((restaurant) => ({
      id: restaurant._id.toString(),
      name: restaurant.name,
      address: restaurant.address,
      tagline: restaurant.tagline || "",
      logo: restaurant.logo || "",
      coverImage: restaurant.coverImage || "",
      description: restaurant.description || "",
      contact: {
        phone: restaurant.contact?.phone || "",
        email: restaurant.contact?.email || "",
        website: restaurant.contact?.website || "",
        instagram: restaurant.contact?.instagram || "",
        facebook: restaurant.contact?.facebook || "",
        twitter: restaurant.contact?.twitter || "",
        whatsapp: restaurant.contact?.whatsapp || "",
      },
    }));
  }

  static async updateRestaurant(
    restaurantId: string,
    restaurantData: NewRestaurant
  ) {
    const { id, ...dataToValidate } = restaurantData;
    NewRestaurantSchema.parse(dataToValidate);
    const existRestaurant = await this.collection().findOne({
      _id: new ObjectId(restaurantId),
    });
    if (!existRestaurant)
      throw { status: 404, message: "Restaurant not found" };
    await this.collection().updateOne(
      { _id: new ObjectId(restaurantId) },
      { $set: dataToValidate }
    );

    return "Success update restaurant";
  }

  static async getRestaurantById(restaurantId: string) {
    const restaurant = await this.collection().findOne({
      _id: new ObjectId(restaurantId),
    });

    if (!restaurant) {
      throw { status: 404, message: "Restaurant not found" };
    }

    return {
      id: restaurant._id.toString(),
      name: restaurant.name,
      address: restaurant.address,
      tagline: restaurant.tagline || "",
      logo: restaurant.logo || "",
      coverImage: restaurant.coverImage || "",
      description: restaurant.description || "",
      contact: {
        phone: restaurant.contact?.phone || "",
        email: restaurant.contact?.email || "",
        website: restaurant.contact?.website || "",
        instagram: restaurant.contact?.instagram || "",
        facebook: restaurant.contact?.facebook || "",
        twitter: restaurant.contact?.twitter || "",
        whatsapp: restaurant.contact?.whatsapp || "",
      },
    };
  }
}

export default RestaurantModel;
