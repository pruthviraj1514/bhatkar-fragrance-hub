import { createContext, useContext, useState } from "react";
import api from "@/lib/axios";

interface User {
  firstname: string;
  lastname: string;
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

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (data: LoginPayload) => Promise<void>;
  signup: (data: SignupPayload) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // ✅ derived auth state
  const isAuthenticated = !!user;

  // 🔐 LOGIN
  const login = async (data: LoginPayload) => {
    const res = await api.post("/auth/signin", data);
    const { token, firstname, lastname, email } = res.data.data;

    localStorage.setItem("token", token);
    setToken(token);
    setUser({ firstname, lastname, email });
  };

  // 📝 SIGNUP
  const signup = async (data: SignupPayload) => {
    const res = await api.post("/auth/signup", data);
    const { token, firstname, lastname, email } = res.data.data;

    localStorage.setItem("token", token);
    setToken(token);
    setUser({ firstname, lastname, email });
  };

  return (
    <AuthContext.Provider
      value={{ user, token, isAuthenticated, login, signup }}
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
