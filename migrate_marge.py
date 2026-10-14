# -*- coding: utf-8 -*-
"""Migration : ajoute cout_unit (marge brute) et remplit depuis les taux par famille."""
import sqlite3

TAUX = {"Alimentaire": 0.22, "Agricole": 0.38, "Boissons": 0.30,
        "Textile": 0.45, "Cosmetique": 0.50, "Equipement": 0.18}

cx = sqlite3.connect("sales.db")
cols = [r[1] for r in cx.execute("PRAGMA table_info(sales)").fetchall()]
if "cout_unit" not in cols:
    cx.execute("ALTER TABLE sales ADD COLUMN cout_unit REAL DEFAULT 0")
    print("colonne cout_unit ajoutee")
n = 0
for fam, t in TAUX.items():
    cur = cx.execute("UPDATE sales SET cout_unit = ROUND(montant * ?) WHERE famille = ? AND (cout_unit IS NULL OR cout_unit = 0)",
                     (1 - t, fam))
    n += cur.rowcount
cx.execute("UPDATE sales SET cout_unit = ROUND(montant * 0.75) WHERE cout_unit IS NULL OR cout_unit = 0")
cx.commit()
tot = cx.execute("SELECT COUNT(*), SUM(montant), SUM(montant - cout_unit) FROM sales").fetchone()
print(f"lignes coutees: {n} | total: {tot[0]} | CA: {tot[1]:,.0f} | marge: {tot[2]:,.0f} FCFA")
cx.close()
