import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Filter, SlidersHorizontal, X, Search, RefreshCw } from "lucide-react";
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
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";
import { useProducts } from "@/contexts/ProductContext";
import { WeekendSaleHero } from "@/components/WeekendSaleHero";

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

  const { products, loading: productsLoading, refreshProducts } = useProducts();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedLongevity, setSelectedLongevity] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 6000]);
  const [sortBy, setSortBy] = useState("popularity");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Manual refresh function
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshProducts();
      toast.success("Products refreshed successfully");
    } catch (error: any) {
      toast.error("Failed to refresh products");
    } finally {
      setIsRefreshing(false);
    }
  };

  const filteredProducts = useMemo(() => {
    // Rely exclusively on global context products
    let result = [...products];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name?.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query) ||
          p.brand?.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (selectedCategories.length > 0) {
      result = result.filter((p) =>
        selectedCategories.includes(p.category?.toLowerCase() || '')
      );
    }

    // Fragrance Type filter
    if (selectedTypes.length > 0) {
      result = result.filter((p) =>
        selectedTypes.some(type => 
          p.description?.toLowerCase().includes(type) || 
          p.name?.toLowerCase().includes(type)
        )
      );
    }

    // Longevity filter
    if (selectedLongevity.length > 0) {
      result = result.filter((p) =>
        selectedLongevity.some(longevity => 
          p.description?.toLowerCase().includes(longevity) || 
          p.name?.toLowerCase().includes(longevity)
        )
      );
    }

    // Price filter
    result = result.filter(
      (p) => p.price >= priceRange[0] && p.price <= priceRange[1]
    );

    // Sort
    switch (sortBy) {
      case "price-asc":
        result.sort((a: any, b: any) => a.price - b.price);
        break;
      case "price-desc":
        result.sort((a: any, b: any) => b.price - a.price);
        break;
      case "newest":
        result.sort((a: any, b: any) => b.id - a.id);
        break;
      case "popularity":
      default:
        result.sort((a: any, b: any) => b.id - a.id);
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
    products
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
    (searchQuery ? 1 : 0) +
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
      <WeekendSaleHero />

      <section className="py-12">
        <div className="container px-4">
          {/* Search Bar - Full width on mobile, partial on desktop */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, notes, brand..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {searchQuery && (
              <p className="text-sm text-muted-foreground mt-2">
                Found {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} matching "{searchQuery}"
              </p>
            )}
          </div>

          {/* Toolbar - Controls */}
          <div className="flex flex-col md:flex-row gap-3 mb-8 items-start md:items-center justify-between">
            <div className="flex gap-3 items-center w-full md:w-auto">
              {/* Refresh Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </Button>

              {/* Mobile Filter Button */}
              <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="lg:hidden gap-2">
                    <Filter className="h-4 w-4" />
                    Filters
                    {activeFiltersCount > 0 && (
                      <span className="px-2 py-0.5 bg-primary text-primary-foreground rounded-full text-xs">
                        {activeFiltersCount}
                      </span>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[85vw] sm:w-80 overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle className="font-display">Filters</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <FilterContent />
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Sort - Full width on mobile */}
            <div className="w-full md:w-auto">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
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
            </div>

            {/* Results Count */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>
                {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
              </span>
              {productsLoading && (
                <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
              )}
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
              {productsLoading && filteredProducts.length === 0 ? (
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-card rounded-lg overflow-hidden shadow-soft animate-pulse">
                      <div className="aspect-[3/4] bg-secondary" />
                      <div className="p-4 space-y-3">
                        <div className="h-4 bg-secondary rounded w-1/3" />
                        <div className="h-6 bg-secondary rounded w-3/4" />
                        <div className="h-4 bg-secondary rounded w-1/2" />
                        <div className="h-8 bg-secondary rounded w-full mt-4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredProducts.length === 0 ? (
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
                      product={product as any}
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
