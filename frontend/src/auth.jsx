import { createContext, useContext, useEffect, useState } from "react";
import { api } from "./api";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    api.get("/api/auth/me").then(setUser).catch(() => setUser(null)).finally(() => setReady(true));
  }, []);
  const logout = async () => { try { await api.post("/api/auth/logout"); } catch {} setUser(null); };
  return <AuthCtx.Provider value={{ user, setUser, logout, ready }}>{children}</AuthCtx.Provider>;
}
