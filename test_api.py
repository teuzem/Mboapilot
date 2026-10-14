# -*- coding: utf-8 -*-
"""Tests API MboaPilot (React + Flask, auth simple Sprint 1)."""
import sqlite3
import app

app.app.config["TESTING"] = True
ok = []

def check(nom, cond):
    print(("PASS " if cond else "FAIL ") + nom)
    assert cond, nom
    ok.append(nom)

a = app.app.test_client()

# Vitrine publique
v = a.get("/api/vitrine/stats").get_json()
check("vitrine sites live", v["sites"]["regions"] == 10 and v["sites"]["pdv"] >= 15 and v["sites"]["canaux"] == 3)
check("vitrine marge", v["kpis"]["marge30"] > 0 and v["kpis"]["tauxMarge"])
check("vitrine nb>40000", v["nb"] > 40000)
check("vitrine serie30", len(v["serie30"]) >= 28)
check("vitrine regions", len(v["topRegions"]) == 5)
check("vitrine canaux", len(v["canaux"]) == 3)
check("vitrine kpis", v["kpis"]["ca30"] > 0 and v["kpis"]["objPct"] is not None)
check("vitrine regions nb", v["regions"] == 10)
check("vitrine serieN1", len(v["serieN1"]) >= 28)

# SPA servie
for url in ["/", "/tarifs", "/login", "/app"]:
    r = a.get(url)
    check(f"spa {url} -> index", r.status_code == 200 and b'<div id="root">' in r.data)
check("asset js", a.get("/assets/").status_code in (404, 403, 200))
check("img locale", a.get("/img/hero-marche.jpg").status_code == 200)
check("logo", a.get("/logo.svg").status_code == 200)

# Contact
r = a.post("/api/contact", json={"nom": "Jury Test", "entreprise": "J SARL",
                                 "email": "jury@test.cm", "message": "Demo svp"})
check("contact ok", r.status_code == 200)
r = a.post("/api/contact", json={"nom": "x", "email": "bad", "message": "y"})
check("contact invalide 400", r.status_code == 400)

# Auth : 401 sans session
check("kpis 401 anonyme", a.get("/api/kpis?periode=30").status_code == 401)
check("me 401", a.get("/api/auth/me").status_code == 401)

# Login commercial (sans MFA)
r = a.post("/api/auth/login", json={"login": "commercial", "password": "MboaPilot-Com-2026!"})
check("login commercial", r.status_code == 200 and r.get_json()["user"]["role"] == "Commercial")
k = a.get("/api/kpis?periode=365").get_json()
check("kpis objectif", k["objectif"] and k["var_obj"] is not None)
check("kpis marge", k["marge"] > 0 and k["tauxMarge"] and k["var_marge"] is not None)
check("cloisonnement", set(x["region"] for x in a.get("/api/repartitions?periode=365").get_json()["regions"]) == {"Littoral"})
se = a.get("/api/serie?periode=30").get_json()
check("serie cible", len(se["points"]) >= 30 and se["cible_jour"] > 0)
check("serie n1", len(se["n1"]) >= 28 and all("ca" in x for x in se["n1"]))
mm = a.get("/api/mensuel?region=Littoral").get_json()
check("mensuel 12 mois", len(mm) == 12 and all({"mois", "n", "marge", "n1"} <= set(x) for x in mm))
check("mensuel valeurs", sum(x["n"] for x in mm) > 0)
rp = a.get("/api/repartitions?periode=365").get_json()
check("familles marge", len(rp["familles"]) >= 5 and all("mg" in x for x in rp["familles"]))
rc = a.get("/api/recit?periode=365").get_json()
check("recit >=3", len(rc) >= 3)
check("export csv", a.get("/api/export/csv?periode=30").status_code == 200)
check("commercial interdit users", a.get("/api/users").status_code == 403)
p = a.post("/api/pos-push").get_json()
check("pos push", p.get("ok") is True)
check("logout", a.post("/api/auth/logout").status_code == 200)
check("me apres logout 401", a.get("/api/auth/me").status_code == 401)

# Login manager (auth simple, sans MFA)
m = app.app.test_client()
r = m.post("/api/auth/login", json={"login": "manager", "password": "MboaPilot-Mgr-2026!"})
check("login manager direct", r.status_code == 200 and r.get_json()["user"]["perimetre"] == "Centre")
check("dashboard manager", m.get("/api/kpis?periode=30").status_code == 200)
check("audit manager", m.get("/api/audit").status_code == 200)
check("rapport", m.get("/api/rapport").status_code == 200)
check("imports list", m.get("/api/imports").status_code == 200)

# Admin : users
ad = app.app.test_client()
r = ad.post("/api/auth/login", json={"login": "admin", "password": "MboaPilot-Admin-2026!"})
check("login admin direct", r.status_code == 200)
us = ad.get("/api/users").get_json()
check("users 5 comptes", len(us["users"]) == 5)
dd = a.get("/api/auth/demo-secrets").get_json()
check("demo 5 comptes sans secret", len(dd["comptes"]) == 5 and "secret" not in dd["comptes"][0])

# Lockout
cx = sqlite3.connect("sales.db")
cx.execute("UPDATE users SET echecs=0, bloque_jusqua=NULL, bloque_def=0 WHERE login='commercial'")
cx.commit(); cx.close()
c3 = app.app.test_client()
for _ in range(5):
    c3.post("/api/auth/login", json={"login": "commercial", "password": "mauvais-12345678!"})
r = c3.post("/api/auth/login", json={"login": "commercial", "password": "mauvais-12345678!"})
check("verrouillage 403", r.status_code == 403)
cx = sqlite3.connect("sales.db")
cx.execute("UPDATE users SET echecs=0, bloque_jusqua=NULL, bloque_def=0 WHERE login='commercial'")
cx.commit(); cx.close()

# Reset
r = a.post("/api/auth/reset-request", json={"login": "commercial"})
lien = r.get_json()["lien"]
tok = lien.split("/reset/")[1]
r = a.post("/api/auth/reset-use", json={"token": tok, "p1": "Faible1!", "p2": "Faible1!"})
check("reset faible refuse", r.status_code == 400)
r = a.post("/api/auth/reset-use", json={"token": tok, "p1": "Nouveau-Com-2026!", "p2": "Nouveau-Com-2026!"})
check("reset fort ok", r.status_code == 200)
r = a.post("/api/auth/login", json={"login": "commercial", "password": "Nouveau-Com-2026!"})
check("login nouveau mdp", r.status_code == 200)
cx = sqlite3.connect("sales.db")
import werkzeug.security as ws
cx.execute("UPDATE users SET hash=? WHERE login='commercial'",
           (ws.generate_password_hash("MboaPilot-Com-2026!", method="pbkdf2:sha256:600000"),))
cx.commit(); cx.close()

print(f"\n{len(ok)} TESTS PASS")
