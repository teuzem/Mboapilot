import { useEffect, useState } from "react";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import BoltIcon from "@mui/icons-material/Bolt";
import { api } from "../api";

export default function Imports() {
  const [rows, setRows] = useState([]);
  const [msg, setMsg] = useState(null);
  const [pos, setPos] = useState("");
  const charger = () => api.get("/api/imports").then((r) => setRows(r.imports)).catch(() => {});
  useEffect(() => { charger(); }, []);
  const envoyer = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    setMsg(null);
    const r = await fetch("/api/imports", { method: "POST", body: fd });
    const j = await r.json();
    setMsg({ ok: r.ok, txt: j.message || "Import traité." });
    e.target.reset(); charger();
  };
  const push = async () => {
    const j = await api.post("/api/pos-push");
    setPos(j.ok ? `Vente ${j.ref} · ${j.montant} FCFA encaissée.` : "Doublon écarté (idempotence).");
    charger();
  };
  const badge = (s) => s === "Reussi" ? "b-green" : s === "Partiel" ? "b-amber" : "b-red";
  return (<>
    <div className="topbar"><h1>Collecte automatisée</h1></div>
    <p style={{ color: "var(--muted)", marginTop: -12 }}>POS live · CSV/SFTP agences · déduplication par référence unique.</p>
    {msg && <div className={msg.ok ? "ok" : "alert"}>{msg.txt}</div>}
    <div className="cols-2">
      <div className="panel"><h2>Dépôt agence (CSV)</h2>
        <p className="hint">ref;jour;canal;region;ville;point_vente;vendeur;produit;famille;qte;prix_unit;remise_pct;montant;cout_unit;devise : coût calculé si absent, traité dans l'heure.</p>
        <form onSubmit={envoyer}>
          <div className="field"><input type="file" name="fichier" accept=".csv" required /></div>
          <button className="btn btn-brand"><CloudUploadIcon /> Importer et contrôler</button>
        </form></div>
      <div className="panel"><h2>Caisse POS temps réel</h2>
        <p className="hint">En production : import caisses avant 8h + alerte si silence &gt; 24h.</p>
        <button className="btn btn-brand" onClick={push}><BoltIcon /> Encaisser une vente test</button>
        {pos && <span style={{ fontSize: 13.5, marginLeft: 10 }}>{pos}</span>}</div>
    </div>
    <div className="panel"><h2>Suivi des imports</h2>
      <div style={{ overflow: "auto" }}><table className="grid">
        <thead><tr><th>#</th><th>Source</th><th>Fichier</th><th>Jour</th><th className="num">Reçues</th><th className="num">Intégrées</th><th className="num">Doublons</th><th className="num">Rejets</th><th>Statut</th></tr></thead>
        <tbody>{rows.map((r) => <tr key={r.id}><td>{r.id}</td><td>{r.source}</td><td>{r.nom_fichier}</td><td>{r.jour}</td>
          <td className="num">{r.lignes_recues}</td><td className="num">{r.lignes_integrees}</td><td className="num">{r.doublons}</td><td className="num">{r.rejets}</td>
          <td><span className={"badge " + badge(r.statut)}>{r.statut}</span></td></tr>)}</tbody>
      </table></div></div>
  </>);
}
