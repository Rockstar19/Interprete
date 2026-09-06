// api/ciclos.js
//
// Puente entre el medidor de ciclo (HTML estático) y GitHub.
// GET  -> lee progreso-ciclos.json del repo y lo devuelve como JSON.
// POST -> recibe el estado nuevo y hace un commit al mismo archivo en GitHub.
//
// El token de GitHub vive solo aquí, como variable de entorno en Vercel — nunca
// en el HTML ni en el chat. Variables a configurar en el proyecto de Vercel:
//
//   GITHUB_TOKEN       (obligatoria) Personal Access Token con permiso de escritura
//                       sobre el repo Rockstar19/Interprete (scope "repo" clásico,
//                       o un token fine-grained con "Contents: Read and write").
//   GITHUB_OWNER        opcional, por defecto "Rockstar19"
//   GITHUB_REPO         opcional, por defecto "Interprete"
//   GITHUB_BRANCH       opcional, por defecto "main"
//   GITHUB_JSON_PATH    opcional, por defecto "progreso-ciclos.json"
//   MEDIDOR_SECRETO     opcional. Si la defines aquí, copia el mismo valor en la
//                       constante SECRETO_NUBE del HTML para exigir esa cabecera
//                       antes de aceptar guardados. No es una seguridad fuerte
//                       (el HTML es público y cualquiera puede leer su código),
//                       pero evita que bots que escanean rutas /api/* al azar
//                       encuentren y sobrescriban el archivo sin querer.

const OWNER = process.env.GITHUB_OWNER || 'Rockstar19';
const REPO = process.env.GITHUB_REPO || 'Interprete';
const BRANCH = process.env.GITHUB_BRANCH || 'main';
const RUTA = process.env.GITHUB_JSON_PATH || 'progreso-ciclos.json';
const TOKEN = process.env.GITHUB_TOKEN;
const SECRETO = process.env.MEDIDOR_SECRETO || '';

const API_BASE = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${encodeURIComponent(RUTA)}`;

function enviarError(res, codigo, mensaje) {
  res.status(codigo).json({ error: mensaje });
}

async function leerArchivoGitHub() {
  const r = await fetch(`${API_BASE}?ref=${BRANCH}`, {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });
  if (r.status === 404) return { existe: false, sha: null, contenido: null };
  if (!r.ok) {
    const texto = await r.text().catch(() => '');
    throw new Error(`GitHub GET ${r.status}: ${texto}`);
  }
  const datos = await r.json();
  const texto = Buffer.from(datos.content, 'base64').toString('utf-8');
  return { existe: true, sha: datos.sha, contenido: texto };
}

async function escribirArchivoGitHub(contenidoTexto, shaActual) {
  const cuerpo = {
    message: `Actualiza progreso del medidor de ciclo — ${new Date().toISOString()}`,
    content: Buffer.from(contenidoTexto, 'utf-8').toString('base64'),
    branch: BRANCH,
  };
  if (shaActual) cuerpo.sha = shaActual;

  const r = await fetch(API_BASE, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(cuerpo),
  });
  if (!r.ok) {
    const texto = await r.text().catch(() => '');
    throw new Error(`GitHub PUT ${r.status}: ${texto}`);
  }
  return r.json();
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Medidor-Secreto');
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (!TOKEN) return enviarError(res, 500, 'Falta configurar GITHUB_TOKEN en las variables de entorno de Vercel.');

  if (SECRETO && req.headers['x-medidor-secreto'] !== SECRETO) {
    return enviarError(res, 401, 'Secreto inválido o ausente.');
  }

  try {
    if (req.method === 'GET') {
      const archivo = await leerArchivoGitHub();
      if (!archivo.existe) return res.status(200).json({ existe: false, datos: null });
      let json;
      try {
        json = JSON.parse(archivo.contenido);
      } catch (e) {
        return enviarError(res, 500, 'El JSON guardado en GitHub está corrupto.');
      }
      return res.status(200).json({ existe: true, datos: json });
    }

    if (req.method === 'POST') {
      let cuerpo = req.body;
      if (typeof cuerpo === 'string') {
        try { cuerpo = JSON.parse(cuerpo); } catch (e) { return enviarError(res, 400, 'Cuerpo inválido: no es JSON.'); }
      }
      if (!cuerpo || typeof cuerpo !== 'object') return enviarError(res, 400, 'Cuerpo inválido: se esperaba un objeto JSON.');

      const actual = await leerArchivoGitHub();
      const texto = JSON.stringify(cuerpo, null, 2);
      const resultado = await escribirArchivoGitHub(texto, actual.sha);
      return res.status(200).json({ ok: true, commit: resultado && resultado.commit ? resultado.commit.sha : null });
    }

    return enviarError(res, 405, 'Método no permitido.');
  } catch (err) {
    return enviarError(res, 502, String((err && err.message) || err));
  }
};
