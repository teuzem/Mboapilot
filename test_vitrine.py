# -*- coding: utf-8 -*-
import app
app.app.config["TESTING"] = True
a = app.app.test_client()

r = a.get("/")
t = r.get_data(as_text=True)
print("landing:", r.status_code, len(r.data) // 1024, "Ko")
checks = ["hero-chapitre", "hero_marche.jpg", "hero_equipe.jpg", "hero_ville.jpg",
          "bandeau-live", "dropcap", "registre", "ligne-module", "liveBoard",
          "lb-graph", "gantt-ligne", "attestation", "journal", "bascule",
          "grande-citation", "Mokolo", "buyam-sellam", "Deido", "Mvan",
          "2024/017", "Akwa", "Bafoussam", "Garoua", "vitrine.js", "landing.css"]
for c in checks:
    print(("OK  " if c in t else "MANQUANT ") + c)

# IA-slop scan : aucun gradient violet, aucun emoji, aucun lorem
import re
slop = re.findall(r"linear-gradient\([^)]*(?:purple|violet|#7c3aed|#8b5cf6)[^)]*\)|[\U0001F300-\U0001FAFF]|lorem", t, re.I)
print("slop detecte:", slop if slop else "aucun")

# API vitrine
for f in (7, 30, 365):
    d = a.get(f"/api/vitrine/synthese?fenetre={f}").get_json()
    print(f"vitrine {f}j: CA={d['ca']:,.0f} obj={d['objectif']:,.0f} atteinte={d['atteinte']}% varN1={d['var_n1']}% pts={len(d['serie'])} regions={len(d['regions'])}")

# pages restantes intactes
for u in ("/fonctionnalites", "/tarifs", "/securite", "/contact", "/login", "/tableau-de-bord"):
    print(u, a.get(u).status_code)
print("DONE")
