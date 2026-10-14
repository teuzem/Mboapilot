# -*- coding: utf-8 -*-
"""MBOA PILOT — Générateur de données massives de ventes (contexte Cameroun, FCFA).
Sprint 1 : construit data/ventes_agences.csv + alimente sales.db (SQLite).
Volumétrie cible : ~24 000 transactions sur 15 mois (juil. 2025 -> oct. 2026).
Exécuter :  python generate_data.py
"""
import csv, random, sqlite3, hashlib
from datetime import date, timedelta
from pathlib import Path

BASE = Path(__file__).resolve().parent
DATA = BASE / "data"
DB = BASE / "sales.db"
random.seed(20261013)

REGIONS = [
    ("Centre", "Yaounde", 0.22), ("Littoral", "Douala", 0.24),
    ("Ouest", "Bafoussam", 0.12), ("Nord-Ouest", "Bamenda", 0.08),
    ("Sud-Ouest", "Buea", 0.08), ("Sud", "Ebolowa", 0.05),
    ("Est", "Bertoua", 0.05), ("Adamaoua", "Ngaoundere", 0.05),
    ("Nord", "Garoua", 0.06), ("Extreme-Nord", "Maroua", 0.05),
]
CANAUX = [("POS", 0.55), ("Agence", 0.30), ("E-commerce", 0.15)]
PRODUITS = [  # (nom, famille, prix FCFA)
    ("Riz parfume 25kg", "Alimentaire", 14500), ("Huile de palme 5L", "Alimentaire", 6500),
    ("Manioc baton x10", "Alimentaire", 2500), ("Plantain regime", "Alimentaire", 3500),
    ("Macabo sac 50kg", "Alimentaire", 8000), ("Haricot niebe 1kg", "Alimentaire", 1200),
    ("Mais grain 1kg", "Alimentaire", 600), ("Cacao grade1 1kg", "Agricole", 5200),
    ("Cafe arabica 1kg", "Agricole", 3800), ("Sucre en poudre 1kg", "Alimentaire", 900),
    ("Farine de ble 1kg", "Alimentaire", 650), ("Lait poudre 400g", "Alimentaire", 3200),
    ("Sardine boite", "Alimentaire", 500), ("Spaghetti 500g", "Alimentaire", 450),
    ("Jus naturel 1L", "Boissons", 1200), ("Biere locale 65cl", "Boissons", 650),
    ("Eau minerale 1.5L", "Boissons", 500), ("Pagne Wax 6 yards", "Textile", 12000),
    ("Pagne Voile 6 yards", "Textile", 8000), ("Huile de karite 500ml", "Cosmetique", 3500),
    ("Savon artisanal lot", "Cosmetique", 1500), ("Ventilateur sur pied", "Equipement", 18000),
    ("Rechaud a gaz 2 feux", "Equipement", 25000), ("Smartphone Android E", "Equipement", 45000),
]
POINTS_VENTE = ["YAO-Centre", "YAO-Mvan", "DLA-Akwa", "DLA-Deido", "BFS-Marche A",
                "BMD-Food Market", "BUE-Molyko", "GAR-Centre", "MAR-Kakata",
                "NGA-Centre", "BER-Centre", "EBO-Centre", "E-COMMERCE-National",
                "AGENCE-Nord", "AGENCE-Grand Sud", "AGENCE-Ouest", "AGENCE-Littoral"]
VENDEURS = [("EVODO M.", "Centre"), ("NGONO A.", "Centre"), ("KAMDEM J.", "Ouest"),
            ("TCHOUMI S.", "Littoral"), ("MBAPPE L.", "Littoral"), ("FONKEM B.", "Nord-Ouest"),
            ("NDIFOR C.", "Sud-Ouest"), ("ADAMOU H.", "Nord"), ("ZARA A.", "Extreme-Nord"),
            ("ONDOUA P.", "Sud"), ("E-COMMERCE", "National")]

def saisonnalite(j: date) -> float:
    m = j.month
    coef = 1.0
    if m == 12: coef = 1.55   # fêtes de fin d'année
    elif m == 9: coef = 1.25  # rentrée scolaire
    elif m in (10, 11, 1): coef = 1.15  # traite cacao/café + fêtes
    elif m in (6, 7): coef = 0.88       # saison creuse pluies
    if j.weekday() == 5: coef *= 1.35   # samedi = jour de marché
    elif j.weekday() == 6: coef *= 0.55 # dimanche creux
    return coef

def pick_pondere(table):
    r = random.random(); acc = 0.0
    for v, p in table:
        acc += p
        if r <= acc: return v
    return table[-1][0]

