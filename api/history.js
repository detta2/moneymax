export default async function handler(req, res) {
  const base = (req.query.base || 'USD').toUpperCase();
  const target = (req.query.target || 'IDR').toUpperCase();
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

  const end = new Date();
  const start = new Date(end.getTime() - 90 * 24 * 60 * 60 * 1000);
  const fmt = (d) => d.toISOString().slice(0, 10);
  const s = fmt(start), e = fmt(end);

  const sources = [
    `https://api.frankfurter.app/${s}..${e}?from=${base}&to=${target}`,
    `https://api.exchangerate.host/timeseries?start_date=${s}&end_date=${e}&base=${base}&symbols=${target}`,
  ];

  for (const url of sources) {
    try {
      const r = await fetch(url);
      if (!r.ok) continue;
      const d = await r.json();
      const series = d.rates;
      if (series && Object.keys(series).length > 10) {
        const points = Object.entries(series)
          .sort()
          .map(([date, val]) => ({ date, rate: val[target] || val }));
        return res.status(200).json({ base, target, points });
      }
    } catch (e) { continue; }
  }
  return res.status(503).json({ error: 'no history source', base, target });
}
