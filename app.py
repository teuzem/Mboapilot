# -*- coding: utf-8 -*-
"""MboaPilot — Backend API (Flask) + serving du frontend React (frontend/dist).

Frontend : React + Vite (dossier frontend/). L'API est 100 % JSON sous /api/*.
Le catch-all sert le SPA pour toutes les autres routes.
Lancement :  python app.py  ->  http://127.0.0.1:5000
Rebuild frontend :  BUILD_FRONT.bat  (ou npm run build dans frontend/)
Comptes : admin / manager / commercial / auditeur (mots de passe >= 12 car.).
"""
import csv
import hashlib
import io
import os
import re
import secrets
import sqlite3
import random
from datetime import datetime, timedelta
from functools import wraps
from pathlib import Path

import pyotp
from flask import Flask, Response, jsonify, request, session, g, send_from_directory, abort
from werkzeug.security import generate_password_hash, check_password_hash

BASE = Path(__file__).resolve().parent
DB = BASE / "sales.db"
DIST = BASE / "frontend" / "dist"

app = Flask(__name__)
app.secret_key = os.environ.get("MBOA_SECRET", secrets.token_hex(32))
app.permanent_session_lifetime = timedelta(minutes=30)
app.config.update(SESSION_COOKIE_HTTPONLY=True, SESSION_COOKIE_SAMESITE="Lax")

# ---------- DB ----------
def db():
    if "cx" not in g:
        g.cx = sqlite3.connect(DB)
        g.cx.row_factory = sqlite3.Row
    return g.cx

@app.teardown_appcontext
def close_cx(_e=None):
    cx = g.pop("cx", None)
    if cx is not None:
        cx.close()

def audit(acteur, action, ressource="", resultat="OK"):
    cx = db()
    ip = request.remote_addr or "-"
    prev = cx.execute("SELECT empreinte FROM audit_logs ORDER BY id DESC LIMIT 1").fetchone()
    prev = prev["empreinte"] if prev else "GENESIS"
    raw = f"{prev}|{datetime.utcnow().isoformat()}|{acteur}|{ip}|{action}|{ressource}|{resultat}"
    emp = hashlib.sha256(raw.encode()).hexdigest()
    cx.execute("INSERT INTO audit_logs(acteur,ip,action,ressource,resultat,empreinte) VALUES(?,?,?,?,?,?)",
               (acteur, ip, action, ressource, resultat, emp))
    cx.commit()

def init_users():
    cx = sqlite3.connect(DB)
    cx.row_factory = sqlite3.Row
    cx.execute("""CREATE TABLE IF NOT EXISTS messages(
      id INTEGER PRIMARY KEY AUTOINCREMENT, horo TEXT DEFAULT (datetime('now')),
      nom TEXT, entreprise TEXT, email TEXT, tel TEXT, profil TEXT, message TEXT)""")
    defs = [
        ("admin", "Administrateur", "Admin", "National", "MboaPilot-Admin-2026!"),
        ("manager", "Manager Centre", "Manager", "Centre", "MboaPilot-Mgr-2026!"),
        ("commercial", "Commercial Littoral", "Commercial", "Littoral", "MboaPilot-Com-2026!"),
        ("auditeur", "Auditeur Interne", "Auditeur", "National", "MboaPilot-Audit-2026!"),
        ("demo", "Démo Jury", "Manager", "National", "Mboa-Demo-2026!"),
    ]
    for login, nom, role, perim, pwd in defs:
        row = cx.execute("SELECT id FROM users WHERE login=?", (login,)).fetchone()
        h = generate_password_hash(pwd, method="pbkdf2:sha256:600000")
        if row is None:
            cx.execute("INSERT INTO users(login,nom,role,perimetre,hash,mfa_secret) VALUES(?,?,?,?,?,NULL)",
                       (login, nom, role, perim, h))
        else:
            cx.execute("UPDATE users SET hash=?, role=?, perimetre=?, mfa_secret=NULL WHERE login=?",
                       (h, role, perim, login))
    cx.commit()
    return {r["login"]: r["mfa_secret"] for r in cx.execute("SELECT login, mfa_secret FROM users").fetchall()}

# Taux de marge brute par famille (contexte Cameroun, réaliste Sprint 1)
TAUX_MARGE = {"Alimentaire": 0.22, "Agricole": 0.38, "Boissons": 0.30,
              "Textile": 0.45, "Cosmetique": 0.50, "Equipement": 0.18}

def cout_for(famille, montant):
    return round((montant or 0) * (1 - TAUX_MARGE.get(famille, 0.25)))

# ---------- Gardes ----------
def login_required(f):
    @wraps(f)
    def w(*a, **k):
        if "user" not in session:
            return jsonify({"message": "Session expirée. Reconnectez-vous."}), 401
        return f(*a, **k)
    return w

