import { useState } from "react";
import { Link } from "react-router-dom";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { SiteHeader, SiteFooter, Reveal } from "../components";
import { api } from "../api";

export default function Contact() {
  const [form, setForm] = useState({ nom: "", entreprise: "", email: "", tel: "", profil: "Direction générale / commerciale", message: "" });
  const [etat, setEtat] = useState({ envoi: false, ok: null, msg: "" });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const envoyer = async (e) => {
    e.preventDefault();
    setEtat({ envoi: true, ok: null, msg: "" });
    try {
      await api.post("/api/contact", form);
      setEtat({ envoi: false, ok: true, msg: `Message bien reçu, ${form.nom.split(" ")[0]} ! Réponse sous 24h ouvrées.` });
      setForm({ nom: "", entreprise: "", email: "", tel: "", profil: form.profil, message: "" });
    } catch (err) { setEtat({ envoi: false, ok: false, msg: err.message }); }
  };
  return (<>
    <SiteHeader />
    <div className="page-hero"><div className="hero-mesh"><i /><i /><i /></div>
      <div className="wrap" style={{ position: "relative" }}>
        <span className="eyebrow"><span className="dot" /> Contact</span>
        <h1>30 minutes. Vos chiffres. Votre tableau.</h1>
        <p className="sub">Démo sur vos données sous 7 jours. Réponse sous 24h ouvrées.</p>
      </div>
    </div>
    <section className="block" style={{ paddingTop: 40 }}>
      <div className="wrap grid-2" style={{ alignItems: "start" }}>
        <Reveal>
          {etat.ok === true && <div className="ok">{etat.msg}</div>}
          {etat.ok === false && <div className="alert">{etat.msg}</div>}
          <form onSubmit={envoyer} style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 16, padding: 30, boxShadow: "var(--shadow-sm)" }}>
            <div className="grid-2" style={{ gap: 14 }}>
              <div className="field"><label>Nom complet *</label><input required value={form.nom} onChange={set("nom")} placeholder="Ex. Amina Nkomo" /></div>
              <div className="field"><label>Entreprise *</label><input required value={form.entreprise} onChange={set("entreprise")} placeholder="Ex. Savanna Distribution" /></div>
            </div>
            <div className="grid-2" style={{ gap: 14 }}>
              <div className="field"><label>Email pro *</label><input required type="email" value={form.email} onChange={set("email")} placeholder="vous@entreprise.cm" /></div>
              <div className="field"><label>Téléphone</label><input value={form.tel} onChange={set("tel")} placeholder="+237 …" /></div>
            </div>
            <div className="field"><label>Vous êtes…</label>
              <select value={form.profil} onChange={set("profil")}>
                {["Direction générale / commerciale", "Manager / responsable réseau", "DAF / contrôle de gestion", "DSI / RSSI", "Autre"].map((o) => <option key={o}>{o}</option>)}
              </select></div>
            <div className="field"><label>Votre besoin *</label>
              <textarea rows={5} required value={form.message} onChange={set("message")} placeholder="Ex. 4 boutiques à Douala et Yaoundé, consolidations Excel chaque lundi…" /></div>
            <button className="btn btn-brand btn-lg btn-block" disabled={etat.envoi}>{etat.envoi ? "Envoi…" : "Envoyer ma demande"}</button>
            <p style={{ fontSize: 12.5, color: "var(--faint)", marginTop: 10 }}>En envoyant, vous acceptez notre <Link to="/confidentialite">politique de confidentialité</Link>.</p>
          </form>
        </Reveal>
        <Reveal delay={0.12}>
          <h2>Ce qui se passe ensuite</h2>
          {[["J+1 · Cadrage", "15 minutes : vos indicateurs, vos sources, vos périmètres. Si MboaPilot ne convient pas, on vous le dit."],
            ["J+7 · Démo sur vos données", "Un échantillon CSV suffit : on vous présente votre tableau de bord, pas une maquette."],
            ["J+30 · Premier pilotage", "Sources branchées, équipes formées, première revue hebdo accompagnée."]].map(([t, p], i) => (
            <div key={t} style={{ display: "flex", gap: 14, marginTop: 20 }}>
              <span style={{ fontWeight: 800, color: "var(--brand)", fontSize: 22 }}>0{i + 1}</span>
              <span><b>{t}</b><br /><span style={{ color: "var(--muted)" }}>{p}</span></span>
            </div>
          ))}
          <figure className="split-photo" style={{ margin: "28px 0 0", minHeight: 260 }}>
            <img src="/img/rue-marche.jpg" alt="Rue commerçante, Cameroun" />
            <figcaption>Bonanjo, Douala, <b>réponse sous 24h</b></figcaption>
          </figure>
        </Reveal>
      </div>
    </section>
    <SiteFooter />
  </>);
}
