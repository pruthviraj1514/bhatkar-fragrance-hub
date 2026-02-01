import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { User, LogOut, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export function ProfileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const { user } = useAuth(); // ❗ logout not yet in context

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 🔐 TEMP LOGOUT (until we add it to AuthContext properly)
  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.reload(); // simple + safe for now
  };

  if (!user) return null;

  // ✅ Safe initials
  const initials =
    (user.firstname?.charAt(0) ?? "") +
    (user.lastname?.charAt(0) ?? "");

  const fullName = `${user.firstname} ${user.lastname}`;

  return (
    <div ref={menuRef} className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
        aria-label="Profile menu"
      >
        <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
          {initials.toUpperCase()}
        </div>
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-56 bg-background border border-border rounded-lg shadow-xl z-50"
          >
            {/* User Info */}
            <div className="px-4 py-3 border-b border-border bg-muted/50">
              <p className="text-sm font-semibold text-foreground">
                {fullName}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user.email}
              </p>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              <Link
                to="/account"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
              >
                <User className="h-4 w-4" />
                Account Details
              </Link>

              <Link
                to="/orders"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
              >
                <FileText className="h-4 w-4" />
                My Orders
              </Link>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors border-t border-border mt-2"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
