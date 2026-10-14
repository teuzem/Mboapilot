/* MboaPilot : client API (same-origin, cookie de session). */
async function req(url, opts = {}) {
  const r = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  let data = null;
  try { data = await r.json(); } catch { data = null; }
  if (r.status === 401) throw Object.assign(new Error("UNAUTHORIZED"), { code: 401 });
  if (!r.ok) throw new Error((data && data.message) || "Erreur serveur");
  return data;
}
export const api = {
  get: (u) => req(u),
  post: (u, body) => req(u, { method: "POST", body: JSON.stringify(body || {}) }),
};
export const fmt = (n) =>
  new Intl.NumberFormat("fr-FR").format(Math.round(Number(n) || 0));
export const fmtFCFA = (n) => fmt(n) + " FCFA";
