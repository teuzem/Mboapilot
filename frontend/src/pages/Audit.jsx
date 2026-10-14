import { useEffect, useState } from "react";
import { api } from "../api";

export default function Audit() {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [total, setTotal] = useState(0);
  const charger = () => api.get("/api/audit?q=" + encodeURIComponent(q)).then((r) => { setRows(r.logs); setTotal(r.total); }).catch(() => {});
  useEffect(() => { charger(); }, []);
  return (<>
    <div className="topbar"><h1>Journal d'audit</h1><span className="who">{total} entrées · append-only, SHA-256 chaîné</span></div>
    <div className="filters noprint">
      <div><label>Recherche</label><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="acteur, action…" style={{ font: "inherit", fontSize: 14, padding: "8px 10px", border: "1px solid #CBD2DC", borderRadius: 8 }} /></div>
      <div><label>&nbsp;</label><button className="btn btn-brand" onClick={charger}>Filtrer</button></div>
    </div>
    <div className="panel"><div style={{ overflow: "auto" }}><table className="grid">
      <thead><tr><th>#</th><th>Horodatage UTC</th><th>Acteur</th><th>IP</th><th>Action</th><th>Ressource</th><th>Résultat</th><th>Empreinte</th></tr></thead>
      <tbody>{rows.map((r) => <tr key={r.id}><td>{r.id}</td><td>{r.horo}</td><td><b>{r.acteur}</b></td><td>{r.ip}</td>
        <td>{r.action}</td><td>{r.ressource}</td><td>{r.resultat}</td>
        <td style={{ fontFamily: "monospace", fontSize: 11 }}>{(r.empreinte || "").slice(0, 12)}…</td></tr>)}</tbody>
    </table></div></div>
  </>);
}
