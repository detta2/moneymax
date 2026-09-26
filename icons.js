// Currency icon resolver: flags for fiat, branded icons for crypto/metals.
// flagcdn.com uses lowercase ISO-3166 country codes; most currency codes map
// directly, but a handful need an explicit override.
const FLAG_OVERRIDE = {
  EUR: 'eu', GBP: 'gb', TRY: 'tr', KRW: 'kr', RUB: 'ru', ZAR: 'za',
  PHP: 'ph', VND: 'vn', IDR: 'id', PLN: 'pl', THB: 'th', MYR: 'my',
  CNY: 'cn', JPY: 'jp', INR: 'in', BRL: 'br', MXN: 'mx', CHF: 'ch',
  SGD: 'sg', HKD: 'hk', AUD: 'au', CAD: 'ca', NZD: 'nz', SEK: 'se',
  NOK: 'no', DKK: 'dk', CZK: 'cz', HUF: 'hu', RON: 'ro', BGN: 'bg',
  HRK: 'hr', ISK: 'is', ILS: 'il', JOD: 'jo', KWD: 'kw', QAR: 'qa',
  OMR: 'om', BHD: 'bh', LKR: 'lk', NPR: 'np', MMK: 'mm', KHR: 'kh',
  LAK: 'la', TWD: 'tw', AED: 'ae', SAR: 'sa', EGP: 'eg', KES: 'ke',
  MAD: 'ma', NGN: 'ng', PKR: 'pk', BDT: 'bd', USD: 'us',
};
const CRYPTO_ICON = {
  BTC: 'btc', ETH: 'eth', SOL: 'sol', BNB: 'bnb', XRP: 'xrp', DOGE: 'doge',
  USDT: 'usdt', TRX: 'trx', ADA: 'ada', LINK: 'link',
};
const METAL_ICON = { XAU: 'gold', XAG: 'silver' };
const METAL_GLYPH = { XAU: '🥇', XAG: '🥈' };

function iconFor(code) {
  if (CRYPTO_ICON[code]) {
    return '<img class="ic" alt="' + code + '" loading="lazy" ' +
      'src="https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/svg/color/' + CRYPTO_ICON[code] + '.svg">';
  }
  if (METAL_ICON[code]) {
    return '<span class="metal-ic" aria-hidden="true">' + (METAL_GLYPH[code] || '◆') + '</span>';
  }
  var cc = (FLAG_OVERRIDE[code] || code.slice(0, 2)).toLowerCase();
  return '<img class="ic" alt="' + code + '" loading="lazy" src="https://flagcdn.com/w40/' + cc + '.png" ' +
    'onerror="this.style.display=\'none\';this.insertAdjacentHTML(\'afterend\',\'<span class=\\\'ic-fallback\\\'>' + code + '</span>\')">';
}
