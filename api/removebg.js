// Vercel Serverless Function — Node bawaan saja (fetch/FormData/Blob global)
// Mendukung 2 mode input: raw bytes (image/*) atau multipart/form-data
export const config = { runtime: 'nodejs', maxDuration: 60 };

function readRawBody(req) {
  return new Promise(function (resolve, reject) {
    var chunks = [];
    req.on('data', function (c) { chunks.push(c); });
    req.on('end', function () { resolve(Buffer.concat(chunks)); });
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  var apiKey = process.env.REMOVE_BG_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'REMOVE_BG_API_KEY tidak dikonfigurasi' });

  try {
    var buf = await readRawBody(req);
    if (!buf.length) return res.status(400).json({ error: 'Body kosong — kirim file gambar' });

    var ct = req.headers['content-type'] || '';
    var body, headers;

    if (ct.indexOf('multipart/form-data') === 0) {
      body = buf;
      headers = { 'X-Api-Key': apiKey, 'Content-Type': ct };
    } else {
      var form = new FormData();
      form.append('image_file', new Blob([buf], { type: ct || 'image/png' }), 'input.png');
      form.append('size', 'auto');
      body = form;
      headers = { 'X-Api-Key': apiKey };
    }

    var r = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST', headers: headers, body: body
    });

    if (!r.ok) {
      var detail = await r.text();
      return res.status(r.status).json({ error: 'remove.bg menolak permintaan', detail: detail });
    }

    var out = Buffer.from(await r.arrayBuffer());
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-store');
    return res.send(out);
  } catch (e) {
    return res.status(500).json({ error: 'Kesalahan server', detail: String((e && e.message) || e) });
  }
}