import { NavLink, Outlet, useNavigate } from "react-router-dom";
import DashboardIcon from "@mui/icons-material/Dashboard";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import GroupIcon from "@mui/icons-material/Group";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import DescriptionIcon from "@mui/icons-material/Description";
import LogoutIcon from "@mui/icons-material/Logout";
import PublicIcon from "@mui/icons-material/Public";
import { Logo } from "../components";
import { api } from "../api";
import { useAuth } from "../auth";

export default function AppLayout() {
  const { user, setUser } = useAuth();
  const nav = useNavigate();
  const logout = async () => { try { await api.post("/api/auth/logout"); } catch {} setUser(null); nav("/"); };
  return (
    <div className="app">
      <aside className="sidebar">
        <Logo />
        <nav className="side-nav">
          <NavLink to="/app" end className={({ isActive }) => isActive ? "on" : ""}><DashboardIcon /> Tableau de bord</NavLink>
          <NavLink to="/app/imports" className={({ isActive }) => isActive ? "on" : ""}><CloudUploadIcon /> Collecte & imports</NavLink>
          {user?.role === "Admin" && <NavLink to="/app/users" className={({ isActive }) => isActive ? "on" : ""}><GroupIcon /> Utilisateurs</NavLink>}
          {["Admin", "Auditeur", "Manager"].includes(user?.role) && <NavLink to="/app/audit" className={({ isActive }) => isActive ? "on" : ""}><ReceiptLongIcon /> Journal d'audit</NavLink>}
          <NavLink to="/app/rapport" className={({ isActive }) => isActive ? "on" : ""}><DescriptionIcon /> Rapport</NavLink>
          <NavLink to="/"><PublicIcon /> Voir le site</NavLink>
        </nav>
        <div className="side-foot">
          <b>{user?.nom}</b><br />{user?.role}{user?.perimetre ? " · " + user.perimetre : ""}
          <br /><button className="btn btn-ghost" style={{ padding: "6px 0", fontSize: 13 }} onClick={logout}><LogoutIcon style={{ fontSize: 16 }} /> Déconnexion</button>
        </div>
      </aside>
      <main className="main"><Outlet /></main>
    </div>
  );
}
