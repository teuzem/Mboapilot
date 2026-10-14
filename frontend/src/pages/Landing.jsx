import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import StorefrontIcon from "@mui/icons-material/Storefront";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import InsightsIcon from "@mui/icons-material/Insights";
import LockIcon from "@mui/icons-material/Lock";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ShieldIcon from "@mui/icons-material/Shield";
import BoltIcon from "@mui/icons-material/Bolt";
import HubIcon from "@mui/icons-material/Hub";
import SyncIcon from "@mui/icons-material/Sync";
import CategoryIcon from "@mui/icons-material/Category";
import StarIcon from "@mui/icons-material/Star";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import {
  AreaChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
  BarChart, Bar, Cell, PieChart, Pie,
} from "recharts";
import { SiteHeader, SiteFooter, Reveal } from "../components";
import { api, fmt } from "../api";

const spring = { type: "spring", stiffness: 90, damping: 20 };

function useVitrine() {
  const [d, setD] = useState(null);
  const [maj, setMaj] = useState("");
  useEffect(() => {
    const load = () => api.get("/api/vitrine/stats").then((r) => {
      setD(r);
      setMaj(new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    }).catch(() => {});
    load();
    const t = setInterval(load, 45000);
    return () => clearInterval(t);
  }, []);
  return [d, maj];
}

function HeroDash({ d, maj }) {
  const serie = d?.serie30 || [];
  const n1 = d?.serieN1 || [];
  const k = d?.kpis || {};
  const data = serie.map((p, i) => ({ jour: p.jour, n: p.ca, n1: n1[i] ?? null }));
  const objJour = k.obj30 ? Math.round(k.obj30 / Math.max(1, serie.length)) : 0;
  return (
    <div className="dash-float">
      <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.25 }}>
        <div className="dash-card">
          <div className="dc-head"><i /><i /><i />
            <span style={{ marginLeft: 8, fontSize: 12.5, color: "var(--faint)", fontWeight: 600 }}>mboapilot : Réseau Littoral, octobre 2026</span>
            <span className="badge b-green" style={{ marginLeft: "auto" }}><span className="live-dot" style={{ marginRight: 6 }} />En direct{maj ? " : " + maj : ""}</span>
          </div>
          <div className="dc-kpis">
            <div className="dc-kpi"><small>CA : 30 j</small><b>{fmt(k.ca30)} <span style={{ fontSize: 12 }}>FCFA</span></b><span className={k.var30 < 0 ? "down" : "up"}>{k.var30 == null ? "calcul…" : `${k.var30 >= 0 ? "Hausse de +" : "Baisse de "}${k.var30} % contre N-1`}</span><span style={{ color: "var(--faint)", display: "block", marginTop: 2 }}>{fmt(k.nb30)} tickets encaissés</span></div>
            <div className="dc-kpi"><small>Croissance N-1</small><b className={k.var30 < 0 ? "down" : "up"} style={{ fontSize: 24 }}>{k.var30 == null ? "…" : `${k.var30 >= 0 ? "+" : ""}${k.var30} %`}</b><span style={{ color: "var(--faint)" }}>même période, année N-1</span></div>
            <div className="dc-kpi"><small>Panier moyen</small><b>{fmt(k.panier)}</b><span style={{ color: "var(--faint)" }}>FCFA par ticket · marge {k.tauxMarge ?? "…"} %</span></div>
            <div className="dc-kpi"><small>Objectif mois</small><b>{k.objPct ?? "…"} %</b><span className="up">trajectoire tenue</span></div>
          </div>
          <div style={{ padding: "6px 10px 4px", height: 236 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gCA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#635BFF" stopOpacity={0.32} />
                    <stop offset="100%" stopColor="#635BFF" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#EEF1F5" vertical={false} />
                <XAxis dataKey="jour" tick={{ fontSize: 10, fill: "#697386" }} tickFormatter={(j) => j.slice(8) + "/" + j.slice(5, 7)} minTickGap={40} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#697386" }} tickFormatter={(v) => (v / 1e6).toFixed(1) + "M"} width={44} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v, n) => [fmt(v) + " FCFA", n === "n" ? "Cette année" : "Année N-1"]} labelFormatter={(j) => "Jour : " + j} />
                {objJour > 0 && <ReferenceLine y={objJour} stroke="#FFC247" strokeDasharray="7 5" strokeWidth={2} />}
                <Area type="monotone" dataKey="n" stroke="#635BFF" strokeWidth={2.5} fill="url(#gCA)" />
                <Line type="monotone" dataKey="n1" stroke="#7C87A0" strokeWidth={2} strokeDasharray="5 4" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: "flex", gap: 16, padding: "0 16px 12px", fontSize: 12, color: "var(--muted)" }}>
            <span><i style={{ display: "inline-block", width: 14, height: 3, background: "#635BFF", borderRadius: 2, marginRight: 6 }} />Année en cours</span>
            <span><i style={{ display: "inline-block", width: 14, height: 0, borderTop: "2px dashed #B9C0D0", marginRight: 6, verticalAlign: "middle" }} />Année N-1</span>
            <span><i style={{ display: "inline-block", width: 14, height: 0, borderTop: "2px dashed #FFC247", marginRight: 6, verticalAlign: "middle" }} />Objectif jour</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

const LOGOS = [
  ["mtn", "MTN Cameroon"], ["orange", "Orange Cameroun"], ["guinness", "Guinness Cameroun"],
  ["ecobank", "Ecobank Cameroun"], ["tradex", "Tradex"], ["tecno", "Tecno Mobile"],
  ["turkish", "Turkish Airlines"], ["ethiopian", "Ethiopian Airlines"], ["nestle", "Nestlé Cameroun"],
];

export default function Landing() {
  const [d, maj] = useVitrine();
  const [tab, setTab] = useState(0);
  const [cycle, setCycle] = useState(0);
  useEffect(() => {
    const t = setInterval(() => { setTab((p) => (p + 1) % 3); setCycle((c) => c + 1); }, 7000);
    return () => clearInterval(t);
  }, []);
  const TABS = [
    { t: "Connectez", h: "Vos sources branchées en 10 jours", p: "Caisses POS, fichiers CSV d'agences, boutique en ligne : nos connecteurs absorbent vos formats actuels, séparateur point-virgule, remises, prix en FCFA. Premier import contrôlé sous 10 jours, sans changer vos habitudes de caisse.", img: "/img/allee-marche.jpg", leg: "Allée du marché Mokolo, Yaoundé, là où naît la donnée", liv: "Connecteurs POS et CSV posés, premier rapport d'import livré" },
    { t: "Contrôlez", h: "Une donnée propre dès l'entrée", p: "Doublons écartés par idempotence, formats validés, rejets expliqués ligne par ligne. Le taux d'erreur de chaque import s'affiche : vous savez exactement ce qui entre dans vos indicateurs.", img: "/img/commerce.jpg", leg: "Commerce de proximité, Douala, zéro ressaisie, zéro doublon", liv: "Zéro ressaisie manuelle, rapport qualité par import" },
    { t: "Pilotez", h: "La revue hebdo de 15 minutes", p: "Chaque lundi 7h, le rapport est dans votre boîte. Objectifs en pointillés, écarts N-1, alertes sous 90 % : la réunion hebdo se fait sur un écran, et les décisions partent avant la perte.", img: "/img/marche-central.jpg", leg: "Marché Central, Yaoundé, un réseau entier sur un écran", liv: "Rapport auto du lundi et alertes de seuils actives" },
  ];
  return (
    <>
      <SiteHeader />
      <div className="hero">
        <div className="hero-mesh"><i /><i /><i /></div>
        <div className="wrap-wide hero-grid" style={{ position: "relative" }}>
          <div>
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={spring}>
              <span className="eyebrow"><span className="dot" /> Pilotage commercial, Afrique centrale</span>
              <h1>Vos ventes méritent mieux qu'un tableur. <span className="grad">Pilotez-les.</span></h1>
              <p className="sub">MboaPilot collecte vos caisses, agences et commandes en ligne, les sécurise, et les transforme en décisions : <b>en FCFA, en temps réel</b>, du marché Mokolo à votre direction.</p>
              <div className="hero-ctas">
                <Link className="btn btn-brand btn-lg" to="/contact">Démarrer <ArrowForwardIcon /></Link>
                <Link className="btn btn-outline btn-lg" to="/login">Voir la démo live</Link>
              </div>
              <p className="hero-note">Démo sur données réelles, sans carte bancaire, réponse sous 24 h</p>
              <div className="hero-proof">
                <div><b>{d ? fmt(d.nb) : "···"}</b><span>transactions suivies</span></div>
                <div><b>{d ? fmt(d.caM) + " M" : "···"}</b><span>FCFA pilotés</span></div>
                <div><b>{d ? d.regions : "···"}</b><span>régions couvertes</span></div>
              </div>
            </motion.div>
          </div>
          <HeroDash d={d} maj={maj} />
        </div>
        <div className="slant" />
      </div>

      <div className="logos">
        <div className="wrap">
          <p>Ils pilotent leur croissance avec MboaPilot</p>
        </div>
        <div className="logo-wall">
          <div className="logo-track">
            {[...LOGOS, ...LOGOS].map(([src, alt], i) => (
              <img key={i} src={`/img/logos/${src}.png`} alt={alt} title={alt} loading="lazy" />
            ))}
          </div>
        </div>
      </div>

      <section className="block">
        <div className="wrap">
          <Reveal><div className="sec-head center">
            <h2>Une plateforme complète, pas un tableau de plus</h2>
            <p>Six modules qui travaillent ensemble, de la caisse au conseil d'administration.</p>
          </div></Reveal>
          <div className="grid-3">
            {[
              { ic: <StorefrontIcon />, c: "#635BFF", t: "Collecte multi-source", p: "POS avant 8h, CSV d'agences dans l'heure, API e-commerce au quart d'heure. Un point de vente silencieux 24h déclenche une alerte.", k: "Zéro ressaisie", mini: d && <MiniBars data={(d.topRegions || []).slice(0, 5)} /> },
              { ic: <VerifiedUserIcon />, c: "#00C07F", t: "Qualité à la source", p: "Déduplication par idempotence, formats validés, rejets consultables. Le taux d'erreur de chaque import s'affiche en clair.", k: "Donnée de confiance", mini: d && <MiniDonut data={d.canaux || []} /> },
              { ic: <InsightsIcon />, c: "#E09B00", t: "Décisionnel temps réel", p: "CA, volumes, panier moyen, transformation, filtrés par période, région, canal, vendeur. Objectifs en pointillés, écarts N-1.", k: "Décision en 30 s", mini: d && <MiniSpark data={d.serie30 || []} /> },
              { ic: <LockIcon />, c: "#0A2540", t: "Accès verrouillés", p: "Mots de passe forts, 4 rôles au moindre privilège, cloisonnement régional appliqué côté serveur. Chacun ne voit que son périmètre.", k: "Sécurité bancaire" },
              { ic: <NotificationsActiveIcon />, c: "#FF5996", t: "Alertes proactives", p: "Seuils sur vos KPI : décrochage, rupture, écart d'objectif, notifié en minutes par email, in-app, SMS critique.", k: "Réactivité" },
              { ic: <ReceiptLongIcon />, c: "#00B8D4", t: "Audit infalsifiable", p: "Connexions, consultations, exports : journal horodaté, chaîné SHA-256, rétention 5 ans. Conforme loi n° 2024/017.", k: "Prêt pour l'audit" },
            ].map((f, i) => (
              <Reveal key={f.t} delay={(i % 3) * 0.1}>
                <div className="feat">
                  <div className="pic" style={{ background: f.c }}>{f.ic}</div>
                  <h3>{f.t}</h3><p>{f.p}</p>
                  {f.mini && <div className="mini">{f.mini}</div>}
                  <span className="kicker">{f.k}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="block soft">
        <div className="wrap grid-2">
          <Reveal>
            <span className="eyebrow"><span className="dot" /> Le constat</span>
            <h2 style={{ fontSize: "clamp(28px,3.4vw,40px)" }}>Le lundi matin, vous arbitrez sur les chiffres de la semaine dernière.</h2>
            <p style={{ color: "var(--muted)", fontSize: 18 }}>Fichiers ressaisis, caisses jamais consolidées, agences qui envoient quand elles peuvent. Pendant ce temps, une rupture à Deido coûte des centaines de milliers de FCFA avant même d'être vue.</p>
            <p style={{ fontSize: 18 }}><b>MboaPilot inverse la logique :</b> captée à la source, contrôlée à l'entrée, la décision arrive <b>avant</b> la perte.</p>
            <Link className="btn btn-brand" to="/fonctionnalites" style={{ marginTop: 12 }}>Explorer le produit <ArrowForwardIcon /></Link>
          </Reveal>
          <Reveal delay={0.15}>
            <figure className="split-photo" style={{ margin: 0 }}>
              <img src="/img/hero-marche.jpg" alt="Vendeuses au marché, Cameroun" />
              <figcaption><b>+32 % de croissance</b> suivie en direct sur le réseau pilote, marché Mvan, Yaoundé</figcaption>
            </figure>
          </Reveal>
        </div>
      </section>

      <section className="block">
        <div className="wrap">
          <div className="grid-2">
            <Reveal>
              <span className="eyebrow"><span className="dot" /> Intégration</span>
              <h2 style={{ fontSize: "clamp(28px,3.4vw,40px)" }}>Branchez vos sources en un après-midi.</h2>
              <p style={{ color: "var(--muted)", fontSize: 17 }}>Un fichier de configuration, vos formats actuels, et la collecte démarre. Pas de migration, pas de rupture de caisse, vos équipes gardent leurs habitudes.</p>
              <ul className="check-list">
                <li><CheckCircleIcon /> Vos CSV actuels sont acceptés tels quels, mapping assisté</li>
                <li><CheckCircleIcon /> Rejeu automatique en cas de coupure, sans doublon</li>
                <li><CheckCircleIcon /> API documentée pour votre boutique en ligne et votre ERP</li>
              </ul>
              <Link className="btn btn-outline" to="/fonctionnalites">Voir le détail produit <ArrowForwardIcon /></Link>
            </Reveal>
            <Reveal delay={0.12}>
              <div className="code-win">
                <div className="cw-head"><i /><i /><i /><span style={{ marginLeft: 8 }}>mboapilot.yaml</span></div>
                <pre><code><span className="tok-c"># Déclarez vos sources, MboaPilot s'occupe du reste</span>{"\n"}<span className="tok-k">sources</span>:{"\n"}  - <span className="tok-k">nom</span>: <span className="tok-s">"caisses_akwa"</span>{"\n"}    <span className="tok-k">type</span>: <span className="tok-s">pos</span>  <span className="tok-c"># import quotidien avant 8h</span>{"\n"}  - <span className="tok-k">nom</span>: <span className="tok-s">"agences_ouest"</span>{"\n"}    <span className="tok-k">type</span>: <span className="tok-s">csv</span>{"\n"}    <span className="tok-k">separateur</span>: <span className="tok-s">";"</span>  <span className="tok-k">devise</span>: <span className="tok-s">XAF</span>{"\n"}<span className="tok-k">objectifs</span>:{"\n"}  <span className="tok-k">croissance</span>: <span className="tok-n">+10 %</span>  <span className="tok-c"># base N-1 automatique</span>{"\n"}  <span className="tok-k">alerte_seuil</span>: <span className="tok-n">90 %</span>{"\n"}{"\n"}<span className="tok-f">$ mboapilot connecter --verifier</span>{"\n"}<span className="tok-s">3 sources OK : 12 480 lignes contrôlées, 0 doublon</span></code></pre>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="block" id="methode" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <Reveal><div className="sec-head">
            <span className="eyebrow"><span className="dot" /> Déploiement</span>
            <h2>De votre CSV au premier dashboard en 4 semaines</h2>
            <p>Pas de big-bang, pas de jargon : trois mouvements, un livrable chacun.</p>
          </div></Reveal>
          <div className="tabs auto" key={"tabs" + cycle}>
            {TABS.map((t, i) => (
              <button key={t.t} className={i === tab ? "on" : ""} onClick={() => { setTab(i); setCycle((c) => c + 1); }}>0{i + 1} : {t.t}</button>
            ))}
            <span className="tab-progress" key={"bar" + cycle} />
          </div>
          <div className="tab-pane" key={tab}>
            <motion.div initial={{ opacity: 0, x: -18 }} animate={{ opacity: 1, x: 0 }} transition={spring}>
              <h3 style={{ fontSize: 26 }}>{TABS[tab].h}</h3>
              <p style={{ color: "var(--muted)", fontSize: 17 }}>{TABS[tab].p}</p>
              <div className="deliver"><CheckCircleIcon /><span><b>Livrable : </b>{TABS[tab].liv}</span></div>
              <Link className="btn btn-outline" to="/contact" style={{ marginTop: 18 }}>Planifier mon déploiement</Link>
            </motion.div>
            <motion.figure className="split-photo" style={{ margin: 0 }} initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} transition={spring}>
              <img src={TABS[tab].img} alt={TABS[tab].leg} />
              <figcaption>{TABS[tab].leg}</figcaption>
            </motion.figure>
          </div>
        </div>
      </section>

      <section className="block soft">
        <div className="wrap">
          <Reveal>
            <div className="sites-band">
              <span className="eyebrow" style={{ background: "rgba(99,91,255,.25)", color: "#D5D2FF", border: 0 }}><HubIcon style={{ fontSize: 16 }} /> 04 : Échelle, multi-sites et multi-pays</span>
              <h2 style={{ fontSize: "clamp(28px,3.4vw,40px)", marginTop: 14 }}>Un réseau entier, une seule vérité.</h2>
              <p className="lead-light" style={{ fontSize: 17, maxWidth: "62ch" }}>Boutiques, agences, e-commerce, filiales CEMAC : chaque site alimente le même référentiel en FCFA ou XOF. Chaque manager ne voit que son périmètre, la direction voit tout, l'audit voit l'historique.</p>
              <div className="site-stats">
                {[
                  [<HubIcon />, d?.sites?.regions ?? "···", "régions synchronisées chaque nuit"],
                  [<StorefrontIcon />, d?.sites?.pdv ?? "···", "points de vente connectés en direct"],
                  [<SyncIcon />, d?.sites?.canaux ?? "···", "canaux unifiés, zéro ressaisie"],
                  [<CategoryIcon />, d?.sites?.produits ?? "···", "produits suivis au ticket près"],
                ].map(([ic, val, label]) => (
                  <div key={label}>
                    <span className="site-ic">{ic}</span>
                    <b>{val}</b>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
              <div className="sites-cta">
                <Link className="btn btn-brand" to="/login">Explorer le réseau en démo <ArrowForwardIcon /></Link>
                <small>Vue nationale, vue région, vue boutique : trois clics, trois niveaux.</small>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="block dark">
        <div className="wrap">
          <Reveal><div className="sec-head">
            <span className="eyebrow"><span className="dot" /> 05 : Confiance, sécurité et conformité</span>
            <h2>Vos chiffres sont stratégiques. Gardés comme tels.</h2>
            <p>Hébergés au Cameroun, conformes à la loi n° 2024/017. Chaque mesure ci-dessous est contractuelle et vérifiable par vos auditeurs.</p>
          </div></Reveal>
          <div className="secu-grid">
            {[["Identités fortifiées", "Mots de passe complexes, sessions de 30 minutes, verrouillage après 5 échecs, reset par lien unique de 30 minutes."],
              ["Moindre privilège réel", "4 rôles, périmètres géographiques appliqués côté serveur, jamais contournables depuis le navigateur. Désactivation immédiate."],
              ["Traçabilité totale", "Chaque accès journalisé, horodaté UTC, chaîné SHA-256. Rétention 5 ans, rapport d'audit en moins de 4 heures."]].map(([t, p], i) => (
              <Reveal key={t} delay={i * 0.1}><div className="secu">
                <div className="pic"><LockIcon /></div><h3>{t}</h3><p>{p}</p>
              </div></Reveal>
            ))}
          </div>
          <Reveal><div className="comp-badges">
            <span><ShieldIcon /> Hébergé au Cameroun</span>
            <span><ShieldIcon /> Conforme loi n° 2024/017</span>
            <span><BoltIcon /> Verrou anti force brute, sessions 30 min</span>
            <span><CheckCircleIcon /> Journal 5 ans, rapport sous 4h</span>
          </div></Reveal>
          <Reveal><div style={{ marginTop: 30, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link className="btn btn-white" to="/securite">Lire le dossier sécurité <ArrowForwardIcon /></Link>
            <Link className="btn" to="/contact" style={{ color: "#fff", boxShadow: "inset 0 0 0 1px rgba(255,255,255,.4)" }}>Faire auditer par nos équipes</Link>
          </div></Reveal>
        </div>
      </section>

      <section className="block">
        <div className="wrap">
          <Reveal><div className="sec-head center">
            <span className="eyebrow"><span className="dot" /> 06 : Tarifs</span>
            <h2>Un prix de PME, une exigence de groupe</h2>
            <p>Facturé en FCFA, sans commission sur votre chiffre d'affaires. Hébergement Cameroun et formation inclus, toujours.</p>
          </div></Reveal>
          <div className="grid-3">
            <Reveal><div className="price"><h3>Essentiel</h3>
              <p style={{ color: "var(--muted)", fontSize: 14, margin: "0 0 6px" }}>Pour tester le pilotage sur un point de vente.</p>
              <div className="amount">89 000 <small>FCFA / mois</small></div>
              <ul>{["1 point de vente et CSV agences", "Dashboard KPI et filtres", "3 utilisateurs, rôles inclus", "Exports et rapport PDF"].map((x) => <li key={x}><CheckCircleIcon />{x}</li>)}</ul>
              <Link className="btn btn-outline btn-block" to="/tarifs">Choisir</Link></div></Reveal>
            <Reveal delay={0.1}><div className="price hot"><span className="ribbon">Le plus choisi</span><h3>Pilotage</h3>
              <p style={{ color: "var(--muted)", fontSize: 14, margin: "0 0 6px" }}>Pour diriger un réseau régional complet.</p>
              <div className="amount">249 000 <small>FCFA / mois</small></div>
              <ul>{["Sources illimitées POS, CSV, API", "Alertes seuils et rapports auto", "15 utilisateurs, 4 rôles", "Audit 5 ans, support 8h"].map((x) => <li key={x}><CheckCircleIcon />{x}</li>)}</ul>
              <Link className="btn btn-brand btn-block" to="/contact">Demander une démo</Link></div></Reveal>
            <Reveal delay={0.2}><div className="price"><h3>Réseau</h3>
              <p style={{ color: "var(--muted)", fontSize: 14, margin: "0 0 6px" }}>Groupes multi-filiales, espace CEMAC.</p>
              <div className="amount">Sur devis</div>
              <ul>{["Multi-filiales, multi-pays CEMAC", "Interfaçage ERP bidirectionnel", "SLA 99,5 % et RSSI attitré"].map((x) => <li key={x}><CheckCircleIcon />{x}</li>)}</ul>
              <Link className="btn btn-outline btn-block" to="/contact">Parler à un expert</Link></div></Reveal>
          </div>
          <Reveal><div className="guarantee">
            <div><EventAvailableIcon /><span><b>Sans engagement</b><span>30 jours de préavis, résiliation simple, sans frais cachés.</span></span></div>
            <div><CloudDownloadIcon /><span><b>Vos données restent à vous</b><span>Export complet à tout moment, y compris à la résiliation.</span></span></div>
            <div><SupportAgentIcon /><span><b>Support en français</b><span>Équipe à Douala, réponse sous 8h ouvrées en offre Pilotage.</span></span></div>
          </div></Reveal>
        </div>
      </section>

      <section className="block soft" id="avis">
        <div className="wrap">
          <Reveal><div className="sec-head">
            <span className="eyebrow"><span className="dot" /> 07 : Clients</span>
            <h2>Des directions qui ont repris la main</h2>
            <p>Distribution, agroalimentaire, management régional : ils lisent le même écran chaque lundi.</p>
          </div></Reveal>
          <div className="quotes">
            {[
              ["NK", "#635BFF", "Le lundi 8h, je sais ce que chaque boutique a vendu le week-end. Avant, je le savais le jeudi, trop tard.", "Ngo Bell K.", "Directrice réseau, distribution, Douala"],
              ["TD", "#00C07F", "L'alerte nous a signalé Bafoussam un mardi. Le vendredi, l'opération correctrice avait compensé. C'est ça, la valeur.", "Tchinda D.", "Manager régional Ouest"],
              ["AM", "#FF5996", "Nos auditeurs ont validé le journal en une demi-journée. Traçabilité totale, zéro tableur.", "Amadou M.", "DAF, agroalimentaire, Garoua"],
            ].map(([ini, c, txt, nom, role], i) => (
              <Reveal key={nom} delay={i * 0.1}><div className="quote">
                <div className="stars">{[0, 1, 2, 3, 4].map((s) => <StarIcon key={s} />)}</div>
                <p>« {txt} »</p>
                <div className="who"><span className="avatar" style={{ background: c }}>{ini}</span><span><b>{nom}</b><span>{role}</span></span></div>
              </div></Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="block" id="faq">
        <div className="wrap" style={{ maxWidth: 860 }}>
          <Reveal><div className="sec-head">
            <span className="eyebrow"><span className="dot" /> 08 : FAQ</span>
            <h2>Les questions de dirigeants</h2>
            <p>Compatibilité, délais, coupures, comptabilité, périmètres : les réponses franches.</p>
          </div>
          <div className="faq">
            {[["Nos données sont-elles en sécurité ?", "Au Cameroun, base cloisonnée : mots de passe forts, moindre privilège, filtrage serveur, journal infalsifiable. Conformité loi n° 2024/017."],
              ["Nos caisses et fichiers sont-ils compatibles ?", "Oui : CSV au point-virgule, connecteurs POS, API e-commerce. Doublons écartés automatiquement, rejets expliqués."],
              ["En combien de temps sommes-nous opérationnels ?", "Quatre semaines : indicateurs (semaine 1), sources (semaine 2), formation (semaine 3), première revue accompagnée (semaine 4)."],
              ["Et si internet coupe en boutique ?", "File locale et rejeu automatique à la reconnexion, sans perte ni doublon. Relances avec back-off exponentiel."],
              ["Peut-on alimenter la comptabilité ?", "Exports journalisés, rapports PDF signés, et interfaçage ERP bidirectionnel avec réconciliation dans l'offre Réseau."],
              ["Combien d'utilisateurs et de sites ?", "De 3 utilisateurs sur un point de vente jusqu'aux réseaux multi-filiales CEMAC, chaque périmètre reste cloisonné côté serveur."],
            ].map(([q, a]) => <details key={q}><summary>{q}<span className="plus">+</span></summary><p>{a}</p></details>)}
          </div></Reveal>
        </div>
      </section>

      <div className="wrap">
        <Reveal><div className="cta-band">
          <i style={{ width: 480, height: 300, left: -120, top: -80, background: "#635BFF" }} />
          <i style={{ width: 420, height: 280, right: -100, bottom: -100, background: "#00D4FF" }} />
          <h2>Prêt à dominer votre marché ?</h2>
          <p style={{ maxWidth: "56ch", margin: "0 auto 28px" }}>30 minutes sur vos propres chiffres : on connecte un échantillon, vous repartez avec votre premier tableau de bord.</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", position: "relative" }}>
            <Link className="btn btn-brand btn-lg" to="/contact" style={{ background: "#fff", color: "var(--ink)" }}>Réserver ma démo</Link>
            <Link className="btn btn-lg" to="/login" style={{ color: "#fff", boxShadow: "inset 0 0 0 1px rgba(255,255,255,.4)" }}>Tester la démo live</Link>
          </div>
          <div className="micro-garanties">
            <span><CheckCircleIcon /> Sans carte bancaire</span>
            <span><CheckCircleIcon /> Réponse sous 24 h</span>
            <span><CheckCircleIcon /> Vos données restent à vous</span>
          </div>
        </div></Reveal>
      </div>
      <SiteFooter />
    </>
  );
}

function MiniBars({ data }) {
  return (
    <div style={{ height: 110 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 0, right: 30 }}>
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="region" tick={{ fontSize: 10 }} width={78} axisLine={false} tickLine={false} />
          <Bar dataKey="ca" radius={[0, 4, 4, 0]}>
            {data.map((_, i) => <Cell key={i} fill={i === 0 ? "#635BFF" : "#D9D6FF"} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
function MiniDonut({ data }) {
  const cols = { POS: "#0A2540", Agence: "#635BFF", "E-commerce": "#00D4FF" };
  return (
    <div style={{ height: 110, display: "flex", alignItems: "center", gap: 12 }}>
      <ResponsiveContainer width={110} height={110}>
        <PieChart><Pie data={data} dataKey="ca" nameKey="canal" innerRadius={32} outerRadius={50} paddingAngle={3}>
          {data.map((x) => <Cell key={x.canal} fill={cols[x.canal] || "#C2C9D4"} />)}
        </Pie></PieChart>
      </ResponsiveContainer>
      <div style={{ fontSize: 12, display: "grid", gap: 4 }}>
        {data.map((x) => <span key={x.canal}><i style={{ display: "inline-block", width: 9, height: 9, borderRadius: 3, background: cols[x.canal], marginRight: 6 }} />{x.canal}</span>)}
      </div>
    </div>
  );
}
function MiniSpark({ data }) {
  return (
    <div style={{ height: 110 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data.slice(-60)} margin={{ left: 0, right: 0, top: 4, bottom: 0 }}>
          <defs><linearGradient id="gSpark" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFC247" stopOpacity={0.5} /><stop offset="100%" stopColor="#FFC247" stopOpacity={0.02} />
          </linearGradient></defs>
          <Area type="monotone" dataKey="ca" stroke="#E09B00" strokeWidth={2} fill="url(#gSpark)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
