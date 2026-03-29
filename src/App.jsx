// ... existing imports
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Toast } from "./components/Toast";
import AuthScreen from "./screens/AuthScreen";
import Layout from "./Layout";
import Feed from "./screens/Feed";
import Profile from "./screens/Profile";

const queryClient = new QueryClient();

function AppRoutes() {
  const { isAuthenticated } = useAuth(); // We don't need to pass userId down manually anymore!

  return (
    <Routes>
      {isAuthenticated ? (
        <Route path="/" element={<Layout />}>
          <Route index element={<Feed />} />
          
          {/* This is for YOUR profile (clicking the nav link) */}
          <Route path="profile" element={<Profile />} /> 
          
          {/* NEW: This is for OTHER people's profiles (clicking their name) */}
          <Route path="profile/:id" element={<Profile />} /> 
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      ) : (
        <>
          <Route path="/login" element={<AuthScreen />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </>
      )}
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Toast />
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}