// Синхронизация записей между устройствами одной хозяйки блокнота.
// Записи шифруются прямо на устройстве ключом, который выдаёт скрипт кодов (st.sync).
// На сервер (api.guzelkunts.ru, Россия) уходит только шифр — прочитать его не может никто, кроме устройств хозяйки.
(function(){
  var API = window.NOSTALGIA_SYNC || 'https://api.guzelkunts.ru';
  var P = null, keyP = null, idP = null, forKey = '', timer = null, busy = false, again = false;

  function b64(buf){ var s = '', a = new Uint8Array(buf); for (var i = 0; i < a.length; i++) s += String.fromCharCode(a[i]); return btoa(s); }
  function unb64(s){ var r = atob(s), a = new Uint8Array(r.length); for (var i = 0; i < r.length; i++) a[i] = r.charCodeAt(i); return a; }
  function hex(buf){ return Array.prototype.map.call(new Uint8Array(buf), function(x){ return ('0' + x.toString(16)).slice(-2); }).join(''); }
  function ready(){ var st = P && P.get(); return !!(st && st.sync && window.crypto && crypto.subtle && window.fetch); }
  function prep(){
    var k = P.get().sync;
    if (k !== forKey){
      forKey = k;
      keyP = crypto.subtle.importKey('raw', unb64(k), 'AES-GCM', false, ['encrypt', 'decrypt']);
      idP = crypto.subtle.digest('SHA-256', new TextEncoder().encode('nostalgia-id:' + k)).then(hex);
    }
    return Promise.all([keyP, idP]);
  }
  function seal(key, st){
    var iv = crypto.getRandomValues(new Uint8Array(12));
    var body = JSON.stringify({ v: 1, name: st.name || '', notes: st.notes || {}, t: st.notesT || {} });
    return crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, new TextEncoder().encode(body)).then(function(ct){
      var out = new Uint8Array(12 + ct.byteLength); out.set(iv); out.set(new Uint8Array(ct), 12); return b64(out);
    });
  }
  function open(key, blob){
    var a = unb64(blob);
    return crypto.subtle.decrypt({ name: 'AES-GCM', iv: a.slice(0, 12) }, key, a.slice(12)).then(function(pt){ return JSON.parse(new TextDecoder().decode(pt)); });
  }
  // слияние: по каждой записи побеждает более свежая правка; возвращает, изменилось ли что-то локально и есть ли у нас то, чего нет на сервере
  function merge(st, r){
    st.notes = st.notes || {}; st.notesT = st.notesT || {};
    var gotNew = false, haveMore = false, rt = r.t || {}, rn = r.notes || {};
    Object.keys(rn).concat(Object.keys(rt)).forEach(function(k){
      var lt = st.notesT[k] || 0, t = rt[k] || 0;
      if (t > lt || (!(k in st.notes) && k in rn && !lt)){ if (st.notes[k] !== rn[k]){ st.notes[k] = rn[k]; gotNew = true; } st.notesT[k] = t; }
    });
    Object.keys(st.notes).forEach(function(k){ if ((st.notesT[k] || 0) > (rt[k] || 0) || !(k in rn)) haveMore = true; });
    if (!st.name && r.name){ st.name = r.name; gotNew = true; }
    if (st.name && !r.name) haveMore = true;
    return { gotNew: gotNew, haveMore: haveMore };
  }
  function req(method, id, body){
    return fetch(API + '/v1/n/' + id, { method: method, headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined, cache: 'no-store' })
      .then(function(r){ return r.json().then(function(j){ j.status = r.status; return j; }); });
  }

  // одна полная сверка: забрать с сервера, слить, при необходимости отправить своё
  function run(){
    if (!ready()) return Promise.resolve(false);
    if (busy){ again = true; return Promise.resolve(false); }
    busy = true;
    var changed = false;
    return prep().then(function(kp){
      var key = kp[0], id = kp[1], tries = 0;
      function round(remote){
        var st = P.get(), m = { gotNew: false, haveMore: true };
        var step = remote.blob ? open(key, remote.blob).then(function(r){ m = merge(st, r); }) : Promise.resolve();
        return step.then(function(){
          st.syncRev = remote.rev;
          if (m.gotNew){ changed = true; }
          P.set(st, m.gotNew);
          if (!m.haveMore) return;
          return seal(key, st).then(function(blob){ return req('PUT', id, { rev: remote.rev, blob: blob }); }).then(function(res){
            if (res.ok){ st = P.get(); st.syncRev = res.rev; P.set(st, false); return; }
            if (res.status === 409 && ++tries < 4) return round({ rev: res.rev, blob: res.blob });
          });
        });
      }
      return req('GET', id).then(function(res){ if (res.ok) return round(res); });
    }).catch(function(){}).then(function(){
      busy = false;
      if (again){ again = false; later(1500); }
      return changed;
    });
  }
  function later(ms){ clearTimeout(timer); timer = setTimeout(run, ms == null ? 2500 : ms); }

  window.NSync = {
    // provider: { get: () => st, set: (st, changedFromServer) => void }
    init: function(provider){ P = provider; },
    run: run,          // сверить сейчас; Promise<true, если с сервера пришло новое>
    soon: later,       // сверить после паузы (вызывать после каждой правки)
    merge: merge
  };
  document.addEventListener('visibilitychange', function(){ if (P && document.visibilityState === 'visible') later(300); if (P && document.visibilityState === 'hidden' && timer){ clearTimeout(timer); run(); } });
  window.addEventListener('online', function(){ if (P) later(500); });
})();
