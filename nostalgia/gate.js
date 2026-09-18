// Вход в блокнот: код из письма → имя (хранится только на этом устройстве) → блокнот.
// Содержание приходит с сервера только по верному коду и хранится в памяти браузера.
(function(){
  var API = window.NOSTALGIA_API;
  var TG = 'https://t.me/guzelkunts';
  var KEY = 'nostalgia-app-v1', CKEY = 'nostalgia-content-v1';
  var app = document.getElementById('app');
  var st = {};
  try { st = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { st = {}; }
  function persist(){ try { localStorage.setItem(KEY, JSON.stringify(st)); return true; } catch (e) { return false; } }
  if (!st.device){ st.device = 'd' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10); persist(); }
  function saveContent(c){ try { localStorage.setItem(CKEY, JSON.stringify(c)); } catch (e) {} }
  function loadContent(){ try { return JSON.parse(localStorage.getItem(CKEY) || 'null'); } catch (e) { return null; } }
  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }

  function call(code){
    var ctrl = new AbortController(), timer = setTimeout(function(){ ctrl.abort(); }, 70000);
    return fetch(API + '?code=' + encodeURIComponent(code) + '&device=' + encodeURIComponent(st.device), { signal: ctrl.signal })
      .then(function(r){ return r.json(); }).finally(function(){ clearTimeout(timer); });
  }
  var reasons = {
    notfound: 'Такого кода нет. Проверьте буквы и цифры. Если не получается, <a href="' + TG + '" target="_blank" rel="noopener">напишите Гузель</a>.',
    limit: 'Этот блокнот уже открыт на трёх устройствах. Если Вы сменили телефон, <a href="' + TG + '" target="_blank" rel="noopener">напишите Гузель</a>, она поможет.',
    wait: 'Слишком много попыток подряд. Попробуйте ещё раз через час.',
    net: 'Не получилось связаться с блокнотом. Проверьте интернет, включите или выключите VPN и нажмите ещё раз.'
  };
  function screen(inner){
    app.innerHTML = '<header class="bar"><div class="bar-top"><span class="brand">Ностальгия</span></div></header>' +
      '<figure class="hero" aria-hidden="true"><div style="background-image:url(img/carpet.jpg)"></div></figure>' +
      '<section class="sheet gate">' + inner + '</section>';
  }

  function showCode(prefill, error, auto){
    screen('<h2>Ваш блокнот ждёт Вас</h2><p class="hint">Введите секретный код из письма. Если Вы открыли блокнот кнопкой из письма, код уже подставлен.</p>' +
      '<label class="qlabel" for="gate-code">Секретный код</label><input class="gate-input" id="gate-code" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="например: ЯБЛОНЯ-2039" value="' + esc(prefill || '') + '">' +
      (error ? '<p class="gate-msg" role="alert">' + error + '</p>' : '') +
      '<button class="btn" id="gate-go">Открыть блокнот</button><p class="hint gate-small">Один блокнот открывается на трёх устройствах одного человека.</p>');
    var input = document.getElementById('gate-code'), go = document.getElementById('gate-go');
    function submit(){
      var code = input.value.trim();
      if (!code){ input.focus(); return; }
      go.disabled = true; go.textContent = 'Открываю…';
      var slow = setTimeout(function(){ var h = document.createElement('p'); h.className = 'gate-msg'; h.setAttribute('role', 'status'); h.textContent = 'Загружаю все 12 месяцев. В первый раз это может занять до минуты. Не закрывайте и не обновляйте страницу.'; go.parentNode.insertBefore(h, go.nextSibling); }, 5000);
      call(code).then(function(res){
        clearTimeout(slow);
        if (res.ok){ st.code = code; persist(); saveContent(res.content); st.name ? start(res.content) : showName(); }
        else showCode(code, reasons[res.reason] || reasons.notfound);
      }).catch(function(){ clearTimeout(slow); showCode(code, reasons.net); });
    }
    go.addEventListener('click', submit);
    input.addEventListener('keydown', function(e){ if (e.key === 'Enter') submit(); });
    if (auto && prefill) submit(); else input.focus();
  }

  function showName(value){
    screen('<h2>Как Вас зовут?</h2><p class="hint">Имя появится на обложке, и блокнот будет обращаться к Вам по имени. Напишите так, как Вам приятно.</p>' +
      '<label class="qlabel" for="gate-name">Моё имя</label><input class="gate-input" id="gate-name" maxlength="30" autocomplete="given-name" placeholder="например: Аня" value="' + esc(value || '') + '">' +
      '<button class="btn" id="gate-next">Дальше</button>');
    var input = document.getElementById('gate-name');
    function submit(){ var name = input.value.replace(/\s+/g, ' ').trim(); if (!name){ input.focus(); return; } showConfirm(name); }
    document.getElementById('gate-next').addEventListener('click', submit);
    input.addEventListener('keydown', function(e){ if (e.key === 'Enter') submit(); });
    input.focus();
  }

  function showConfirm(name){
    screen('<p class="hint">Так будет на обложке:</p><p class="label"><small>этот блокнот ведёт</small><b>' + esc(name) + '</b></p>' +
      '<p class="hint">Всё верно? Поменять имя потом не получится.</p>' +
      '<button class="btn" id="gate-yes">Да, это я</button><button class="btn gate-alt" id="gate-fix">Исправить</button>');
    document.getElementById('gate-fix').addEventListener('click', function(){ showName(name); });
    document.getElementById('gate-yes').addEventListener('click', function(){ st.name = name; persist(); start(loadContent(), true); });
  }

  function start(content, first){
    window.CONTENT = content;
    var s = document.createElement('script');
    s.src = 'app-main.js?v=' + (window.NOSTALGIA_V || '1');
    s.onload = function(){
      if (first && window.location.search) history.replaceState(null, '', location.pathname + location.hash);
      if (first){ var t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = 'Готово, ' + st.name + '! Блокнот теперь Ваш.'; document.body.appendChild(t); setTimeout(function(){ t.hidden = true; }, 3500); }
    };
    document.body.appendChild(s);
  }

  var urlCode = new URLSearchParams(location.search).get('code');
  var cached = loadContent();
  if (st.code && st.name && cached){
    start(cached);
    call(st.code).then(function(res){ if (res && res.ok && res.content) saveContent(res.content); }).catch(function(){});
  } else if (st.code && cached && !st.name){
    showName();
  } else {
    showCode(urlCode || st.code || '', '', true);
  }
})();
