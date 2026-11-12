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
