import {db} from "@/db/config/mongodb";
import {ObjectId} from "mongodb";

export interface Review {
  id: string;
  orderId: string;
  tableId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface NewReview {
  orderId: string;
  tableId: string;
  rating: number;
  comment?: string;
}

export default class ReviewModel {
  static collection() {
    return db.collection<Omit<Review, "id"> & {_id?: ObjectId}>("reviews");
  }

  static async getAllReviews(): Promise<Review[]> {
    const reviews = await this.collection()
      .find({})
      .sort({createdAt: -1})
      .toArray();

    return reviews
      .map(
        (review): Review => ({
          ...review,
          id: review._id?.toString() || "",
          _id: undefined,
        })
      )
      .filter((review) => review.id);
  }

  static async getReviewsByTableId(tableId: string): Promise<Review[]> {
    const reviews = await this.collection()
      .find({tableId})
      .sort({createdAt: -1})
      .toArray();

    return reviews
      .map(
        (review): Review => ({
          ...review,
          id: review._id?.toString() || "",
          _id: undefined,
        })
      )
      .filter((review) => review.id);
  }

  static async getReviewsByOrderId(orderId: string): Promise<Review[]> {
    const reviews = await this.collection()
      .find({orderId})
      .sort({createdAt: -1})
      .toArray();

    return reviews
      .map(
        (review): Review => ({
          ...review,
          id: review._id?.toString() || "",
          _id: undefined,
        })
      )
      .filter((review) => review.id);
  }

  static async createReview(newReview: NewReview): Promise<Review> {
    // Validate rating
    if (newReview.rating < 1 || newReview.rating > 5) {
      throw new Error("Rating must be between 1 and 5");
    }

    const reviewWithTimestamp = {
      ...newReview,
      comment: newReview.comment || "",
      createdAt: new Date().toISOString(),
    };

    const result = await this.collection().insertOne(reviewWithTimestamp);

    const createdReview = await this.collection().findOne({
      _id: result.insertedId,
    });

    if (!createdReview) {
      throw new Error("Failed to retrieve created review");
    }

    return {
      ...createdReview,
      id: createdReview._id?.toString() || "",
      _id: undefined,
    };
  }

  static async updateReview(
    id: string,
    updateData: Partial<NewReview>
  ): Promise<Review | null> {
    // Validate rating if provided
    if (updateData.rating && (updateData.rating < 1 || updateData.rating > 5)) {
      throw new Error("Rating must be between 1 and 5");
    }

    const result = await this.collection().findOneAndUpdate(
      {_id: new ObjectId(id)},
      {$set: updateData},
      {returnDocument: "after"}
    );

    if (!result) return null;

    return {
      ...result,
      id: result._id?.toString() || "",
      _id: undefined,
    };
  }

  static async deleteReview(id: string): Promise<string | null> {
    const result = await this.collection().deleteOne({
      _id: new ObjectId(id),
    });

    return result.deletedCount > 0 ? "Review deleted successfully" : null;
  }

  static async getReviewById(id: string): Promise<Review | null> {
    const review = await this.collection().findOne({_id: new ObjectId(id)});

    if (!review) return null;

    return {
      ...review,
      id: review._id?.toString() || "",
      _id: undefined,
    };
  }

  static async getAverageRating(): Promise<number> {
    const pipeline = [
      {
        $group: {
          _id: null,
          averageRating: {$avg: "$rating"},
          totalReviews: {$sum: 1},
        },
      },
    ];

    const result = await this.collection().aggregate(pipeline).toArray();

    if (result.length === 0) return 0;

    return Math.round(result[0].averageRating * 10) / 10; // Round to 1 decimal place
  }

  static async getRatingDistribution(): Promise<{[key: number]: number}> {
    const pipeline = [
      {
        $group: {
          _id: "$rating",
          count: {$sum: 1},
        },
      },
      {
        $sort: {_id: 1},
      },
    ];

    const result = await this.collection().aggregate(pipeline).toArray();

    const distribution: {[key: number]: number} = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    result.forEach((item) => {
      distribution[item._id] = item.count;
    });

    return distribution;
  }
}
