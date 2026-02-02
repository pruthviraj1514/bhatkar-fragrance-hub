import { createContext, useContext, useState, useEffect } from "react";
import api from "@/lib/axios";

interface User {
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
  login: (data: LoginPayload) => Promise<void>;
  adminLogin: (data: LoginPayload) => Promise<void>;
  signup: (data: SignupPayload) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);

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

  // ✅ derived auth state
  const isAuthenticated = !!user || !!admin;
  const isAdmin = role === "admin";

  // 🔐 CUSTOMER LOGIN
  const login = async (data: LoginPayload) => {
    const res = await api.post("/auth/signin", data);
    const { token, firstname, lastname, email } = res.data.data;

    const userData = { firstname, lastname, email };
    localStorage.setItem("token", token);
    localStorage.setItem("role", "customer");
    localStorage.setItem("user", JSON.stringify(userData));
    
    setToken(token);
    setUser(userData);
    setRole("customer");
    setAdmin(null);
  };

  // 🔐 ADMIN LOGIN
  const adminLogin = async (data: LoginPayload) => {
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
  };

  // 📝 SIGNUP
  const signup = async (data: SignupPayload) => {
    const res = await api.post("/auth/signup", data);
    const { token, firstname, lastname, email } = res.data.data;

    const userData = { firstname, lastname, email };
    localStorage.setItem("token", token);
    localStorage.setItem("role", "customer");
    localStorage.setItem("user", JSON.stringify(userData));
    
    setToken(token);
    setUser(userData);
    setRole("customer");
    setAdmin(null);
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
  };

  return (
    <AuthContext.Provider
      value={{ user, admin, token, isAuthenticated, role, isAdmin, login, adminLogin, signup, logout }}
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
