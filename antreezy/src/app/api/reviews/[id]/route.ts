import { NextRequest, NextResponse } from "next/server";
import ReviewModel from "@/db/models/ReviewModel";
import errHandler from "@/helpers/errHandler";

type ErrorWithStatus = Error & { status?: number };

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { orderId, tableId, rating, comment } = body;

    // Validate required fields
    if (!orderId || !tableId || !rating) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    const updatedReview = await ReviewModel.updateReview(id, {
      orderId,
      tableId,
      rating,
      comment: comment || "",
    });

    if (!updatedReview) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Review updated successfully",
      review: updatedReview,
    });
  } catch (error) {
    errHandler(error as ErrorWithStatus);
    console.error("Error updating review:", error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await ReviewModel.deleteReview(id);

    if (!result) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: result,
    });
  } catch (error) {
    errHandler(error as ErrorWithStatus);
    console.error("Error deleting review:", error);
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const reviewId = (await params).id;

    const review = await ReviewModel.getReviewById(reviewId);

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    return NextResponse.json(review);
  } catch (error) {
    errHandler(error as ErrorWithStatus);
    console.error("Error fetching review:", error);
  }
}
