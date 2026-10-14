# MboaPilot — Dossier technique & guide démo (Sprint 1 reconstruit)

**Produit : MboaPilot** — *Vos ventes méritent mieux qu'un tableur. Pilotez-les.*
**Stack : React 19 + Vite + Recharts + Material Icons + Framer Motion · API Flask + SQLite · 100 % hors-ligne après build.**
Lancement : `LANCER.bat` (ou `python app.py`) → http://127.0.0.1:5000 · Rebuild front : `BUILD_FRONT.bat`.

## 1. Positionnement (charte d'équipe, art. 2)
La valeur = la **décision**, pas la consolidation. Le Sprint 1 officiel (collecte + auth, 32 SP réels) n'était pas démontrable par un manager :
le périmètre livré ajoute le noyau décisionnel US-301/302 + US-104 (qualité à la source) + noyau US-501 (journal des connexions) ≈ 48 SP.

## 2. Architecture
```
app.py               # API JSON /api/* + serving frontend/dist (aucun template serveur)
frontend/            # React SPA (react-router) : vitrine + espace client
  src/pages/         # Landing, Features, Pricing, Security, Contact, Legal,
                     # Login, Mfa, Reset, AppLayout, Dashboard, Imports, Users, Audit, Rapport
  src/components.jsx # Logo wordmark, header, footer, Reveal, Counter
  src/theme.css      # Design system flat (tokens esprit Stripe)
  public/img/        # 7 photos 100 % contexte camerounais (Commons, licences libres, vérifiées)
sales.db             # sales (46 953 lignes, 699,9 M FCFA, marge brute 196,5 M via cout_unit, 24 mois N/N-1) · users · imports ·
                     # audit_logs (SHA-256 chaîné) · reset_tokens · messages
generate_data.py     # régénère le seed Cameroun (10 régions, 17 PDV, 24 produits FCFA, coûts et marges par famille)
migrate_marge.py     # migration cout_unit sur base existante (conserve users, imports, audit)
test_api.py          # 43 tests verts : vitrine, auth simple, marges, cloisonnement, lockout, reset…
```
Sécurité (Sprint 1, volontairement simple) : login + mot de passe ≥ 12 complexes (pbkdf2 600k), sessions 30 min,
verrou 5→15 min / 10→définitif, reset unique 30 min, RBAC + périmètre **côté serveur**, audit append-only, exports journalisés.
MFA/TOTP (US-202) et récit génératif : reportés au Sprint 2 par décision de simplification (tracée). Recette : 43 tests verts.

## 3. Design — clone d'esprit Stripe, zéro effet « IA »
Tokens : encre `#0A2540`, muted `#425466`, brand `#635BFF`, fond blanc / `#F6F9FC`, bordures `#E6EBF1`, Inter, radius 8, ombres douces.
Wordmark texte simple `mboapilot` (façon Stripe). Sections : bandeau annonce, header flouté, hero mesh + **dashboard live (vraies données Recharts)**,
logos clients texte, grille modules avec mini-charts réels, split photos, onglets méthode (livrable par étape — pas de steps génériques),
bandeau sombre sécurité, tarifs, avis, FAQ, CTA mesh, footer 4 colonnes. Dashboard : seuils `ReferenceLine`, deltas N-1/objectif, récit auto, barres vendeurs.
Photos : marchés et commerces camerounais vérifiés visuellement, mur de 9 vrais logos (MTN, Orange, Guinness, Ecobank, Tradex, Tecno, Turkish, Ethiopian, Nestlé, tous présents au Cameroun, gris au repos et couleurs au survol), aucune image européenne, aucun tiret cadratin dans les textes.

## 4. Guide démo (10 min, tout en 1 clic, sans MFA)
1. `/` : hero live (CA 30 j, croissance N-1, panier et marge, objectif), courbe N / N-1 / objectif, métriques statiques définitives.
2. Page `/login`, panneau **Connexion démo en 1 clic** : `demo` (vue nationale), `commercial` (Littoral, preuve cloisonnement), `manager`, `admin`, `auditeur`.
3. Dashboard : 5 cartes (CA, marge brute, transactions, panier, transformation), 4 visualisations Recharts, drill vendeur, exports.
4. Imports : réimporter `data/ventes_agences.csv` → doublons écartés, coûts recalculés.
5. Imports : réimporter `data/ventes_agences.csv` → doublons écartés, coûts recalculés. 6. 5 mauvais mdp → verrou (puis Admin débloque).
7. Journal d'audit : tout y est. 8. Rapport → Imprimer-PDF.

## 5. Limites connues → Sprint 2
SFTP-TLS simulé (dépôt local), pas de SMTP (lien affiché), rapport via impression, API e-commerce OAuth2 (US-102),
relances back-off (US-106), MFA/TOTP (US-202), récit génératif, bcrypt natif si exigé. Vélocité ~48 SP > cible 25-30 : à recadrer en rétrospective.
