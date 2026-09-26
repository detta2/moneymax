export default async function handler(req, res) {
  // Validasi input: base/target 3 huruf, days 1..90
  const clean = (v, def) => /^[A-Z]{3}$/i.test(v || def) ? (v || def).toUpperCase() : def;
  const base = clean(req.query.base, 'USD');
  const target = clean(req.query.target, 'IDR');
  const days = Math.min(Math.max(parseInt(req.query.days) || 90, 1), 90);

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

  const end = new Date();
  const fmt = (d) => d.toISOString().slice(0, 10);
  const e = fmt(end);

  const CRYPTO_ID = { BTC: 'bitcoin', ETH: 'ethereum', SOL: 'solana', BNB: 'binancecoin',
    XRP: 'ripple', DOGE: 'dogecoin', USDT: 'tether', TRX: 'tron', ADA: 'cardano', LINK: 'chainlink' };
  const METALS = { XAU: 1, XAG: 1 };
  const isCrypto = (c) => !!CRYPTO_ID[c];
  const isMetal = (c) => !!METALS[c];
  const isAsset = isCrypto(base) || isCrypto(target) || isMetal(base) || isMetal(target);

  // fetch JSON helper, null kalau gagal
  async function get(url) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': 'MoneyMax/1.0' } });
      if (!r.ok) return null;
      return await r.json();
    } catch (x) { return null; }
  }

  // ============================================================
  // 1) CRYPTO & LOGAM — CoinGecko market_chart (satu-satunya
  //    sumber gratis tanpa key yang punya history crypto).
  // ============================================================
  if (isAsset) {
    let coinId, vs;
    if (isCrypto(base)) { coinId = CRYPTO_ID[base]; vs = target.toLowerCase(); }
    else if (isCrypto(target)) { coinId = CRYPTO_ID[target]; vs = base.toLowerCase(); }
    else if (isMetal(base)) { coinId = base.toLowerCase(); vs = target.toLowerCase(); }
    else { coinId = target.toLowerCase(); vs = base.toLowerCase(); }

    const d = await get(`https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=${vs}&days=${days}`);
    if (d && Array.isArray(d.prices) && d.prices.length >= 3) {
      const byDay = {};
      for (const [ms, v] of d.prices) byDay[new Date(ms).toISOString().slice(0, 10)] = v;
      const series = Object.entries(byDay).sort().map(([date, rate]) => ({ date, rate }));
      if (series.length >= 3) return res.status(200).json({ base, target, points: series });
    }

    // Fallback logam: @fawazahmed0/currency-api punya XAU/XAG per tanggal
    const metal = isMetal(target) ? target : (isMetal(base) ? base : null);
    if (metal) {
      const byDay = {};
      const m = metal.toLowerCase();
      const other = (isMetal(target) ? base : target).toLowerCase();
      for (let i = 0; i <= days; i++) {
        const iso = fmt(new Date(end.getTime() - i * 24 * 60 * 60 * 1000));
        const j = await get(`https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${iso}/v1/currencies/${m}.json`);
        const v = j && j[m] ? j[m][other] : null;
        if (v !== null && isFinite(v)) byDay[iso] = v;
      }
      const series = Object.entries(byDay).sort().map(([date, rate]) => ({ date, rate }));
      if (series.length >= 3) return res.status(200).json({ base, target, points: series });
    }
  }

  // ============================================================
  // 2) FIAT — @fawazahmed0/currency-api: history harian ~160
  //    mata uang, kursnya konsisten dengan er-api (sumber
  //    converter) sehingga chart & converter selalu menampilkan
  //    angka yang sama. Titik terakhir ditimpa snapshot live
  //    er-api supaya nilainya identik dengan converter.
  // ============================================================
  if (!isAsset) {
    const live = await get(`https://open.er-api.com/v6/latest/${base}`);
    const liveRate = live && live.rates ? live.rates[target] : null;

    const byDay = {};
    const b = base.toLowerCase(), t = target.toLowerCase();
    const step = days > 30 ? 3 : (days > 14 ? 2 : 1);
    for (let i = 0; i <= days; i += step) {
      const iso = fmt(new Date(end.getTime() - i * 24 * 60 * 60 * 1000));
      const j = await get(`https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${iso}/v1/currencies/${b}.json`);
      const v = j && j[b] ? j[b][t] : null;
      if (v !== null && isFinite(v)) byDay[iso] = v;
    }
    let series = Object.entries(byDay).sort().map(([date, rate]) => ({ date, rate }));
    if (liveRate !== null && isFinite(liveRate)) {
      if (series.length) series[series.length - 1] = { date: e, rate: liveRate };
      else series = [{ date: e, rate: liveRate }];
    }
    if (series.length >= 3) return res.status(200).json({ base, target, points: series });
  }

  // ============================================================
  // 3) Fallback terakhir: frankfurter.dev
  // ============================================================
  const s = fmt(new Date(end.getTime() - days * 24 * 60 * 60 * 1000));
  for (const url of [
    `https://api.frankfurter.dev/v1/${s}..${e}?from=${base}&to=${target}`,
    `https://api.frankfurter.app/${s}..${e}?from=${base}&to=${target}`,
  ]) {
    const d = await get(url);
    const series = d && d.rates ? Object.entries(d.rates).sort().map(([date, val]) => ({ date, rate: val[target] || val })) : null;
    if (series && series.length >= 3) return res.status(200).json({ base, target, points: series });
  }

  return res.status(503).json({ error: 'no history source', base, target });
}
