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

  // --- Crypto & metals history ---
  const CRYPTO_ID = { BTC: 'bitcoin', ETH: 'ethereum', SOL: 'solana', BNB: 'binancecoin',
    XRP: 'ripple', DOGE: 'dogecoin', USDT: 'tether', TRX: 'tron', ADA: 'cardano', LINK: 'chainlink' };
  const METALS = { XAU: 1, XAG: 1 };

  // crypto -> target fiat
  if (CRYPTO_ID[base]) {
    try {
      const r = await fetch(`https://api.coingecko.com/api/v3/coins/${CRYPTO_ID[base]}/market_chart?vs_currency=${target.toLowerCase()}&days=${days}`,
        { headers: { 'User-Agent': 'MoneyMax/1.0' } });
      if (r.ok) {
        const d = await r.json();
        const pts = (d.prices || []).map(([ms, v]) => ({ date: new Date(ms).toISOString().slice(0, 10), rate: v }));
        if (pts.length >= 3) {
          // downsample to <=1 point/day
          const byDay = {};
          for (const p of pts) byDay[p.date] = p.rate;
          return res.status(200).json({ base, target, points: Object.entries(byDay).sort().map(([date, rate]) => ({ date, rate })) });
        }
      }
    } catch (e) {}
  }
  // metal -> target fiat (XAU/XAG in USD from gold-api, then convert)
  if (METALS[base]) {
    try {
      const r = await fetch(`https://api.coingecko.com/api/v3/coins/${base.toLowerCase()}/market_chart?vs_currency=${target.toLowerCase()}&days=${days}`,
        { headers: { 'User-Agent': 'MoneyMax/1.0' } });
      if (r.ok) {
        const d = await r.json();
        const pts = (d.prices || []).map(([ms, v]) => ({ date: new Date(ms).toISOString().slice(0, 10), rate: v }));
        if (pts.length >= 3) {
          const byDay = {};
          for (const p of pts) byDay[p.date] = p.rate;
          return res.status(200).json({ base, target, points: Object.entries(byDay).sort().map(([date, rate]) => ({ date, rate })) });
        }
      }
    } catch (e) {}
  }
  // crypto/metal as the TARGET (fiat base -> crypto target)
  if (CRYPTO_ID[target] || METALS[target]) {
    const vc = CRYPTO_ID[target] ? CRYPTO_ID[target] : target.toLowerCase();
    try {
      const r = await fetch(`https://api.coingecko.com/api/v3/coins/${vc}/market_chart?vs_currency=${base.toLowerCase()}&days=${days}`,
        { headers: { 'User-Agent': 'MoneyMax/1.0' } });
      if (r.ok) {
        const d = await r.json();
        const pts = (d.prices || []).map(([ms, v]) => ({ date: new Date(ms).toISOString().slice(0, 10), rate: v }));
        if (pts.length >= 3) {
          const byDay = {};
          for (const p of pts) byDay[p.date] = p.rate;
          return res.status(200).json({ base, target, points: Object.entries(byDay).sort().map(([date, rate]) => ({ date, rate })) });
        }
      }
    } catch (e) {}
    // metals fallback: @fawazahmed0/currency-api has XAU/XAG per date
    if (METALS[target]) {
      try {
        const byDay = {};
        const t = target.toLowerCase();
        for (let i = 0; i <= days; i++) {
          const d = new Date(end.getTime() - i * 24 * 60 * 60 * 1000);
          const iso = fmt(d);
          const url = `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${iso}/v1/currencies/${t}.json`;
          const r = await fetch(url, { headers: { 'User-Agent': 'MoneyMax/1.0' } });
          if (!r.ok) continue;
          const j = await r.json();
          const v = j && j[t] ? j[t][base.toLowerCase()] : null;
          if (v !== null && isFinite(v)) byDay[iso] = v;
        }
        const points = Object.entries(byDay).sort().map(([date, rate]) => ({ date, rate }));
        if (points.length >= 3) return res.status(200).json({ base, target, points });
      } catch (e) {}
    }
  }

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
