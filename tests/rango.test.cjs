const {test,afterEach}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const modelo=require('../rango-modelo.js');
const repo=require('../rango-repositorio.js');
const inicial=require('../api/progreso-rango.json');
const ejemplo=[[6,0,0,0,0],[4,2,0,0,0],[6,1,0,1,0],[5,3,0,0,0]];
const fetchOriginal=global.fetch;
afterEach(()=>{global.fetch=fetchOriginal;});

test('reproduce el ejemplo del post y la salida del período de cinco estrellas',()=>{
  assert.deepEqual(modelo.resumen(ejemplo),{total:28,puntos:131,promedio:131/28});
  assert.equal(modelo.resumen(ejemplo).promedio.toFixed(2),'4.68');
  assert.equal(modelo.resumen(ejemplo.slice(1)).promedio.toFixed(2),'4.59');
});
test('pondera por valoraciones, no por promedios de períodos',()=>{
  assert.equal(modelo.resumen([[100,0,0,0,0],[0,0,0,0,1]]).promedio,501/101);
  assert.equal(modelo.resumen([[0,0,0,0,0]]).promedio,null);
});
test('metas exactas: 2, 17 y 32 valoraciones; sin redondear el promedio',()=>{
  const r=modelo.resumen(ejemplo);
  assert.deepEqual([4.7,4.8,4.85].map(m=>modelo.cincoEstrellas(r,m)),[2,17,32]);
  assert.equal(modelo.cincoEstrellas({total:200,puntos:959,promedio:4.795},4.8),5);
  assert.equal(modelo.cincoEstrellas({total:1,puntos:5,promedio:5},4.8),0);
  assert.equal(modelo.cincoEstrellas(r,5),Infinity);
  assert.equal(modelo.cincoEstrellas({total:0},4.8),null);
});
test('valida archivo, cantidades y campos antes de adoptar datos remotos',()=>{
  assert.deepEqual(modelo.validar(inicial),inicial);
  for(const cambio of [{rating:6},{cA:-1},{cB:'20'},{proyeccionDia:Infinity},{ultimoCiclo:2.5},{valoraciones:[]},{usarValoraciones:true}]){
    assert.throws(()=>modelo.validar({...inicial,...cambio}));
  }
  assert.throws(()=>modelo.validar({...inicial,valoraciones:[[1.5,0,0,0,0],...ejemplo.slice(1)]}));
});
test('carga GitHub sin token y decodifica UTF-8',async()=>{
  global.fetch=async(url,opts)=>{
    assert.match(url,/\/contents\/api\/progreso-rango\.json\?ref=main$/);
    assert.equal(opts.headers.Authorization,undefined);
    assert.equal(opts.cache,'no-store');
    return {ok:true,json:async()=>({sha:'abc',encoding:'base64',content:Buffer.from(JSON.stringify({...inicial,nota:'calificación'})).toString('base64')})};
  };
  const r=await repo.cargar('');assert.equal(r.sha,'abc');assert.equal(r.datos.nota,'calificación');
});
test('escritura con SHA, rama y token solo en cabecera; preserva el contenido',async()=>{
  global.fetch=async(url,opts)=>{
    assert.equal(opts.method,'PUT');
    assert.equal(opts.headers.Authorization,'Bearer token-de-prueba');
    const body=JSON.parse(opts.body);
    assert.equal(body.sha,'abc');assert.equal(body.branch,'main');
    assert.deepEqual(JSON.parse(Buffer.from(body.content,'base64').toString()),inicial);
    assert.ok(!opts.body.includes('token-de-prueba'));
    return {ok:true,json:async()=>({content:{sha:'def'}})};
  };
  assert.equal(await repo.guardar(inicial,'abc','token-de-prueba'),'def');
});
test('bloquea escrituras sin revisión/token y no reintenta conflictos',async()=>{
  let llamadas=0;
  global.fetch=async()=>{llamadas++;return {ok:false,status:409};};
  await assert.rejects(repo.guardar(inicial,'abc',''),/token/);
  await assert.rejects(repo.guardar(inicial,null,'token'),/Primero carga/);
  assert.equal(llamadas,0);
  await assert.rejects(repo.guardar(inicial,'abc','token'),/cambió/);
  assert.equal(llamadas,1);
});
test('errores de autorización, permisos y red son visibles',async()=>{
  for(const status of [401,403,404,500]){
    global.fetch=async()=>({ok:false,status});
    await assert.rejects(repo.cargar('token'));
  }
  global.fetch=async()=>{throw new Error('offline');};
  await assert.rejects(repo.guardar(inicial,'abc','token'),/conexión/);
});