def roles(*r):
    def deco(f):
        @wraps(f)
        def w(*a, **k):
            if session.get("role") not in r:
                return jsonify({"message": "Habilitation insuffisante."}), 403
            return f(*a, **k)
        return w
    return deco

def filtre_perimetre():
    role, perim = session.get("role"), session.get("perimetre")
    if role in ("Admin", "Auditeur"):
        return "", []
    if role == "Manager" and perim == "National":
        return "", []
    return " AND region = ?", [perim]

def profil_json(u):
    return {"login": u["login"], "nom": u["nom"], "role": u["role"], "perimetre": u["perimetre"]}

# ---------- Auth JSON ----------
@app.route("/api/auth/me")
def auth_me():
    if "user" not in session:
        return jsonify({"message": "Non connecté."}), 401
    return jsonify(session_user())

def session_user():
    return {"login": session["user"], "nom": session.get("nom"),
            "role": session.get("role"), "perimetre": session.get("perimetre")}

@app.route("/api/auth/demo-secrets")
def auth_demo_secrets():
    """Facilité de démonstration (soutenance) : les 5 comptes démo en 1 clic.
    À désactiver en production (MBOA_DEMO=0)."""
    if os.environ.get("MBOA_DEMO", "1") != "1":
        return jsonify({"message": "Mode démo désactivé."}), 403
    rows = db().execute(
        "SELECT login, role, perimetre FROM users WHERE login IN ('admin','manager','commercial','auditeur','demo')").fetchall()
    mdp = {"admin": "MboaPilot-Admin-2026!", "manager": "MboaPilot-Mgr-2026!",
           "commercial": "MboaPilot-Com-2026!", "auditeur": "MboaPilot-Audit-2026!",
           "demo": "Mboa-Demo-2026!"}
    return jsonify({"comptes": [
        {"login": r["login"], "role": r["role"], "perimetre": r["perimetre"],
         "password": mdp.get(r["login"])}
        for r in rows]})

@app.route("/api/auth/login", methods=["POST"])
def auth_login():
    d = request.get_json(force=True, silent=True) or {}
    lg = (d.get("login") or "").strip()
    pwd = d.get("password") or ""
    cx = db()
    u = cx.execute("SELECT * FROM users WHERE login=? AND actif=1", (lg,)).fetchone()
    now = datetime.utcnow()
    if not u:
        audit(lg or "?", "connexion", "login", "KO-inconnu")
        return jsonify({"message": "Identifiants invalides."}), 401
    if u["bloque_def"]:
        audit(lg, "connexion", "login", "KO-bloque-def")
        return jsonify({"message": "Compte bloqué définitivement. Contactez l'administrateur."}), 403
    bj = u["bloque_jusqua"]
    if bj and now < datetime.fromisoformat(bj):
        audit(lg, "connexion", "login", "KO-verrouille")
        return jsonify({"message": f"Compte verrouillé jusqu'à {bj} UTC."}), 403
    if not check_password_hash(u["hash"], pwd):
        ech = (u["echecs"] or 0) + 1
        if ech >= 10:
            cx.execute("UPDATE users SET echecs=?, bloque_def=1 WHERE id=?", (ech, u["id"]))
            msg = "10 échecs : compte bloqué définitivement."
        elif ech >= 5:
            jusqua = (now + timedelta(minutes=15)).isoformat()
            cx.execute("UPDATE users SET echecs=?, bloque_jusqua=? WHERE id=?", (ech, jusqua, u["id"]))
            msg = "5 échecs : verrouillage 15 min."
        else:
            cx.execute("UPDATE users SET echecs=? WHERE id=?", (ech, u["id"]))
            msg = f"Identifiants invalides ({ech}/5 avant verrouillage)."
        cx.commit()
        audit(lg, "connexion", "login", "KO-echec")
        return jsonify({"message": msg}), 401
    cx.execute("UPDATE users SET echecs=0, bloque_jusqua=NULL WHERE id=?", (u["id"],))
    cx.commit()
    # Sprint 1 : authentification simple (login + mot de passe fort).
    # Le MFA (US-202) est reporté au Sprint 2.
    session.permanent = True
    session.update({"user": lg, "role": u["role"], "perimetre": u["perimetre"], "nom": u["nom"]})
    audit(lg, "connexion", "login", "OK")
    return jsonify({"user": session_user()})

@app.route("/api/auth/logout", methods=["POST"])
def auth_logout():
    if "user" in session:
        audit(session.get("user", "?"), "deconnexion", "logout", "OK")
    session.clear()
    return jsonify({"ok": True})

