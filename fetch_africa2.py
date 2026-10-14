# -*- coding: utf-8 -*-
"""Second sourcing : commerce africain, portraits pro, artisanat. Tri via planche."""
import urllib.request
from pathlib import Path
from PIL import Image, ImageDraw

CAND = Path(__file__).resolve().parent / "static" / "img" / "candidats"
CAND.mkdir(exist_ok=True)

IDS = {
    "d01_analyste.jpg": "1573164713988-8665fc963095",
    "d02_laptop.jpg": "1587614382346-4ec70e388b44",
    "d03_directeur.jpg": "1595152772835-219674b2a8a6",
    "d04_portrait_f.jpg": "1567532939604-b6b5b0db2604",
    "d05_marche_air.jpg": "1604719312566-8912e9227c6a",
    "d06_souk.jpg": "1539020147605-0997f2d25d5d",
    "d07_epices.jpg": "1596040033229-a9821ebd058d",
    "d08_tissus.jpg": "1537832816519-689ad163238b",
    "d09_textile.jpg": "1620799140408-edc6dcb6d633",
    "d10_tel.jpg": "1580913428023-02c695666520",
    "d11_main_tel.jpg": "1601784551446-20c9e07cdbdb",
    "d12_atelier.jpg": "1531482615713-2afd69097998",
    "d13_portrait.jpg": "1610484826967-09c5720778c7",
    "d14_femme_pro.jpg": "1619895862022-09114b41f16f",
}

ok = []
for nom, pid in IDS.items():
    url = f"https://images.unsplash.com/photo-{pid}?q=80&w=800&auto=format&fit=crop"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "MboaPilot/1.0"})
        with urllib.request.urlopen(req, timeout=30) as r:
            data = r.read()
        if len(data) < 15000:
            print(f"[KO] {nom} ({len(data)} o)")
            continue
        open(CAND / nom, "wb").write(data)
        ok.append(nom)
        print(f"[OK] {nom} {len(data)//1024} Ko")
    except Exception as e:
        print(f"[KO] {nom} : {e}")

thumbs = []
for nom in ok:
    im = Image.open(CAND / nom).convert("RGB")
    im.thumbnail((400, 300))
    thumbs.append((nom, im))
cols = 4
rows = (len(thumbs) + cols - 1) // cols
W, H = 400, 340
sheet = Image.new("RGB", (cols * W, rows * H), "white")
d = ImageDraw.Draw(sheet)
for i, (nom, im) in enumerate(thumbs):
    x, y = (i % cols) * W, (i // cols) * H
    sheet.paste(im, (x, y + 30))
    d.text((x + 8, y + 8), nom, fill="black")
sheet.save(CAND / "_planche2.jpg", quality=82)
print(f"planche2 : {len(thumbs)} visuels")
