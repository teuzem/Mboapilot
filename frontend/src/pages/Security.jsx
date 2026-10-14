import { Link } from "react-router-dom";
import LockIcon from "@mui/icons-material/Lock";
import GroupIcon from "@mui/icons-material/Group";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { SiteHeader, SiteFooter, Reveal } from "../components";

export default function Security() {
  return (<>
    <SiteHeader />
    <div className="page-hero"><div className="hero-mesh"><i /><i /><i /></div>
      <div className="wrap" style={{ position: "relative" }}>
        <span className="eyebrow"><span className="dot" /> Confiance</span>
        <h1>L'exigence d'une banque, pour vos ventes.</h1>
        <p className="sub">Dossier sécurité opposable, conforme à la loi camerounaise n° 2024/017. Fourni à vos auditeurs.</p>
      </div>
    </div>
    <section className="block dark" style={{ marginTop: 8 }}>
      <div className="wrap">
        <div className="secu-grid">
          {[
            [<LockIcon />, "Identités fortifiées", "Mots de passe complexes dès 12 caractères, sessions de 30 minutes, verrouillage après 5 échecs, reset par lien unique de 30 minutes."],
            [<GroupIcon />, "Moindre privilège réel", "4 rôles, périmètres géographiques appliqués côté serveur, jamais contournables depuis le navigateur. Désactivation immédiate."],
            [<ReceiptLongIcon />, "Traçabilité totale", "Connexions, consultations, exports : journal horodaté UTC, chaîné SHA-256, append-only. Rétention 5 ans, rapport en moins de 4h."],
          ].map(([ic, t, p], i) => (
            <Reveal key={t} delay={i * 0.1}><div className="secu"><div className="pic">{ic}</div><h3>{t}</h3><p>{p}</p></div></Reveal>
          ))}
        </div>
        <Reveal><div className="prose" style={{ marginTop: 48, maxWidth: 760 }}>
          <h2 style={{ color: "#fff" }}>Engagements mesurables</h2>
          <ul style={{ color: "#AAB4C4", display: "grid", gap: 10, paddingLeft: 20 }}>
            <li><b style={{ color: "#fff" }}>Hébergement au Cameroun</b>, aucune donnée sans consentement écrit.</li>
            <li><b style={{ color: "#fff" }}>Chiffrement</b>, dépôts SFTP-TLS, sessions HttpOnly, mots de passe chiffrés.</li>
            <li><b style={{ color: "#fff" }}>Revue croisée</b>, chaque livraison est testée, relue, documentée.</li>
            <li><b style={{ color: "#fff" }}>Transparence incident</b>, notification sous 72h, journal à l'appui.</li>
          </ul>
          <p style={{ color: "#AAB4C4" }}>Détail contractuel : <Link to="/confidentialite">confidentialité</Link> · <Link to="/cgu">CGU</Link> · <Link to="/contact">demander le dossier complet <ArrowForwardIcon style={{ fontSize: 16 }} /></Link></p>
        </div></Reveal>
      </div>
    </section>
    <SiteFooter />
  </>);
}