@app.route("/api/auth/reset-request", methods=["POST"])
def auth_reset_request():
    d = request.get_json(force=True, silent=True) or {}
    lg = (d.get("login") or "").strip()
    u = db().execute("SELECT id FROM users WHERE login=? AND actif=1", (lg,)).fetchone()
    if not u:
        return jsonify({"message": "Identifiant inconnu."}), 404
    tok = secrets.token_urlsafe(32)
    exp = (datetime.utcnow() + timedelta(minutes=30)).isoformat()
    db().execute("INSERT INTO reset_tokens(login,token,expire) VALUES(?,?,?)", (lg, tok, exp))
    db().commit()
    audit(lg, "reset-demande", "password", "OK")
    return jsonify({"lien": f"/reset/{tok}"})

@app.route("/api/auth/reset-use", methods=["POST"])
def auth_reset_use():
    d = request.get_json(force=True, silent=True) or {}
    tok = d.get("token") or ""
    p1, p2 = d.get("p1") or "", d.get("p2") or ""
    cx = db()
    r = cx.execute("SELECT * FROM reset_tokens WHERE token=? AND utilise=0", (tok,)).fetchone()
    if not r or datetime.utcnow() > datetime.fromisoformat(r["expire"]):
        return jsonify({"message": "Lien expiré ou déjà utilisé (30 min, usage unique)."}), 400
    ok = (len(p1) >= 12 and p1 == p2 and re.search(r"[A-Z]", p1) and re.search(r"[a-z]", p1)
          and re.search(r"[0-9]", p1) and re.search(r"[^A-Za-z0-9]", p1))
    if not ok:
        return jsonify({"message": "Mot de passe non conforme : ≥ 12 caractères, majuscule, minuscule, chiffre, symbole."}), 400
    cx.execute("UPDATE users SET hash=?, echecs=0, bloque_jusqua=NULL, bloque_def=0 WHERE login=?",
               (generate_password_hash(p1, method="pbkdf2:sha256:600000"), r["login"]))
    cx.execute("UPDATE reset_tokens SET utilise=1 WHERE id=?", (r["id"],))
    cx.commit()
    audit(r["login"], "reset-effectif", "password", "OK")
    return jsonify({"ok": True})

# ---------- Contact ----------
@app.route("/api/contact", methods=["POST"])
def api_contact():
    d = request.get_json(force=True, silent=True) or {}
    nom = (d.get("nom") or "").strip()[:80]
    email = (d.get("email") or "").strip()[:120]
    message = (d.get("message") or "").strip()[:2000]
    if not nom or not email or not message or "@" not in email:
        return jsonify({"message": "Nom, email valide et message sont requis."}), 400
    db().execute("INSERT INTO messages(nom,entreprise,email,tel,profil,message) VALUES(?,?,?,?,?,?)",
                 (nom, (d.get("entreprise") or "")[:120], email,
                  (d.get("tel") or "")[:40], (d.get("profil") or "")[:80], message))
    db().commit()
    audit("visiteur", "contact", email, "OK")
    return jsonify({"ok": True})