def generer(nb_jours=800, base_jour=52):
    debut = date(2024, 10, 1)  # 24 mois -> comparatif N/N-1 reel sur toutes les fenetres
    lignes = []; tx_id = 100000
    for d in range(nb_jours):
        j = debut + timedelta(days=d)
        if j > date(2026, 10, 12): break
        croissance = 1 + (d / nb_jours) * 0.35  # +35 % de croissance sur la période
        n = max(8, int(random.gauss(base_jour * saisonnalite(j) * croissance, 9)))
        for _ in range(n):
            tx_id += 1
            region = pick_pondere([(r, p) for r, _, p in REGIONS])
            ville = next(v for r, v, _ in REGIONS if r == region)
            canal = pick_pondere(CANAUX)
            nom, fam, prix = random.choice(PRODUITS)
            qte = random.choices([1, 2, 3, 5, 10, 25], weights=[45, 25, 12, 8, 6, 4])[0]
            if fam == "Equipement": qte = random.choices([1, 2], weights=[90, 10])[0]
            remise = random.choices([0, 0.03, 0.05, 0.10], weights=[80, 10, 7, 3])[0]
            montant = round(qte * prix * (1 - remise))
            taux = {"Alimentaire": 0.22, "Agricole": 0.38, "Boissons": 0.30,
                    "Textile": 0.45, "Cosmetique": 0.50, "Equipement": 0.18}.get(fam, 0.25)
            cout = round(montant * (1 - taux))
            pv = "E-COMMERCE-National" if canal == "E-commerce" else random.choice(POINTS_VENTE[:12]) if canal == "POS" else random.choice(POINTS_VENTE[13:])
            vend = "E-COMMERCE" if canal == "E-commerce" else random.choice([v for v, rg in VENDEURS if rg in (region, "National")])
            ref = f"TX-{j.strftime('%Y%m%d')}-{tx_id}"
            lignes.append([ref, j.isoformat(), canal, region, ville, pv, vend, nom, fam, qte, prix, round(remise*100,1), montant, cout, "FCFA"])
    return lignes

SCHEMA = """
CREATE TABLE IF NOT EXISTS sales(
  id INTEGER PRIMARY KEY AUTOINCREMENT, ref TEXT UNIQUE, jour TEXT, canal TEXT,
  region TEXT, ville TEXT, point_vente TEXT, vendeur TEXT, produit TEXT, famille TEXT,
  qte INTEGER, prix_unit REAL, remise_pct REAL, montant REAL, devise TEXT DEFAULT 'FCFA',
  cout_unit REAL DEFAULT 0,
  source TEXT DEFAULT 'seed', created_at TEXT DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS imports(
  id INTEGER PRIMARY KEY AUTOINCREMENT, source TEXT, nom_fichier TEXT, jour TEXT,
  lignes_recues INTEGER, lignes_integrees INTEGER, doublons INTEGER, rejets INTEGER,
  statut TEXT, created_at TEXT DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS users(
  id INTEGER PRIMARY KEY AUTOINCREMENT, login TEXT UNIQUE, nom TEXT, role TEXT,
  perimetre TEXT, hash TEXT, mfa_secret TEXT, actif INTEGER DEFAULT 1,
  echecs INTEGER DEFAULT 0, bloque_jusqua TEXT, bloque_def INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS audit_logs(
  id INTEGER PRIMARY KEY AUTOINCREMENT, horo TEXT DEFAULT (datetime('now')),
  acteur TEXT, ip TEXT, action TEXT, ressource TEXT, resultat TEXT, empreinte TEXT);
CREATE TABLE IF NOT EXISTS reset_tokens(
  id INTEGER PRIMARY KEY AUTOINCREMENT, login TEXT, token TEXT UNIQUE, expire TEXT, utilise INTEGER DEFAULT 0);
"""

def main():
    DATA.mkdir(exist_ok=True)
    lignes = generer()
    with open(DATA / "ventes_agences.csv", "w", newline="", encoding="utf-8-sig") as f:
        w = csv.writer(f, delimiter=";")
        w.writerow(["ref", "jour", "canal", "region", "ville", "point_vente", "vendeur",
                    "produit", "famille", "qte", "prix_unit", "remise_pct", "montant", "cout_unit", "devise"])
        w.writerows(lignes)
    if DB.exists(): DB.unlink()
    cx = sqlite3.connect(DB); cx.executescript(SCHEMA)
    cx.executemany("INSERT OR IGNORE INTO sales(ref,jour,canal,region,ville,point_vente,vendeur,produit,famille,qte,prix_unit,remise_pct,montant,cout_unit,devise,source) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'seed')", lignes)
    cx.execute("INSERT INTO imports(source,nom_fichier,jour,lignes_recues,lignes_integrees,doublons,rejets,statut) VALUES('seed','ventes_agences.csv',date('now'),?,?,0,0,'Reussi')", (len(lignes), len(lignes)))
    cx.commit()
    ca = cx.execute("SELECT SUM(montant), COUNT(*) FROM sales").fetchone()
    cx.close()
    print(f"[OK] {len(lignes)} transactions | CA total {ca[0]:,.0f} FCFA | {ca[1]} lignes en base")
    print(f"[OK] CSV : {DATA/'ventes_agences.csv'} | DB : {DB}")

if __name__ == "__main__":
    main()
