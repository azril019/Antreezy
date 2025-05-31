import errHandler from "@/helpers/errHandler";
import RestaurantModel from "@/db/models/RestaurantModel";
import { NewRestaurant } from "@/app/types";

export async function POST(request: Request) {
  try {
    const body: NewRestaurant = await request.json();
    const result = await RestaurantModel.create(body);
    if (!result) throw { status: 400, message: "Failed to create restaurant" };
    return Response.json({ message: result }, { status: 201 });
  } catch (error) {
    console.log("🚀 ~ POST ~ error:", error);
    return errHandler(error);
  }
}
export async function GET(request: Request) {
  try {
    const restaurant = await RestaurantModel.getAllRestaurants();
    if (!restaurant) {
      return Response.json(
        { message: "Restaurant not found" },
        { status: 404 }
      );
    }
    return Response.json(restaurant);
  } catch (error) {
    return errHandler(error);
  }
}
