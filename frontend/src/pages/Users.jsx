import { useEffect, useState } from "react";
import { api } from "../api";

export default function Users() {
  const [rows, setRows] = useState([]);
  const [msg, setMsg] = useState("");
  const [f, setF] = useState({ login: "", nom: "", pwd: "", role: "Commercial", perimetre: "Littoral" });
  const charger = () => api.get("/api/users").then((r) => setRows(r.users)).catch(() => {});
  useEffect(() => { charger(); }, []);
  const act = async (action, login, body = {}) => {
    setMsg("");
    try { const r = await api.post("/api/users", { action, login, ...body }); setMsg(r.message); charger(); }
    catch (e) { setMsg(e.message); }
  };
  const creer = (e) => { e.preventDefault(); act("creer", f.login, { nom: f.nom, pwd: f.pwd, role: f.role, perimetre: f.perimetre }); };
  const inp = (k) => ({ value: f[k], onChange: (e) => setF({ ...f, [k]: e.target.value }) });
  return (<>
    <div className="topbar"><h1>Utilisateurs & habilitations</h1></div>
    {msg && <div className="ok">{msg}</div>}
    <div className="cols-2">
      <div className="panel"><h2>Créer un compte</h2>
        <form onSubmit={creer}>
          <div className="field"><label>Login</label><input required {...inp("login")} /></div>
          <div className="field"><label>Nom affiché</label><input required {...inp("nom")} /></div>
          <div className="field"><label>Mot de passe initial (≥ 12 car., complexe)</label><input required type="password" {...inp("pwd")} /></div>
          <div style={{ display: "flex", gap: 10 }}>
            <div className="field"><label>Rôle</label><select {...inp("role")}>{["Admin", "Manager", "Commercial", "Auditeur"].map((o) => <option key={o}>{o}</option>)}</select></div>
            <div className="field"><label>Périmètre</label><select {...inp("perimetre")}>{["National", "Centre", "Littoral", "Ouest", "Nord-Ouest", "Sud-Ouest", "Sud", "Est", "Adamaoua", "Nord", "Extreme-Nord"].map((o) => <option key={o}>{o}</option>)}</select></div>
          </div>
          <button className="btn btn-brand">Créer</button>
        </form></div>
      <div className="panel"><h2>Matrice des droits</h2>
        <table className="grid"><thead><tr><th>Rôle</th><th>Données</th><th>Imports</th><th>Audit</th></tr></thead><tbody>
          <tr><td><b>Admin</b></td><td>Toutes</td><td>Oui</td><td>Lecture</td></tr>
          <tr><td><b>Manager</b></td><td>Sa région</td><td>Oui</td><td>Lecture</td></tr>
          <tr><td><b>Commercial</b></td><td>Sa région</td><td>Dépôt</td><td>Aucun</td></tr>
          <tr><td><b>Auditeur</b></td><td>Lecture seule</td><td>Aucun</td><td>Lecture + export</td></tr>
        </tbody></table></div>
    </div>
    <div className="panel"><h2>Comptes ({rows.length})</h2>
      <div style={{ overflow: "auto" }}><table className="grid">
        <thead><tr><th>Login</th><th>Nom</th><th>Rôle</th><th>Périmètre</th><th>Échecs</th><th>Actions</th></tr></thead>
        <tbody>{rows.map((u) => <tr key={u.login}><td><b>{u.login}</b></td><td>{u.nom}</td><td>{u.role}</td><td>{u.perimetre}</td>
          <td>{u.echecs}{u.bloque_def ? " · BLOQUÉ" : ""}</td>
          <td style={{ whiteSpace: "nowrap", display: "flex", gap: 6 }}>
            <button className="btn btn-outline" style={{ padding: "4px 10px", fontSize: 13 }} onClick={() => act("debloquer", u.login)}>Débloquer</button>
            <button className="btn btn-outline" style={{ padding: "4px 10px", fontSize: 13 }} onClick={() => act("desactiver", u.login)}>Désactiver</button>
          </td></tr>)}</tbody>
      </table></div></div>
  </>);
}
