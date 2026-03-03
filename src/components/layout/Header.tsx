import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Menu, X, Heart, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/SearchBar";
import { AuthModal } from "@/components/auth/AuthModal";
import { ProfileMenu } from "@/components/auth/ProfileMenu";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/about", label: "About" },
];

function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const { toggleCart, totalItems } = useCart();
  const { items: wishlistItems } = useWishlist();
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-primary/10 bg-white/70 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 transition-all duration-300">
      <div className="container mx-auto px-4 flex h-20 items-center justify-between">

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>

        {/* Logo */}
        <Link
          to="/"
          className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
        >
          {/* Logo Icon */}
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-amber-600 to-amber-800 text-white font-bold text-lg">
            B
          </div>

          {/* Logo Text */}
          <motion.div
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex flex-col items-start"
          >
            <span className="font-display text-xl font-black tracking-tighter text-foreground leading-none group-hover:text-primary transition-colors duration-300">
              BHATKAR
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary/70 leading-relaxed">
              & CO. PERFUMERY
            </span>
          </motion.div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={cn(
                "text-[13px] uppercase tracking-[0.1em] font-bold transition-all duration-300 hover:text-primary relative group py-2",
                location.pathname === link.href
                  ? "text-primary px-2"
                  : "text-foreground/70 px-2"
              )}
            >
              {link.label}
              <motion.span
                layoutId="nav-underline"
                className={cn(
                  "absolute bottom-0 left-0 h-[2px] bg-primary rounded-full",
                  location.pathname === link.href ? "w-full" : "w-0 group-hover:w-full transition-all duration-300"
                )}
              />
            </Link>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center space-x-2">

          {/* Search + Wishlist + Profile */}
          <div className="flex items-center">
            <SearchBar attachRight />

            <Button
              variant="ghost"
              size="icon"
              className="hidden md:flex relative rounded-l-none border-l border-border"
              onClick={() => navigate("/wishlist")}
              aria-label="Wishlist"
            >
              <Heart className="h-5 w-5" />
              {wishlistItems.length > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-medium text-destructive-foreground"
                >
                  {wishlistItems.length}
                </motion.span>
              )}
            </Button>

            {/* Profile/Auth */}
            <div className="hidden md:flex relative">
              {isAuthenticated ? (
                <ProfileMenu />
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsAuthModalOpen(true)}
                  aria-label="Account"
                >
                  <User className="h-5 w-5" />
                </Button>
              )}

              {!isAuthenticated && isAuthModalOpen && (
                <AuthModal
                  isOpen={isAuthModalOpen}
                  onClose={() => setIsAuthModalOpen(false)}
                />
              )}
            </div>
          </div>

          {/* Cart Button */}
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={toggleCart}
            aria-label="Shopping cart"
          >
            <ShoppingBag className="h-5 w-5" />
            {totalItems > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground"
              >
                {totalItems}
              </motion.span>
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-border md:hidden overflow-hidden"
          >
            <nav className="container py-6 space-y-4">
              {navLinks.map((link, index) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    to={link.href}
                    className={cn(
                      "block text-lg font-medium hover:text-primary py-2",
                      location.pathname === link.href
                        ? "text-primary"
                        : "text-foreground"
                    )}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}

              <div className="flex items-center space-x-4 pt-4 border-t border-border">
                <SearchBar />

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    navigate("/wishlist");
                  }}
                  className="relative"
                >
                  <Heart className="h-5 w-5" />
                  {wishlistItems.length > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-medium text-destructive-foreground">
                      {wishlistItems.length}
                    </span>
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsAuthModalOpen(true)}
                >
                  <User className="h-5 w-5" />
                </Button>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

export default Header;
export { Header };
