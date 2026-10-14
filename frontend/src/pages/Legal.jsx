import { Link } from "react-router-dom";
import { SiteHeader, SiteFooter } from "../components";

const PAGES = {
  "mentions-legales": ["Mentions légales", [
    ["1 · Éditeur", "MboaPilot SARL, Bonanjo, Douala, Cameroun. Contact : contact@mboapilot.cm · +237 6 90 12 34 56. Directrice de la publication : la Direction."],
    ["2 · Hébergement", "Données hébergées au Cameroun sur infrastructure dédiée. La démonstration publique utilise un jeu synthétique (transactions générées, prix FCFA réalistes) : aucune donnée personnelle réelle."],
    ["3 · Propriété intellectuelle", "Nom, logo, design, code et contenus : propriété exclusive de MboaPilot SARL. Visuels : licences libres (Wikimedia Commons, Unsplash). Toute reproduction commerciale sans accord écrit est interdite."],
    ["4 · Droit applicable", "Droit camerounais, dont la loi n° 2024/017 sur la cybersécurité et la protection des données. Litige : médiation à Douala avant toute action."],
  ]],
  confidentialite: ["Confidentialité", [
    ["1 · Données traitées", "Ventes (FCFA, produits, points de vente) pour votre pilotage uniquement. Comptes (login, rôle, périmètre, empreintes) pour l'authentification. Journaux (horodatage UTC, IP) pour la sécurité. Messages de contact pour la relation commerciale."],
    ["2 · Jamais", "Ni revente, ni prospection pour tiers, ni transfert hors Cameroun sans consentement écrit, ni statistique mutualisée sans anonymisation."],
    ["3 · Durées & droits", "Audit : 5 ans (obligation légale) puis suppression. Contact : 3 ans. Comptes : relation + 1 an. Accès, rectification, suppression, opposition : contact@mboapilot.cm, réponse sous 30 jours."],
    ["4 · Sécurité", "Moindre privilège, filtrage serveur, sessions courtes, sauvegardes chiffrées, voir le dossier sécurité. Incident avéré : notification sous 72h."],
  ]],
  cgu: ["Conditions d'utilisation", [
    ["1 · Objet & accès", "Suivi automatisé et sécurisé des ventes : collecte, dashboards FCFA, alertes, audit. Compte nominatif et personnel ; toute compromission suspectée se signale sous 24h."],
    ["2 · Vos responsabilités", "Données licites et exactes. Respect des périmètres : tout contournement du cloisonnement suspend le compte. Pas d'extraction massive hors exports prévus."],
    ["3 · Nos engagements", "Disponibilité cible 99,5 % (Réseau), reprise sans perte en cas de coupure, support en français 8–48h selon l'offre, export complet de vos données à tout moment et à la résiliation (30 jours)."],
    ["4 · Tarifs", "Prix FCFA affichés sur la page Tarifs, révisables avec 60 jours de préavis. Zéro commission sur votre CA, zéro frais caché."],
    ["5 · Responsabilité", "MboaPilot éclaire la décision, vous la prenez : les arbitrages restent sous votre responsabilité, plafonnée à 12 mois d'abonnement. Droit camerounais."],
  ]],
};

export default function Legal({ page }) {
  const [titre, blocs] = PAGES[page] || PAGES["mentions-legales"];
  return (<>
    <SiteHeader />
    <div className="page-hero"><div className="hero-mesh"><i /><i /><i /></div>
      <div className="wrap" style={{ position: "relative" }}>
        <span className="eyebrow"><span className="dot" /> Légal</span>
        <h1>{titre}</h1>
        <p className="sub">Dernière mise à jour : 13 octobre 2026.</p>
      </div>
    </div>
    <section className="block" style={{ paddingTop: 32 }}>
      <div className="wrap prose">
        {blocs.map(([h, p]) => <div key={h}><h2>{h}</h2><p>{p}</p></div>)}
        <p style={{ marginTop: 32 }}>Une question ? <Link to="/contact">Contactez-nous</Link>.</p>
      </div>
    </section>
    <SiteFooter />
  </>);
}
