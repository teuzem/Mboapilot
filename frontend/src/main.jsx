import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { createRoot } from "react-dom/client";
import { useEffect } from "react";
import "./theme.css";
import "./wow.css";
import { AuthProvider, useAuth } from "./auth";
import Landing from "./pages/Landing";
import Features from "./pages/Features";
import Pricing from "./pages/Pricing";
import Security from "./pages/Security";
import Contact from "./pages/Contact";
import Legal from "./pages/Legal";
import Login from "./pages/Login";
import Reset from "./pages/Reset";
import AppLayout from "./pages/AppLayout";
import Dashboard from "./pages/Dashboard";
import Imports from "./pages/Imports";
import Users from "./pages/Users";
import Audit from "./pages/Audit";
import Rapport from "./pages/Rapport";

function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}
function Garde({ children }) {
  const { user, ready } = useAuth();
  if (!ready) return <div style={{ padding: 60, textAlign: "center", color: "var(--muted)" }}>Chargement…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AuthProvider>
      <ScrollTop />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/fonctionnalites" element={<Features />} />
        <Route path="/tarifs" element={<Pricing />} />
        <Route path="/securite" element={<Security />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/mentions-legales" element={<Legal page="mentions-legales" />} />
        <Route path="/confidentialite" element={<Legal page="confidentialite" />} />
        <Route path="/cgu" element={<Legal page="cgu" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/reset" element={<Reset />} />
        <Route path="/reset/:token" element={<Reset />} />
        <Route path="/app" element={<Garde><AppLayout /></Garde>}>
          <Route index element={<Dashboard />} />
          <Route path="imports" element={<Imports />} />
          <Route path="users" element={<Users />} />
          <Route path="audit" element={<Audit />} />
          <Route path="rapport" element={<Rapport />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  </BrowserRouter>
);
