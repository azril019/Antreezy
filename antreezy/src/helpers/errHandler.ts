import { ZodError } from "zod";
import { CustomError } from "../app/types";
export default function errHandler(error: any) {
  console.error("Error:", error);

  if (error.status) {
    return Response.json(
      { error: error.message || "An error occurred" },
      { status: error.status }
    );
  }

  return Response.json(
    { error: "Internal server error" },
    { status: 500 }
  );
}
