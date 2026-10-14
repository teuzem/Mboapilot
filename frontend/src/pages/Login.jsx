import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import BoltIcon from "@mui/icons-material/Bolt";
import { api } from "../api";
import { useAuth } from "../auth";
import { Logo } from "../components";

export default function Login() {
  const nav = useNavigate();
  const { setUser } = useAuth();
  const [login, setLogin] = useState("");
  const [pwd, setPwd] = useState("");
  const [voir, setVoir] = useState(false);
  const [err, setErr] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [comptes, setComptes] = useState([]);
  useEffect(() => { api.get("/api/auth/demo-secrets").then((r) => setComptes(r.comptes)).catch(() => {}); }, []);

  const connecter = async (lg, pw) => {
    setErr(""); setEnvoi(true);
    try {
      const r = await api.post("/api/auth/login", { login: lg.trim(), password: pw });
      setUser(r.user); nav("/app");
    } catch (ex) { setErr(ex.message); }
    setEnvoi(false);
  };
  const go = (e) => { e.preventDefault(); connecter(login, pwd); };

  return (
    <div className="auth-page">
      <div className="auth-side">
        <img className="bg" src="/img/hero-marche.jpg" alt="Marché au Cameroun" />
        <div style={{ marginBottom: "auto" }}><Logo light /></div>
        <blockquote>« Le lundi 8h, je sais ce que chaque boutique a vendu le week-end. »</blockquote>
        <cite>Ngo Bell K., directrice réseau, Douala</cite>
      </div>
      <div className="auth-form"><div className="auth-box">
        <span className="eyebrow"><span className="dot" /> Espace sécurisé</span>
        <h1>Bon retour.</h1>
        <p style={{ color: "var(--muted)" }}>Identifiant et mot de passe. Session de 30 minutes, compte verrouillé après 5 échecs.</p>
        {err && <div className="alert">{err}</div>}
        <form onSubmit={go}>
          <div className="field"><label>Identifiant</label><input value={login} onChange={(e) => setLogin(e.target.value)} required autoComplete="username" placeholder="ex. demo" /></div>
          <div className="field"><label>Mot de passe</label>
            <span className="pw-wrap"><input type={voir ? "text" : "password"} value={pwd} onChange={(e) => setPwd(e.target.value)} required autoComplete="current-password" placeholder="••••••••••••" />
            <button type="button" onClick={() => setVoir(!voir)}>{voir ? "Masquer" : "Afficher"}</button></span></div>
          <button className="btn btn-brand btn-lg btn-block" disabled={envoi}>{envoi ? "Connexion…" : <>Se connecter <ArrowForwardIcon /></>}</button>
        </form>
        <p style={{ fontSize: 14, marginTop: 16 }}><Link to="/reset">Mot de passe oublié ?</Link> · <Link to="/">Retour au site</Link></p>
        <details style={{ marginTop: 8, border: "1px solid var(--line)", borderRadius: 10, padding: "12px 16px" }}>
          <summary style={{ cursor: "pointer", fontWeight: 700, fontSize: 14 }}><BoltIcon style={{ fontSize: 17, verticalAlign: -3, color: "var(--brand)" }} /> Connexion démo en 1 clic (soutenance)</summary>
          <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
            {comptes.map((c) => (
              <div key={c.login} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5 }}>
                <button className="btn btn-outline" style={{ padding: "6px 14px", fontSize: 13.5 }} disabled={envoi}
                  onClick={() => { setLogin(c.login); setPwd(c.password); connecter(c.login, c.password); }}>
                  {c.login}
                </button>
                <span style={{ color: "var(--muted)" }}>{c.role}{c.perimetre ? ", " + c.perimetre : ""}</span>
              </div>
            ))}
            <p style={{ fontSize: 12.5, color: "var(--muted)", margin: "4px 0 0" }}>
              Recommandé pour le jury : <b>demo</b> (vue nationale complète) ou <b>commercial</b> (périmètre Littoral).
            </p>
          </div>
        </details>
      </div></div>
    </div>
  );
}