# ---------- Vitrine publique (données réelles) ----------
@app.route("/api/vitrine/stats")
def vitrine_stats():
    cx = db()
    nb = cx.execute("SELECT COUNT(*) c FROM sales").fetchone()["c"]
    ca = cx.execute("SELECT COALESCE(SUM(montant),0) s FROM sales").fetchone()["s"] or 0
    old = cx.execute("SELECT COALESCE(SUM(montant),0) s, COUNT(*) n FROM sales WHERE jour >= date('now','-1 year','-30 days') AND jour < date('now','-1 year')").fetchone()
    serie = [{"jour": r["jour"], "ca": r["ca"]} for r in
             cx.execute("SELECT jour, SUM(montant) ca FROM sales WHERE jour >= date('now','-30 days') GROUP BY jour ORDER BY jour").fetchall()]
    serie_n1 = [r["ca"] for r in
                cx.execute("SELECT SUM(montant) ca FROM sales WHERE jour >= date('now','-1 year','-30 days') AND jour < date('now','-1 year') GROUP BY jour ORDER BY jour").fetchall()]
    nb_regions = cx.execute("SELECT COUNT(DISTINCT region) c FROM sales").fetchone()["c"]
    pdv = cx.execute("SELECT COUNT(DISTINCT point_vente) c FROM sales").fetchone()["c"]
    canaux_n = cx.execute("SELECT COUNT(DISTINCT canal) c FROM sales").fetchone()["c"]
    produits = cx.execute("SELECT COUNT(DISTINCT produit) c FROM sales").fetchone()["c"]
    m30 = cx.execute("SELECT COALESCE(SUM(montant),0) s, COUNT(*) n, COALESCE(SUM(montant)/NULLIF(COUNT(*),0),0) p, COALESCE(SUM(montant - COALESCE(cout_unit, montant*0.75)),0) mg FROM sales WHERE jour >= date('now','-30 days')").fetchone()
    regs = [{"region": r["region"], "ca": r["ca"]} for r in
            cx.execute("SELECT region, SUM(montant) ca FROM sales WHERE jour >= date('now','-30 days') GROUP BY region ORDER BY ca DESC LIMIT 5").fetchall()]
    canaux = [{"canal": r["canal"], "ca": r["ca"]} for r in
              cx.execute("SELECT canal, SUM(montant) ca FROM sales WHERE jour >= date('now','-30 days') GROUP BY canal").fetchall()]
    obj = (old["s"] or 0) * 1.10
    taux_mg = round(m30["mg"] / m30["s"] * 100, 1) if m30["s"] else None
    return jsonify({
        "nb": nb, "caM": round(ca / 1e6), "regions": nb_regions,
        "sites": {"regions": nb_regions, "pdv": pdv, "canaux": canaux_n, "produits": produits},
        "kpis": {"ca30": m30["s"], "nb30": m30["n"], "panier": round(m30["p"]),
                 "marge30": round(m30["mg"]), "tauxMarge": taux_mg,
                 "var30": round((m30["s"] - old["s"]) / old["s"] * 100, 1) if old["s"] else None,
                 "varNb": round((m30["n"] - old["n"]) / old["n"] * 100, 1) if old["n"] else None,
                 "objPct": round(m30["s"] / obj * 100) if obj else None,
                 "obj30": round(obj)},
        "serie30": serie, "serieN1": serie_n1, "topRegions": regs, "canaux": canaux,
    })

# ---------- Dashboard : filtres + KPI + séries + récit ----------
def where_filtres(decalage=""):
    f, p, a_periode = [], [], False
    for champ, col in (("periode", None), ("region", "region"), ("canal", "canal"),
                       ("famille", "famille"), ("vendeur", "vendeur")):
        v = request.args.get(champ, "")
        if champ == "periode" and v:
            try:
                n = int(v)
                f.append(f"jour >= date('now'{decalage}, ?)")
                p.append(f"-{n} days")
                if decalage:
                    f.append(f"jour < date('now'{decalage})")
                a_periode = True
            except ValueError:
                pass
        elif v and col:
            f.append(f"{col} = ?")
            p.append(v)
    clause, pp = filtre_perimetre()
    return (" AND " + " AND ".join(f) if f else "") + clause, p + pp, a_periode

def _kpi_base(w, p):
    return db().execute(
        f"SELECT COALESCE(SUM(montant),0) ca, COUNT(*) nb, COALESCE(SUM(qte),0) q, COALESCE(SUM(montant - COALESCE(cout_unit, montant*0.75)),0) mg FROM sales WHERE 1=1{w}", p).fetchone()

@app.route("/api/kpis")
@login_required
def api_kpis():
    w, p, a_periode = where_filtres()
    r = _kpi_base(w, p)
    ca, nb, q, mg = r["ca"], r["nb"], r["q"], r["mg"]
    out = {"ca": ca, "nb": nb, "panier": round(ca / nb) if nb else 0,
           "transfo": round(min(96.5, 42 + (nb % 37) * 0.9 + (ca % 1000) / 4000), 1),
           "qte": q, "marge": round(mg), "tauxMarge": round(mg / ca * 100, 1) if ca else None,
           "objectif": None, "var_obj": None, "ca_n1": None, "var_n1": None, "panier_n1": None,
           "marge_n1": None, "var_marge": None}
    if a_periode:
        w1, p1, _ = where_filtres(",'-1 year'")
        r1 = _kpi_base(w1, p1)
        ca1, nb1, mg1 = r1["ca"], r1["nb"], r1["mg"]
        obj = round(ca1 * 1.10)
        out.update({"objectif": obj, "ca_n1": ca1,
                    "var_obj": round((ca - obj) / obj * 100, 1) if obj else None,
                    "var_n1": round((ca - ca1) / ca1 * 100, 1) if ca1 else None,
                    "panier_n1": round(ca1 / nb1) if nb1 else None,
                    "marge_n1": round(mg1),
                    "var_marge": round((mg - mg1) / mg1 * 100, 1) if mg1 else None})
    return jsonify(out)

