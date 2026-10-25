(function(root){
  'use strict';
  var URL='https://api.github.com/repos/Rockstar19/Interprete/contents/api/progreso-rango.json';
  function cabeceras(token){
    var h={Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'};
    if(token) h.Authorization='Bearer '+token;
    return h;
  }
  function errorHTTP(status){
    if(status===409 || status===422) return new Error('El repositorio cambió o la rama no permite este guardado. Tus cambios siguen en pantalla. Recarga y revisa antes de volver a guardar.');
    if(status===401) return new Error('Token inválido o vencido. Revisa el acceso para guardar.');
    if(status===403) return new Error('GitHub denegó el acceso o alcanzaste el límite de solicitudes. Revisa los permisos y vuelve a intentarlo.');
    if(status===404) return new Error('No se pudo acceder al archivo. Revisa que el token tenga acceso a Interprete y que exista la rama main.');
    return new Error('GitHub respondió '+status+'. Tus cambios siguen en pantalla; vuelve a intentarlo.');
  }
  async function solicitar(url,opciones){
    var controller=new AbortController(), timer=setTimeout(function(){controller.abort();},20000);
    try{return await fetch(url,Object.assign({},opciones,{signal:controller.signal}));}
    catch(e){throw new Error('No se pudo conectar con GitHub. Tus cambios siguen en pantalla. Comprueba la conexión y reintenta.');}
    finally{clearTimeout(timer);}
  }
  async function cargar(token){
    var r=await solicitar(URL+'?ref=main',{headers:cabeceras(token),cache:'no-store'});
    if(!r.ok) throw errorHTTP(r.status);
    var archivo=await r.json();
    if(!archivo.sha || archivo.encoding!=='base64' || typeof archivo.content!=='string') throw new Error('GitHub no devolvió un archivo de progreso válido.');
    var texto=new TextDecoder().decode(Uint8Array.from(atob(archivo.content.replace(/\s/g,'')),function(c){return c.charCodeAt(0);}));
    return {sha:archivo.sha,datos:JSON.parse(texto)};
  }
  async function guardar(datos,sha,token){
    if(!token) throw new Error('Introduce un token de GitHub en «Acceso para guardar».');
    if(!sha) throw new Error('Primero carga el progreso del repositorio para poder guardar sin sobrescribir otra revisión.');
    var bytes=new TextEncoder().encode(JSON.stringify(datos,null,2)+'\n');
    var content=btoa(Array.from(bytes,function(b){return String.fromCharCode(b);}).join(''));
    var r=await solicitar(URL,{method:'PUT',headers:Object.assign(cabeceras(token),{'Content-Type':'application/json'}),body:JSON.stringify({message:'Actualizar progreso de ascenso de rango',content:content,sha:sha,branch:'main'})});
    if(!r.ok) throw errorHTTP(r.status);
    var resultado=await r.json();
    if(!resultado.content || !resultado.content.sha) throw new Error('No se pudo confirmar la revisión guardada. Recarga para comprobar el resultado.');
    return resultado.content.sha;
  }
  var api={cargar:cargar,guardar:guardar};
  if(typeof module==='object' && module.exports) module.exports=api;
  else root.RangoRepositorio=api;
})(typeof globalThis!=='undefined'?globalThis:this);
