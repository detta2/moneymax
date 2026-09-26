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

  // collect previous-day rates so the UI can show 24H change
  let prev = null;
  try {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const iso = d.toISOString().slice(0, 10);
    const pr = await fetch(
      `https://api.frankfurter.dev/v1/${iso}?from=${base}`,
      { headers: { 'User-Agent': 'MoneyMax/1.0' } }
    );
    if (pr.ok) {
      const pd = await pr.json();
      if (pd && pd.rates) prev = pd.rates;
    }
  } catch (e) {}

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
          prev,
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
