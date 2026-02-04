import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Filter, SlidersHorizontal, X, Search } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { ProductCard } from "@/components/products/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { products } from "@/data/products";
import { formatPrice } from "@/lib/utils";
import api from "@/lib/axios";
import { toast } from "sonner";

interface DatabaseProduct {
  id: number;
  name: string;
  brand: string;
  price: number;
  category: string;
  concentration: string;
  description: string;
  stock: number;
  images: Array<{
    id: number;
    image_url: string;
    alt_text: string;
    image_order: number;
    is_thumbnail: boolean;
  }>;
}

const categories = [
  { value: "men", label: "Men" },
  { value: "women", label: "Women" },
  { value: "unisex", label: "Unisex" },
];

const fragranceTypes = [
  { value: "woody", label: "Woody" },
  { value: "floral", label: "Floral" },
  { value: "citrus", label: "Citrus" },
  { value: "oriental", label: "Oriental" },
  { value: "fresh", label: "Fresh" },
  { value: "spicy", label: "Spicy" },
];

const longevityOptions = [
  { value: "light", label: "Light (2-4 hours)" },
  { value: "moderate", label: "Moderate (4-6 hours)" },
  { value: "long-lasting", label: "Long-lasting (6-8 hours)" },
  { value: "intense", label: "Intense (8+ hours)" },
];

const sortOptions = [
  { value: "popularity", label: "Popularity" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "newest", label: "Newest" },
  { value: "rating", label: "Highest Rated" },
];

export default function Shop() {
  const [searchParams] = useSearchParams();
  const collectionParam = searchParams.get("collection");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedLongevity, setSelectedLongevity] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 6000]);
  const [sortBy, setSortBy] = useState("popularity");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [dbProducts, setDbProducts] = useState<DatabaseProduct[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch products from database with images
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await api.get('/products/with-images/all');
        setDbProducts(response.data.data || []);
        if (response.data.data && response.data.data.length > 0) {
          toast.success(`Loaded ${response.data.data.length} products`);
        }
      } catch (error: any) {
        console.error('Failed to fetch products:', error);
        console.error('Error details:', error.response?.status, error.response?.data);
        toast.error(error.response?.data?.message || 'Failed to load products from database');
        // Fall back to static products if API fails
        setDbProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    // Use database products if available, otherwise fall back to static products
    let sourceProducts = dbProducts.length > 0 ? dbProducts : products;
    let result = [...sourceProducts];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.brand.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (selectedCategories.length > 0) {
      result = result.filter((p) => 
        selectedCategories.includes(p.category.toLowerCase())
      );
    }

    // Price filter
    result = result.filter(
      (p) => p.price >= priceRange[0] && p.price <= priceRange[1]
    );

    // Sort
    switch (sortBy) {
      case "price-asc":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        result.sort((a, b) => b.price - a.price);
        break;
      case "newest":
        result.sort((a, b) => b.id - a.id);
        break;
      case "popularity":
      default:
        result.sort((a, b) => b.id - a.id);
    }

    return result;
  }, [
    searchQuery,
    selectedCategories,
    selectedTypes,
    selectedLongevity,
    priceRange,
    sortBy,
    collectionParam,
    dbProducts
  ]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategories([]);
    setSelectedTypes([]);
    setSelectedLongevity([]);
    setPriceRange([0, 6000]);
    setSortBy("popularity");
  };

  const activeFiltersCount =
    selectedCategories.length +
    selectedTypes.length +
    selectedLongevity.length +
    (priceRange[0] > 0 || priceRange[1] < 6000 ? 1 : 0);

  const FilterContent = () => (
    <div className="space-y-8">
      {/* Category */}
      <div>
        <Label className="text-base font-semibold mb-4 block">Category</Label>
        <div className="space-y-3">
          {categories.map((category) => (
            <div key={category.value} className="flex items-center space-x-2">
              <Checkbox
                id={`category-${category.value}`}
                checked={selectedCategories.includes(category.value)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedCategories([...selectedCategories, category.value]);
                  } else {
                    setSelectedCategories(
                      selectedCategories.filter((c) => c !== category.value)
                    );
                  }
                }}
              />
              <label
                htmlFor={`category-${category.value}`}
                className="text-sm cursor-pointer"
              >
                {category.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Fragrance Type */}
      <div>
        <Label className="text-base font-semibold mb-4 block">
          Fragrance Type
        </Label>
        <div className="space-y-3">
          {fragranceTypes.map((type) => (
            <div key={type.value} className="flex items-center space-x-2">
              <Checkbox
                id={`type-${type.value}`}
                checked={selectedTypes.includes(type.value)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedTypes([...selectedTypes, type.value]);
                  } else {
                    setSelectedTypes(
                      selectedTypes.filter((t) => t !== type.value)
                    );
                  }
                }}
              />
              <label
                htmlFor={`type-${type.value}`}
                className="text-sm cursor-pointer"
              >
                {type.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <Label className="text-base font-semibold mb-4 block">Price Range</Label>
        <div className="px-2">
          <Slider
            value={priceRange}
            onValueChange={(value) => setPriceRange(value as [number, number])}
            min={0}
            max={6000}
            step={100}
            className="mb-4"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{formatPrice(priceRange[0])}</span>
            <span>{formatPrice(priceRange[1])}</span>
          </div>
        </div>
      </div>

      {/* Longevity */}
      <div>
        <Label className="text-base font-semibold mb-4 block">Longevity</Label>
        <div className="space-y-3">
          {longevityOptions.map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <Checkbox
                id={`longevity-${option.value}`}
                checked={selectedLongevity.includes(option.value)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedLongevity([...selectedLongevity, option.value]);
                  } else {
                    setSelectedLongevity(
                      selectedLongevity.filter((l) => l !== option.value)
                    );
                  }
                }}
              />
              <label
                htmlFor={`longevity-${option.value}`}
                className="text-sm cursor-pointer"
              >
                {option.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Clear Filters */}
      {activeFiltersCount > 0 && (
        <Button
          variant="outline"
          className="w-full"
          onClick={clearFilters}
        >
          <X className="h-4 w-4 mr-2" />
          Clear All Filters
        </Button>
      )}
    </div>
  );

  return (
    <Layout>
      {/* Hero */}
      <section className="bg-secondary/30 py-16">
        <div className="container px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
              {collectionParam
                ? collectionParam
                    .split("-")
                    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(" ")
                : "All Fragrances"}
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Explore our exquisite collection of handcrafted perfumes
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-12">
        <div className="container px-4">
          {/* Toolbar */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex gap-3 items-center">
              {/* Mobile Filter Button */}
              <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="lg:hidden">
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                    {activeFiltersCount > 0 && (
                      <span className="ml-2 px-2 py-0.5 bg-primary text-primary-foreground rounded-full text-xs">
                        {activeFiltersCount}
                      </span>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle className="font-display">Filters</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <FilterContent />
                  </div>
                </SheetContent>
              </Sheet>

              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Results Count */}
              <span className="text-sm text-muted-foreground hidden md:block">
                {filteredProducts.length} products
              </span>
            </div>
          </div>

          <div className="flex gap-8">
            {/* Desktop Filters */}
            <aside className="hidden lg:block w-64 shrink-0">
              <div className="sticky top-24">
                <h2 className="font-display text-xl font-semibold mb-6 flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filters
                </h2>
                <FilterContent />
              </div>
            </aside>

            {/* Products Grid */}
            <div className="flex-1">
              {filteredProducts.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-muted-foreground text-lg mb-4">
                    No products found matching your criteria
                  </p>
                  <Button variant="outline" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredProducts.map((product, index) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      index={index}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
