import { createContext, useContext, useState } from "react";
import { getToken, setToken as saveToken, clearToken, getUserId, setUserId as saveUserId } from "../utils";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(getToken());
  const [userId, setUserId] = useState(getUserId());

  const login = (newToken, newUserId) => {
    saveToken(newToken);
    if (newUserId != null && newUserId !== "") {
      saveUserId(newUserId);
    }
    setToken(newToken);
    setUserId(
      newUserId != null && newUserId !== "" ? String(newUserId) : getUserId()
    );
  };

  const logout = () => {
    clearToken();
    localStorage.removeItem("autocrat_uid");
    setToken(null);
    setUserId(null);
  };

  return (
    <AuthContext.Provider value={{ token, userId, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- hook colocated with provider
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx == null) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}