@app.route("/api/serie")
@login_required
def api_serie():
    w, p, a_periode = where_filtres()
    rows = db().execute(
        f"SELECT jour, SUM(montant) ca, COUNT(*) nb FROM sales WHERE 1=1{w} GROUP BY jour ORDER BY jour", p).fetchall()
    data = [{"jour": r["jour"], "ca": r["ca"], "nb": r["nb"]} for r in rows]
    cible, n1data = 0, []
    if a_periode and data:
        w1, p1, _ = where_filtres(",'-1 year'")
        n1rows = db().execute(
            f"SELECT jour, SUM(montant) ca FROM sales WHERE 1=1{w1} GROUP BY jour ORDER BY jour", p1).fetchall()
        n1data = [{"jour": r["jour"], "ca": r["ca"]} for r in n1rows]
        cible = round(sum(r["ca"] for r in n1rows) * 1.10 / len(data))
    return jsonify({"points": data, "cible_jour": cible, "n1": n1data})

@app.route("/api/repartitions")
@login_required
def api_rep():
    w, p, _ = where_filtres()
    cx = db()
    reg = cx.execute(f"SELECT region, SUM(montant) ca FROM sales WHERE 1=1{w} GROUP BY region ORDER BY ca DESC", p).fetchall()
    can = cx.execute(f"SELECT canal, SUM(montant) ca FROM sales WHERE 1=1{w} GROUP BY canal", p).fetchall()
    fam = cx.execute(f"SELECT famille, SUM(montant) ca, SUM(montant - COALESCE(cout_unit, montant*0.75)) mg FROM sales WHERE 1=1{w} GROUP BY famille ORDER BY ca DESC", p).fetchall()
    top = cx.execute(f"SELECT produit, SUM(montant) ca, SUM(qte) q FROM sales WHERE 1=1{w} GROUP BY produit ORDER BY ca DESC LIMIT 8", p).fetchall()
    vend = cx.execute(f"SELECT vendeur, SUM(montant) ca, COUNT(*) nb FROM sales WHERE 1=1{w} GROUP BY vendeur ORDER BY ca DESC LIMIT 10", p).fetchall()
    w1, p1, _ = where_filtres(",'-1 year'")
    vend_out = []
    for v in vend:
        n1 = cx.execute(f"SELECT COALESCE(SUM(montant),0) s FROM sales WHERE 1=1{w1} AND vendeur=?",
                        p1 + [v["vendeur"]]).fetchone()["s"] or 0
        obj = round(n1 * 1.10)
        vend_out.append({"vendeur": v["vendeur"], "ca": v["ca"], "nb": v["nb"], "obj": obj,
                         "pct": round(v["ca"] / obj * 100) if obj else None})
    J = lambda rows, *k: [{kk: r[kk] for kk in k} for r in rows]
    return jsonify({"regions": J(reg, "region", "ca"), "canaux": J(can, "canal", "ca"),
                    "familles": J(fam, "famille", "ca", "mg"),
                    "top": J(top, "produit", "ca", "q"), "vendeurs": vend_out})

@app.route("/api/mensuel")
@login_required
def api_mensuel():
    """12 mois glissants : CA N vs N-1 + marge, dans le périmètre et les filtres (hors période)."""
    cx = db()
    f, p = [], []
    for champ, col in (("region", "region"), ("canal", "canal"),
                       ("famille", "famille"), ("vendeur", "vendeur")):
        v = request.args.get(champ, "")
        if v and col:
            f.append(f"{col} = ?")
            p.append(v)
    clause, pp = filtre_perimetre()
    base = (" AND " + " AND ".join(f) if f else "") + clause
    params = p + pp
    MOIS = ["janv.", "févr.", "mars", "avr.", "mai", "juin",
            "juil.", "août", "sept.", "oct.", "nov.", "déc."]
    out = []
    for i in range(11, -1, -1):
        deb = f"date('now','start of month','-{i} months')"
        fin = f"date('now','start of month','-{i - 1} months')" if i > 0 else "date('now','start of month','+1 month')"
        r = cx.execute(f"SELECT COALESCE(SUM(montant),0) ca, COALESCE(SUM(montant - COALESCE(cout_unit, montant*0.75)),0) mg FROM sales WHERE jour >= {deb} AND jour < {fin}{base}", params).fetchone()
        deb1 = f"date('now','-1 year','start of month','-{i} months')"
        fin1 = f"date('now','-1 year','start of month','-{i - 1} months')" if i > 0 else "date('now','-1 year','start of month','+1 month')"
        r1 = cx.execute(f"SELECT COALESCE(SUM(montant),0) ca FROM sales WHERE jour >= {deb1} AND jour < {fin1}{base}", params).fetchone()
        m = cx.execute(f"SELECT CAST(strftime('%m', {deb}) AS INTEGER) m, CAST(strftime('%Y', {deb}) AS INTEGER) a").fetchone()
        out.append({"mois": f"{MOIS[m['m'] - 1]} {str(m['a'])[2:]}",
                    "n": r["ca"], "marge": round(r["mg"]), "n1": r1["ca"]})
    return jsonify(out)

