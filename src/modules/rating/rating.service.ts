import { ratingModel } from "./rating.model";

export const ratingService = {
  async listRatings(input: { branchId?: string }) {
    const ratings = await ratingModel.list(input.branchId);
    const averageRating =
      ratings.length > 0
        ? ratings.reduce((sum, item) => sum + item.rating, 0) / ratings.length
        : 0;

    return {
      summary: {
        totalReviews: ratings.length,
        averageRating: Number(averageRating.toFixed(1)),
        lowRatings: ratings.filter((item) => item.rating <= 2).length,
      },
      items: ratings.map((rating) => ({
        id: rating.id,
        orderId: rating.orderId,
        customerName: rating.customerName,
        branchName: rating.branchName,
        rating: rating.rating,
        feedback: rating.feedback ?? null,
        createdAt: rating.createdAt.toISOString(),
      })),
    };
  },
};
