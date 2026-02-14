import { useState, useEffect, useRef } from "react";
import { Plus, Edit2, Trash2, Loader, Upload, X, Images, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import api from "@/lib/axios";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface Product {
  id: number;
  name: string;
  brand: string;
  price: number;
  quantity_ml: number;
  quantity_unit: string;
  category: "Men" | "Women" | "Unisex";
  concentration: "EDP" | "EDT" | "Parfum";
  description: string;
  stock: number;
  is_best_seller?: boolean;
  is_luxury_product?: boolean;
  created_on: string;
  images?: Array<{
    id: number;
    image_url: string;
    alt_text: string;
    image_order: number;
    is_thumbnail: boolean;
  }>;
}

interface FormData {
  name: string;
  brand: string;
  price: string;
  original_price: string;
  discount_percentage: string;
  shipping_cost: string;
  other_charges: string;
  quantity_ml: string;
  quantity_unit: string;
  category: "Men" | "Women" | "Unisex" | "";
  concentration: "EDP" | "EDT" | "Parfum" | "";
  description: string;
  stock: string;
  is_best_seller: boolean;
  is_luxury_product: boolean;
}

interface ProductImage {
  id?: number;
  imageUrl: string;
  altText: string;
  imageOrder: number;
  isThumbnail: boolean;
}

interface InitialReview {
  reviewer_name: string;
  rating: number;
  review_text: string;
}

export default function Products() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    name: "",
    brand: "",
    price: "",
    original_price: "",
    discount_percentage: "",
    shipping_cost: "0",
    other_charges: "0",
    quantity_ml: "100",
    quantity_unit: "ml",
    category: "",
    concentration: "",
    description: "",
    stock: "0",
    is_best_seller: false,
    is_luxury_product: false,
  });

  const [images, setImages] = useState<ProductImage[]>([]);
  const [variants, setEditVariants] = useState<any[]>([]);
  const [newVariant, setNewVariant] = useState({ name: "", value: "", unit: "ml", price: "", stock: "" });
  const [selectedVariantForImages, setSelectedVariantForImages] = useState<number | null>(null);
  const [variantImageFiles, setVariantImageFiles] = useState<File[]>([]);
  const [isUploadingVariantImages, setIsUploadingVariantImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Reviews state
  const [initialReviews, setInitialReviews] = useState<InitialReview[]>([]);
  const [newReview, setNewReview] = useState<InitialReview>({ reviewer_name: "", rating: 5, review_text: "" });

  const handleVariantFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setVariantImageFiles(Array.from(files));
    }
  };

  // Redirect if not admin
  useEffect(() => {
    if (!isAdmin) {
      navigate("/");
    }
  }, [isAdmin, navigate]);

  // Fetch products
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      // Fetch products with images from the dedicated endpoint
      const response = await api.get("/products/with-images/all");
      setProducts(response.data.data || []);
      setError("");
    } catch (err) {
      setError("Failed to load products");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setEditingId(product.id);
      setFormData({
        name: product.name,
        brand: product.brand,
        price: product.price.toString(),
        original_price: (product as any).original_price ? (product as any).original_price.toString() : "",
        discount_percentage: (product as any).discount_percentage ? (product as any).discount_percentage.toString() : "",
        shipping_cost: (product as any).shipping_cost ? (product as any).shipping_cost.toString() : "0",
        other_charges: (product as any).other_charges ? (product as any).other_charges.toString() : "0",
        quantity_ml: product.quantity_ml.toString(),
        quantity_unit: product.quantity_unit,
        category: product.category,
        concentration: product.concentration,
        description: product.description,
        stock: product.stock.toString(),
        is_best_seller: product.is_best_seller || false,
        is_luxury_product: (product as any).is_luxury_product || false,
      });
      // Load existing images and variants for product
      loadProductImages(product.id);
      loadProductVariants(product.id);
      setNewVariant({ name: "", value: "", unit: "ml", price: "", stock: "" });
      setInitialReviews([]);
      setNewReview({ reviewer_name: "", rating: 5, review_text: "" });
    } else {
      setEditingId(null);
      setFormData({
        name: "",
        brand: "",
        price: "",
        original_price: "",
        discount_percentage: "",
        shipping_cost: "0",
        other_charges: "0",
        quantity_ml: "100",
        quantity_unit: "ml",
        category: "",
        concentration: "",
        description: "",
        stock: "0",
        is_best_seller: false,
        is_luxury_product: false,
      });
      setImages([]);
      setEditVariants([]);
      setNewVariant({ name: "", value: "", unit: "ml", price: "", stock: "" });
      setInitialReviews([]);
      setNewReview({ reviewer_name: "", rating: 5, review_text: "" });
    }
    setIsOpen(true);
  };

  const loadProductImages = async (productId: number) => {
    try {
      const response = await api.get(`/products/${productId}/images`);
      if (response.data.data) {
        setImages(response.data.data.map((img: any) => ({
          id: img.id,
          imageUrl: img.image_url,
          altText: img.alt_text || "",
          imageOrder: img.image_order,
          isThumbnail: img.is_thumbnail
        })));
      }
    } catch (err) {
      console.error("Failed to load product images");
      setImages([]);
    }
  };

  const loadProductVariants = async (productId: number) => {
    try {
      const response = await api.get(`/variants/product/${productId}`);
      if (response.data.data) {
        setEditVariants(response.data.data);
      } else {
        setEditVariants([]);
      }
    } catch (err) {
      console.error("Failed to load product variants:", err);
      setEditVariants([]);
    }
  };

  const handleCloseDialog = () => {
    setIsOpen(false);
    setEditingId(null);
    setFormData({
      name: "",
      brand: "",
      price: "",
      original_price: "",
      discount_percentage: "",
      shipping_cost: "0",
      other_charges: "0",
      quantity_ml: "100",
      quantity_unit: "ml",
      category: "",
      concentration: "",
      description: "",
      stock: "0",
      is_best_seller: false,
      is_luxury_product: false,
    });
    setImages([]);
    setEditVariants([]);
    setNewVariant({ name: "", value: "", unit: "ml", price: "", stock: "" });
    setInitialReviews([]);
    setNewReview({ reviewer_name: "", rating: 5, review_text: "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      // Validation
      if (!formData.name || !formData.brand || !formData.price || !formData.category || !formData.concentration) {
        setError("Please fill in all required fields");
        setIsSubmitting(false);
        return;
      }

      const payload = {
        name: formData.name,
        brand: formData.brand,
        price: parseFloat(formData.price),
        original_price: formData.original_price ? parseFloat(formData.original_price) : null,
        discount_percentage: formData.discount_percentage ? parseFloat(formData.discount_percentage) : 0,
        shipping_cost: formData.shipping_cost ? parseFloat(formData.shipping_cost) : 0,
        other_charges: formData.other_charges ? parseFloat(formData.other_charges) : 0,
        quantity_ml: parseInt(formData.quantity_ml) || 100,
        quantity_unit: formData.quantity_unit || 'ml',
        category: formData.category,
        concentration: formData.concentration,
        description: formData.description,
        stock: parseInt(formData.stock) || 0,
        is_best_seller: formData.is_best_seller,
        is_luxury_product: formData.is_luxury_product,
      };

      let productId: number;

      if (editingId) {
        // Update product
        await api.put(`/products/${editingId}`, payload);
        productId = editingId;
      } else {
        // Create product
        const response = await api.post("/products", payload);
        productId = response.data.data.id;
        setEditingId(productId);
      }

      // Handle images - upload data URLs to Railway, save URLs to database
      if (images.length > 0) {
        const newImages = images.filter(img => !img.id); // Only new images
        if (newImages.length > 0) {
          // Process images: upload data URLs to Railway, keep existing URLs
          const processedImages = await Promise.all(
            newImages.map(async (img, index) => {
              let finalUrl = img.imageUrl;

              // If it's a data URL (from local file upload), upload to Railway
              if (img.imageUrl.startsWith('data:')) {
                try {
                  console.log(`📤 Uploading local image ${index + 1} to Railway...`);
                  
                  // Convert data URL to blob
                  const response = await fetch(img.imageUrl);
                  const blob = await response.blob();
                  
                  // Upload to Railway
                  const form = new FormData();
                  form.append("images", blob, `product-image-${index + 1}.jpg`);
                  
                  const uploadResponse = await api.post(`/images/upload/${productId}`, form, {
                    headers: {
                      "Content-Type": "multipart/form-data",
                    },
                  });
                  
                  const uploadedImages = uploadResponse.data.data?.images || [];
                  if (uploadedImages.length > 0) {
                    finalUrl = uploadedImages[0].image_url;
                    console.log(`✅ Image uploaded to Railway: ${finalUrl}`);
                  }
                } catch (uploadErr: any) {
                  console.error(`❌ Failed to upload image ${index + 1}:`, uploadErr.message);
                  throw new Error(`Failed to upload image: ${uploadErr.message}`);
                }
              }

              return {
                imageUrl: finalUrl,
                altText: img.altText,
                imageOrder: index + 1,
                isThumbnail: index === 0
              };
            })
          );

          // Save to database
          const imagePayload = {
            images: processedImages
          };
          await api.post(`/products/${productId}/images`, imagePayload);
        }
      }

      // Handle initial reviews if provided
      if (initialReviews.length > 0) {
        for (const review of initialReviews) {
          try {
            await api.post(`/reviews`, {
              product_id: productId,
              reviewer_name: review.reviewer_name,
              rating: review.rating,
              review_text: review.review_text,
              verified_purchase: true,
              is_approved: true,
              is_active: true
            });
          } catch (reviewErr: any) {
            console.error("Failed to create review:", reviewErr);
            toast.error(`Failed to create review for ${review.reviewer_name}`);
          }
        }
      }

      await fetchProducts();
      handleCloseDialog();
      toast.success(editingId ? "Product updated successfully!" : "Product created successfully!");
    } catch (err: any) {
      console.error("Submit error:", err);
      setError(err.response?.data?.message || err.message || "Failed to save product");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddReview = () => {
    if (!newReview.reviewer_name.trim() || !newReview.review_text.trim()) {
      toast.error("Please fill in reviewer name and review text");
      return;
    }

    if (newReview.rating < 1 || newReview.rating > 5) {
      toast.error("Rating must be between 1 and 5 stars");
      return;
    }

    setInitialReviews([...initialReviews, { ...newReview }]);
    setNewReview({ reviewer_name: "", rating: 5, review_text: "" });
    toast.success("Review added to product!");
  };

  const handleRemoveReview = (index: number) => {
    setInitialReviews(initialReviews.filter((_, i) => i !== index));
    toast.success("Review removed");
  };

  const handleAddImage = (imageUrl: string, altText: string) => {
    if (images.length >= 4) {
      toast.error("Maximum 4 images per product");
      return;
    }

    if (!imageUrl.trim()) {
      toast.error("Please enter image URL");
      return;
    }

    const newImage: ProductImage = {
      imageUrl: imageUrl.trim(),
      altText: altText.trim() || "Product image",
      imageOrder: images.length + 1,
      isThumbnail: images.length === 0
    };

    setImages([...images, newImage]);
    toast.success("Image added!");
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    toast.success("Image removed");
  };

  const handleSetThumbnail = (index: number) => {
    const updatedImages = images.map((img, i) => ({
      ...img,
      isThumbnail: i === index
    }));
    setImages(updatedImages);
    toast.success("Thumbnail updated");
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this product?")) {
      return;
    }

    try {
      setError("");
      await api.delete(`/products/${id}`);
      await fetchProducts();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete product");
    }
  };

  const handleAddVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingId) {
      toast.error("Please save the product first before adding variants");
      return;
    }

    if (!newVariant.name || !newVariant.value || !newVariant.price || !newVariant.stock) {
      toast.error("Please fill all variant fields");
      return;
    }

    try {
      // Backend expects POST /variants with productId in body (admin route)
      const response = await api.post(`/variants`, {
        productId: editingId,
        variant_name: newVariant.name,
        variant_value: parseInt(newVariant.value),
        variant_unit: newVariant.unit,
        price: parseFloat(newVariant.price),
        stock: parseInt(newVariant.stock)
      });

      await loadProductVariants(editingId);
      setNewVariant({ name: "", value: "", unit: "ml", price: "", stock: "" });
      toast.success("Variant added successfully!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to add variant");
    }
  };

  const handleDeleteVariant = async (variantId: number) => {
    if (!confirm("Delete this variant?")) return;

    try {
      await api.delete(`/variants/${variantId}`);
      await loadProductVariants(editingId!);
      toast.success("Variant deleted");
    } catch (err: any) {
      toast.error("Failed to delete variant");
    }
  };

  // Upload files for a specific variant: upload to Railway then save URLs to variant_images
  const handleUploadVariantImages = async (variantId: number) => {
    if (variantImageFiles.length === 0) {
      toast.error("Please select at least one image to upload");
      return;
    }

    if (!editingId) {
      toast.error("Please save the product before uploading variant images");
      return;
    }

    setIsUploadingVariantImages(true);
    try {
      const form = new FormData();
      variantImageFiles.forEach((file) => form.append('images', file));

      // Upload files to Railway (product-level upload endpoint)
      const uploadResp = await api.post(`/images/upload/${editingId}`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const uploaded = uploadResp.data.data?.images || [];
      if (uploaded.length === 0) throw new Error('No images returned from upload');

      // Save uploaded URLs to variant_images via API
      const imagesPayload = uploaded.map((img: any) => ({ image_url: img.image_url, alt_text: img.alt_text || 'Variant image' }));
      await api.post(`/variants/${variantId}/images`, { images: imagesPayload });

      await loadProductVariants(editingId);
      setVariantImageFiles([]);
      setSelectedVariantForImages(null);
      toast.success('Variant images uploaded successfully');
    } catch (err: any) {
      console.error('Variant image upload failed:', err.response || err.message || err);
      toast.error(err.response?.data?.message || err.message || 'Failed to upload variant images');
    } finally {
      setIsUploadingVariantImages(false);
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="container py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-4xl font-bold text-foreground">Products</h1>
          <Button onClick={() => handleOpenDialog()} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        </div>
        <p className="text-muted-foreground">Manage your fragrance catalog</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 rounded-lg bg-destructive/10 text-destructive">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Image</TableHead>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Concentration</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Best Seller</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      No products found. Create one to get started!
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product) => {
                    // Get thumbnail image for database products
                    const productImages = product.images || [];
                    const thumbnailImage = productImages.find((img: any) => img.is_thumbnail) || productImages[0];
                    const apiBase = import.meta.env.VITE_API_BASE_URL ? import.meta.env.VITE_API_BASE_URL.replace(/\/api$/, '') : '';
                    const imageUrlRaw = thumbnailImage?.image_url;
                    const imageUrl = imageUrlRaw
                      ? (imageUrlRaw.startsWith('http') ? imageUrlRaw : `${apiBase}${imageUrlRaw}`)
                      : '/placeholder.svg';
                    
                    return (
                    <TableRow key={product.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="w-12 h-16 rounded overflow-hidden bg-muted flex-shrink-0">
                          <img 
                            src={imageUrl} 
                            alt={product.name}
                            className="w-full h-full object-cover"
                            onError={(e: any) => {
                              e.target.src = '/placeholder.svg';
                            }}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.brand}</TableCell>
                      <TableCell>₹{product.price.toFixed(2)}</TableCell>
                      <TableCell className="text-sm">
                        {product.quantity_ml}{product.quantity_unit}
                      </TableCell>
                      <TableCell>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          {product.category}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-secondary/10 text-secondary-foreground">
                          {product.concentration}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={`inline-block px-3 py-1 rounded text-xs font-semibold ${
                            product.stock > 10 ? 'bg-green-100 text-green-800' :
                            product.stock > 3 ? 'bg-yellow-100 text-yellow-800' :
                            product.stock > 0 ? 'bg-orange-100 text-orange-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {product.stock}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {product.is_best_seller ? (
                          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                            ⭐ Yes
                          </span>
                        ) : (
                          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                            No
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/admin/products/${product.id}/images`)}
                            className="gap-1"
                          >
                            <Images className="h-4 w-4" />
                            Images
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenDialog(product)}
                            className="gap-1"
                          >
                            <Edit2 className="h-4 w-4" />
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(product.id)}
                            className="gap-1"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader className="shrink-0">
            <DialogTitle>{editingId ? "Edit Product" : "Add New Product"}</DialogTitle>
            <DialogDescription>
              {editingId ? "Update the product details" : "Create a new fragrance product"}
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-y-auto flex-1 px-4">
            <form id="productForm" onSubmit={handleSubmit} className="space-y-4 pr-4">
            {/* Name */}
            <div>
              <label className="text-sm font-medium block mb-1">Product Name *</label>
              <Input
                placeholder="e.g., Eau de Parfum Rose"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={isSubmitting}
              />
            </div>

            {/* Brand */}
            <div>
              <label className="text-sm font-medium block mb-1">Brand *</label>
              <Input
                placeholder="e.g., Guerlain"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                disabled={isSubmitting}
              />
            </div>

            {/* Price */}
            <div>
              <label className="text-sm font-medium block mb-1">Price (₹) *</label>
              <Input
                type="number"
                placeholder="0.00"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                disabled={isSubmitting}
              />
            </div>

            {/* Pricing Details Section */}
            <div className="border-t pt-3 mt-3">
              <label className="text-xs font-semibold block mb-3 uppercase tracking-wide text-muted-foreground">
                Pricing Details (Optional)
              </label>
              
              {/* Original Price */}
              <div className="mb-3">
                <label className="text-sm font-medium block mb-1">Original Price (MRP)</label>
                <Input
                  type="number"
                  placeholder="Original/list price"
                  step="0.01"
                  value={formData.original_price}
                  onChange={(e) => setFormData({ ...formData, original_price: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>

              {/* Discount Percentage */}
              <div className="mb-3">
                <label className="text-sm font-medium block mb-1">Discount Percentage (%)</label>
                <Input
                  type="number"
                  placeholder="0"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.discount_percentage}
                  onChange={(e) => setFormData({ ...formData, discount_percentage: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>

              {/* Shipping Cost */}
              <div className="mb-3">
                <label className="text-sm font-medium block mb-1">Shipping Cost</label>
                <Input
                  type="number"
                  placeholder="0"
                  step="0.01"
                  value={formData.shipping_cost}
                  onChange={(e) => setFormData({ ...formData, shipping_cost: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>

              {/* Other Charges */}
              <div className="mb-3">
                <label className="text-sm font-medium block mb-1">Other Charges</label>
                <Input
                  type="number"
                  placeholder="0"
                  step="0.01"
                  value={formData.other_charges}
                  onChange={(e) => setFormData({ ...formData, other_charges: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Quantity */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="text-sm font-medium block mb-1">Quantity (ML)</label>
                <Input
                  type="number"
                  placeholder="100"
                  value={formData.quantity_ml}
                  onChange={(e) => setFormData({ ...formData, quantity_ml: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Unit</label>
                <Select
                  value={formData.quantity_unit}
                  onValueChange={(value: any) => setFormData({ ...formData, quantity_unit: value })}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ml">ML</SelectItem>
                    <SelectItem value="g">G</SelectItem>
                    <SelectItem value="oz">OZ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="text-sm font-medium block mb-1">Category *</label>
              <Select
                value={formData.category}
                onValueChange={(value: any) => setFormData({ ...formData, category: value })}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Men">Men</SelectItem>
                  <SelectItem value="Women">Women</SelectItem>
                  <SelectItem value="Unisex">Unisex</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Concentration */}
            <div>
              <label className="text-sm font-medium block mb-1">Concentration *</label>
              <Select
                value={formData.concentration}
                onValueChange={(value: any) => setFormData({ ...formData, concentration: value })}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select concentration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EDP">EDP (Eau de Parfum)</SelectItem>
                  <SelectItem value="EDT">EDT (Eau de Toilette)</SelectItem>
                  <SelectItem value="Parfum">Parfum</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Stock */}
            <div>
              <label className="text-sm font-medium block mb-1">Stock</label>
              <Input
                type="number"
                placeholder="0"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                disabled={isSubmitting}
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-sm font-medium block mb-1">Description</label>
              <textarea
                placeholder="Product description..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                rows={4}
              />
            </div>

            {/* Best Seller Flag */}
            <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
              <input
                type="checkbox"
                id="is_best_seller"
                checked={formData.is_best_seller}
                onChange={(e) => setFormData({ ...formData, is_best_seller: e.target.checked })}
                disabled={isSubmitting}
                className="w-4 h-4 rounded cursor-pointer"
              />
              <label htmlFor="is_best_seller" className="text-sm font-medium cursor-pointer flex items-center gap-1">
                ⭐ Best Seller
              </label>
            </div>

            {/* Luxury Product Flag */}
            <div className="flex items-center gap-2 p-2 bg-purple-50 border border-purple-200 rounded">
              <input
                type="checkbox"
                id="is_luxury_product"
                checked={formData.is_luxury_product}
                onChange={(e) => setFormData({ ...formData, is_luxury_product: e.target.checked })}
                disabled={isSubmitting}
                className="w-4 h-4 rounded cursor-pointer"
              />
              <label htmlFor="is_luxury_product" className="text-sm font-medium cursor-pointer flex items-center gap-1">
                💎 Luxury Product
              </label>
            </div>

            {/* Product Images */}
            <div className="border-t pt-3">
              <div className="mb-2">
                <label className="text-xs font-semibold block mb-2 uppercase tracking-wide text-muted-foreground">Images (Max 4)</label>
                
                {/* Image Upload Form */}
                <div className="space-y-2 mb-3 p-2 bg-muted/50 rounded">
                  <ImageUploadForm 
                    onAdd={handleAddImage}
                    disabled={isSubmitting || images.length >= 4}
                    productId={editingId}
                  />
                </div>

                {/* Images List */}
                {images.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground mb-1">
                      {images.length}/{4} images added
                    </p>
                    {images.map((image, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-1 p-1 bg-muted rounded border border-input text-xs"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-xs truncate font-medium">{image.altText}</p>
                          <p className="text-xs text-muted-foreground truncate">{image.imageUrl.substring(0, 40)}...</p>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant={image.isThumbnail ? "default" : "outline"}
                          onClick={() => handleSetThumbnail(index)}
                          disabled={isSubmitting}
                          className="text-xs h-6 px-2"
                        >
                          {image.isThumbnail ? "✓" : "Thumb"}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRemoveImage(index)}
                          disabled={isSubmitting}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Product Variants Management - Only when editing */}
            {editingId && (
              <div className="border-t pt-3">
                <label className="text-xs font-semibold block mb-2 uppercase tracking-wide text-muted-foreground">
                  Variants (ML / Size)
                </label>

                {/* Existing Variants List */}
                {variants.length > 0 && (
                  <div className="space-y-1 mb-3">
                    <p className="text-xs text-muted-foreground mb-2">{variants.length} variant(s)</p>
                    {variants.map((variant) => (
                      <div
                        key={variant.id}
                        className="flex items-center justify-between p-2 bg-muted rounded border border-input text-xs"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{variant.variant_name}</p>
                          <p className="text-muted-foreground">
                            ₹{variant.price} | Stock: {variant.stock}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedVariantForImages(variant.id);
                              // open file picker
                              if (fileInputRef.current) fileInputRef.current.click();
                            }}
                            className="h-6 px-2"
                          >
                            <Upload className="h-3 w-3" />
                          </Button>

                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteVariant(variant.id)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}

                    {/* Hidden file input for variant uploads */}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      ref={fileInputRef}
                      onChange={handleVariantFileChange}
                      style={{ display: 'none' }}
                    />

                    {/* Selected files preview & upload controls */}
                    {selectedVariantForImages !== null && (
                      <div className="mt-2 p-2 border border-input rounded bg-muted/50 text-xs">
                        <p className="mb-2 font-medium">Selected files for variant:</p>
                        {variantImageFiles.length === 0 ? (
                          <p className="text-muted-foreground">No files selected</p>
                        ) : (
                          <div className="space-y-1 mb-2">
                            {variantImageFiles.map((f, i) => (
                              <div key={i} className="flex items-center justify-between bg-white p-2 rounded">
                                <span className="truncate mr-2">{f.name}</span>
                                <span className="text-muted-foreground text-xs">{(f.size / 1024 / 1024).toFixed(2)} MB</span>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => {
                            if (selectedVariantForImages) handleUploadVariantImages(selectedVariantForImages);
                          }} disabled={isUploadingVariantImages}>
                            {isUploadingVariantImages ? 'Uploading...' : 'Upload to Variant'}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => { setVariantImageFiles([]); setSelectedVariantForImages(null); }}>
                            Clear
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Add New Variant Form */}
                <form onSubmit={handleAddVariant} className="space-y-2 p-2 bg-muted/30 rounded">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-medium block mb-1">Name</label>
                      <Input
                        type="text"
                        placeholder="e.g., 100ml"
                        value={newVariant.name}
                        onChange={(e) => setNewVariant({ ...newVariant, name: e.target.value })}
                        className="text-xs h-8"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium block mb-1">Value</label>
                      <Input
                        type="number"
                        placeholder="e.g., 100"
                        value={newVariant.value}
                        onChange={(e) => setNewVariant({ ...newVariant, value: e.target.value })}
                        className="text-xs h-8"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-medium block mb-1">Price</label>
                      <Input
                        type="number"
                        placeholder="₹"
                        step="0.01"
                        value={newVariant.price}
                        onChange={(e) => setNewVariant({ ...newVariant, price: e.target.value })}
                        className="text-xs h-8"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium block mb-1">Stock</label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={newVariant.stock}
                        onChange={(e) => setNewVariant({ ...newVariant, stock: e.target.value })}
                        className="text-xs h-8"
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    size="sm"
                    className="w-full text-xs h-8"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Variant
                  </Button>
                </form>
              </div>
            )}

            {/* Initial Reviews Section */}
            <div className="border-t pt-3">
              <label className="text-xs font-semibold block mb-2 uppercase tracking-wide text-muted-foreground">
                Initial Reviews (Minimum 2 Recommended)
              </label>

              {/* Existing Reviews List */}
              {initialReviews.length > 0 && (
                <div className="space-y-1 mb-3">
                  <p className="text-xs text-muted-foreground mb-2">{initialReviews.length} review(s)</p>
                  {initialReviews.map((review, index) => (
                    <div
                      key={index}
                      className="flex items-start justify-between p-2 bg-muted rounded border border-input text-xs"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{review.reviewer_name}</p>
                        <div className="flex items-center gap-1 my-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3 w-3 ${
                                i < review.rating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-muted-foreground line-clamp-2">{review.review_text}</p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRemoveReview(index)}
                        className="h-6 w-6 p-0 flex-shrink-0 ml-2"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add New Review Form */}
              {initialReviews.length < 10 && (
                <div className="p-2 bg-muted/30 rounded space-y-2">
                  <div>
                    <label className="text-xs font-medium block mb-1">Reviewer Name</label>
                    <Input
                      type="text"
                      placeholder="e.g., John Doe"
                      value={newReview.reviewer_name}
                      onChange={(e) => setNewReview({ ...newReview, reviewer_name: e.target.value })}
                      className="text-xs h-8"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1">Rating (1-5 stars)</label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="1"
                        max="5"
                        value={newReview.rating}
                        onChange={(e) => setNewReview({ ...newReview, rating: Math.min(5, Math.max(1, parseInt(e.target.value) || 1)) })}
                        className="text-xs h-8 w-16"
                      />
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 cursor-pointer ${
                              i < newReview.rating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
                            onClick={() => setNewReview({ ...newReview, rating: i + 1 })}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1">Review Text</label>
                    <textarea
                      placeholder="Write the review..."
                      value={newReview.review_text}
                      onChange={(e) => setNewReview({ ...newReview, review_text: e.target.value })}
                      className="w-full px-2 py-1 border border-input rounded text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                      rows={2}
                    />
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    className="w-full text-xs h-8"
                    onClick={handleAddReview}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Review
                  </Button>
                </div>
              )}
            </div>
            </form>
          </div>

          {/* Actions - Fixed at bottom */}
          <div className="flex gap-2 justify-end pt-4 border-t shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button form="productForm" type="submit" disabled={isSubmitting} className="gap-2">
                {isSubmitting && <Loader className="h-4 w-4 animate-spin" />}
                {editingId ? "Update Product" : "Add Product"}
              </Button>
            </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Image Upload Form Component
function ImageUploadForm({ 
  onAdd, 
  disabled,
  productId
}: { 
  onAdd: (imageUrl: string, altText: string) => void;
  disabled?: boolean;
  productId?: number | null;
}) {
  const [imageUrl, setImageUrl] = useState("");
  const [altText, setAltText] = useState("");
  const [uploadMethod, setUploadMethod] = useState<"url" | "file">("file");
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [currentProductId, setCurrentProductId] = useState<number | null | undefined>(productId);

  // Update local state when productId prop changes
  useEffect(() => {
    setCurrentProductId(productId);
  }, [productId]);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setFilePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleUploadFile = async () => {
    if (!selectedFile) {
      toast.error("Please select a file to upload");
      return;
    }

    // If we have a product ID, upload to Railway Storage immediately
    if (currentProductId) {
      setIsUploading(true);
      try {
        const form = new FormData();
        form.append("images", selectedFile);

        console.log("🚀 Uploading to Railway Storage - Product:", currentProductId, "File:", selectedFile.name);

        const response = await api.post(`/images/upload/${currentProductId}`, form, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        console.log("✅ Upload response:", response.data);

        const uploadedImages = response.data.data?.images || [];
        if (uploadedImages.length > 0) {
          const imageUrl = uploadedImages[0].image_url;
          console.log("✅ Image URL from Railway:", imageUrl);
          onAdd(imageUrl, altText || "Product image");
          toast.success("Image uploaded to Railway Storage successfully!");
        } else {
          throw new Error("No image URL returned from server");
        }
        
        setSelectedFile(null);
        setFilePreview(null);
        setAltText("");
      } catch (error: any) {
        console.error("❌ Upload error:", error.response?.data || error.message);
        const errorMsg = error.response?.data?.message || error.message || "Failed to upload image";
        toast.error(errorMsg);
      } finally {
        setIsUploading(false);
      }
    } else {
      // No product ID yet - upload temporarily to backend and return hosted URL
      setIsUploading(true);
      try {
        const form = new FormData();
        form.append('images', selectedFile);

        const response = await api.post('/images/upload-temp', form, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        const uploaded = response.data.data?.images || [];
        if (uploaded.length > 0) {
          const imageUrl = uploaded[0].image_url;
          onAdd(imageUrl, altText || 'Product image');
          toast.success('Image uploaded successfully (temporary).');
        } else {
          throw new Error('No image URL returned from server');
        }

        setSelectedFile(null);
        setFilePreview(null);
        setAltText('');
      } catch (error: any) {
        console.error('Temp upload error:', error.response?.data || error.message);
        toast.error(error.response?.data?.message || error.message || 'Failed to upload image');
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl.trim()) {
      toast.error("Please enter an image URL");
      return;
    }
    onAdd(imageUrl, altText);
    setImageUrl("");
    setAltText("");
  };

  return (
    <div className="space-y-2">
      {/* Upload Method Tabs - Now always enabled */}
      <div className="flex gap-1 border-b">
        <button
          type="button"
          onClick={() => setUploadMethod("file")}
          className={`px-2 py-1 text-xs font-medium transition-colors ${
            uploadMethod === "file"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          📁 File
        </button>
        <button
          type="button"
          onClick={() => setUploadMethod("url")}
          className={`px-2 py-1 text-xs font-medium transition-colors ${
            uploadMethod === "url"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          🔗 URL
        </button>
      </div>

      {/* File Upload Method */}
      {uploadMethod === "file" && (
        <div className="space-y-2">
          {/* Drag and Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            className={`relative border-2 border-dashed rounded-lg p-2 text-center transition-colors ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-input bg-muted/50 hover:border-primary/50"
            }`}
          >
            <input
              type="file"
              accept="image/*"
              onChange={handleFileInputChange}
              disabled={disabled}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              id="fileInput"
            />
            <label htmlFor="fileInput" className="cursor-pointer block">
              {filePreview ? (
                <div className="space-y-1">
                  <img
                    src={filePreview}
                    alt="Preview"
                    className="h-12 w-12 object-cover rounded mx-auto flex-shrink-0"
                  />
                  <p className="text-xs font-medium text-foreground line-clamp-1">
                    {selectedFile?.name}
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <Upload className="h-6 w-6 mx-auto text-muted-foreground" />
                  <p className="text-xs font-medium text-foreground">
                    Drag & drop or click
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Max 5MB
                  </p>
                </div>
              )}
            </label>
          </div>

          {/* Alt Text Input */}
          <div>
            <label className="text-xs font-medium block mb-1">Alt Text (optional)</label>
            <Input
              type="text"
              placeholder="e.g., Front view"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              disabled={disabled || !selectedFile}
              className="text-xs h-8"
            />
          </div>

          {/* Upload Button */}
          <Button
            type="button"
            onClick={handleUploadFile}
            disabled={disabled || !selectedFile || isUploading}
            className="w-full text-xs gap-1 h-8"
            size="sm"
          >
            {isUploading ? (
              <>
                <Loader className="h-3 w-3 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-3 w-3" />
                Upload
              </>
            )}
          </Button>

          {selectedFile && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedFile(null);
                setFilePreview(null);
              }}
              disabled={disabled}
              className="w-full text-xs h-8"
            >
              Clear
            </Button>
          )}
        </div>
      )}

      {/* URL Upload Method */}
      {uploadMethod === "url" && (
        <form onSubmit={handleUrlSubmit} className="space-y-2">
          <div>
            <label className="text-xs font-medium block mb-1">Image URL *</label>
            <Input
              type="url"
              placeholder="https://example.com/image.jpg"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              disabled={disabled}
              className="text-xs h-8"
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium block mb-1">Alt Text (optional)</label>
            <Input
              type="text"
              placeholder="e.g., Front view"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              disabled={disabled}
              className="text-xs h-8"
            />
          </div>

          <Button
            type="submit"
            disabled={disabled || !imageUrl.trim()}
            className="w-full text-xs gap-1 h-8"
            size="sm"
          >
            <Upload className="h-3 w-3" />
            Add Image
          </Button>
        </form>
      )}
    </div>
  );
}
