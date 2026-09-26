export default async function handler(req, res) {
  const base = (req.query.base || 'USD').toUpperCase();
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');

  // --- Crypto & metals: CoinGecko (no key) + gold-api (no key) ---
  const CRYPTO = {
    BTC: 'bitcoin', ETH: 'ethereum', SOL: 'solana', BNB: 'binancecoin',
    XRP: 'ripple', DOGE: 'dogecoin', USDT: 'tether', TRX: 'tron',
    ADA: 'cardano', LINK: 'chainlink',
  };
  const METALS = { XAU: 'gold', XAG: 'silver' };
  const ASSETS = { ...CRYPTO, ...METALS };
  const USD_BASES = ['USD', 'USDT', ...Object.keys(ASSETS)];

  async function assetUsd(code) {
    if (METALS[code]) {
      const r = await fetch(`https://api.gold-api.com/price/${code}`, { headers: { 'User-Agent': 'MoneyMax/1.0' } });
      if (!r.ok) return null;
      const d = await r.json();
      const p = parseFloat(d.price);
      return isFinite(p) ? p : null;
    }
    const id = CRYPTO[code];
    const r = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd&include_24hr_change=true`, { headers: { 'User-Agent': 'MoneyMax/1.0' } });
    if (!r.ok) return null;
    const d = await r.json();
    if (!d[id]) return null;
    return { usd: parseFloat(d[id].usd), ch: parseFloat(d[id].usd_24h_change) };
  }

  // base is a crypto/metal -> quote in every fiat we know
  if (ASSETS[base]) {
    try {
      const u = await assetUsd(base);
      if (u) {
        const usd = typeof u === 'number' ? u : u.usd;
        const r = await fetch(`https://open.er-api.com/v6/latest/USD`, { headers: { 'User-Agent': 'MoneyMax/1.0' } });
        if (r.ok) {
          const fr = await r.json();
          if (fr && fr.rates) {
            const rates = {};
            for (const c of Object.keys(fr.rates)) rates[c] = fr.rates[c] * usd;
            rates[base] = 1;
            const prev = {};
            const ch = typeof u === 'object' && u.ch ? u.ch / 100 : null;
            if (ch !== null) for (const c of Object.keys(rates)) prev[c] = rates[c] / (1 + ch);
            return res.status(200).json({ base, rates, prev, source: 'coingecko+er-api', updated: new Date().toISOString() });
          }
        }
      }
    } catch (e) {}
  }

  // base is fiat -> attach crypto & metals priced in this fiat
  async function buildExtra() {
    const out = {};
    const r = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${Object.values(CRYPTO).join(',')}&vs_currencies=usd&include_24hr_change=true`, { headers: { 'User-Agent': 'MoneyMax/1.0' } });
    if (r.ok) {
      const d = await r.json();
      for (const code of Object.keys(CRYPTO)) {
        const it = d[CRYPTO[code]];
        if (it && isFinite(it.usd)) out[code] = { usd: it.usd, ch: it.usd_24h_change };
      }
    }
    for (const code of Object.keys(METALS)) {
      const p = await assetUsd(code);
      if (typeof p === 'number') out[code] = { usd: p, ch: null };
    }
    return out;
  }

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

  // fetch JSON helper
  async function get(url) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': 'MoneyMax/1.0' } });
      if (!r.ok) return null;
      return await r.json();
    } catch (x) { return null; }
  }

  // collect previous-day rates so the UI can show 24H change.
  // Pakai fawazahmed0 currency-api (kurs-nya konsisten dgn er-api, beda tipis
  // dibanding frankfurter). Hari kemarin = tanggal UTC kemarin.
  let prev = null;
  {
    const dd = new Date();
    dd.setDate(dd.getDate() - 1);
    const iso = dd.toISOString().slice(0, 10);
    const j = await get(`https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${iso}/v1/currencies/${base.toLowerCase()}.json`);
    if (j && j[base.toLowerCase()]) prev = j[base.toLowerCase()];
  }

  for (const s of sources) {
    try {
      const r = await fetch(s.url, { headers: { 'User-Agent': 'MoneyMax/1.0' } });
      if (!r.ok) continue;
      const data = await r.json();
      const rates = s.map(data);
      if (rates && Object.keys(rates).length > 5) {
        // augment with crypto & metals (only for fiat bases)
        if (!ASSETS[base] && base !== 'USDT') {
          try {
            const extra = await buildExtra();
            let usdRate = rates['USD'] || 1;
            for (const code of Object.keys(extra)) {
              rates[code] = extra[code].usd * usdRate;
              if (extra[code].ch !== null && extra[code].ch !== undefined) {
                prev = prev || {};
                prev[code] = rates[code] / (1 + extra[code].ch / 100);
              }
            }
          } catch (e) {}
        }
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
