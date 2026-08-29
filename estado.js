// Backend del medidor de ciclo — Vercel Serverless Function + Upstash Redis
//
// GET  /api/estado  -> devuelve el ultimo estado guardado (objeto JSON, o {} si no hay nada)
// POST /api/estado  -> guarda el estado enviado en el cuerpo de la peticion
//
// No requiere dependencias ni "npm install": usa la API REST de Upstash con fetch nativo.
// Vercel crea la ruta automaticamente por estar el archivo dentro de la carpeta /api.

const CLAVE_REDIS = 'medidor:estado';

// Vercel nombra estas variables distinto segun como se cree la base; se aceptan ambas formas.
const URL_REDIS =
  process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN_REDIS =
  process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

// Clave propia para que un tercero no pueda escribir. Si no se define, no se exige.
const TOKEN_APP = process.env.MEDIDOR_TOKEN || '';

async function comandoRedis(comando) {
  const r = await fetch(URL_REDIS, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN_REDIS}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(comando),
  });
  if (!r.ok) throw new Error(`Redis respondio ${r.status}`);
  return r.json();
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (!URL_REDIS || !TOKEN_REDIS) {
    return res.status(500).json({
      error:
        'Falta la base de datos. Crea un Upstash Redis en la pestana Storage del proyecto en Vercel.',
    });
  }

  // Verificacion de clave. Quita este bloque completo si prefieres el backend abierto.
  if (TOKEN_APP) {
    const enviado = req.headers['x-token'] || '';
    if (enviado !== TOKEN_APP) {
      return res.status(401).json({ error: 'Clave incorrecta o ausente' });
    }
  }

  try {
    if (req.method === 'GET') {
      const { result } = await comandoRedis(['GET', CLAVE_REDIS]);
      if (!result) return res.status(200).json({});
      try {
        return res.status(200).json(JSON.parse(result));
      } catch {
        // dato corrupto: se devuelve vacio en lugar de romper la pagina
        return res.status(200).json({});
      }
    }

    if (req.method === 'POST') {
      // req.body puede llegar ya parseado por Vercel, o como texto crudo
      let datos = req.body;
      if (typeof datos === 'string') {
        try {
          datos = JSON.parse(datos);
        } catch {
          return res.status(400).json({ error: 'El cuerpo no es JSON valido' });
        }
      }
      if (!datos || typeof datos !== 'object' || Array.isArray(datos)) {
        return res.status(400).json({ error: 'Se esperaba un objeto JSON' });
      }

      await comandoRedis(['SET', CLAVE_REDIS, JSON.stringify(datos)]);
      return res.status(200).json({ ok: true, guardado: new Date().toISOString() });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Metodo no permitido' });
  } catch (e) {
    return res.status(500).json({ error: 'Fallo al hablar con la base de datos' });
  }
}
