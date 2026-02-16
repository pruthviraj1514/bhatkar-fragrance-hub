/**
 * ISSUE 3: SEARCH BAR MOBILE RESPONSIVENESS FIX
 * =============================================
 * Problems:
 * - Dropdown overlapping navbar on mobile
 * - Poor positioning on smaller screens
 * - Not accounting for container relative positioning
 * 
 * Solution:
 * - Responsive width and positioning
 * - Proper z-index management
 * - Mobile-friendly dropdown animation
 * - Correct alignment under search input
 */

import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search as SearchIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getProductImage } from "@/lib/imageUtils";
import { products } from "@/data/products";
import { formatPrice } from "@/lib/utils";

export function SearchBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<typeof products>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter products based on search query
  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = products.filter((product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.fragranceType?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setResults(filtered);
    } else {
      setResults([]);
    }
  }, [searchQuery]);

  // Handle click outside - close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Close search on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen]);

  return (
    <div 
      ref={containerRef} 
      className="relative w-full md:w-auto flex items-center"
    >
      {/* ===== MOBILE SEARCH ICON BUTTON ===== */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden flex-shrink-0"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Search products"
        aria-expanded={isOpen}
      >
        <SearchIcon className="h-5 w-5" />
      </Button>

      {/* ===== MOBILE FULL-WIDTH SEARCH PANEL ===== */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="fixed md:hidden top-16 left-0 right-0 z-[100] bg-background border-b border-border shadow-lg"
          >
            {/* Search Input Row */}
            <div className="px-4 py-4 flex items-center gap-2">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search perfumes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsOpen(true)}
                  aria-label="Search products"
                  className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setResults([]);
                      inputRef.current?.focus();
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setIsOpen(false);
                  setSearchQuery("");
                  setResults([]);
                }}
                aria-label="Close search"
                className="flex-shrink-0"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Search Results Dropdown - Mobile */}
            {searchQuery && (
              <div 
                className="max-h-[calc(100vh-180px)] overflow-y-auto bg-background border-t border-border"
              >
                {results.length > 0 ? (
                  <div className="divide-y divide-border">
                    {results.map((product) => (
                      <Link
                        key={product.id}
                        to={`/product/${product.id}`}
                        onClick={() => {
                          setIsOpen(false);
                          setSearchQuery("");
                        }}
                        className="block p-3 sm:p-4 hover:bg-accent transition-colors active:bg-accent/80 last:border-b-0"
                      >
                        <div className="flex gap-3 sm:gap-4">
                          <img
                            src={getProductImage(product.images?.[0])}
                            alt={product.name}
                            onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
                            className="h-14 w-14 sm:h-16 sm:w-16 rounded object-cover flex-shrink-0 bg-muted"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm mb-1 truncate">
                              {product.name}
                            </h4>
                            <p className="text-xs text-muted-foreground mb-2 truncate">
                              {product.category} • {product.fragranceType}
                            </p>
                            <p className="font-semibold text-primary text-sm">
                              {formatPrice(product.price)}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-muted-foreground text-sm">
                    No perfumes found. Try another search.
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== DESKTOP SEARCH BAR ===== */}
      <div className="hidden md:flex items-center relative w-full md:w-auto">
        <div className={`relative transition-all duration-300 ease-out ${isOpen ? "w-[400px]" : "w-12"}`}>
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search perfumes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsOpen(true)}
            aria-label="Search products"
            className="w-full pl-10 pr-10 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                setResults([]);
                inputRef.current?.focus();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 z-10"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Desktop Dropdown - Positioned Absolutely Inside Container */}
        <AnimatePresence>
          {isOpen && searchQuery && (
            <motion.div
              ref={dropdownRef}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full left-0 right-0 w-full min-w-[400px] mt-2 bg-background border border-border rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto"
            >
              {results.length > 0 ? (
                <div className="divide-y divide-border">
                  {results.map((product) => (
                    <Link
                      key={product.id}
                      to={`/product/${product.id}`}
                      onClick={() => {
                        setIsOpen(false);
                        setSearchQuery("");
                      }}
                      className="block p-4 hover:bg-accent transition-colors active:bg-accent/80 last:border-b-0"
                    >
                      <div className="flex gap-4">
                        <img
                          src={getProductImage(product.images?.[0])}
                          alt={product.name}
                          onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
                          className="h-16 w-16 rounded object-cover flex-shrink-0 bg-muted"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm mb-1 truncate">
                            {product.name}
                          </h4>
                          <p className="text-xs text-muted-foreground mb-2 truncate">
                            {product.category} • {product.fragranceType}
                          </p>
                          <p className="font-semibold text-primary text-sm">
                            {formatPrice(product.price)}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-muted-foreground">
                  No perfumes found. Try another search.
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/**
 * KEY RESPONSIVE FIXES:
 * 
 * 1. MOBILE SEARCH
 *    - Fixed positioning at top of viewport
 *    - Full width panel
 *    - z-[100] to stay above navbar
 *    - max-h-[calc(100vh-180px)] for scroll
 *    - Results dropdown integrated (no separate dropdown)
 * 
 * 2. DESKTOP SEARCH
 *    - Expandable width: w-12 (icon) → w-[400px] (search)
 *    - absolute top-full positioning inside container
 *    - min-w-[400px] ensures dropdown doesn't shrink
 *    - max-h-96 overflow-y-auto for long results
 * 
 * 3. IMAGE HANDLING
 *    - Uses getProductImage() helper from imageUtils
 *    - Fallback to /placeholder.svg on error
 *    - onError handler prevents [object Object] bugs
 * 
 * 4. ACCESSIBILITY
 *    - aria-label on buttons
 *    - aria-expanded on toggle
 *    - Keyboard support (Escape to close)
 *    - Focus management (auto-focus input)
 *    - Click outside handling
 * 
 * 5. ANIMATIONS
 *    - Smooth fade + slide on mobile
 *    - Quick transition on width expand/collapse
 *    - Hardware-accelerated framer-motion
 */
