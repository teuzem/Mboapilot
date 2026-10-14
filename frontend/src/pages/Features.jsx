import { Link } from "react-router-dom";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { SiteHeader, SiteFooter, Reveal } from "../components";

const BLOCS = [
  { kick: "01 · Collecte", t: "Toutes vos ventes, captées à la source", p: "Caisses POS importées avant 8h, CSV d'agences traités dans l'heure sur espace chiffré, API e-commerce rafraîchie au quart d'heure avec file de récupération. Point de vente silencieux 24h : alerte automatique.", img: "/img/allee-marche.jpg", leg: "Allée du marché Mokolo, là où naît la donnée", checks: ["Import POS quotidien avant 8h", "CSV/SFTP chiffré, rapport d'erreurs", "API e-commerce + file de reprise"] },
  { kick: "02 · Qualité", t: "Propre à l'entrée, fiable à la sortie", p: "Déduplication par clé transaction + source + date, validation des formats, rejets consultables, taux d'erreur affiché. Ce qui entre dans MboaPilot est déjà décidable.", img: "/img/commerce.jpg", leg: "Commerce de proximité, Douala, zéro ressaisie", checks: ["Idempotence garantie (ref unique)", "Rejets expliqués ligne par ligne", "Taux d'erreur affiché par import"] },
  { kick: "03 · Décisionnel", t: "Le tableau que la direction lit vraiment", p: "CA, volumes, panier moyen, transformation, avec objectifs en pointillés, comparatifs N-1, drill-down vendeur, exports PDF signés. Filtres persistants, réponse sous 3 secondes.", img: "/img/point-vente.jpg", leg: "Point de vente pilote, chaque ticket compte", checks: ["Seuils objectifs + écarts N-1", "Drill-down jusqu'au vendeur", "PDF signé + Excel journalisé"], cta: true },
  { kick: "04 · Sécurité", t: "Verrouillé, alerté, traçé", p: "Mots de passe forts, 4 rôles au moindre privilège, cloisonnement côté serveur. Alertes de seuils, rapports du lundi 7h, journal d'audit infalsifiable chaîné SHA-256.", img: "/img/marche-central.jpg", leg: "Marché Central, Yaoundé, un réseau entier sous contrôle", checks: ["Verrou anti force brute et sessions courtes", "Journal append-only, rétention 5 ans", "Conforme loi n° 2024/017"] },
];

export default function Features() {
  return (<>
    <SiteHeader />
    <div className="page-hero"><div className="hero-mesh"><i /><i /><i /></div>
      <div className="wrap" style={{ position: "relative" }}>
        <span className="eyebrow"><span className="dot" /> Produit</span>
        <h1>Six modules. Zéro ressaisie.</h1>
        <p className="sub">Ce que MboaPilot fait chaque jour pour vos équipes, du caissier à la direction.</p>
      </div>
    </div>
    <section className="block" style={{ paddingTop: 40 }}>
      <div className="wrap" style={{ display: "grid", gap: 88 }}>
        {BLOCS.map((b, i) => {
          const texte = (
            <Reveal key={"t" + b.kick}>
              <span className="eyebrow"><span className="dot" /> {b.kick}</span>
              <h2 style={{ fontSize: "clamp(26px,3vw,36px)" }}>{b.t}</h2>
              <p style={{ color: "var(--muted)", fontSize: 17 }}>{b.p}</p>
              {b.checks.map((c) => <div className="deliver" key={c}><CheckCircleIcon /><span>{c}</span></div>)}
              {b.cta && <Link className="btn btn-brand" to="/login" style={{ marginTop: 18 }}>Ouvrir la démo live <ArrowForwardIcon /></Link>}
            </Reveal>
          );
          const photo = (
            <Reveal key={"p" + b.kick} delay={0.12}>
              <figure className="split-photo" style={{ margin: 0 }}>
                <img src={b.img} alt={b.leg} />
                <figcaption>{b.leg}</figcaption>
              </figure>
            </Reveal>
          );
          return <div className="grid-2" key={b.kick}>{i % 2 ? [photo, texte] : [texte, photo]}</div>;
        })}
      </div>
    </section>
    <div className="wrap">
      <Reveal><div className="cta-band">
        <h2>Voyez-le sur vos chiffres.</h2>
        <p style={{ maxWidth: "54ch", margin: "0 auto 28px" }}>Démo de 30 minutes sur un échantillon de vos données.</p>
        <Link className="btn btn-brand btn-lg" to="/contact" style={{ background: "#fff", color: "var(--ink)", position: "relative" }}>Réserver ma démo</Link>
      </div></Reveal>
    </div>
    <SiteFooter />
  </>);
}
