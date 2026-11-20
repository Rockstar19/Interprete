(function () {
  "use strict";

  var proceso = document.getElementById("wc-proceso");
  var otros = document.getElementById("wc-otros-cuerpo");
  var glosario = document.getElementById("wc-glosario");
  if (!proceso && !otros && !glosario) return;

  var filtroEtapas = document.getElementById("wc-filtro-etapas");
  var cuentaEtapas = document.getElementById("wc-etapas-cuenta");
  var vacioEtapas = document.getElementById("wc-proceso-vacio");
  var fuentesCa = document.getElementById("wc-ca-fuentes");
  var filtroOtros = document.getElementById("wc-filtro-otros");
  var cuentaOtros = document.getElementById("wc-otros-cuenta");
  var vacioOtros = document.getElementById("wc-otros-vacio");
  var filtroGlosario = document.getElementById("wc-filtro-glosario");
  var cuentaGlosario = document.getElementById("wc-glosario-cuenta");
  var vacioGlosario = document.getElementById("wc-glosario-vacio");
  var chips = document.getElementById("wc-glosario-chips");

  var etapas = [];
  var filasQuien = [];
  var seccionQuien = null;
  var seccionVistazo = null;
  var seccionEtapas = null;
  var filasComparacion = [];
  var seccionComparacion = null;
  var fichas = [];
  var estadoActivo = "";
  var temas = [];
  var totalTerminos = 0;
  var temaActivo = "todo";
  var otrosListos = false;
  var pendiente = "";

  function vaciar(nodo) {
    if (!nodo) return;
    while (nodo.firstChild) nodo.removeChild(nodo.firstChild);
  }

  function normalizar(texto) {
    return String(texto == null ? "" : texto)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  function elemento(etiqueta, clase, texto) {
    var nodo = document.createElement(etiqueta);
    if (clase) nodo.className = clase;
    if (texto !== undefined) nodo.textContent = texto;
    return nodo;
  }

  function urlSegura(url) {
    return /^https?:\/\//i.test(String(url || ""));
  }

  function enlace(url, texto) {
    if (!urlSegura(url)) return elemento("span", "", texto);
    var a = elemento("a", "wc-enlace", texto);
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.appendChild(elemento("span", "portal-sr", " (se abre en una pestaña nueva)"));
    return a;
  }

  function desplazar(nodo) {
    if (!nodo) return;
    var reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    nodo.scrollIntoView({ behavior: reducido ? "auto" : "smooth", block: "start" });
  }

  function aviso(nodo, mensaje) {
    vaciar(nodo);
    var p = elemento("p", "wc-error", mensaje);
    p.setAttribute("role", "alert");
    nodo.appendChild(p);
  }

  function resaltar(celda, consulta) {
    var raw = celda.getAttribute("data-raw") || "";
    if (!consulta) {
      celda.textContent = raw;
      return;
    }
    var plano = normalizar(raw);
    if (plano.length !== raw.length || plano.indexOf(consulta) < 0) {
      celda.textContent = raw;
      return;
    }
    celda.textContent = "";
    var pos = 0;
    var idx = plano.indexOf(consulta);
    while (idx >= 0) {
      if (idx > pos) celda.appendChild(document.createTextNode(raw.slice(pos, idx)));
      celda.appendChild(elemento("mark", "wc-marca", raw.slice(idx, idx + consulta.length)));
      pos = idx + consulta.length;
      idx = plano.indexOf(consulta, pos);
    }
    if (pos < raw.length) celda.appendChild(document.createTextNode(raw.slice(pos)));
  }

  function crearTabla(cabezas, filas, columnas, clases) {
    var tabla = elemento("div", "wc-tabla");
    tabla.setAttribute("role", "table");
    tabla.style.setProperty("--cols", columnas);
    var cabeza = elemento("div", "wc-fila wc-fila--cabeza");
    cabeza.setAttribute("role", "row");
    cabezas.forEach(function (texto) {
      var celda = elemento("div", "wc-celda", texto);
      celda.setAttribute("role", "columnheader");
      cabeza.appendChild(celda);
    });
    tabla.appendChild(cabeza);
    var hechas = filas.map(function (fila) {
      var row = elemento("div", "wc-fila");
      row.setAttribute("role", "row");
      fila.forEach(function (texto, i) {
        var extra = clases && clases[i] ? " wc-celda--" + clases[i] : "";
        var celda = elemento("div", "wc-celda" + extra, texto);
        celda.setAttribute("role", "cell");
        celda.setAttribute("data-label", cabezas[i]);
        celda.setAttribute("data-raw", texto);
        row.appendChild(celda);
      });
      tabla.appendChild(row);
      return row;
    });
    return { tabla: tabla, filas: hechas };
  }

  function bloqueMini(titulo, cabezas, pares) {
    var caja = elemento("div");
    caja.appendChild(elemento("p", "wc-mini", titulo));
    var tabla = crearTabla(cabezas, pares, "1fr 1fr", ["", "es"]);
    caja.appendChild(tabla.tabla);
    return { caja: caja, filas: tabla.filas };
  }

  function hayDe(partes) {
    return normalizar(partes.join(" | "));
  }

  function construirProceso(guia) {
    vaciar(proceso);

    seccionQuien = elemento("section", "wc-bloque");
    seccionQuien.appendChild(elemento("h3", "", "Quién es quién"));
    seccionQuien.appendChild(elemento("p", "wc-sub", "Los participantes que verás en casi cualquier llamada."));
    var quien = crearTabla(guia.whoHeads, guia.who, guia.whoCols, guia.whoCls);
    filasQuien = quien.filas;
    filasQuien.forEach(function (fila) {
      var textos = [];
      Array.prototype.forEach.call(fila.children, function (celda) {
        textos.push(celda.getAttribute("data-raw") || "");
      });
      fila._hay = hayDe(textos);
    });
    seccionQuien.appendChild(quien.tabla);
    proceso.appendChild(seccionQuien);

    seccionVistazo = elemento("section", "wc-bloque");
    seccionVistazo.appendChild(elemento("h3", "", "El proceso de un vistazo"));
    seccionVistazo.appendChild(elemento("p", "wc-sub", "Toca una etapa para ir directo a ella."));
    var flujo = elemento("ol", "wc-flujo");
    seccionVistazo.appendChild(flujo);
    proceso.appendChild(seccionVistazo);

    seccionEtapas = elemento("section", "wc-bloque");
    seccionEtapas.appendChild(elemento("h3", "", "Etapa por etapa"));
    var masivo = elemento("div", "wc-masivo");
    var abrir = elemento("button", "", "Abrir todas");
    var cerrar = elemento("button", "", "Cerrar todas");
    abrir.type = "button";
    cerrar.type = "button";
    masivo.appendChild(abrir);
    masivo.appendChild(cerrar);
    seccionEtapas.appendChild(masivo);
    var lista = elemento("div", "wc-etapas");
    seccionEtapas.appendChild(lista);
    proceso.appendChild(seccionEtapas);

    etapas = guia.stages.map(function (etapa, indice) {
      var numero = String(indice + 1);
      var detalle = elemento("details", "wc-etapa");
      detalle.id = "etapa-" + numero;
      var sumario = elemento("summary");
      sumario.appendChild(elemento("span", "wc-num", numero));
      var titulo = elemento("span", "wc-etapa__titulo");
      titulo.appendChild(document.createTextNode(etapa.title));
      titulo.appendChild(elemento("span", "wc-etapa__en", etapa.en));
      sumario.appendChild(titulo);
      detalle.appendChild(sumario);

      var cuerpo = elemento("div", "wc-etapa__cuerpo");
      var plazos = elemento("div", "wc-plazos");
      etapa.tags.forEach(function (tag) {
        plazos.appendChild(elemento("span", "wc-plazo", tag));
      });
      cuerpo.appendChild(plazos);

      var que = elemento("div");
      que.appendChild(elemento("p", "wc-mini", "Qué pasa"));
      var viñetas = elemento("ul");
      etapa.what.forEach(function (texto) {
        viñetas.appendChild(elemento("li", "", texto));
      });
      que.appendChild(viñetas);
      cuerpo.appendChild(que);

      var par = elemento("div", "wc-par");
      var terminos = bloqueMini("Términos de esta etapa", ["English", "Español"], etapa.terms);
      var frases = bloqueMini("Frases típicas", ["English", "Español"], etapa.phrases);
      par.appendChild(terminos.caja);
      par.appendChild(frases.caja);
      cuerpo.appendChild(par);

      var nota = elemento("div", "wc-nota-int");
      nota.appendChild(elemento("p", "wc-mini", "Para el intérprete"));
      nota.appendChild(elemento("p", "", etapa.note));
      cuerpo.appendChild(nota);
      detalle.appendChild(cuerpo);
      lista.appendChild(detalle);

      var item = elemento("li");
      var boton = elemento("button", "wc-flujo__btn");
      boton.type = "button";
      boton.setAttribute("aria-controls", "etapa-" + numero);
      boton.appendChild(elemento("span", "wc-flujo__n", "Etapa " + numero));
      boton.appendChild(elemento("span", "wc-flujo__t", etapa.title));
      boton.appendChild(elemento("span", "wc-flujo__d", etapa.tags[0] || ""));
      item.appendChild(boton);
      flujo.appendChild(item);

      var objeto = {
        d: detalle,
        flujo: item,
        filas: terminos.filas.concat(frases.filas),
        abierto: false
      };
      objeto.hay = hayDe([
        etapa.title,
        etapa.en,
        etapa.tags.join(" "),
        etapa.what.join(" "),
        etapa.note,
        etapa.terms.map(function (parTermino) { return parTermino.join(" "); }).join(" "),
        etapa.phrases.map(function (parFrase) { return parFrase.join(" "); }).join(" ")
      ]);
      sumario.addEventListener("click", function () {
        objeto.abierto = !detalle.open;
      });
      boton.addEventListener("click", function () {
        objeto.abierto = true;
        detalle.open = true;
        desplazar(detalle);
      });
      return objeto;
    });

    abrir.addEventListener("click", function () {
      etapas.forEach(function (etapa) {
        if (!etapa.d.hidden) {
          etapa.d.open = true;
          etapa.abierto = true;
        }
      });
    });
    cerrar.addEventListener("click", function () {
      etapas.forEach(function (etapa) {
        etapa.d.open = false;
        etapa.abierto = false;
      });
    });

    if (fuentesCa) {
      vaciar(fuentesCa);
      fuentesCa.appendChild(elemento("h3", "", "Fuentes"));
      var notaFuente = elemento("div", "wc-nota-int");
      notaFuente.appendChild(elemento("p", "", guia.notaFuentes));
      fuentesCa.appendChild(notaFuente);
      var listaFuentes = elemento("ul", "wc-fuentes-lista");
      guia.fuentes.forEach(function (fuente) {
        var li = elemento("li");
        li.appendChild(enlace(fuente.url, fuente.texto));
        listaFuentes.appendChild(li);
      });
      fuentesCa.appendChild(listaFuentes);
    }
    pintarEtapas(normalizar(filtroEtapas ? filtroEtapas.value : ""));
  }

  function pintarEtapas(consulta) {
    var visibles = 0;
    var quienVisible = 0;
    etapas.forEach(function (etapa) {
      var coincide = !consulta || etapa.hay.indexOf(consulta) >= 0;
      etapa.d.hidden = !coincide;
      etapa.flujo.hidden = !coincide;
      if (!coincide) return;
      visibles += 1;
      etapa.d.open = consulta ? true : etapa.abierto;
      etapa.filas.forEach(function (fila) {
        Array.prototype.forEach.call(fila.children, function (celda) {
          resaltar(celda, consulta);
        });
      });
    });
    filasQuien.forEach(function (fila) {
      var coincide = !consulta || fila._hay.indexOf(consulta) >= 0;
      fila.hidden = !coincide;
      if (!coincide) return;
      quienVisible += 1;
      Array.prototype.forEach.call(fila.children, function (celda) {
        resaltar(celda, consulta);
      });
    });
    if (seccionQuien) seccionQuien.hidden = quienVisible === 0;
    if (seccionVistazo) seccionVistazo.hidden = visibles === 0;
    if (seccionEtapas) seccionEtapas.hidden = visibles === 0;
    if (cuentaEtapas) {
      cuentaEtapas.textContent =
        visibles === etapas.length
          ? etapas.length + " etapas"
          : visibles + " de " + etapas.length + " etapas";
    }
    if (vacioEtapas) vacioEtapas.hidden = !(visibles === 0 && quienVisible === 0);
  }

  function construirOtros(guia) {
    vaciar(otros);
    estadoActivo = guia.states[0].id;

    seccionComparacion = elemento("section", "wc-bloque");
    seccionComparacion.appendChild(elemento("h3", "", "Comparación rápida"));
    seccionComparacion.appendChild(
      elemento(
        "p",
        "wc-sub",
        'Desliza la tabla hacia los lados en el teléfono. Donde dice "confirmar", las fuentes oficiales que consulté no daban el dato.'
      )
    );
    var marco = elemento("div", "wc-cmp-wrap");
    marco.tabIndex = 0;
    marco.setAttribute("role", "region");
    marco.setAttribute("aria-label", "Tabla comparativa de California, Nueva York, Texas, Puerto Rico y Florida");
    var tabla = elemento("table", "wc-cmp");
    var thead = elemento("thead");
    var filaCabeza = elemento("tr");
    guia.compare.heads.forEach(function (texto) {
      var th = elemento("th", "", texto);
      th.scope = "col";
      filaCabeza.appendChild(th);
    });
    thead.appendChild(filaCabeza);
    tabla.appendChild(thead);
    var tbody = elemento("tbody");
    filasComparacion = guia.compare.rows.map(function (fila) {
      var tr = elemento("tr");
      fila.forEach(function (texto, i) {
        var celda = elemento(i === 0 ? "th" : "td", i === 1 ? "wc-cmp__ca" : "", texto);
        if (i === 0) celda.scope = "row";
        tr.appendChild(celda);
      });
      tr._hay = hayDe(fila);
      tbody.appendChild(tr);
      return tr;
    });
    tabla.appendChild(tbody);
    marco.appendChild(tabla);
    seccionComparacion.appendChild(marco);
    otros.appendChild(seccionComparacion);

    var eleccion = elemento("section", "wc-bloque");
    eleccion.appendChild(elemento("h3", "", "Elige una jurisdicción"));
    var picker = elemento("div", "wc-picker");
    picker.setAttribute("role", "group");
    picker.setAttribute("aria-label", "Jurisdicción");
    var paneles = elemento("div");
    eleccion.appendChild(picker);
    eleccion.appendChild(paneles);
    otros.appendChild(eleccion);

    fichas = guia.states.map(function (estado) {
      var boton = elemento("button", "wc-tab", estado.name);
      boton.type = "button";
      boton.setAttribute("aria-pressed", estado.id === estadoActivo ? "true" : "false");
      boton.addEventListener("click", function () {
        if (filtroOtros) filtroOtros.value = "";
        estadoActivo = estado.id;
        pintarOtros("");
        desplazar(document.getElementById("ficha-" + estado.id) || picker);
      });
      picker.appendChild(boton);

      var panel = elemento("article", "wc-panel");
      panel.id = "ficha-" + estado.id;
      var cabeza = elemento("div");
      cabeza.appendChild(elemento("h3", "wc-panel__nombre", estado.name));
      cabeza.appendChild(elemento("p", "wc-panel__agencia", estado.agency));
      var plazos = elemento("div", "wc-plazos");
      estado.tags.forEach(function (tag) {
        plazos.appendChild(elemento("span", "wc-plazo", tag));
      });
      cabeza.appendChild(plazos);
      panel.appendChild(cabeza);
      panel.appendChild(elemento("p", "", estado.intro));

      var pasos = elemento("div");
      pasos.appendChild(elemento("p", "wc-mini", "Paso a paso"));
      var ol = elemento("ol", "wc-pasos");
      estado.steps.forEach(function (paso) {
        var li = elemento("li");
        var texto = elemento("div");
        texto.appendChild(elemento("strong", "", paso[0]));
        texto.appendChild(elemento("span", "", paso[1]));
        li.appendChild(texto);
        ol.appendChild(li);
      });
      pasos.appendChild(ol);
      panel.appendChild(pasos);

      var plazosClave = elemento("div");
      plazosClave.appendChild(elemento("p", "wc-mini", "Plazos clave"));
      var tablaPlazos = crearTabla(["Qué", "Plazo"], estado.deadlines, "1fr 1.2fr", ["", "sig"]);
      plazosClave.appendChild(tablaPlazos.tabla);
      panel.appendChild(plazosClave);

      var par = elemento("div", "wc-par");
      var terminos = bloqueMini("Términos de " + estado.name, ["English", "Español"], estado.terms);
      var frases = bloqueMini("Frases típicas", ["English", "Español"], estado.phrases);
      par.appendChild(terminos.caja);
      par.appendChild(frases.caja);
      panel.appendChild(par);

      var cambia = elemento("div");
      cambia.appendChild(elemento("p", "wc-mini", "Qué cambia frente a California"));
      var ul = elemento("ul", "wc-vs");
      estado.vsca.forEach(function (texto) {
        ul.appendChild(elemento("li", "", texto));
      });
      cambia.appendChild(ul);
      panel.appendChild(cambia);

      var nota = elemento("div", "wc-nota-int");
      nota.appendChild(elemento("p", "wc-mini", "Para el intérprete"));
      nota.appendChild(elemento("p", "", estado.note));
      panel.appendChild(nota);

      var fuentes = elemento("div");
      fuentes.appendChild(elemento("p", "wc-mini", "Fuentes de " + estado.name));
      var listaFuentes = elemento("ul", "wc-fuentes-lista");
      estado.sources.forEach(function (fuente) {
        var li = elemento("li");
        li.appendChild(enlace(fuente[1], fuente[0]));
        listaFuentes.appendChild(li);
      });
      fuentes.appendChild(listaFuentes);
      panel.appendChild(fuentes);
      paneles.appendChild(panel);

      var objeto = {
        id: estado.id,
        boton: boton,
        panel: panel,
        filas: tablaPlazos.filas.concat(terminos.filas, frases.filas)
      };
      objeto.hay = hayDe([
        estado.name,
        estado.en,
        estado.agency,
        estado.tags.join(" "),
        estado.intro,
        estado.steps.map(function (paso) { return paso.join(" "); }).join(" "),
        estado.deadlines.map(function (plazo) { return plazo.join(" "); }).join(" "),
        estado.terms.map(function (termino) { return termino.join(" "); }).join(" "),
        estado.phrases.map(function (frase) { return frase.join(" "); }).join(" "),
        estado.vsca.join(" "),
        estado.note
      ]);
      return objeto;
    });

    otrosListos = true;
    pintarOtros(normalizar(filtroOtros ? filtroOtros.value : ""));
  }

  function pintarOtros(consulta) {
    var comparacionVisible = 0;
    filasComparacion.forEach(function (fila) {
      var coincide = !consulta || fila._hay.indexOf(consulta) >= 0;
      fila.hidden = !coincide;
      if (coincide) comparacionVisible += 1;
    });
    if (seccionComparacion) seccionComparacion.hidden = comparacionVisible === 0;

    var visibles = 0;
    fichas.forEach(function (ficha) {
      var coincide = consulta ? ficha.hay.indexOf(consulta) >= 0 : ficha.id === estadoActivo;
      ficha.panel.hidden = !coincide;
      var pulsado = consulta ? coincide : ficha.id === estadoActivo;
      ficha.boton.setAttribute("aria-pressed", pulsado ? "true" : "false");
      if (!coincide) return;
      visibles += 1;
      ficha.filas.forEach(function (fila) {
        Array.prototype.forEach.call(fila.children, function (celda) {
          if (celda.hasAttribute("data-raw")) resaltar(celda, consulta);
        });
      });
    });
    if (cuentaOtros) {
      cuentaOtros.textContent = consulta
        ? visibles + " de " + fichas.length + " jurisdicciones"
        : fichas.length + " jurisdicciones";
    }
    if (vacioOtros) vacioOtros.hidden = !(consulta && visibles === 0 && comparacionVisible === 0);
  }

  function abrirFicha(id, llevar) {
    if (!otrosListos) {
      pendiente = id;
      desplazar(document.getElementById("otros"));
      return;
    }
    if (filtroOtros) filtroOtros.value = "";
    estadoActivo = id;
    pintarOtros("");
    if (llevar) desplazar(document.getElementById("ficha-" + id) || document.getElementById("otros"));
  }

  function construirGlosario(datos) {
    vaciar(glosario);
    vaciar(chips);
    totalTerminos = 0;
    temaActivo = "todo";

    function chip(id, etiqueta) {
      var boton = elemento("button", "wc-chip", etiqueta);
      boton.type = "button";
      boton.setAttribute("aria-pressed", id === temaActivo ? "true" : "false");
      boton.addEventListener("click", function () {
        temaActivo = id;
        Array.prototype.forEach.call(chips.children, function (otro) {
          otro.setAttribute("aria-pressed", "false");
        });
        boton.setAttribute("aria-pressed", "true");
        pintarGlosario();
      });
      chips.appendChild(boton);
    }

    chip("todo", "Todo");
    temas = datos.sections.map(function (seccion) {
      chip(seccion.id, seccion.chip);
      var bloque = elemento("section", "wc-tema");
      bloque.id = "tema-" + seccion.id;
      bloque.appendChild(elemento("h3", "", seccion.title));
      bloque.appendChild(elemento("p", "wc-sub", seccion.sub));
      var tabla = crearTabla(seccion.heads, seccion.rows, seccion.cols, seccion.cls);
      tabla.filas.forEach(function (fila) {
        var textos = [];
        Array.prototype.forEach.call(fila.children, function (celda) {
          textos.push(celda.getAttribute("data-raw") || "");
        });
        fila._hay = hayDe(textos);
        totalTerminos += 1;
      });
      bloque.appendChild(tabla.tabla);
      glosario.appendChild(bloque);
      return { def: seccion, bloque: bloque, filas: tabla.filas };
    });
    pintarGlosario();
  }

  function pintarGlosario() {
    var consulta = normalizar(filtroGlosario ? filtroGlosario.value.trim() : "");
    var visibles = 0;
    temas.forEach(function (tema) {
      var temaActivoAhora = temaActivo === "todo" || temaActivo === tema.def.id;
      var alguno = 0;
      tema.filas.forEach(function (fila) {
        var coincide = temaActivoAhora && (!consulta || fila._hay.indexOf(consulta) >= 0);
        fila.hidden = !coincide;
        if (!coincide) return;
        alguno += 1;
        Array.prototype.forEach.call(fila.children, function (celda) {
          if (celda.hasAttribute("data-raw")) resaltar(celda, consulta);
        });
      });
      tema.bloque.hidden = alguno === 0;
      visibles += alguno;
    });
    if (cuentaGlosario) {
      cuentaGlosario.textContent =
        visibles === totalTerminos
          ? totalTerminos + " términos"
          : visibles + " de " + totalTerminos + " términos";
    }
    if (vacioGlosario) vacioGlosario.hidden = visibles !== 0;
  }

  function glosarioSimple(lista) {
    vaciar(chips);
    vaciar(glosario);
    totalTerminos = lista.length;
    temas = [];
    var bloque = elemento("section", "wc-tema");
    var tabla = crearTabla(
      ["English", "Español", "Nota"],
      lista.map(function (item) {
        return [item.en, item.es, item.explicacion];
      }),
      "1.2fr 1.2fr 1.6fr",
      ["", "es", "note"]
    );
    tabla.filas.forEach(function (fila, indice) {
      var item = lista[indice];
      fila._hay = hayDe([item.en, item.es, item.explicacion, item.sigla || ""]);
    });
    bloque.appendChild(tabla.tabla);
    glosario.appendChild(bloque);
    temas = [{ def: { id: "todo" }, bloque: bloque, filas: tabla.filas }];
    pintarGlosario();
  }

  function aplicarHash(llevar) {
    var hash = location.hash || "";
    var ficha = /^#ficha-(ny|tx|pr|fl)$/.exec(hash);
    if (ficha) {
      abrirFicha(ficha[1], llevar);
      return;
    }
    var etapa = /^#etapa-([1-9]|10)$/.exec(hash);
    if (!etapa) return;
    var nodo = document.getElementById(hash.slice(1));
    var objeto = null;
    for (var i = 0; i < etapas.length; i += 1) {
      if (etapas[i].d === nodo) objeto = etapas[i];
    }
    if (!objeto) return;
    objeto.abierto = true;
    objeto.d.open = true;
    if (llevar) desplazar(objeto.d);
  }

  document.addEventListener("click", function (evento) {
    var origen = evento.target;
    if (origen && origen.nodeType !== 1) origen = origen.parentElement;
    var enlaceFicha = origen && origen.closest ? origen.closest("[data-wc-abrir]") : null;
    if (!enlaceFicha) return;
    abrirFicha(enlaceFicha.getAttribute("data-wc-abrir"), true);
  });

  if (filtroEtapas) {
    filtroEtapas.addEventListener("input", function () {
      pintarEtapas(normalizar(filtroEtapas.value.trim()));
    });
  }
  if (filtroOtros) {
    filtroOtros.addEventListener("input", function () {
      pintarOtros(normalizar(filtroOtros.value.trim()));
    });
  }
  if (filtroGlosario) {
    filtroGlosario.addEventListener("input", pintarGlosario);
  }
  window.addEventListener("hashchange", function () {
    aplicarHash(true);
  });

  function cargar(url) {
    return fetch(url).then(function (respuesta) {
      if (!respuesta.ok) throw new Error(url);
      return respuesta.json();
    });
  }

  if (proceso) {
    cargar("data/wc_guia.json")
      .then(function (guia) {
        construirProceso(guia);
        construirOtros(guia);
        if (pendiente) abrirFicha(pendiente, true);
        else aplicarHash(true);
      })
      .catch(function () {
        aviso(
          proceso,
          "No se pudo cargar la guía de California y de los otros estados. El directorio de 54 jurisdicciones sigue disponible."
        );
        if (otros) {
          aviso(otros, "No se pudo cargar la comparación de estados.");
        }
      });
  }

  if (glosario) {
    cargar("data/wc_glosario.json")
      .then(construirGlosario)
      .catch(function () {
        return cargar("data/workers_comp_estados.json").then(function (datos) {
          glosarioSimple(datos.glosario || []);
        });
      })
      .catch(function () {
        aviso(glosario, "No se pudo cargar el glosario. Los consejos de esta página siguen disponibles.");
      });
  }
})();
