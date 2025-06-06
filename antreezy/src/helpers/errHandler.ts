interface ErrorWithStatus {
  status?: number;
  message?: string;
}

interface ErrorResponse {
  error: string;
}

export default function errHandler(error: ErrorWithStatus): Response {
  console.error("Error:", error);

  if (error.status) {
    return Response.json(
      { error: error.message || "An error occurred" } as ErrorResponse,
      { status: error.status }
    );
  }

  return Response.json({ error: "Internal server error" } as ErrorResponse, {
    status: 500,
  });
}
