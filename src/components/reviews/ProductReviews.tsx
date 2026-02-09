import { useState, useEffect } from "react";
import { Star, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/axios";
import { toast } from "sonner";

interface Review {
  id: number;
  product_id: number;
  reviewer_name: string;
  rating: number;
  review_text: string;
  verified_purchase: boolean;
  created_at: string;
}

interface ReviewStats {
  total_reviews: number;
  average_rating: number;
}

interface ProductReviewsProps {
  productId: number;
}

export default function ProductReviews({ productId }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [expandedReviews, setExpandedReviews] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    reviewer_name: "",
    rating: 5,
    review_text: "",
    verified_purchase: false,
  });

  // Load reviews and stats on mount
  useEffect(() => {
    loadReviews();
    loadStats();
  }, [productId]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/reviews/product/${productId}`);
      setReviews(response.data.data || []);
    } catch (error) {
      console.error("Failed to load reviews:", error);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await api.get(`/reviews/stats/${productId}`);
      setStats(response.data.data || { total_reviews: 0, average_rating: 0 });
    } catch (error) {
      console.error("Failed to load review stats:", error);
      setStats({ total_reviews: 0, average_rating: 0 });
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.reviewer_name.trim() || !formData.review_text.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    if (formData.rating < 1 || formData.rating > 5) {
      toast.error("Rating must be between 1 and 5");
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/reviews/product/${productId}`, formData);
      toast.success("Review submitted successfully!");

      // Reset form
      setFormData({
        reviewer_name: "",
        rating: 5,
        review_text: "",
        verified_purchase: false,
      });

      // Reload reviews and stats
      await loadReviews();
      await loadStats();
    } catch (error: any) {
      console.error("Failed to submit review:", error);
      toast.error(error.response?.data?.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            className={star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const displayedReviews = expandedReviews ? reviews : reviews.slice(0, 3);

  return (
    <div className="w-full max-w-4xl mx-auto py-8 border-t">
      {/* Reviews Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Customer Reviews</h2>

        {/* Rating Summary */}
        {stats && (
          <div className="flex items-center gap-6 mb-6 p-4 bg-muted/50 rounded-lg">
            <div className="flex flex-col items-center">
              <div className="text-4xl font-bold">{stats.average_rating.toFixed(1)}</div>
              <div className="flex gap-1 mt-1">{renderStars(Math.round(stats.average_rating))}</div>
              <div className="text-sm text-muted-foreground mt-2">
                {stats.total_reviews} {stats.total_reviews === 1 ? "review" : "reviews"}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Submit Review Form */}
      <div className="mb-8 p-6 border rounded-lg bg-muted/30">
        <h3 className="text-lg font-semibold mb-4">Write a Review</h3>
        <form onSubmit={handleSubmitReview} className="space-y-4">
          {/* Name Field */}
          <div>
            <label className="block text-sm font-medium mb-1">Your Name</label>
            <input
              type="text"
              value={formData.reviewer_name}
              onChange={(e) => setFormData({ ...formData, reviewer_name: e.target.value })}
              placeholder="Enter your name"
              disabled={submitting}
              className="w-full px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Rating Field */}
          <div>
            <label className="block text-sm font-medium mb-2">Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFormData({ ...formData, rating: star })}
                  disabled={submitting}
                  className="focus:outline-none"
                >
                  <Star
                    size={28}
                    className={`cursor-pointer transition ${
                      star <= formData.rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300 hover:text-yellow-200"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Review Text */}
          <div>
            <label className="block text-sm font-medium mb-1">Your Review</label>
            <textarea
              value={formData.review_text}
              onChange={(e) => setFormData({ ...formData, review_text: e.target.value })}
              placeholder="Share your thoughts about this product..."
              disabled={submitting}
              rows={4}
              className="w-full px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Verified Purchase Checkbox */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="verified"
              checked={formData.verified_purchase}
              onChange={(e) => setFormData({ ...formData, verified_purchase: e.target.checked })}
              disabled={submitting}
              className="w-4 h-4 rounded cursor-pointer"
            />
            <label htmlFor="verified" className="text-sm font-medium cursor-pointer">
              ✓ Verified Purchase
            </label>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={submitting}
            className="w-full gap-2"
          >
            {submitting ? (
              <>
                <Loader size={16} className="animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Review"
            )}
          </Button>
        </form>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold mb-4">All Reviews</h3>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader size={24} className="animate-spin text-muted-foreground" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No reviews yet. Be the first to review this product!
          </div>
        ) : (
          <>
            {displayedReviews.map((review) => (
              <div
                key={review.id}
                className="p-4 border rounded-lg bg-background hover:bg-muted/30 transition"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-semibold">{review.reviewer_name}</div>
                    <div className="flex gap-2 items-center mt-1">
                      <div className="flex gap-1">{renderStars(review.rating)}</div>
                      {review.verified_purchase && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded font-semibold">
                          ✓ Verified
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatDate(review.created_at)}
                  </div>
                </div>
                <p className="text-sm text-foreground/80 mt-2">{review.review_text}</p>
              </div>
            ))}

            {reviews.length > 3 && !expandedReviews && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setExpandedReviews(true)}
              >
                See All {reviews.length} Reviews
              </Button>
            )}

            {expandedReviews && reviews.length > 3 && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setExpandedReviews(false)}
              >
                Show Less
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
