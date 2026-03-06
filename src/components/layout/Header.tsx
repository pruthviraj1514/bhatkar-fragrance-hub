import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Menu, X, Heart, User, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthModal } from "@/components/auth/AuthModal";
import { ProfileMenu } from "@/components/auth/ProfileMenu";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import ThemeToggle from "@/components/ui/ThemeToggle";

// ✅ Import Logo
import logo from "@/assets/Bhatkarlogo.png";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/about", label: "About" },
  { href: "/orders", label: "Orders" },
];

// Animation variants for smooth transitions
const containerVariants = {
  hidden: { opacity: 0, height: 0 },
  visible: {
    opacity: 1,
    height: "auto",
    transition: { duration: 0.3, ease: "easeInOut" }
  },
  exit: {
    opacity: 0,
    height: 0,
    transition: { duration: 0.2, ease: "easeInOut" }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.08, duration: 0.3 }
  })
};

function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const { toggleCart, totalItems } = useCart();
  const { items: wishlistItems } = useWishlist();
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <>
      {/* Main Header - Google Inspired Design */}
      <header className="sticky top-0 z-50 w-full bg-white/95 dark:bg-slate-950/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/90 dark:supports-[backdrop-filter]:bg-slate-950/90 border-b border-gray-200 dark:border-slate-800/50 transition-all duration-300 shadow-sm">
        
        {/* Header Container */}
        <div className="mx-auto w-full px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex h-16 md:h-20 items-center justify-between gap-3 md:gap-6">

            {/* Left Section: Menu Button & Logo */}
            <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
              {/* Mobile Menu Toggle */}
              <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden h-10 w-10 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800/70 rounded-full transition-all duration-200"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  aria-label="Toggle navigation menu"
                >
                  {isMobileMenuOpen ? (
                    <X className="h-5 w-5" />
                  ) : (
                    <Menu className="h-5 w-5" />
                  )}
                </Button>
              </motion.div>

              {/* Brand Logo & Name */}
              <Link
                to="/"
                className="flex items-center gap-2 md:gap-3 hover:opacity-80 transition-opacity duration-200"
              >
                <img
                  src={logo}
                  alt="Bhatkar Perfumery Logo"
                  className="h-9 md:h-11 w-auto object-contain flex-shrink-0"
                />
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="hidden sm:flex flex-col items-start leading-tight"
                >
                  <span className="font-black text-base md:text-lg text-foreground tracking-tight">
                    BHATKAR
                  </span>
                  <span className="text-[8px] md:text-[9px] font-bold uppercase tracking-wider text-primary/60">
                    Perfumery
                  </span>
                </motion.div>
              </Link>
            </div>

            {/* Center: Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.href;
                return (
                  <motion.div key={link.href} whileHover={{ y: -1 }} whileTap={{ y: 0 }}>
                    <Link
                      to={link.href}
                      className={cn(
                        "text-sm font-medium px-3.5 py-2 rounded-lg transition-all duration-200 relative group",
                        isActive
                          ? "text-primary font-semibold"
                          : "text-gray-700 dark:text-gray-300 hover:text-foreground hover:bg-gray-50 dark:hover:bg-slate-800/50"
                      )}
                    >
                      {link.label}
                      {isActive && (
                        <motion.div
                          layoutId="navbar-indicator"
                          className="absolute bottom-1 left-3.5 right-3.5 h-1 bg-primary rounded-full"
                          initial={false}
                          transition={{ type: "spring", stiffness: 350, damping: 30 }}
                        />
                      )}
                    </Link>
                  </motion.div>
                );
              })}
            </nav>

            {/* Right Section: Actions & Icons */}
            <div className="flex items-center gap-1 md:gap-2 ml-auto">

              {/* Search Button - Desktop */}
              <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }} className="hidden lg:block">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 text-gray-600 dark:text-gray-400 hover:text-foreground hover:bg-gray-100 dark:hover:bg-slate-800/70 rounded-full transition-all duration-200"
                  aria-label="Search products"
                >
                  <Search className="h-5 w-5" />
                </Button>
              </motion.div>

              {/* Desktop: Theme + Wishlist + Auth/Profile */}
              <div className="hidden md:flex items-center gap-1">
                {/* Theme Toggle */}
                <ThemeToggle />

                {/* Wishlist Button */}
                <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 text-gray-600 dark:text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-full relative transition-all duration-200"
                    onClick={() => navigate("/wishlist")}
                    aria-label="View wishlist"
                  >
                    <Heart className="h-5 w-5" />
                    {wishlistItems.length > 0 && (
                      <motion.span
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 300 }}
                        className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-semibold text-white shadow-sm"
                      >
                        {wishlistItems.length > 99 ? "99+" : wishlistItems.length}
                      </motion.span>
                    )}
                  </Button>
                </motion.div>

                {/* Auth/Profile Button */}
                {isAuthenticated ? (
                  <motion.div whileHover={{ scale: 1.05 }}>
                    <ProfileMenu />
                  </motion.div>
                ) : (
                  <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 text-gray-600 dark:text-gray-400 hover:text-foreground hover:bg-gray-100 dark:hover:bg-slate-800/70 rounded-full transition-all duration-200"
                      onClick={() => setIsAuthModalOpen(true)}
                      aria-label="Sign in to your account"
                    >
                      <User className="h-5 w-5" />
                    </Button>
                  </motion.div>
                )}
              </div>

              {/* Mobile: Profile Button */}
              <div className="md:hidden">
                {isAuthenticated ? (
                  <ProfileMenu />
                ) : (
                  <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800/70 rounded-full relative transition-all duration-200"
                      onClick={() => setIsAuthModalOpen(true)}
                      aria-label="Sign in"
                    >
                      <User className="h-5 w-5" />
                      {isAuthenticated && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5 rounded-full bg-green-500"
                        />
                      )}
                    </Button>
                  </motion.div>
                )}
              </div>

              {/* Auth Modal */}
              {!isAuthenticated && isAuthModalOpen && (
                <AuthModal
                  isOpen={isAuthModalOpen}
                  onClose={() => setIsAuthModalOpen(false)}
                />
              )}

              {/* Shopping Cart */}
              <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 text-gray-600 dark:text-gray-400 hover:text-primary hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-full relative transition-all duration-200"
                  onClick={toggleCart}
                  aria-label="Open shopping cart"
                >
                  <ShoppingBag className="h-5 w-5" />
                  {totalItems > 0 && (
                    <motion.span
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 300 }}
                      className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white shadow-sm"
                    >
                      {totalItems > 99 ? "99+" : totalItems}
                    </motion.span>
                  )}
                </Button>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="md:hidden border-t border-gray-200 dark:border-slate-800/50 bg-gray-50/50 dark:bg-slate-900/30 backdrop-blur-sm overflow-hidden"
            >
              <div className="mx-auto w-full px-3 sm:px-4 py-4 space-y-2">
                
                {/* Mobile Navigation Links */}
                {navLinks.map((link, index) => {
                  const isActive = location.pathname === link.href;
                  return (
                    <motion.div
                      key={link.href}
                      custom={index}
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      <Link
                        to={link.href}
                        className={cn(
                          "block px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                          isActive
                            ? "text-primary bg-blue-50 dark:bg-blue-950/20 font-semibold"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800/50"
                        )}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {link.label}
                      </Link>
                    </motion.div>
                  );
                })}

                {/* Mobile Wishlist Link */}
                {location.pathname !== "/wishlist" && (
                  <motion.div
                    custom={navLinks.length}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <button
                      className="w-full text-left px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800/50 rounded-lg transition-all duration-200 flex items-center gap-2"
                      onClick={() => {
                        navigate("/wishlist");
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      <Heart className="h-4 w-4" />
                      <span>Wishlist</span>
                      {wishlistItems.length > 0 && (
                        <span className="ml-auto text-xs bg-red-500 text-white px-2 py-0.5 rounded-full font-semibold">
                          {wishlistItems.length}
                        </span>
                      )}
                    </button>
                  </motion.div>
                )}

                {/* Divider */}
                <div className="my-3 h-px bg-gray-200 dark:bg-slate-800/50" />

                {/* Mobile Footer Actions */}
                <div className="flex items-center gap-2 pt-2">
                  <ThemeToggle />
                  {isAuthenticated ? (
                    <ProfileMenu />
                  ) : (
                    <Button
                      variant="default"
                      className="flex-1 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg"
                      onClick={() => {
                        setIsAuthModalOpen(true);
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      <User className="h-4 w-4 mr-2" />
                      Sign In
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}

export default Header;
export { Header };