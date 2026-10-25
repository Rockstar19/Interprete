(function(root){
  'use strict';
  function resumen(periodos){
    var total=0, puntos=0;
    periodos.forEach(function(fila){ fila.forEach(function(n,i){total+=n; puntos+=n*(5-i);}); });
    return {total:total,puntos:puntos,promedio:total?puntos/total:null};
  }
  function cincoEstrellas(datos,meta){
    if(!datos.total) return null;
    if(datos.promedio>=meta) return 0;
    if(meta>=5) return Infinity;
    return Math.max(0,Math.ceil((meta*datos.total-datos.puntos)/(5-meta)-1e-10));
  }
  function validar(g){
    if(!g || typeof g!=='object' || Array.isArray(g)) throw new Error('El progreso no es un objeto válido.');
    var st={version:2};
    ['cA','cB','cC','rating','proyeccionDia','ultimoCiclo'].forEach(function(k){
      var n=g[k];
      if(typeof n!=='number' || !Number.isFinite(n) || n<0 || n>1000000) throw new Error('Valor inválido en '+k+'.');
      if(k==='rating' && n>5) throw new Error('La calificación debe estar entre 0 y 5.');
      if(k==='ultimoCiclo' && (!Number.isInteger(n) || n<3 || n>10000)) throw new Error('El ciclo debe ser un entero entre 3 y 10000.');
      st[k]=n;
    });
    if(!Array.isArray(g.valoraciones) || g.valoraciones.length!==4 || g.valoraciones.some(function(fila){
      return !Array.isArray(fila) || fila.length!==5 || fila.some(function(n){return !Number.isSafeInteger(n) || n<0 || n>1000000;});
    })) throw new Error('Se requieren cuatro períodos con cinco cantidades enteras no negativas.');
    if(typeof g.usarValoraciones!=='boolean') throw new Error('Modo de calificación inválido.');
    st.valoraciones=g.valoraciones.map(function(fila){return fila.slice();});
    st.usarValoraciones=g.usarValoraciones;
    if(st.usarValoraciones && !resumen(st.valoraciones).total) throw new Error('Ingresa valoraciones antes de usar su promedio.');
    return st;
  }
  var api={resumen:resumen,cincoEstrellas:cincoEstrellas,validar:validar};
  if(typeof module==='object' && module.exports) module.exports=api;
  else root.RangoModelo=api;
})(typeof globalThis!=='undefined'?globalThis:this);
