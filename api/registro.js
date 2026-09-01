// api/registro.js
//
// Endpoint GET/POST para sincronizar entre dispositivos el registro diario
// de la consola MBIC/MTAC (panel-mbic-mtac.html). Guarda un JSON por fecha.
//
// No usa el paquete @vercel/kv: llama directo a la REST API de Upstash con
// fetch nativo, así no hace falta tocar package.json ni instalar nada.
//
// REQUISITO (una sola vez, desde el dashboard de Vercel):
//   1. Proyecto "Interprete" → pestaña Storage → Create Database → KV
//   2. Connect Project → selecciona este proyecto
//   3. Vercel agrega solo las variables de entorno KV_REST_API_URL y
//      KV_REST_API_TOKEN — no hay que copiar ni pegar nada a mano.
//   4. Redeploy (Vercel normalmente lo sugiere automáticamente al conectar).
//
// Sin clave de acceso propia a propósito (endpoint abierto, uso personal).

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const KV_URL = process.env.KV_REST_API_URL;
  const KV_TOKEN = process.env.KV_REST_API_TOKEN;
  if (!KV_URL || !KV_TOKEN) {
    return res.status(500).json({
      error: 'KV no está conectado a este proyecto todavía. Ve a Vercel → Storage → Create Database → KV → Connect Project, y vuelve a desplegar.',
    });
  }

  const fecha = String(req.query.fecha || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return res.status(400).json({ error: 'Parámetro "fecha" inválido o faltante (formato YYYY-MM-DD).' });
  }
  const key = `mbic:${fecha}`;

  async function kvCommand(commandArray) {
    const r = await fetch(KV_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${KV_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(commandArray),
    });
    const j = await r.json();
    if (j.error) throw new Error(j.error);
    return j.result;
  }

  try {
    if (req.method === 'GET') {
      const raw = await kvCommand(['GET', key]);
      const data = raw ? JSON.parse(raw) : null;
      return res.status(200).json({ fecha, data });
    }

    if (req.method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch (e) { body = null; }
      }
      if (!body || typeof body !== 'object') {
        return res.status(400).json({ error: 'Cuerpo inválido: se espera un objeto JSON.' });
      }
      await kvCommand(['SET', key, JSON.stringify(body)]);
      return res.status(200).json({ ok: true, fecha });
    }

    return res.status(405).json({ error: 'Método no permitido. Usa GET o POST.' });
  } catch (err) {
    return res.status(500).json({ error: 'Error de almacenamiento en KV.', detail: String(err) });
  }
};
