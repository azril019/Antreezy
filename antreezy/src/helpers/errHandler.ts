import { ZodError } from "zod";
import { CustomError } from "../app/types";
export default function errHandler(payload: unknown) {
  const error = payload as CustomError;
  let message = error.message || "Internal Server Error";
  let status = error.status || 500;

  if (payload instanceof ZodError) {
    message = payload.issues[0].message;
    status = 400;
  }

  return Response.json(
    {
      message: message,
    },
    {
      status: status,
    }
  );
}
