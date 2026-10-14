import { Link } from "react-router-dom";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { SiteHeader, SiteFooter, Reveal } from "../components";

const OFFRES = [
  { n: "Essentiel", d: "Pour tester le pilotage sur un point de vente.", prix: "89 000", u: "FCFA / mois", hot: false, f: ["1 point de vente + CSV agences", "Dashboard KPI + filtres", "3 utilisateurs, rôles et périmètres", "Exports + rapport PDF", "Journal des connexions", "Support sous 48h"] },
  { n: "Pilotage", d: "Pour diriger un réseau régional.", prix: "249 000", u: "FCFA / mois", hot: true, f: ["Sources illimitées POS · CSV · API", "Alertes seuils + rapports auto", "15 utilisateurs, 4 rôles", "Audit infalsifiable 5 ans", "Formation par profil incluse", "Support sous 8h ouvrées"] },
  { n: "Réseau", d: "Groupes multi-filiales, CEMAC.", prix: "Sur devis", u: "", hot: false, f: ["Multi-sociétés, XAF/XOF", "ERP bidirectionnel + réconciliation", "SMS critiques, SLA 99,5 %", "RSSI attitré, revue trimestrielle"] },
];

export default function Pricing() {
  return (<>
    <SiteHeader />
    <div className="page-hero"><div className="hero-mesh"><i /><i /><i /></div>
      <div className="wrap" style={{ position: "relative" }}>
        <span className="eyebrow"><span className="dot" /> Tarifs</span>
        <h1>Facturé en FCFA. Sans surprise.</h1>
        <p className="sub">Hébergement Cameroun et formation inclus, toujours. Résiliation 30 jours, export complet de vos données.</p>
      </div>
    </div>
    <section className="block" style={{ paddingTop: 40 }}>
      <div className="wrap">
        <div className="grid-3">
          {OFFRES.map((o, i) => (
            <Reveal key={o.n} delay={i * 0.1}>
              <div className={"price" + (o.hot ? " hot" : "")} style={{ height: "100%" }}>
                {o.hot && <span className="ribbon">Le plus choisi</span>}
                <h3>{o.n}</h3>
                <p style={{ color: "var(--muted)", fontSize: 14 }}>{o.d}</p>
                <div className="amount">{o.prix} {o.u && <small>{o.u}</small>}</div>
                <ul>{o.f.map((x) => <li key={x}><CheckCircleIcon />{x}</li>)}</ul>
                <Link className={"btn btn-block " + (o.hot ? "btn-brand" : "btn-outline")} to="/contact">{o.hot ? "Demander une démo" : "Contacter l'équipe"}</Link>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal><div className="prose" style={{ margin: "56px auto 0", textAlign: "center" }}>
          <h2>Ni commission sur votre CA, ni frais cachés</h2>
          <p style={{ color: "var(--muted)" }}>Vos chiffres restent à vous : c'est écrit dans nos <Link to="/cgu">CGU</Link>. Comparatif détaillé et devis Réseau : <Link to="/contact">parlez à un expert</Link>.</p>
        </div></Reveal>
      </div>
    </section>
    <SiteFooter />
  </>);
}
