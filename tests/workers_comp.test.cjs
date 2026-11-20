const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const data = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "data", "workers_comp_estados.json"), "utf8")
);

const CAMPOS = [
  "formulario_trabajador",
  "formulario_empleador",
  "plazo_avisar_empleador",
  "plazo_presentar_reclamo",
  "defensor",
  "eleccion_medico",
];

test("cubre los 50 estados, DC y tres territorios del directorio DOL", () => {
  assert.equal(data.jurisdicciones.length, 54);
  const codigos = data.jurisdicciones.map((item) => item.codigo);
  assert.equal(new Set(codigos).size, 54);
  for (const codigo of ["DC", "GU", "PR", "VI"]) {
    assert.ok(codigos.includes(codigo));
  }
  assert.equal(codigos.filter((codigo) => codigo.length === 2).length, 54);
});

test("cada ficha tiene contacto, fuente y fecha, y no inventa campos vacíos", () => {
  for (const item of data.jurisdicciones) {
    assert.ok(item.agencia);
    assert.ok(item.sitio.startsWith("http"));
    assert.ok(item.telefono);
    assert.equal(item.verificado_el, "2026-11-12");
    assert.equal(item.fuente_directorio_dol, "https://www.dol.gov/agencies/owcp/wc");
    let hayClave = false;
    for (const campo of CAMPOS) {
      const valor = item[campo];
      if (valor == null) continue;
      assert.equal(typeof valor.texto, "string");
      assert.ok(valor.texto.length > 20);
      assert.ok(valor.fuente.startsWith("http"));
      hayClave = true;
    }
    assert.equal(item.datos_clave_verificados, hayClave);
  }
});

