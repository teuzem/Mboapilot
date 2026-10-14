import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

export function Logo({ light = false }) {
  return (
    <Link className="wordmark" to="/" style={light ? { color: "#fff" } : undefined}>
      <img src="/logo.svg" alt="MboaPilot" />
      <b style={light ? { color: "#fff" } : undefined}>mboapilot</b>
    </Link>
  );
}

export function SiteHeader() {
  const [solid, setSolid] = useState(false);
  useEffect(() => {
    const f = () => setSolid(window.scrollY > 16);
    window.addEventListener("scroll", f, { passive: true });
    f();
    return () => window.removeEventListener("scroll", f);
  }, []);
  return (
    <>
      <div className="announce">
        Nouveau : <b>alertes SMS critiques</b> et rapports du lundi 7h inclus dans l'offre Pilotage
      </div>
      <header className={"site-head" + (solid ? " solid" : "")}>
        <div className="wrap bar">
          <Logo />
          <nav className="site-nav">
            <Link to="/fonctionnalites">Produit</Link>
            <Link to="/#methode">Méthode</Link>
            <Link to="/tarifs">Tarifs</Link>
            <Link to="/securite">Sécurité</Link>
            <Link to="/contact">Contact</Link>
          </nav>
          <div className="head-actions">
            <Link className="btn btn-ghost" to="/login">Se connecter</Link>
            <Link className="btn btn-brand" to="/contact">Démarrer</Link>
          </div>
        </div>
      </header>
    </>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-foot">
      <div className="wrap">
        <div className="foot-grid">
          <div>
            <Logo />
            <p style={{ color: "var(--muted)", marginTop: 14, maxWidth: "32ch" }}>
              Le pilotage commercial pensé pour l'Afrique : données FCFA temps réel, sécurité de niveau bancaire.
            </p>
            <p style={{ color: "var(--faint)", fontSize: 13 }}>Bonanjo, Douala, Cameroun</p>
          </div>
          <div>
            <h4>Produit</h4>
            <Link to="/fonctionnalites">Fonctionnalités</Link>
            <Link to="/tarifs">Tarifs</Link>
            <Link to="/securite">Sécurité</Link>
            <Link to="/login">Espace client</Link>
          </div>
          <div>
            <h4>Ressources</h4>
            <Link to="/#methode">Méthode de déploiement</Link>
            <Link to="/#avis">Avis clients</Link>
            <Link to="/#faq">FAQ</Link>
            <Link to="/contact">Demander une démo</Link>
          </div>
          <div>
            <h4>Légal</h4>
            <Link to="/mentions-legales">Mentions légales</Link>
            <Link to="/confidentialite">Confidentialité</Link>
            <Link to="/cgu">CGU</Link>
          </div>
        </div>
        <div className="foot-bottom">
          <span>© 2026 MboaPilot SARL, Douala, Cameroun. Tous droits réservés.</span>
          <span><span className="live-dot" style={{ marginRight: 8 }} />Tous systèmes opérationnels</span>
          <span>FCFA, données hébergées au Cameroun</span>
        </div>
      </div>
    </footer>
  );
}

export function Reveal({ children, delay = 0, className = "" }) {
  const [vis, setVis] = useState(false);
  const ref = (n) => {
    if (!n) return;
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && (setVis(true), io.disconnect())),
      { threshold: 0.12 }
    );
    io.observe(n);
  };
  return (
    <div ref={ref} className={className} style={{
      opacity: vis ? 1 : 0, transform: vis ? "none" : "translateY(26px)",
      transition: `opacity .7s var(--spring) ${delay}s, transform .7s var(--spring) ${delay}s`,
    }}>{children}</div>
  );
}
