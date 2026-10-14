# -*- coding: utf-8 -*-
"""Visuels finaux w=1600 pour la landing (contexte africain verifie)."""
import urllib.request
from pathlib import Path

IMG = Path(__file__).resolve().parent / "static" / "img"
CAND = IMG / "candidats"

FINAUX = {
    "hero_marche.jpg": ("c04_champ.jpg", "1464226184884-fa280b87c399"),  #placeholder, remplace ci-dessous
}
# mapping direct : (fichier final, photo id, source verifiee)
MAP = {
    "hero_marche.jpg": "1488459716781-31db52582fe9",   # etal de legumes (neutre, sans visage)
    "hero_equipe.jpg": "1573164713988-8665fc963095",   # professionnelles africaines (d01)
    "hero_ville.jpg": "1547471080-7cc2caa01a7e",       # skyline africain (c11) -> placeholder
    "epices.jpg": "1596040033229-a9821ebd058d",        # epices (d07)
    "etal_legumes.jpg": "1500937386664-56d1dfef3854",  #placeholder
    "manager.jpg": "1573496359142-b8d87734a5a2",       # dirigeante (c07)
    "commercial.jpg": "1531384441138-2736e62e0919",    # portrait homme (c08)
    "silhouette.jpg": "1520813792240-56fc4a3765a7",    #placeholder
    "atelier.jpg": "1531482615713-2afd69097998",        # atelier africain (d12)
    "accessoires.jpg": "1537832816519-689ad163238b",   # maroquinerie (d08)
}
# Corrections : reprendre les fichiers verifies du dossier candidats (qualite suffisante)
import shutil
COPIES = {
    "hero_equipe.jpg": "d01_analyste.jpg",
    "epices.jpg": "d07_epices.jpg",
    "manager.jpg": "c07_bureau.jpg",
    "commercial.jpg": "c08_portrait_h.jpg",
    "atelier.jpg": "d12_atelier.jpg",
    "accessoires.jpg": "d08_tissus.jpg",
    "hero_ville.jpg": "c11_homme.jpg",
    "silhouette.jpg": "c09_foulard.jpg",
    "etal_legumes.jpg": "c04_champ.jpg",
}
for dest, src in COPIES.items():
    s = CAND / src
    if s.exists():
        # re-telecharger en haute def quand l'id est connu
        print(f"[COPY] {src} -> {dest}")
        shutil.copy(s, IMG / dest)
    else:
        print(f"[MANQUANT] {src}")

# Haute definition pour les 3 heros (ids verifies)
HD = {
    "hero_marche.jpg": "1488459716781-31db52582fe9",
    "hero_equipe.jpg": "1573164713988-8665fc963095",
    "hero_ville.jpg": "1577948000111-9c970dfe3743",
}
for dest, pid in HD.items():
    url = f"https://images.unsplash.com/photo-{pid}?q=80&w=1600&auto=format&fit=crop"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "MboaPilot/1.0"})
        with urllib.request.urlopen(req, timeout=30) as r:
            data = r.read()
        open(IMG / dest, "wb").write(data)
        print(f"[HD] {dest} {len(data)//1024} Ko")
    except Exception as e:
        print(f"[KO HD] {dest} : {e}")