test("los programas federales citan dol.gov y un teléfono", () => {
  assert.equal(data.federal.length, 4);
  for (const programa of data.federal) {
    assert.match(programa.sitio, /^https:\/\/www\.dol\.gov\//);
    assert.match(programa.telefono, /\d/);
    assert.ok(programa.cubre.length > 40);
  }
});

test("el glosario tiene los términos de una llamada de workers' comp", () => {
  const ingles = data.glosario.map((item) => item.en.toLowerCase());
  for (const termino of [
    "claim",
    "adjuster",
    "claimant",
    "injured worker",
    "carrier",
    "temporary total disability",
    "maximum medical improvement",
    "independent medical examination",
    "impairment rating",
    "light duty",
    "work restrictions",
    "return to work",
    "nurse case manager",
    "utilization review",
    "settlement",
    "deposition",
    "mileage reimbursement",
    "pre-authorization",
  ]) {
    assert.ok(ingles.includes(termino), termino);
  }
  for (const item of data.glosario) {
    assert.ok(item.es);
    assert.ok(item.explicacion.length > 20);
  }
});

function normalizar(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

test("la guía copia el proceso, la comparación y las fuentes del artefacto", () => {
  const guia = JSON.parse(
    fs.readFileSync(path.join(__dirname, "..", "data", "wc_guia.json"), "utf8")
  );
  assert.equal(guia.who.length, 11);
  assert.equal(guia.who[0][0], "Trabajador lesionado / solicitante");
  assert.equal(guia.who[10][1], "workers' compensation judge / WCAB");
  assert.equal(guia.stages.length, 10);
  assert.deepEqual(
    guia.stages.map((etapa) => etapa.title),
    [
      "Lesión y aviso",
      "Formulario de reclamo (DWC-1)",
      "Atención médica inicial",
      "Decisión del reclamo",
      "Incapacidad temporal (TD)",
      "Tratamiento continuo y revisión de utilización",
      "Disputas médicas: QME y AME",
      "Alta médica y regreso al trabajo",
      "Incapacidad permanente (PD)",
      "Disputas ante la WCAB y arreglo",
    ]
  );
  const temporal = guia.stages[4];
  assert.ok(temporal.what.some((texto) => texto.includes("$264.61") && texto.includes("$1,764.11")));
  assert.ok(
    guia.stages[5].what.some((texto) =>
      texto.includes("La DWC avisó que hay reglas nuevas de UR desde el 1 de abril de 2026.")
    )
  );
  assert.match(guia.notaFuentes, /1\.º de abril de 2026/);
  assert.equal(guia.fuentes.length, 14);
  assert.equal(guia.fuentes[0].url, "https://edd.ca.gov/es/disability/");
  assert.equal(
    guia.fuentes[13].url,
    "https://www.fresno.gov/personnel/risk-management/ames-and-qmes/"
  );
  assert.deepEqual(guia.compare.heads, [
    "Aspecto",
    "California",
    "Nueva York",
    "Texas",
    "Puerto Rico",
    "Florida (Miami)",
  ]);
  assert.equal(guia.compare.rows.length, 11);
  assert.equal(guia.compare.rows[10][0], "Detalle que cambia todo");
  assert.deepEqual(
    guia.states.map((estado) => estado.id),
    ["ny", "tx", "pr", "fl"]
  );
  for (const estado of guia.states) {
    assert.ok(estado.agency);
    assert.ok(estado.intro.length > 40);
    assert.ok(estado.steps.length >= 4);
    assert.ok(estado.deadlines.length >= 4);
    assert.ok(estado.terms.length >= 8);
    assert.ok(estado.phrases.length >= 4);
    assert.ok(estado.vsca.length >= 3);
    assert.ok(estado.note.length > 40);
    for (const fuente of estado.sources) {
      assert.match(fuente[1], /^https?:\/\//);
    }
  }
  assert.match(guia.stages[0].what.join(" "), /30 días/);
  assert.ok(normalizar(guia.stages[0].what.join(" ")).includes("lesion"));
});

test("el glosario conserva las 300 filas y suma solo términos que no estaban", () => {
  const glosario = JSON.parse(
    fs.readFileSync(path.join(__dirname, "..", "data", "wc_glosario.json"), "utf8")
  );
  assert.deepEqual(
    glosario.sections.map((seccion) => seccion.id),
    ["siglas", "laboral", "edd", "embarazo", "medico", "proceso", "frases", "notas"]
  );
  assert.deepEqual(
    glosario.sections.map((seccion) => seccion.chip),
    [
      "Siglas",
      "Compensación laboral",
      "EDD, SDI y PFL",
      "Embarazo y licencias",
      "Médicos y lesión",
      "Proceso y disputas",
      "Frases de llamada",
      "Notas del intérprete",
    ]
  );
  const notas = glosario.sections.find((seccion) => seccion.id === "notas");
  assert.equal(notas.rows.length, 14);
  assert.equal(notas.rows[0][0], "disability");
  assert.match(notas.sub, /Falsos amigos/);
  let total = 0;
  const claves = new Set();
  for (const seccion of glosario.sections) {
    const columna = seccion.id === "siglas" ? 1 : 0;
    for (const fila of seccion.rows) {
      total += 1;
      assert.equal(fila.length, seccion.heads.length);
      if (seccion.id === "siglas") claves.add(normalizar(fila[0]));
      const ingles = normalizar(fila[columna]);
      claves.add(ingles);
      for (const parte of ingles.split("/")) claves.add(parte.trim());
    }
  }
  assert.equal(total - glosario.agregadosDelDirectorio.length, 300);
  assert.ok(glosario.agregadosDelDirectorio.length > 0);
  const laboral = glosario.sections.find((seccion) => seccion.id === "laboral");
  for (const ingles of glosario.agregadosDelDirectorio) {
    const veces = laboral.rows.filter((fila) => fila[0] === ingles).length;
    assert.equal(veces, 1, ingles);
    assert.ok(
      data.glosario.some((item) => item.en === ingles),
      ingles
    );
  }
  for (const item of data.glosario) {
    if (glosario.agregadosDelDirectorio.includes(item.en)) continue;
    assert.ok(claves.has(normalizar(item.en)), item.en);
  }
  assert.ok(glosario.agregadosDelDirectorio.includes("nurse case manager"));
  assert.ok(glosario.agregadosDelDirectorio.includes("mileage reimbursement"));
  assert.ok(!glosario.agregadosDelDirectorio.includes("claim"));
  assert.ok(!glosario.agregadosDelDirectorio.includes("maximum medical improvement"));
});

test("la página conserva el directorio, lo federal y el generador, y enlaza la guía", () => {
  const html = fs.readFileSync(path.join(__dirname, "..", "workers_comp.html"), "utf8");
  const guia = fs.readFileSync(path.join(__dirname, "..", "workers_comp_guia.js"), "utf8");
  const inicio = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
  for (const id of ["california", "otros", "estado", "federal", "glosario", "consejos"]) {
    assert.match(html, new RegExp('id="' + id + '"'));
  }
  assert.match(html, /Ayuda Workers' Comp/);
  assert.match(html, /generador_nota_llamada\.html/);
  assert.match(html, /Buscar en las etapas…/);
  assert.match(html, /No se envía ni se guarda ningún dato de la llamada/);
  assert.match(guia, /Abrir todas/);
  assert.match(guia, /Cerrar todas/);
  assert.match(guia, /data-wc-abrir/);
  assert.match(inicio, /workers_comp\.html/);
  const generador = fs.readFileSync(
    path.join(__dirname, "..", "generador_nota_llamada.html"),
    "utf8"
  );
  assert.match(generador, /Reporte de cumplimiento/);
});