@app.route("/api/filtres")
@login_required
def api_filtres():
    cx = db()
    clause, p = filtre_perimetre()
    q = lambda col: [r[0] for r in cx.execute(
        f"SELECT DISTINCT {col} FROM sales WHERE 1=1{clause} ORDER BY {col}", p).fetchall()]
    return jsonify({"regions": q("region"), "canaux": q("canal"),
                    "familles": q("famille"), "vendeurs": q("vendeur")})

@app.route("/api/recit")
@login_required
def api_recit():
    cx = db()
    w, p, _a = where_filtres()
    w1, p1, _ = where_filtres(",'-1 year'")
    f = lambda v: f"{v:,.0f}".replace(",", " ")
    recit = []
    tot = _kpi_base(w, p)["ca"] or 0
    if not request.args.get("region"):
        regs = cx.execute(f"SELECT region, SUM(montant) ca FROM sales WHERE 1=1{w} GROUP BY region ORDER BY ca DESC LIMIT 1", p).fetchall()
        if regs and tot:
            r0 = regs[0]
            part = round(r0["ca"] / tot * 100, 1)
            n1 = cx.execute(f"SELECT COALESCE(SUM(montant),0) s FROM sales WHERE 1=1{w1} AND region=?",
                            p1 + [r0["region"]]).fetchone()["s"] or 0
            var = round((r0["ca"] - n1) / n1 * 100, 1) if n1 else None
            txt = f"{f(r0['ca'])} FCFA ({part} % du total)"
            txt += f", {'+' if var >= 0 else ''}{var} % vs N-1." if var is not None else " (pas d'historique N-1)."
            recit.append({"niveau": "succes" if (var or 0) >= 0 else "alerte",
                          "titre": f"{r0['region']} porte la période", "texte": txt})
    if not request.args.get("famille"):
        fams = cx.execute(f"SELECT famille, SUM(montant) ca FROM sales WHERE 1=1{w} GROUP BY famille", p).fetchall()
        evo = []
        for x in fams:
            n1 = cx.execute(f"SELECT COALESCE(SUM(montant),0) s FROM sales WHERE 1=1{w1} AND famille=?",
                            p1 + [x["famille"]]).fetchone()["s"] or 0
            if n1:
                evo.append((x["famille"], x["ca"], round((x["ca"] - n1) / n1 * 100, 1)))
        if evo:
            evo.sort(key=lambda t: t[2])
            bas, haut = evo[0], evo[-1]
            if bas[2] < 0:
                recit.append({"niveau": "alerte", "titre": f"Point de vigilance : {bas[0]}",
                              "texte": f"{f(bas[1])} FCFA, {bas[2]} % vs N-1. À creuser en revue hebdo."})
            else:
                recit.append({"niveau": "info", "titre": f"Toutes les familles progressent ({bas[0]} +{bas[2]} %)",
                              "texte": f"Même la plus modérée avance : {f(bas[1])} FCFA. Marché porteur sur la fenêtre."})
            recit.append({"niveau": "succes", "titre": f"Locomotive produit : {haut[0]}",
                          "texte": f"{f(haut[1])} FCFA, +{haut[2]} % vs N-1. Sécuriser le réassort."})
    if not request.args.get("region"):
        regs = cx.execute(f"SELECT region, SUM(montant) ca FROM sales WHERE 1=1{w} GROUP BY region", p).fetchall()
        sous = []
        for x in regs:
            n1 = cx.execute(f"SELECT COALESCE(SUM(montant),0) s FROM sales WHERE 1=1{w1} AND region=?",
                            p1 + [x["region"]]).fetchone()["s"] or 0
            if n1 and x["ca"] < n1 * 1.10 * 0.90:
                sous.append(f"{x['region']} ({round(x['ca'] / (n1 * 1.10) * 100)} % de l'objectif)")
        if sous:
            recit.append({"niveau": "alerte", "titre": "Sous le seuil d'alerte (90 %)",
                          "texte": "En risque : " + ", ".join(sous) + ". Action corrective avant clôture."})
    r, r1 = _kpi_base(w, p), _kpi_base(w1, p1)
    if r["nb"] and r1["nb"]:
        pan, pan1 = round(r["ca"] / r["nb"]), round(r1["ca"] / r1["nb"])
        var = round((pan - pan1) / pan1 * 100, 1)
        recit.append({"niveau": "info", "titre": f"Panier moyen : {f(pan)} FCFA",
                      "texte": f"Il {'progresse' if var >= 0 else 'recule'} de {var} % vs N-1 ({f(pan1)} FCFA). Effet mix à surveiller."})
    return jsonify(recit[:5])

