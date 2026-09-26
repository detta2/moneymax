export default async function handler(req, res) {
  // Validasi input: base/target 3 huruf, days 1..90
  const clean = (v, def) => /^[A-Z]{3}$/i.test(v || def) ? (v || def).toUpperCase() : def;
  const base = clean(req.query.base, 'USD');
  const target = clean(req.query.target, 'IDR');
  const days = Math.min(Math.max(parseInt(req.query.days) || 90, 1), 90);

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

  const end = new Date();
  const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
  const fmt = (d) => d.toISOString().slice(0, 10);
  const s = fmt(start), e = fmt(end);

  // frankfurter.dev adalah domain baru (api.frankfurter.app kini 301 ke sini).
  // exchangerate.host butuh access_key sejak 2025 -> bukan fallback gratis lagi.
  const sources = [
    `https://api.frankfurter.dev/v1/${s}..${e}?from=${base}&to=${target}`,
    `https://api.frankfurter.app/${s}..${e}?from=${base}&to=${target}`,
  ];

  for (const url of sources) {
    try {
      const r = await fetch(url, { redirect: 'follow' });
      if (!r.ok) continue;
      const d = await r.json();
      const series = d && d.rates;
      if (series && Object.keys(series).length >= 3) {
        const points = Object.entries(series)
          .sort()
          .map(([date, val]) => ({ date, rate: val[target] || val }));
        return res.status(200).json({ base, target, points });
      }
    } catch (e) { continue; }
  }
  return res.status(503).json({ error: 'no history source', base, target });
}
