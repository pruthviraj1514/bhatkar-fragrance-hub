import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import ProductImageUploader from "@/components/products/ProductImageUploader";
import api from "@/lib/axios";
import { toast } from "sonner";

interface Product {
  id: number;
  name: string;
  brand: string;
  price: number;
  category: string;
  stock: number;
}

interface ProductImage {
  id: number;
  image_url: string;
  image_format: string;
  alt_text: string;
  image_order: number;
  is_thumbnail: boolean;
}

export default function AdminProductImageManager() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await api.get(`/products/${id}`);
        setProduct(response.data.data);

        // Fetch images
        const imagesResponse = await api.get(`/products/${id}/with-images`);
        setImages(imagesResponse.data.data.images || []);
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Failed to load product");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProduct();
  }, [id]);

  const handleImageUploadComplete = (uploadedImages: ProductImage[]) => {
    setImages([...images, ...uploadedImages]);
  };

  const handleDeleteImage = async (imageId: number) => {
    try {
      setDeleting(imageId);
      await api.delete(`/images/${id}/${imageId}`);
      setImages(images.filter(img => img.id !== imageId));
      toast.success("Image deleted successfully");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete image");
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container py-12 px-4">
          <div className="text-center">Loading...</div>
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="container py-12 px-4">
          <div className="text-center">Product not found</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-gray-50 py-4 mb-8">
        <div className="container px-4">
          <a href="/admin" className="flex items-center gap-2 text-orange-600 hover:text-orange-700 mb-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Admin
          </a>
          <h1 className="text-2xl font-bold">Manage Product Images</h1>
        </div>
      </div>

      <section className="py-8">
        <div className="container px-4">
          {/* Product Info */}
          <div className="bg-white rounded-lg p-6 mb-8 border">
            <h2 className="text-xl font-semibold mb-2">{product.name}</h2>
            <p className="text-gray-600">{product.brand} • {product.category}</p>
            <p className="text-orange-600 font-semibold mt-2">${product.price}</p>
          </div>

          {/* Upload Section */}
          <div className="bg-white rounded-lg p-6 mb-8 border">
            <h3 className="text-lg font-semibold mb-4">Upload Images</h3>
            <ProductImageUploader 
              productId={parseInt(id!)} 
              onImagesUploaded={handleImageUploadComplete}
            />
          </div>

          {/* Current Images */}
          {images.length > 0 && (
            <div className="bg-white rounded-lg p-6 border">
              <h3 className="text-lg font-semibold mb-4">
                Current Images ({images.length}/4)
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {images
                  .sort((a, b) => a.image_order - b.image_order)
                  .map((image) => (
                    <div key={image.id} className="border rounded-lg overflow-hidden">
                      <img
                        src={image.image_url}
                        alt={image.alt_text}
                        className="w-full h-40 object-cover"
                      />
                      <div className="p-3 bg-gray-50">
                        <p className="text-sm font-medium truncate">{image.alt_text}</p>
                        <p className="text-xs text-gray-600">
                          Order: {image.image_order} • {image.image_format.toUpperCase()}
                        </p>
                        {image.is_thumbnail && (
                          <p className="text-xs text-orange-600 font-semibold">★ Thumbnail</p>
                        )}
                        <button
                          onClick={() => handleDeleteImage(image.id)}
                          disabled={deleting === image.id}
                          className="mt-2 w-full bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white text-xs py-1 rounded transition-colors"
                        >
                          {deleting === image.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {images.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-600">No images uploaded yet</p>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
