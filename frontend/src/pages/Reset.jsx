import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api";
import { Logo } from "../components";

function force(pwd) {
  let s = 0;
  if (pwd.length >= 12) s++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) s++;
  if (/[0-9]/.test(pwd)) s++;
  if (/[^A-Za-z0-9]/.test(pwd)) s++;
  return s;
}
const MOTS = ["Très faible", "Faible", "Correct", "Fort", "Excellent"];
const COLS = ["#DF1B41", "#DF1B41", "#FFC247", "#00C07F", "#00C07F"];

export default function Reset() {
  const { token } = useParams();
  const [login, setLogin] = useState("");
  const [lien, setLien] = useState("");
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [msg, setMsg] = useState({ ok: null, txt: "" });
  const demander = async (e) => {
    e.preventDefault(); setMsg({ ok: null, txt: "" });
    try {
      const r = await api.post("/api/auth/reset-request", { login: login.trim() });
      setLien(r.lien);
      setMsg({ ok: true, txt: "Lien généré (30 min, usage unique). En production, il part par email." });
    } catch (ex) { setMsg({ ok: false, txt: ex.message }); }
  };
  const changer = async (e) => {
    e.preventDefault(); setMsg({ ok: null, txt: "" });
    try {
      await api.post("/api/auth/reset-use", { token, p1, p2 });
      setMsg({ ok: true, txt: "Mot de passe réinitialisé. Connectez-vous." });
    } catch (ex) { setMsg({ ok: false, txt: ex.message }); }
  };
  const f = force(p1);
  return (
    <div className="auth-page">
      <div className="auth-side">
        <img className="bg" src="/img/point-vente.jpg" alt="Point de vente, Cameroun" />
        <div style={{ marginBottom: "auto" }}><Logo light /></div>
        <blockquote>Retrouvez l'accès, en toute sécurité.</blockquote>
        <cite>Lien unique 30 minutes, action journalisée</cite>
      </div>
      <div className="auth-form"><div className="auth-box">
        {!token ? (<>
          <span className="eyebrow"><span className="dot" /> Récupération</span>
          <h1>Mot de passe oublié</h1>
          {msg.txt && <div className={msg.ok ? "ok" : "alert"}>{msg.txt}</div>}
          <form onSubmit={demander}>
            <div className="field"><label>Identifiant</label><input value={login} onChange={(e) => setLogin(e.target.value)} required /></div>
            <button className="btn btn-brand btn-lg btn-block">Générer le lien</button>
          </form>
          {lien && <div className="ok">Lien démo : <Link to={lien}>{lien}</Link></div>}
        </>) : (<>
          <span className="eyebrow"><span className="dot" /> Nouveau mot de passe</span>
          <h1>Choisissez-en un fort</h1>
          {msg.txt && <div className={msg.ok ? "ok" : "alert"}>{msg.txt}</div>}
          <form onSubmit={changer}>
            <div className="field"><label>Nouveau (≥ 12 car. : majuscule, minuscule, chiffre, symbole)</label>
              <input type="password" value={p1} onChange={(e) => setP1(e.target.value)} required />
              <span className="meter"><i style={{ width: f * 25 + "%", background: COLS[f] }} /></span>
              <small style={{ color: "var(--muted)" }}>{p1 ? MOTS[f] : ""}</small></div>
            <div className="field"><label>Confirmation</label><input type="password" value={p2} onChange={(e) => setP2(e.target.value)} required /></div>
            <button className="btn btn-brand btn-lg btn-block">Réinitialiser</button>
          </form>
        </>)}
        <p style={{ fontSize: 14 }}><Link to="/login">← Retour connexion</Link></p>
      </div></div>
    </div>
  );
}
