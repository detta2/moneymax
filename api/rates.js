export default async function handler(req, res) {
  const base = (req.query.base || 'USD').toUpperCase();
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');

  const sources = [
    {
      url: `https://open.er-api.com/v6/latest/${base}`,
      map: (d) => d && d.rates ? d.rates : null,
    },
    {
      url: `https://api.frankfurter.app/latest?from=${base}`,
      map: (d) => d && d.rates ? d.rates : null,
    },
    {
      url: `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${base.toLowerCase()}.json`,
      map: (d) => d && d[base.toLowerCase()] ? d[base.toLowerCase()] : null,
    },
  ];

  for (const s of sources) {
    try {
      const r = await fetch(s.url, { headers: { 'User-Agent': 'MoneyMax/1.0' } });
      if (!r.ok) continue;
      const data = await r.json();
      const rates = s.map(data);
      if (rates && Object.keys(rates).length > 5) {
        return res.status(200).json({
          base,
          rates,
          source: s.url.split('/')[2],
          updated: new Date().toISOString(),
        });
      }
    } catch (e) {
      continue;
    }
  }
  return res.status(503).json({ error: 'no source available', base });
}