// Ejecuta los eventos de la página sin depender de un DOM externo ni de GitHub real.
function pagina(repositorio){
  const elementos={};
  function elemento(id){return elementos[id] ||= {value:'',checked:false,disabled:false,textContent:'',innerHTML:'',dataset:{},handlers:{},addEventListener(tipo,fn){this.handlers[tipo]=fn;},focus(){},checkValidity(){return true;},reportValidity(){}};}
  const document={getElementById:elemento,querySelectorAll:()=>[]};
  const window={confirm:()=>true,addEventListener(){}};
  const html=fs.readFileSync(require.resolve('../calculadora-ascenso-rango.html'),'utf8');
  const source=html.match(/<script>\s*([\s\S]*?)<\/script>/)[1];
  vm.runInNewContext(source,{document,window,RangoModelo:modelo,RangoRepositorio:repositorio});
  return elementos;
}
const tick=()=>new Promise(resolve=>setImmediate(resolve));
test('integra carga, ejemplo, promedio seleccionado y metas en la página',async()=>{
  const el=pagina({cargar:async()=>({sha:'abc',datos:inicial})});await tick();
  assert.equal(el.kRating.textContent,'4.65/5');
  assert.equal(el.btnGuardar.disabled,true);
  el.btnEjemploRating.handlers.click();
  assert.equal(el.ratingPonderado.textContent,'4.679 / 5');
  assert.equal(el.ratingSiguiente.textContent,'4.591 / 5');
  el.usarValoraciones.checked=true;el.usarValoraciones.handlers.change();
  assert.equal(el.kRating.textContent,'4.679/5');assert.equal(el.rating.disabled,true);
  assert.equal(el.btnGuardar.disabled,false);
});
test('un promedio que redondea a Oro no se considera suficiente para el umbral',async()=>{
  const datos={...inicial,cA:2000,cB:2000,cC:2000,usarValoraciones:true,valoraciones:[[159,41,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0]]};
  const el=pagina({cargar:async()=>({sha:'abc',datos})});await tick();
  assert.equal(el.selloNivel.textContent,'Plata');assert.equal(el.kRating.textContent,'4.795/5');
  assert.equal(el.kFaltanRating.textContent,'0.005');
});
test('no pierde ediciones realizadas durante una escritura pendiente',async()=>{
  let resolver,envio;
  const el=pagina({cargar:async()=>({sha:'abc',datos:inicial}),guardar:(datos)=>{envio=datos;return new Promise(r=>resolver=r);}});await tick();
  el.cA.value='1000';el.cA.handlers.input();el.githubToken.value='prueba';
  const guardado=el.btnGuardar.handlers.click();
  el.cA.value='1200';el.cA.handlers.input();resolver('def');await guardado;
  assert.equal(envio.cA,1000);assert.equal(el.cA.value,'1200');
  assert.match(el.archivoTexto.textContent,/pendientes/);assert.equal(el.btnGuardar.disabled,false);
});
test('no reemplaza ediciones realizadas durante una carga pendiente',async()=>{
  let resolver;
  const el=pagina({cargar:()=>new Promise(r=>resolver=r)});
  el.cA.value='2000';el.cA.handlers.input();resolver({sha:'abc',datos:inicial});await tick();
  assert.equal(el.cA.value,'2000');assert.match(el.archivoTexto.textContent,/No se reemplazaron/);
});
test('un conflicto preserva controles y deja reintentar sin afirmar que se guardó',async()=>{
  const el=pagina({cargar:async()=>({sha:'abc',datos:inicial}),guardar:async()=>{throw new Error('Conflicto');}});await tick();
  el.cA.value='2000';el.cA.handlers.input();el.githubToken.value='prueba';
  await el.btnGuardar.handlers.click();
  assert.equal(el.cA.value,'2000');assert.equal(el.archivoTexto.textContent,'Conflicto');assert.equal(el.btnGuardar.disabled,false);
});
