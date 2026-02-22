import { createContext, useContext, useState, useEffect } from "react";
import api from "@/lib/axios";

interface User {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
}

interface AdminUser {
  id: number;
  email: string;
}

interface LoginPayload {
  email: string;
  password: string;
}

interface SignupPayload {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
}

type UserRole = "admin" | "customer";

interface AuthContextType {
  user: User | null;
  admin: AdminUser | null;
  token: string | null;
  isAuthenticated: boolean;
  role: UserRole | null;
  isAdmin: boolean;
  isLoading: boolean;
  error: string | null;
  login: (data: LoginPayload) => Promise<void>;
  adminLogin: (data: LoginPayload) => Promise<void>;
  signup: (data: SignupPayload) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedAdminToken = localStorage.getItem("adminToken");
    const storedRole = localStorage.getItem("role") as UserRole | null;

    if (storedAdminToken) {
      setToken(storedAdminToken);
      setRole("admin");
      const storedAdmin = localStorage.getItem("admin");
      if (storedAdmin) {
        setAdmin(JSON.parse(storedAdmin));
      }
    } else if (storedToken) {
      setToken(storedToken);
      setRole("customer");
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    }
  }, []);

  // Clear error function
  const clearError = () => setError(null);

  // ✅ derived auth state
  const isAuthenticated = !!user || !!admin;
  const isAdmin = role === "admin";

  // 🔐 CUSTOMER LOGIN
  const login = async (data: LoginPayload) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.post("/auth/signin", data);
      const { token, id, firstname, lastname, email } = res.data.data;

      const userData = { id, firstname, lastname, email };
      localStorage.setItem("token", token);
      localStorage.setItem("role", "customer");
      localStorage.setItem("user", JSON.stringify(userData));
      
      setToken(token);
      setUser(userData);
      setRole("customer");
      setAdmin(null);
    } catch (err: any) {
      // Handle specific error messages
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error || 
                          "Login failed. Please check your credentials.";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // 🔐 ADMIN LOGIN
  const adminLogin = async (data: LoginPayload) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.post("/admin/login", data);
      const { token } = res.data.data;
      const adminData = res.data.data.admin;

      localStorage.setItem("adminToken", token);
      localStorage.setItem("role", "admin");
      localStorage.setItem("admin", JSON.stringify(adminData));
      
      setToken(token);
      setAdmin(adminData);
      setRole("admin");
      setUser(null);
    } catch (err: any) {
      // Handle specific error messages
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error || 
                          "Admin login failed. Please check your credentials.";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // 📝 SIGNUP
  const signup = async (data: SignupPayload) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.post("/auth/signup", data);
      const { token, id, firstname, lastname, email } = res.data.data;

      const userData = { id, firstname, lastname, email };
      localStorage.setItem("token", token);
      localStorage.setItem("role", "customer");
      localStorage.setItem("user", JSON.stringify(userData));
      
      setToken(token);
      setUser(userData);
      setRole("customer");
      setAdmin(null);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error || 
                          "Signup failed. Please try again.";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // 🚪 LOGOUT
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("adminToken");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    localStorage.removeItem("admin");
    
    setUser(null);
    setAdmin(null);
    setToken(null);
    setRole(null);
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{ 
        user, 
        admin, 
        token, 
        isAuthenticated, 
        role, 
        isAdmin,
        isLoading,
        error,
        login, 
        adminLogin, 
        signup, 
        logout,
        clearError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}
