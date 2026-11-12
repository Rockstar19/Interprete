(function () {
  "use strict";

  var CLAVE = "ci-workers-comp-estado";
  var VERIFICAR = "Verificar en el sitio oficial";
  var datos = null;
  var codigoActivo = "";

  var filtroEstado = document.getElementById("wc-filtro-estado");
  var selectEstado = document.getElementById("wc-estado");
  var ficha = document.getElementById("wc-ficha");
  var recordado = document.getElementById("wc-recordado");
  var federal = document.getElementById("wc-federal");
  var filtroGlosario = document.getElementById("wc-filtro-glosario");
  var cuentaGlosario = document.getElementById("wc-glosario-cuenta");
  var listaGlosario = document.getElementById("wc-glosario");

  function escapar(texto) {
    return String(texto == null ? "" : texto)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function enlace(url, texto) {
    if (!url) return escapar(texto);
    return (
      '<a class="wc-enlace" href="' +
      escapar(url) +
      '" target="_blank" rel="noopener noreferrer">' +
      escapar(texto) +
      '<span class="portal-sr"> (se abre en una pestaña nueva)</span></a>'
    );
  }

  function etiqueta(item) {
    var es = item.nombre_es;
    var en = item.nombre_en;
    if (es && en && es.toLowerCase() !== en.toLowerCase()) {
      return es + " — " + en + " (" + item.codigo + ")";
    }
    return (es || en) + " (" + item.codigo + ")";
  }

  function coincideEstado(item, consulta) {
    if (!consulta) return true;
    var texto = (
      item.codigo +
      " " +
      item.nombre_es +
      " " +
      item.nombre_en +
      " " +
      item.agencia
    ).toLowerCase();
    return texto.indexOf(consulta) !== -1;
  }

  function leerGuardado() {
    try {
      return localStorage.getItem(CLAVE) || "";
    } catch (error) {
      return "";
    }
  }

  function guardar(codigo) {
    try {
      if (codigo) localStorage.setItem(CLAVE, codigo);
    } catch (error) {
      /* El navegador puede bloquear el almacenamiento. La ficha sigue en pantalla. */
    }
  }

  function porCodigo(codigo) {
    var lista = datos.jurisdicciones;
    for (var i = 0; i < lista.length; i += 1) {
      if (lista[i].codigo === codigo) return lista[i];
    }
    return null;
  }

  function llenarSelect(consulta, preferido) {
    var q = (consulta || "").trim().toLowerCase();
    var coincidencias = datos.jurisdicciones.filter(function (item) {
      return coincideEstado(item, q);
    });
    var html = '<option value="">Elija un estado o territorio</option>';
    coincidencias.forEach(function (item) {
      html +=
        '<option value="' +
        escapar(item.codigo) +
        '">' +
        escapar(etiqueta(item)) +
        "</option>";
    });
    selectEstado.innerHTML = html;

    var elegido = preferido;
    if (q && coincidencias.length === 1) elegido = coincidencias[0].codigo;
    if (elegido && porCodigo(elegido) && coincideEstado(porCodigo(elegido), q)) {
      selectEstado.value = elegido;
    } else if (elegido && !q) {
      selectEstado.value = elegido;
    }
  }

  function campo(valor, sitio) {
    if (!valor || !valor.texto) {
      return enlace(sitio, VERIFICAR);
    }
    var html = escapar(valor.texto);
    if (valor.fuente) {
      html += " " + enlace(valor.fuente, "Fuente");
    }
    return html;
  }

  function tieneDatoClave(item) {
    return [
      "formulario_trabajador",
      "formulario_empleador",
      "plazo_avisar_empleador",
      "plazo_presentar_reclamo",
      "defensor",
      "eleccion_medico"
    ].some(function (clave) {
      return item[clave] && item[clave].texto;
    });
  }

  function pintarFicha(codigo) {
    var item = porCodigo(codigo);
    if (!item) {
      ficha.innerHTML =
        '<section class="portal-tarjeta wc-ficha"><p>Elija un estado o territorio para ver la agencia y los datos contrastados.</p></section>';
      recordado.textContent = "";
      return;
    }

    var insignia = tieneDatoClave(item)
      ? "Contacto verificado y algún dato clave contrastado"
      : "Contacto verificado; plazos y formularios por confirmar";

    ficha.innerHTML =
      '<section class="portal-tarjeta wc-ficha">' +
      '<p class="wc-etiqueta">' +
      escapar(insignia) +
      "</p>" +
      "<h3>" +
      escapar(etiqueta(item)) +
      "</h3>" +
      "<p><strong>" +
      escapar(item.agencia) +
      "</strong></p>" +
      '<dl class="wc-dl">' +
      "<div><dt>Sitio oficial</dt><dd>" +
      enlace(item.sitio, item.sitio) +
      "</dd></div>" +
      "<div><dt>Teléfono</dt><dd>" +
      escapar(item.telefono) +
      "</dd></div>" +
      "<div><dt>Dirección publicada</dt><dd>" +
      escapar(item.direccion) +
      "</dd></div>" +
      "<div><dt>Formulario del trabajador</dt><dd>" +
      campo(item.formulario_trabajador, item.sitio) +
      "</dd></div>" +
      "<div><dt>Formulario del empleador</dt><dd>" +
      campo(item.formulario_empleador, item.sitio) +
      "</dd></div>" +
      "<div><dt>Plazo para avisar al empleador</dt><dd>" +
      campo(item.plazo_avisar_empleador, item.sitio) +
      "</dd></div>" +
      "<div><dt>Plazo para presentar el reclamo</dt><dd>" +
      campo(item.plazo_presentar_reclamo, item.sitio) +
      "</dd></div>" +
      "<div><dt>Defensor u ombudsman</dt><dd>" +
      campo(item.defensor, item.sitio) +
      "</dd></div>" +
      "<div><dt>Elección de médico</dt><dd>" +
      campo(item.eleccion_medico, item.sitio) +
      "</dd></div>" +
      "</dl>" +
      (item.nota ? '<p class="wc-nota">' + escapar(item.nota) + "</p>" : "") +
      '<p class="wc-fuentes">Fuente del contacto: ' +
      enlace(item.fuente, item.fuente) +
      ". Verificado el " +
      escapar(item.verificado_el) +
      ".</p></section>";

    recordado.textContent =
      "Este navegador recordará " + etiqueta(item) + " para la próxima visita.";
  }

  function pintarFederal() {
    var html = "";
    datos.federal.forEach(function (programa) {
      html +=
        '<article class="portal-tarjeta wc-programa">' +
        '<p class="wc-etiqueta">Programa federal</p>' +
        "<h3>" +
        escapar(programa.nombre) +
        "</h3>" +
        "<p>" +
        escapar(programa.cubre) +
        "</p>" +
        '<dl class="wc-dl">' +
        "<div><dt>Sitio oficial</dt><dd>" +
        enlace(programa.sitio, programa.sitio) +
        "</dd></div>" +
        "<div><dt>Teléfono publicado en dol.gov</dt><dd>" +
        escapar(programa.telefono) +
        "</dd></div>" +
        "<div><dt>Formularios</dt><dd>" +
        escapar(programa.formularios) +
        (programa.fuente_formularios
          ? " " + enlace(programa.fuente_formularios, "Fuente")
          : "") +
        "</dd></div>" +
        "</dl></article>";
    });
    federal.innerHTML = html;
  }

  function pintarGlosario() {
    var q = (filtroGlosario.value || "").trim().toLowerCase();
    var lista = datos.glosario.filter(function (item) {
      if (!q) return true;
      var texto = (item.en + " " + item.es + " " + item.explicacion + " " + (item.sigla || "")).toLowerCase();
      if (q.length <= 4) {
        var seguro = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        return new RegExp("(^|[^a-záéíóúüñ])" + seguro + "(?![a-záéíóúüñ])").test(texto);
      }
      return texto.indexOf(q) !== -1;
    });
    cuentaGlosario.textContent =
      lista.length + " de " + datos.glosario.length + " términos";
    if (!lista.length) {
      listaGlosario.innerHTML =
        '<p class="portal-tarjeta wc-termino">Ningún término coincide. Pruebe con la sigla en inglés o con una palabra en español.</p>';
      return;
    }
    listaGlosario.innerHTML = lista
      .map(function (item) {
        return (
          '<article class="wc-termino">' +
          "<h3>" +
          escapar(item.en) +
          (item.sigla ? " (" + escapar(item.sigla) + ")" : "") +
          "</h3>" +
          '<p class="wc-es">' +
          escapar(item.es) +
          "</p>" +
          '<p class="wc-explicacion">' +
          escapar(item.explicacion) +
          "</p></article>"
        );
      })
      .join("");
  }

  function adoptar(codigo) {
    if (!codigo) return;
    codigoActivo = codigo;
    guardar(codigo);
    pintarFicha(codigo);
  }

  function alCambiarEstado() {
    adoptar(selectEstado.value);
  }

  function mostrarError() {
    var aviso =
      '<p class="wc-error" role="alert">No se pudo cargar <code>data/workers_comp_estados.json</code>. Abra la página desde el sitio (no como archivo suelto) y vuelva a intentarlo. Los consejos de esta página siguen disponibles.</p>';
    ficha.innerHTML = aviso;
    selectEstado.innerHTML = '<option value="">No se cargaron los estados</option>';
  }

  fetch("data/workers_comp_estados.json")
    .then(function (respuesta) {
      if (!respuesta.ok) throw new Error("json");
      return respuesta.json();
    })
    .then(function (json) {
      datos = json;
      datos.jurisdicciones.sort(function (a, b) {
        return etiqueta(a).localeCompare(etiqueta(b), "es");
      });
      var guardado = leerGuardado();
      if (guardado && !porCodigo(guardado)) guardado = "";
      codigoActivo = guardado;
      llenarSelect("", guardado);
      pintarFicha(guardado);
      pintarFederal();
      pintarGlosario();
    })
    .catch(mostrarError);

  filtroEstado.addEventListener("input", function () {
    llenarSelect(filtroEstado.value, codigoActivo);
    if (selectEstado.value && selectEstado.value !== codigoActivo) adoptar(selectEstado.value);
  });

  selectEstado.addEventListener("change", alCambiarEstado);
  filtroGlosario.addEventListener("input", function () {
    if (datos) pintarGlosario();
  });
})();
