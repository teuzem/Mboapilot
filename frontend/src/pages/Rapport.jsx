import { useEffect, useState } from "react";
import { api, fmt } from "../api";

export default function Rapport() {
  const [r, setR] = useState(null);
  useEffect(() => { api.get("/api/rapport").then(setR).catch(() => {}); }, []);
  if (!r) return <div className="panel">Génération du rapport…</div>;
  return (
    <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 12, padding: 40, maxWidth: 820 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, borderBottom: "3px solid var(--ink)", paddingBottom: 14 }}>
        <img src="/logo.svg" style={{ width: 48, height: 48 }} alt="" />
        <div><div style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-.02em" }}>MboaPilot, Rapport des ventes</div>
        <div style={{ fontSize: 12.5, color: "var(--muted)" }}>Édité le {r.horo} · Empreinte {r.emp}</div></div>
      </div>
      <h2 style={{ marginTop: 22 }}>Synthèse</h2>
      <p><b>{fmt(r.ca)} FCFA</b> · <b>{r.nb}</b> transactions (filtres 12 mois).</p>
      <h3>Top 10 produits</h3>
      <table className="grid"><thead><tr><th>Produit</th><th className="num">CA FCFA</th></tr></thead>
      <tbody>{r.top.map((t) => <tr key={t.produit}><td>{t.produit}</td><td className="num">{fmt(t.ca)}</td></tr>)}</tbody></table>
      <p style={{ fontSize: 12, color: "var(--muted)" }}>Document horodaté et signé (empreinte {r.emp}).</p>
      <div className="noprint" style={{ marginTop: 16, display: "flex", gap: 8 }}>
        <button className="btn btn-brand" onClick={() => window.print()}>Générer le PDF (impression A4)</button>
      </div>
    </div>
  );
}