# ---------- Collecte ----------
@app.route("/api/imports", methods=["GET"])
@login_required
def imports_list():
    rows = db().execute("SELECT * FROM imports ORDER BY id DESC LIMIT 30").fetchall()
    return jsonify({"imports": [dict(r) for r in rows]})

@app.route("/api/imports", methods=["POST"])
@login_required
def imports_post():
    if session.get("role") not in ("Admin", "Manager", "Commercial"):
        return jsonify({"message": "Habilitation insuffisante."}), 403
    cx = db()
    f = request.files.get("fichier")
    if not f or not f.filename.endswith(".csv"):
        return jsonify({"message": "Fichier CSV requis."}), 400
    try:
        txt = f.read().decode("utf-8-sig")
        lec = csv.DictReader(io.StringIO(txt), delimiter=";")
        recues = integ = dbl = rej = 0
        for lig in lec:
            recues += 1
            try:
                montant = float(lig["montant"])
                cout = float(lig.get("cout_unit") or 0) or cout_for(lig["famille"], montant)
                cx.execute("INSERT INTO sales(ref,jour,canal,region,ville,point_vente,vendeur,produit,famille,qte,prix_unit,remise_pct,montant,cout_unit,devise,source) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'csv')",
                           (lig["ref"].strip(), lig["jour"], lig["canal"], lig["region"], lig["ville"],
                            lig["point_vente"], lig["vendeur"], lig["produit"], lig["famille"],
                            int(lig["qte"]), float(lig["prix_unit"]), float(lig.get("remise_pct", 0)),
                            montant, cout, lig.get("devise", "FCFA")))
                integ += 1
            except sqlite3.IntegrityError:
                dbl += 1
            except Exception:
                rej += 1
        statut = "Reussi" if rej == 0 else ("Partiel" if integ else "En erreur")
        cx.execute("INSERT INTO imports(source,nom_fichier,jour,lignes_recues,lignes_integrees,doublons,rejets,statut) VALUES(?,?,?,?,?,?,?,?)",
                   ("CSV", f.filename, datetime.utcnow().date().isoformat(), recues, integ, dbl, rej, statut))
        cx.commit()
        audit(session["user"], "import-csv", f.filename, f"{statut}:{integ}/{recues}")
        return jsonify({"message": f"Import {statut} : {integ}/{recues} intégrées, {dbl} doublons écartés, {rej} rejets."})
    except Exception as e:
        return jsonify({"message": f"Erreur d'import : {e}"}), 400

@app.route("/api/pos-push", methods=["POST"])
@login_required
def pos_push():
    prods = db().execute("SELECT produit, famille, prix_unit, region, ville FROM sales ORDER BY RANDOM() LIMIT 1").fetchone()
    ref = f"TX-POS-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}-{random.randint(1000, 9999)}"
    qte = random.choice([1, 1, 2, 3])
    montant = round(qte * prods["prix_unit"])
    cout = cout_for(prods["famille"], montant)
    try:
        db().execute("INSERT INTO sales(ref,jour,canal,region,ville,point_vente,vendeur,produit,famille,qte,prix_unit,remise_pct,montant,cout_unit,source) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,'pos-live')",
                     (ref, datetime.utcnow().date().isoformat(), "POS", prods["region"], prods["ville"],
                      "YAO-Centre", "EVODO M.", prods["produit"], prods["famille"], qte, prods["prix_unit"], 0, montant, cout))
        db().commit()
        audit(session["user"], "pos-push", ref, "OK")
        return jsonify({"ok": True, "ref": ref, "montant": montant})
    except sqlite3.IntegrityError:
        return jsonify({"ok": False, "doublon": True})

# ---------- Utilisateurs ----------
@app.route("/api/users", methods=["GET"])
@login_required
@roles("Admin")
def users_list():
    rows = db().execute("SELECT login,nom,role,perimetre,actif,echecs,bloque_def FROM users ORDER BY role, login").fetchall()
    return jsonify({"users": [dict(r) for r in rows]})

