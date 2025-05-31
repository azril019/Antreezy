import errHandler from "@/helpers/errHandler";
import MenuModel from "@/db/models/MenuModel";
import { NewMenuItem } from "@/app/types";
import { generateNutritionalInfo } from "@/helpers/geminiAI";

export async function GET() {
  try {
    const result = await MenuModel.getAllMenuItems();
    return Response.json(result, { status: 200 });
  } catch (error) {
    console.log("🚀 ~ GET ~ error:", error);
    return errHandler(error);
  }
}

export async function POST(request: Request) {
  try {
    const body: NewMenuItem = await request.json();

    // Generate nutritional info jika ada komposisi
    if (body.composition && body.composition.trim()) {
      try {
        body.nutritionalInfo = await generateNutritionalInfo(body.composition);
        console.log("✅ Generated nutritional info:", body.nutritionalInfo);
      } catch (aiError) {
        console.error("❌ Failed to generate nutritional info:", aiError);
      }
    }

    const result = await MenuModel.createMenuItem(body);
    if (!result) throw { status: 400, message: "Failed to create menu item" };

    return Response.json(
      { message: "Menu item created successfully", data: result },
      { status: 201 }
    );
  } catch (error) {
    console.log("🚀 ~ POST ~ error:", error);
    return errHandler(error);
  }
}
