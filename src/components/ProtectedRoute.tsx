import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "customer";
}

/**
 * ProtectedRoute Component
 * Protects routes by checking authentication and role
 */
export default function ProtectedRoute({ 
  children, 
  requiredRole = "customer" 
}: ProtectedRouteProps) {
  const { isAuthenticated, role } = useAuth();

  // Not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Authenticated but wrong role
  if (requiredRole === "admin" && role !== "admin") {
    return <Navigate to="/" replace />;
  }

  // All checks passed
  return <>{children}</>;
}