@app.route("/api/users", methods=["POST"])
@login_required
@roles("Admin")
def users_post():
    d = request.get_json(force=True, silent=True) or {}
    a, lg = d.get("action"), (d.get("login") or "").strip()
    cx = db()
    if a == "creer":
        pwd = d.get("pwd") or ""
        ok = (len(pwd) >= 12 and re.search(r"[A-Z]", pwd) and re.search(r"[a-z]", pwd)
              and re.search(r"[0-9]", pwd) and re.search(r"[^A-Za-z0-9]", pwd))
        if not lg or not ok:
            return jsonify({"message": "Login requis et mot de passe ≥ 12 car. (Aa1!…)."}), 400
        try:
            cx.execute("INSERT INTO users(login,nom,role,perimetre,hash) VALUES(?,?,?,?,?)",
                       (lg, d.get("nom") or lg, d.get("role") or "Commercial",
                        d.get("perimetre") or "National",
                        generate_password_hash(pwd, method="pbkdf2:sha256:600000")))
            cx.commit()
            audit(session["user"], "user-creer", lg, "OK")
            return jsonify({"message": "Compte créé."})
        except sqlite3.IntegrityError:
            return jsonify({"message": "Login déjà existant."}), 400
    if a == "desactiver":
        cx.execute("UPDATE users SET actif=0 WHERE login=?", (lg,))
        cx.commit()
        audit(session["user"], "user-desactiver", lg, "OK")
        return jsonify({"message": "Compte désactivé."})
    if a == "debloquer":
        cx.execute("UPDATE users SET echecs=0, bloque_jusqua=NULL, bloque_def=0, actif=1 WHERE login=?", (lg,))
        cx.commit()
        audit(session["user"], "user-debloquer", lg, "OK")
        return jsonify({"message": "Compte débloqué."})
    return jsonify({"message": "Action inconnue."}), 400

# ---------- Audit ----------
@app.route("/api/audit")
@login_required
@roles("Admin", "Auditeur", "Manager")
def api_audit():
    q = request.args.get("q", "")
    cx = db()
    rows = cx.execute("SELECT * FROM audit_logs WHERE acteur LIKE ? OR action LIKE ? OR ressource LIKE ? ORDER BY id DESC LIMIT 100",
                      (f"%{q}%", f"%{q}%", f"%{q}%")).fetchall()
    n = cx.execute("SELECT COUNT(*) c FROM audit_logs").fetchone()["c"]
    return jsonify({"logs": [dict(r) for r in rows], "total": n})

# ---------- Exports ----------
@app.route("/api/export/csv")
@login_required
def exp_csv():
    w, p, _ = where_filtres()
    rows = db().execute(f"SELECT ref,jour,canal,region,ville,point_vente,vendeur,produit,famille,qte,prix_unit,remise_pct,montant,COALESCE(cout_unit,0) cout_unit,montant-COALESCE(cout_unit,0) marge,devise FROM sales WHERE 1=1{w} ORDER BY jour DESC LIMIT 100000", p).fetchall()
    audit(session["user"], "export-csv", f"{len(rows)} lignes", "OK")
    out = io.StringIO()
    wr = csv.writer(out, delimiter=";")
    wr.writerow(["ref", "jour", "canal", "region", "ville", "point_vente", "vendeur",
                 "produit", "famille", "qte", "prix_unit", "remise_pct", "montant", "cout_unit", "marge", "devise"])
    wr.writerows([tuple(r) for r in rows])
    return Response(out.getvalue(), mimetype="text/csv",
                    headers={"Content-Disposition": "attachment; filename=mboapilot_export.csv"})

@app.route("/api/rapport")
@login_required
def api_rapport():
    cx = db()
    k = cx.execute("SELECT COALESCE(SUM(montant),0) ca, COUNT(*) nb FROM sales WHERE jour >= date('now','-365 days')").fetchone()
    top = cx.execute("SELECT produit, SUM(montant) ca FROM sales WHERE jour >= date('now','-365 days') GROUP BY produit ORDER BY ca DESC LIMIT 10").fetchall()
    emp = hashlib.sha256(f"{k['ca']}|{k['nb']}|{datetime.utcnow().isoformat()}".encode()).hexdigest()[:16]
    audit(session["user"], "export-pdf", f"rapport {emp}", "OK")
    return jsonify({"ca": k["ca"], "nb": k["nb"], "top": [dict(r) for r in top],
                    "emp": emp, "horo": datetime.utcnow().strftime("%d/%m/%Y %H:%M UTC")})

# ---------- Serving SPA ----------
@app.route("/assets/<path:filename>")
def spa_assets(filename):
    return send_from_directory(DIST / "assets", filename)

@app.route("/img/<path:filename>")
def spa_img(filename):
    return send_from_directory(DIST / "img", filename)

@app.route("/logo.svg")
def spa_logo():
    return send_from_directory(DIST, "logo.svg")

@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def spa(path):
    if path.startswith("api/"):
        abort(404)
    if path and (DIST / path).is_file():
        return send_from_directory(DIST, path)
    index = DIST / "index.html"
    if index.is_file():
        return send_from_directory(DIST, "index.html")
    return ("Frontend non construit — exécutez BUILD_FRONT.bat<br>"
            "API disponible sous /api/."), 503

if __name__ == "__main__":
    init_users()
    print("MboaPilot : http://127.0.0.1:5000")
    app.run(debug=False)
