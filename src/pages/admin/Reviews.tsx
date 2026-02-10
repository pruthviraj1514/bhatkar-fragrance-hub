import { useState, useEffect } from "react";
import { Plus, Trash2, Loader, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import api from "@/lib/axios";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface Product {
  id: number;
  name: string;
}

interface Review {
  id: number;
  reviewer_name: string;
  rating: number;
  review_text: string;
  verified_purchase: boolean;
  is_featured?: boolean;
  is_active?: boolean;
  created_at: string;
}

export default function AdminReviews() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<{ reviewer_name?: string; rating?: number; review_text?: string; verified_purchase?: boolean }>({});

  const [formData, setFormData] = useState({
    reviewer_name: "",
    rating: 5,
    review_text: "",
    verified_purchase: true,
    is_featured: false,
    is_active: true,
  });

  // Redirect if not admin
  useEffect(() => {
    if (!isAdmin) navigate("/");
  }, [isAdmin, navigate]);

  // Load products
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await api.get("/products");
      setProducts(response.data.data || []);
    } catch (error) {
      console.error("Failed to load products:", error);
      toast.error("Failed to load products");
    }
  };

  // Load reviews for selected product
  useEffect(() => {
    if (selectedProductId) {
      loadReviews();
    }
  }, [selectedProductId]);

  const loadReviews = async () => {
    if (!selectedProductId) return;
    try {
      setLoading(true);
      const response = await api.get(`/reviews/product/${selectedProductId}/all`);
      setReviews(response.data.data || []);
    } catch (error) {
      console.error("Failed to load reviews:", error);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProductId) {
      toast.error("Please select a product");
      return;
    }

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
      await api.post(`/reviews/product/${selectedProductId}`, formData);
      toast.success("Review added successfully!");

      setFormData({
        reviewer_name: "",
        rating: 5,
        review_text: "",
        verified_purchase: true,
        is_featured: false,
        is_active: true,
      });

      await loadReviews();
    } catch (error: any) {
      console.error("Failed to add review:", error);
      toast.error(error.response?.data?.message || "Failed to add review");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleFeatured = async (reviewId: number, value: boolean) => {
    try {
      await api.patch(`/reviews/${reviewId}/featured`, { featured: value });
      toast.success('Updated featured flag');
      await loadReviews();
    } catch (err) {
      toast.error('Failed to update featured flag');
    }
  };

  const handleToggleActive = async (reviewId: number, value: boolean) => {
    try {
      await api.patch(`/reviews/${reviewId}/active`, { active: value });
      toast.success('Updated active flag');
      await loadReviews();
    } catch (err) {
      toast.error('Failed to update active flag');
    }
  };

  const handleUpdateReview = async (reviewId: number, updated: Partial<Review>) => {
    try {
      await api.put(`/reviews/${reviewId}`, updated);
      toast.success('Review updated');
      await loadReviews();
    } catch (err) {
      toast.error('Failed to update review');
    }
  };

  const handleDeleteReview = async (reviewId: number) => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;

    try {
      await api.delete(`/reviews/${reviewId}`);
      toast.success("Review deleted successfully!");
      await loadReviews();
    } catch (error: any) {
      console.error("Failed to delete review:", error);
      toast.error("Failed to delete review");
    }
  };

  const renderStars = (rating: number) => (
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

  return (
    <div className="w-full max-w-6xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Manage Product Reviews</h1>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Product List */}
        <div className="border rounded-lg p-6 h-96 overflow-y-auto">
          <h2 className="text-xl font-semibold mb-4">Products</h2>
          <div className="space-y-2">
            {products.map((product) => (
              <button
                key={product.id}
                onClick={() => setSelectedProductId(product.id)}
                className={`w-full text-left p-3 rounded border-2 transition ${
                  selectedProductId === product.id
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <span className="font-medium">{product.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="md:col-span-2 space-y-8">
          {selectedProductId ? (
            <>
              {/* Add Review Form */}
              <div className="border rounded-lg p-6 bg-muted/30">
                <h2 className="text-xl font-semibold mb-4">Add New Review</h2>
                <form onSubmit={handleAddReview} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Reviewer Name</label>
                    <Input
                      placeholder="Enter reviewer name"
                      value={formData.reviewer_name}
                      onChange={(e) =>
                        setFormData({ ...formData, reviewer_name: e.target.value })
                      }
                      disabled={submitting}
                    />
                  </div>

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

                  <div>
                    <label className="block text-sm font-medium mb-1">Review Text</label>
                    <textarea
                      placeholder="Enter review text"
                      value={formData.review_text}
                      onChange={(e) =>
                        setFormData({ ...formData, review_text: e.target.value })
                      }
                      disabled={submitting}
                      rows={4}
                      className="w-full px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="verified"
                      checked={formData.verified_purchase}
                      onChange={(e) =>
                        setFormData({ ...formData, verified_purchase: e.target.checked })
                      }
                      disabled={submitting}
                      className="w-4 h-4 rounded cursor-pointer"
                    />
                    <label htmlFor="verified" className="text-sm font-medium cursor-pointer">
                      ✓ Mark as Verified Purchase
                    </label>
                  </div>

                  <Button type="submit" disabled={submitting} className="w-full gap-2">
                    {submitting ? (
                      <>
                        <Loader size={16} className="animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus size={16} />
                        Add Review
                      </>
                    )}
                  </Button>
                </form>
              </div>

              {/* Reviews List */}
              <div className="border rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">
                  Existing Reviews ({reviews.length})
                </h2>

                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader size={24} className="animate-spin text-muted-foreground" />
                  </div>
                ) : reviews.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No reviews yet</p>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {reviews.map((review) => (
                      <div
                        key={review.id}
                        className="p-4 border rounded-lg bg-background hover:bg-muted/30 transition"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold">{review.reviewer_name}</p>
                            <div className="flex gap-2 items-center mt-1">
                              <div className="flex gap-1">{renderStars(review.rating)}</div>
                              {review.verified_purchase && (
                                <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded font-semibold">
                                  ✓ Verified
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2 items-center">
                            <Button
                              variant={review.is_featured ? "secondary" : "outline"}
                              size="sm"
                              onClick={() => handleToggleFeatured(review.id, !review.is_featured)}
                            >
                              {review.is_featured ? "⭐ Unfeature" : "☆ Feature"}
                            </Button>
                            <Button
                              variant={review.is_active ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleToggleActive(review.id, !review.is_active)}
                            >
                              {review.is_active ? "Disable" : "Enable"}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteReview(review.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-foreground/80 mt-2">{review.review_text}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(review.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              Select a product to manage its reviews
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
