import { useEffect, useState } from "react";
import AddIcon from "@mui/icons-material/Add";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
  BarChart, Bar, Cell, PieChart, Pie, Legend, Line, ComposedChart, LabelList,
} from "recharts";
import { api, fmt } from "../api";
import { useAuth } from "../auth";

const Delta = ({ v, suffix = " %" }) => {
  if (v === null || v === undefined) return null;
  const pos = v >= 0;
  const cls = v === 0 ? "b-gray" : pos ? "b-green" : "b-red";
  return <span className={"badge " + cls}>{pos ? "▲" : "▼"} {pos ? "+" : ""}{v}{suffix}</span>;
};
const PERIODES = { 30: "30 derniers jours", 90: "90 derniers jours", 365: "12 mois glissants", "": "tout l'historique" };

export default function Dashboard() {
  const { user } = useAuth();
  const [filtres, setFiltres] = useState(null);
  const [f, setF] = useState({ periode: "365", region: "", canal: "", famille: "", vendeur: "" });
  const [k, setK] = useState(null);
  const [serie, setSerie] = useState({ points: [], cible_jour: 0, n1: [] });  const [rep, setRep] = useState(null);
  const [mensuel, setMensuel] = useState([]);
  const [maj, setMaj] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { api.get("/api/filtres").then(setFiltres).catch(() => {}); }, []);
  const charger = async () => {
    setBusy(true);
    const q = new URLSearchParams(f).toString();
    const qm = new URLSearchParams({ region: f.region, canal: f.canal, famille: f.famille, vendeur: f.vendeur }).toString();
    try {
      const [kk, se, rr, mm] = await Promise.all([
        api.get("/api/kpis?" + q), api.get("/api/serie?" + q),
        api.get("/api/repartitions?" + q), api.get("/api/mensuel?" + qm),
      ]);
      setK(kk); setSerie(se); setRep(rr); setMensuel(mm);
      setMaj(new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    } catch {}
    setBusy(false);
  };
  useEffect(() => { charger(); }, []);
  const set = (cle) => (e) => setF({ ...f, [cle]: e.target.value });
  const posPush = async () => { try { await api.post("/api/pos-push"); charger(); } catch {} };

  const sel = (label, cle, opts) => (
    <div><label>{label}</label>
      <select value={f[cle]} onChange={set(cle)} onBlur={charger}>
        <option value="">Tous</option>
        {(opts || []).map((o) => <option key={o} value={o}>{o}</option>)}
      </select></div>
  );
  const caTotal = (rep?.canaux || []).reduce((s, x) => s + x.ca, 0);
  const actifs = [f.region, f.canal, f.famille, f.vendeur].filter(Boolean);
  const parN1 = Object.fromEntries((serie.n1 || []).map((x) => [x.jour.slice(5), x.ca]));
  const points = serie.points.map((p) => ({ ...p, n1: parN1[p.jour.slice(5)] ?? null }));

  return (<>
    <div className="topbar">
      <div>
        <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--brand)" }}>Pilotage commercial · FCFA</div>
        <h1 style={{ margin: "2px 0" }}>Performance du réseau de vente</h1>
        <div style={{ fontSize: 13, color: "var(--muted)" }}>
          {user?.role}{user?.perimetre ? " : " + user.perimetre : ""} · {PERIODES[f.periode] || "période personnalisée"}
          {actifs.length ? " · filtres : " + actifs.join(", ") : ""}
          {maj ? ` · actualisé à ${maj} (auto 5 min)` : ""}
        </div>
      </div>
      <span className="who"><span className="role-pill">Objectif = N-1 × 1,10</span>
        <span className="actions" style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-brand" onClick={posPush}><AddIcon /> Vente POS live</button>
          <a className="btn btn-outline" href={"/api/export/csv?" + new URLSearchParams(f).toString()}><FileDownloadIcon /> CSV</a>
        </span></span>
    </div>

    <div className="filters">
      <div><label>Période</label><select value={f.periode} onChange={set("periode")}>
        <option value="30">30 derniers jours</option><option value="90">90 jours</option>
        <option value="365">12 mois</option><option value="">Tout l'historique</option></select></div>
      {sel("Région", "region", filtres?.regions)}{sel("Canal", "canal", filtres?.canaux)}
      {sel("Famille", "famille", filtres?.familles)}{sel("Vendeur", "vendeur", filtres?.vendeurs)}
      <div><label>&nbsp;</label><button className="btn btn-brand" onClick={charger} disabled={busy}>{busy ? "…" : "Actualiser"}</button></div>
    </div>

    {k && <div className="cards">
      <div className="kpi"><small>Chiffre d'affaires</small><div className="v">{fmt(k.ca)} <span style={{ fontSize: 14 }}>FCFA</span></div>
        <div className="s">{k.var_obj !== null && k.var_obj !== undefined ? <>Objectif {fmt(k.objectif)} <Delta v={k.var_obj} /> · N-1 <Delta v={k.var_n1} /></> : "Périmètre habilité"}</div></div>
      <div className="kpi"><small>Marge brute</small><div className="v">{fmt(k.marge)} <span style={{ fontSize: 14 }}>FCFA</span></div>
        <div className="s">Taux {k.tauxMarge ?? "…"} %{k.var_marge !== null && k.var_marge !== undefined ? <> · N-1 <Delta v={k.var_marge} /></> : ""}</div></div>
      <div className="kpi"><small>Transactions</small><div className="v">{fmt(k.nb)}</div><div className="s">{fmt(k.qte)} articles · panier {fmt(k.panier)} FCFA</div></div>
      <div className="kpi"><small>Panier moyen</small><div className="v">{fmt(k.panier)} <span style={{ fontSize: 14 }}>FCFA</span></div>
        <div className="s">{k.panier_n1 ? <>N-1 : {fmt(k.panier_n1)} FCFA</> : "FCFA / ticket"}</div></div>
    </div>}

    <div className="panel"><h2>Activité journalière : CA, tickets, objectif</h2>
      <p className="hint">Courbe violette : CA N · pointillés gris : N-1 · pointillés or : objectif jour · barres vertes : tickets (axe droit).</p>
      <div style={{ height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={points} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
            <defs><linearGradient id="gCA2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#635BFF" stopOpacity={0.3} /><stop offset="100%" stopColor="#635BFF" stopOpacity={0.02} />
            </linearGradient></defs>
            <CartesianGrid stroke="#EEF1F5" vertical={false} />
            <XAxis dataKey="jour" tick={{ fontSize: 11, fill: "#697386" }} tickFormatter={(j) => j.slice(8) + "/" + j.slice(5, 7)} minTickGap={48} axisLine={false} tickLine={false} />
            <YAxis yAxisId="g" tick={{ fontSize: 11, fill: "#697386" }} tickFormatter={(v) => (v / 1e6).toFixed(1) + "M"} width={48} axisLine={false} tickLine={false} />
            <YAxis yAxisId="d" orientation="right" hide />
            <Tooltip formatter={(v, n) => [fmt(v) + (n === "Tickets" ? "" : " FCFA"), n === "ca" ? "CA jour (N)" : n === "n1" ? "CA jour (N-1)" : n]} />
            <Bar yAxisId="d" dataKey="nb" name="Tickets" fill="#00C07F" opacity={0.35} radius={[3, 3, 0, 0]} barSize={6} />
            <Area yAxisId="g" type="monotone" dataKey="ca" name="ca" stroke="#0A2540" strokeWidth={2.5} fill="url(#gCA2)" />
            <Line yAxisId="g" type="monotone" dataKey="n1" name="n1" stroke="#8A94A6" strokeWidth={1.8} strokeDasharray="5 4" dot={false} />
            {serie.cible_jour > 0 && <ReferenceLine yAxisId="g" y={serie.cible_jour} stroke="#E09B00" strokeDasharray="7 5" strokeWidth={2} label={{ value: "Objectif jour " + fmt(serie.cible_jour), fill: "#8A5A00", fontSize: 12, position: "insideTopRight" }} />}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="legende" style={{ display: "flex", gap: 16, fontSize: 12.5, color: "var(--muted)", marginTop: 8 }}>
        <span><i style={{ display: "inline-block", width: 14, height: 3, background: "#0A2540", borderRadius: 2, marginRight: 6 }} />CA année N</span>
        <span><i style={{ display: "inline-block", width: 14, height: 0, borderTop: "2px dashed #8A94A6", marginRight: 6, verticalAlign: "middle" }} />CA année N-1</span>
        <span><i style={{ display: "inline-block", width: 14, height: 0, borderTop: "2px dashed #E09B00", marginRight: 6, verticalAlign: "middle" }} />Objectif jour</span>
        <span><i style={{ display: "inline-block", width: 10, height: 10, background: "#00C07F", opacity: 0.5, borderRadius: 2, marginRight: 6 }} />Tickets</span>
      </div></div>

    <div className="panel"><h2>Saisonnalité : 12 mois glissants N contre N-1</h2>
      <p className="hint">Colonnes groupées par mois civil, marge du mois en infobulle. La saisonnalité (fêtes, rentrée, traite cacao) saute aux yeux.</p>
      <div style={{ height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={mensuel} margin={{ top: 10, right: 8, left: 0, bottom: 0 }} barGap={3}>
            <CartesianGrid stroke="#EEF1F5" vertical={false} />
            <XAxis dataKey="mois" tick={{ fontSize: 11, fill: "#697386" }} axisLine={false} tickLine={false} interval={0} angle={-18} dy={8} height={44} />
            <YAxis tick={{ fontSize: 11, fill: "#697386" }} tickFormatter={(v) => (v / 1e6).toFixed(0) + "M"} width={44} axisLine={false} tickLine={false} />
            <Tooltip formatter={(v, n) => [fmt(v) + " FCFA", n === "n" ? "Mois (N)" : "Mois (N-1)"]} />
            <Legend />
            <Bar dataKey="n" name="Année N" fill="#635BFF" radius={[5, 5, 0, 0]} />
            <Bar dataKey="n1" name="Année N-1" fill="#D9D6FF" radius={[5, 5, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div></div>

    <div className="cols-2">
      <div className="panel"><h2>CA par région</h2><p className="hint">Cloisonné selon votre périmètre, valeurs en millions.</p>
        <div style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rep?.regions || []} layout="vertical" margin={{ left: 0, right: 56 }}>
              <XAxis type="number" hide /><YAxis type="category" dataKey="region" tick={{ fontSize: 12 }} width={110} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => [fmt(v) + " FCFA", "CA"]} />
              <Bar dataKey="ca" radius={[0, 6, 6, 0]}>
                {(rep?.regions || []).map((_, i) => <Cell key={i} fill={i === 0 ? "#635BFF" : i < 3 ? "#9B95FF" : "#D9D6FF"} />)}
                <LabelList dataKey="ca" position="right" formatter={(v) => (v / 1e6).toFixed(1) + "M"} style={{ fontSize: 11, fill: "#697386" }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div></div>
      <div className="panel"><h2>Mix canaux</h2><p className="hint">POS · Agences · E-commerce, total au centre.</p>
        <div style={{ height: 300, position: "relative" }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={rep?.canaux || []} dataKey="ca" nameKey="canal" innerRadius={68} outerRadius={104} paddingAngle={3}>
                {(rep?.canaux || []).map((x) => <Cell key={x.canal} fill={{ POS: "#0A2540", Agence: "#635BFF", "E-commerce": "#00D4FF" }[x.canal] || "#C2C9D4"} />)}
              </Pie>
              <Tooltip formatter={(v, n) => [fmt(v) + " FCFA", n]} /><Legend />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
            <b style={{ fontSize: 22 }}>{(caTotal / 1e6).toFixed(1)} M</b>
            <span style={{ fontSize: 11.5, color: "var(--faint)" }}>FCFA filtrés</span>
          </div>
        </div></div>
    </div>

    <div className="cols-2">
      <div className="panel"><h2>Mix par famille : CA et marge</h2><p className="hint">Longueur : chiffre d'affaires · survolez : marge brute et taux par famille.</p>
        <div style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rep?.familles || []} layout="vertical" margin={{ left: 0, right: 56 }}>
              <XAxis type="number" hide /><YAxis type="category" dataKey="famille" tick={{ fontSize: 12 }} width={110} axisLine={false} tickLine={false} />
              <Tooltip content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const x = payload[0].payload;
                const taux = x.ca ? Math.round(x.mg / x.ca * 100) : 0;
                return <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 8, padding: "10px 14px", fontSize: 13 }}>
                  <b>{x.famille}</b><br />CA : {fmt(x.ca)} FCFA<br />Marge : {fmt(x.mg)} FCFA ({taux} %)
                </div>;
              }} />
              <Bar dataKey="ca" radius={[0, 6, 6, 0]}>
                {(rep?.familles || []).map((_, i) => <Cell key={i} fill={["#0F766E", "#00C07F", "#635BFF", "#9B95FF", "#FFC247", "#00D4FF", "#C2C9D4"][i % 7]} />)}
                <LabelList dataKey="ca" position="right" formatter={(v) => (v / 1e6).toFixed(1) + "M"} style={{ fontSize: 11, fill: "#697386" }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div></div>
      <div className="panel"><h2>Top produits (FCFA)</h2><p className="hint">Les 8 références qui portent le chiffre.</p>
        <div style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rep?.top || []} layout="vertical" margin={{ left: 0, right: 56 }}>
              <XAxis type="number" hide /><YAxis type="category" dataKey="produit" tick={{ fontSize: 11 }} width={130} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => [fmt(v) + " FCFA", "CA"]} />
              <Bar dataKey="ca" fill="#FFC247" radius={[0, 6, 6, 0]}>
                <LabelList dataKey="ca" position="right" formatter={(v) => (v / 1e6).toFixed(1) + "M"} style={{ fontSize: 11, fill: "#697386" }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div></div>
    </div>

    <div className="panel"><h2>Classement vendeurs : atteinte d'objectif</h2><p className="hint">Objectif individuel N-1 × 1,10 · rouge sous 90 % · cliquez un vendeur pour filtrer tout le tableau.</p>
      <div style={{ maxHeight: 340, overflow: "auto" }}>
        <table className="grid"><thead><tr><th style={{ width: 56 }}>Rang</th><th>Vendeur</th><th className="num">CA FCFA</th><th className="num">Tickets</th><th style={{ minWidth: 190 }}>Objectif</th></tr></thead>
        <tbody>{(rep?.vendeurs || []).map((v, i) => {
          const pct = v.pct === null ? null : Math.min(100, v.pct);
          const c = pct === null ? "#CBD2DC" : pct < 90 ? "#DF1B41" : pct < 100 ? "#FFC247" : "#00C07F";
          const medaille = ["#C99A1B", "#8A94A6", "#B47A3B"][i] || "#EEF1F5";
          const txt = i < 3 ? "#fff" : "var(--muted)";
          return <tr key={v.vendeur} style={{ cursor: "pointer" }} onClick={() => { setF({ ...f, vendeur: v.vendeur }); setTimeout(charger, 50); }}>
            <td><span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, borderRadius: "50%", background: medaille, color: txt, fontWeight: 800, fontSize: 13 }}>{i + 1}</span></td>
            <td><b>{v.vendeur}</b></td>
            <td className="num"><b>{fmt(v.ca)}</b></td>
            <td className="num">{v.nb}</td>
            <td><div className="pbar"><i style={{ width: (pct ?? 0) + "%", background: c }} /></div>
              <span style={{ fontSize: 11.5, color: "var(--faint)" }}>{v.pct === null ? "sans N-1" : v.pct + " % de " + fmt(v.obj)}</span></td></tr>;
        })}</tbody></table>
      </div></div>
  </>);
}
