import errHandler from "@/helpers/errHandler";
import RestaurantModel from "@/db/models/RestaurantModel";
import { NewRestaurant } from "@/app/types";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: restaurantId } = await context.params;
    const restaurant = await RestaurantModel.getRestaurantById(restaurantId);

    return Response.json(restaurant);
  } catch (error) {
    return errHandler(error);
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: restaurantId } = await context.params;
    const body: NewRestaurant = await request.json();
    const result = await RestaurantModel.updateRestaurant(restaurantId, body);

    return Response.json({ message: result });
  } catch (error) {
    return errHandler(error);
  }
}
