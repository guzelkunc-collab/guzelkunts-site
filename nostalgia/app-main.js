(function(){
  var KEY = 'nostalgia-app-v1';
  var ALL = ['октябрь','ноябрь','декабрь','январь','февраль','март','апрель','май','июнь','июль','август','сентябрь'];
  var app = document.getElementById('app');
  var st = {};
  try { st = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { st = {}; }
  st.notes = st.notes || {}; st.notesT = st.notesT || {};
  var PROD = !!window.NOSTALGIA_PROD;
  if (!st.name) st.name = PROD ? 'Вы' : 'Аня';
  function persist(){ try { localStorage.setItem(KEY, JSON.stringify(st)); return true; } catch (e) { return false; } }

  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  function nm(s){ return esc(s).split('{имя}').join(esc(st.name)); }
  function toast(msg){ var t = document.querySelector('.toast'); if (!t){ t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role','status'); document.body.appendChild(t); } t.textContent = msg; t.hidden = false; clearTimeout(t._t); t._t = setTimeout(function(){ t.hidden = true; }, 3000); }
  function val(k){ return st.notes[k] || ''; }
  function ta(k, cls, ph, label){ var id = 'f-' + k.replace(/[^a-z0-9]/gi, '-'); return (label ? '<label class="qlabel" for="' + id + '">' + esc(label) + '</label>' : '') + '<textarea class="ans ' + (cls || '') + '" id="' + id + '" data-key="' + k + '"' + (ph ? ' placeholder="' + esc(ph) + '"' : '') + (label ? '' : ' aria-label="Запись"') + '>' + esc(val(k)) + '</textarea>'; }
  function byId(id){ return CONTENT.months.filter(function(m){ return m.id === id; })[0]; }
  function todayNum(mo){ var d = new Date(); return d.getMonth() === mo.jsMonth ? Math.min(d.getDate(), mo.days) : 1; }
  function currentMonth(){ var d = new Date().getMonth(); return CONTENT.months.filter(function(m){ return m.jsMonth === d; })[0] || CONTENT.months[0]; }
  function hero(img){ return '<figure class="hero" aria-hidden="true"><div style="background-image:url(img/' + img + '.jpg)"></div></figure>'; }
  function item(href, title, sub, img){ return '<button class="item' + (img ? ' th' : '') + '" data-go="' + href + '">' + (img ? '<span class="thumb" style="background-image:url(img/' + img + '.jpg)" aria-hidden="true"></span>' : '') + '<b>' + esc(title) + '</b><small>' + esc(sub) + '</small><i aria-hidden="true">›</i></button>'; }

  function bar(mo){
    return '<header class="bar"><div class="bar-top"><button class="brand" data-go="#/' + mo.id + '">Ностальгия</button><span class="saved" id="saved" aria-live="polite">записи сохраняются сами</span></div>' +
      '<nav class="months" aria-label="Месяцы">' + ALL.map(function(m, i){ var c = CONTENT.months[i]; return '<button class="m' + (c && c.id === mo.id ? ' on' : '') + '"' + (c ? ' data-go="#/' + c.id + '"' : ' data-soon="1"') + '>' + m + '</button>'; }).join('') + '</nav></header>';
  }
  function back(mo){ return '<button class="back" data-go="#/' + mo.id + '">← ' + esc(mo.name.toLowerCase()) + '</button>'; }

  function viewHome(mo){
    var t = todayNum(mo), p = mo.id;
    var started = function(prefix){ return Object.keys(st.notes).some(function(k){ return k.indexOf(prefix) === 0 && st.notes[k]; }); };
    var h = bar(mo);
    h += '<section class="cover"><div class="cover-img" style="background-image:url(img/' + mo.img.cover + '.jpg)" aria-hidden="true"></div><div class="cover-body">' +
      '<div class="label"><small>этот блокнот ведёт</small><b>' + esc(st.name) + '</b></div>' +
      '<h1>' + esc(mo.name) + '</h1><p class="when">когда накрывает:</p><p class="pain">' + esc(mo.pain) + '</p>' +
      '<p style="margin:14px 0 0"><span class="chip">тема месяца · ' + esc(mo.theme) + '</span></p>' +
      '<p class="when" style="margin-top:14px">бабушка говорила</p><p class="grandma" style="margin:0">' + esc(mo.grandma) + '</p></div></section>';
    h += '<button class="today" data-go="#/' + p + '/day/' + t + '"><small>каждый день · 2–3 минуты</small><b>' + esc(st.name) + ', сегодня ' + t + ' ' + mo.gen + '</b><span>' + esc(mo.daily[t - 1]) + '</span></button>';
    h += '<p class="section-title">В НАЧАЛЕ МЕСЯЦА</p><section class="card list">' +
      item('#/' + p + '/letter', 'Письмо от Гузель', 'прочитай первым', mo.img.letter) +
      item('#/' + p + '/card', 'Карта месяца', 'картинка и три вопроса', mo.img.card) + '</section>';
    h += '<p class="section-title">РАЗ В НЕДЕЛЮ · ≈15 МИНУТ</p><section class="card list">' +
      mo.weeks.map(function(w, i){ return item('#/' + p + '/week/' + (i + 1), 'Неделя ' + (i + 1) + ': ' + w.short, started(p + '-w' + (i + 1) + '-') ? '✓ начато' : 'задание недели', mo.img.weeks[i]); }).join('') +
      item('#/' + p + '/kitchen', 'Посиделки на кухне', 'по воскресеньям, три вопроса', mo.img.kitchen) + '</section>';
    h += '<p class="section-title">В КОНЦЕ МЕСЯЦА</p><section class="card list">' +
      item('#/' + p + '/summary', 'Итоги: ' + mo.name.toLowerCase(), 'и главный инсайт', mo.img.summary) +
      item('#/' + p + '/days', 'Все дни: ' + mo.name.toLowerCase(), 'календарь твоих записей') + '</section>';
    h += '<section class="card pad" style="display:flex;flex-direction:column;gap:10px"><p class="muted small" style="margin:0">' + esc(st.name) + ', твои записи хранятся на этом устройстве и в зашифрованном виде на сервере в России, поэтому они открываются на всех твоих устройствах. Прочитать их не может никто, кроме тебя. А эта кнопка сделает ещё и копию текстом.</p><button class="btn" id="copy">Сохранить копию моих записей</button></section>';
    if (!PROD) h += '<p class="preview">Предпросмотр: имя «' + esc(st.name) + '». <button id="rename">Проверить с другим именем</button></p>';
    return h;
  }

  function viewLetter(mo){
    return bar(mo) + back(mo) + hero(mo.img.letter) + '<article class="letter"><h2>Привет, ' + esc(st.name) + '.</h2>' + mo.letter.map(function(p){ return '<p>' + nm(p) + '</p>'; }).join('') + '<p class="sign">Гузель</p></article>';
  }

  function viewCard(mo){
    var c = mo.card;
    return bar(mo) + back(mo) + '<section class="sheet" style="margin-top:0"><h2>Карта месяца</h2><figure class="photo"><div class="ph" style="background-image:url(img/' + mo.img.card + '.jpg)"></div><figcaption>' + esc(c.caption) + '</figcaption></figure>' +
      '<p class="hint">' + esc(c.intro) + '</p>' + c.questions.map(function(q, i){ return '<div class="q">' + ta(mo.id + '-card-' + i, 's2', '', q) + '</div>'; }).join('') + '</section>';
  }

  function viewDay(mo, n){
    n = Math.max(1, Math.min(mo.days, n)); var p = mo.id + '-d' + n + '-';
    return bar(mo) + back(mo) + hero(mo.img.today) + '<section class="sheet"><div class="dayhead"><button data-go="#/' + mo.id + '/day/' + (n - 1) + '" aria-label="Предыдущий день"' + (n === 1 ? ' disabled' : '') + '>‹</button><h2 style="margin:0;text-align:center;font-size:30px">' + n + ' ' + mo.gen + '</h2><button data-go="#/' + mo.id + '/day/' + (n + 1) + '" aria-label="Следующий день"' + (n === mo.days ? ' disabled' : '') + '>›</button></div>' +
      '<div class="qday"><small>вопрос дня</small><p>' + esc(mo.daily[n - 1]) + '</p></div>' + ta(p + 'q', '', 'пиши здесь…') +
      '<div class="q" style="margin-top:18px">' + ta(p + 'good', 's1', '', 'Что хорошего сегодня случилось?') + '</div>' +
      '<div class="q">' + ta(p + 'margin', 's2', 'если хочется написать больше', 'Мысли на полях') + '</div>' +
      '<p class="hint" style="margin:0">Пропустила день? Ничего страшного, блокнот не ругается. Просто продолжай.</p></section>';
  }

  function chips(title, list){ return list ? '<p class="qlabel">' + esc(title) + '</p><div class="needs">' + list.map(function(n){ return '<span>' + esc(n) + '</span>'; }).join('') + '</div>' : ''; }

  function viewWeek(mo, i){
    var w = mo.weeks[i - 1], p = mo.id + '-w' + i + '-';
    var h = bar(mo) + back(mo) + hero(mo.img.weeks[i - 1]) + '<section class="sheet"><p class="mono muted" style="margin:0 0 6px">неделя ' + i + ' · ≈15 минут</p><h2>' + nm(w.title) + '</h2><p class="hint">' + nm(w.intro) + '</p>';
    if (w.tips) h += '<p class="qlabel">' + esc(w.tipsTitle) + '</p><ul class="tips">' + w.tips.map(function(t){ return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>';
    if (w.type === 'questions'){
      if (w.tag) h += '<div class="tag"><label>дата <input data-key="' + p + 'date" value="' + esc(val(p + 'date')) + '"></label><label>погода внутри <input data-key="' + p + 'weather" value="' + esc(val(p + 'weather')) + '"></label></div>';
      h += w.questions.map(function(q, j){ return '<div class="q">' + ta(p + j, w.small && j < w.small ? 's1' : '', '', q) + '</div>'; }).join('');
      h += chips(w.chipsTitle, w.chips);
    } else if (w.type === 'table'){
      h += '<p class="example">например: ' + w.example.map(esc).join(' → ') + '</p>';
      for (var r = 0; r < w.rows; r++){
        h += '<div class="row3"><span class="n">' + esc(w.rowLabel || '') + ' ' + (r + 1) + '</span>' + w.cols.map(function(c, j){ return '<div class="q" style="margin:0 0 8px">' + ta(p + 'r' + r + 'c' + j, 's1', '', c) + '</div>'; }).join('') + '</div>';
      }
      h += chips(w.chipsTitle, w.chips);
      if (w.final) h += '<div class="q">' + ta(p + 'final', 's2', '', w.final) + '</div>';
    } else if (w.type === 'compass'){
      h += compassSvg();
      h += w.sides.map(function(s, j){
        var cur = val(p + 's' + j + 'score'), dots = '';
        for (var k = 0; k <= 10; k++) dots += '<button class="' + (String(k) === String(cur) ? 'on' : '') + '" data-score="' + p + 's' + j + 'score" data-v="' + k + '" aria-label="' + k + ' из 10">' + k + '</button>';
        return '<div class="side">' + ta(p + 's' + j, 's2', 'что для меня здесь важно', s) + '<p class="mono muted" style="margin:10px 0 0">' + esc(w.scaleQ) + '</p><div class="scale" role="group" aria-label="Оценка от 0 до 10">' + dots + '</div></div>';
      }).join('');
      h += '<div class="q">' + ta(p + 'final', 's2', '', w.final) + '</div>';
    } else if (w.type === 'circle'){
      h += circleSvg();
      h += '<div class="zone mine"><p class="qlabel">Внутри круга · моё</p><p class="ex">например: ' + esc(w.mine) + '</p>' + ta(p + 'mine', '', 'на что я могу повлиять') + '</div>';
      h += '<div class="zone not"><p class="qlabel">Снаружи · не моё, отпускаю</p><p class="ex">например: ' + esc(w.notMine) + '</p>' + ta(p + 'not', '', 'что можно отпустить') + '</div>';
      h += '<div class="q">' + ta(p + 'final', 's2', '', w.final) + '</div>';
    }
    if (w.note) h += '<div class="note"><small>записка</small><p>' + esc(w.note) + '</p></div>';
    return h + '</section>';
  }

  function compassSvg(){
    var s = '<svg class="compass" viewBox="0 0 200 200" aria-hidden="true"><circle cx="100" cy="100" r="94" fill="#F7F1E6" stroke="#6B5646" stroke-width="1.4"/><circle cx="100" cy="100" r="86" fill="none" stroke="#6B5646" stroke-width=".7"/>';
    for (var d = 0; d < 360; d += 10){ var a = d * Math.PI / 180, L = d % 90 === 0 ? 10 : 5; s += '<line x1="' + (100 + Math.sin(a) * 86).toFixed(1) + '" y1="' + (100 - Math.cos(a) * 86).toFixed(1) + '" x2="' + (100 + Math.sin(a) * (86 - L)).toFixed(1) + '" y2="' + (100 - Math.cos(a) * (86 - L)).toFixed(1) + '" stroke="#6B5646" stroke-width=".7"/>'; }
    [0, 90, 180, 270].forEach(function(g, i){ var a = g * Math.PI / 180, t = [100 + Math.sin(a) * 66, 100 - Math.cos(a) * 66], l = [100 + Math.sin(a - 1.57) * 10, 100 - Math.cos(a - 1.57) * 10], r = [100 + Math.sin(a + 1.57) * 10, 100 - Math.cos(a + 1.57) * 10];
      s += '<path d="M100 100 L' + l[0].toFixed(1) + ' ' + l[1].toFixed(1) + ' L' + t[0].toFixed(1) + ' ' + t[1].toFixed(1) + 'Z" fill="' + (i === 0 ? '#7A3B32' : '#B89A74') + '" stroke="#6B5646" stroke-width=".5"/><path d="M100 100 L' + r[0].toFixed(1) + ' ' + r[1].toFixed(1) + ' L' + t[0].toFixed(1) + ' ' + t[1].toFixed(1) + 'Z" fill="#EFE5D3" stroke="#6B5646" stroke-width=".5"/>'; });
    return s + '<circle cx="100" cy="100" r="4" fill="#2E2520"/></svg>';
  }
  function circleSvg(){
    return '<svg class="circles" viewBox="0 0 200 200" aria-hidden="true"><defs><path id="ringp" d="M100 100 m-84 0 a84 84 0 1 1 168 0 a84 84 0 1 1 -168 0"/></defs>' +
      '<circle cx="100" cy="100" r="94" fill="rgba(110,88,70,.04)" stroke="#7A3B32" stroke-width="1" stroke-dasharray="3 3"/>' +
      '<text font-family="PT Sans, sans-serif" font-size="8.5" fill="#7B6A5C" letter-spacing="2"><textPath href="#ringp">НЕ МОЁ · ОТПУСКАЮ · НЕ МОЁ · ОТПУСКАЮ · НЕ МОЁ · ОТПУСКАЮ ·</textPath></text>' +
      '<circle cx="100" cy="100" r="52" fill="rgba(110,88,70,.12)" stroke="#6B5646" stroke-width="1"/><text x="100" y="108" text-anchor="middle" font-family="Cormorant Garamond, serif" font-style="italic" font-size="28" fill="#2E2520">моё</text></svg>';
  }

  function viewKitchen(mo, w){
    var k = mo.kitchen;
    var tabs = [1, 2, 3, 4].map(function(i){ return '<button class="' + (i === w ? 'on' : '') + '" data-go="#/' + mo.id + '/kitchen/' + i + '">неделя ' + i + '</button>'; }).join('');
    return bar(mo) + back(mo) + hero(mo.img.kitchen) + '<section class="sheet"><h2>Посиделки на кухне</h2><p class="hint">' + esc(k.intro) + '</p><div class="wk">' + tabs + '</div>' +
      k.questions.map(function(q, j){ return '<div class="q">' + ta(mo.id + '-k' + w + '-' + j, 's2', '', q) + '</div>'; }).join('') + '</section>';
  }

  function viewSummary(mo){
    var s = mo.summary, p = mo.id + '-sum-';
    return bar(mo) + back(mo) + hero(mo.img.summary) + '<section class="sheet"><h2>' + nm(s.title) + '</h2><p class="hint">' + esc(s.intro) + '</p>' +
      s.questions.map(function(q, j){ return '<div class="q">' + ta(p + j, '', '', q) + '</div>'; }).join('') +
      '<div class="note"><small>самое важное</small><p>' + esc(s.insight) + '</p></div>' + ta(p + 'insight', '', '') +
      '<div class="q" style="margin-top:18px">' + ta(p + 'word', 's1', '', s.word) + '</div></section>';
  }

  function viewDays(mo){
    var t = todayNum(mo), cells = '';
    for (var n = 1; n <= mo.days; n++){
      var filled = ['q', 'good', 'margin'].some(function(x){ return val(mo.id + '-d' + n + '-' + x); });
      cells += '<button class="' + (filled ? 'filled ' : '') + (n === t ? 'now' : '') + '" data-go="#/' + mo.id + '/day/' + n + '" aria-label="' + n + ' ' + mo.gen + (filled ? ', есть запись' : '') + '">' + n + '</button>';
    }
    return bar(mo) + back(mo) + '<section class="sheet" style="margin-top:0"><h2>Все дни: ' + esc(mo.name.toLowerCase()) + '</h2><p class="hint">Точка — в этот день есть запись. Нажми на число, чтобы открыть день.</p><div class="cal">' + cells + '</div></section>';
  }

  function render(){
    var r = (location.hash || '').replace('#/', '').split('/');
    var mo = byId(r[0]) || currentMonth();
    var num = function(x, max){ return Math.max(1, Math.min(max, parseInt(x, 10) || 1)); };
    var h;
    if (r[1] === 'letter') h = viewLetter(mo);
    else if (r[1] === 'card') h = viewCard(mo);
    else if (r[1] === 'day') h = viewDay(mo, num(r[2], mo.days));
    else if (r[1] === 'week') h = viewWeek(mo, num(r[2], 4));
    else if (r[1] === 'kitchen') h = viewKitchen(mo, num(r[2], 4));
    else if (r[1] === 'summary') h = viewSummary(mo);
    else if (r[1] === 'days') h = viewDays(mo);
    else h = viewHome(mo);
    app.innerHTML = h;
    wire();
    window.scrollTo(0, 0);
  }

  function wire(){
    var savedEl = document.getElementById('saved');
    function saved(ok){ if (!savedEl) return; savedEl.textContent = ok ? 'сохранено ✓' : 'не удалось сохранить'; clearTimeout(savedEl._t); savedEl._t = setTimeout(function(){ savedEl.textContent = 'записи сохраняются сами'; }, 1800); }
    function grow(el){ el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; }
    app.querySelectorAll('[data-go]').forEach(function(b){ b.addEventListener('click', function(){ location.hash = b.getAttribute('data-go'); }); });
    var mb = app.querySelector('.months'); if (mb){ /* months-wheel */ mb.addEventListener('wheel', function(e){ if (Math.abs(e.deltaY) > Math.abs(e.deltaX)){ mb.scrollLeft += e.deltaY; e.preventDefault(); } }, { passive: false }); var on = mb.querySelector('.on'); if (on) mb.scrollLeft = on.offsetLeft - (mb.clientWidth - on.offsetWidth) / 2; }
    app.querySelectorAll('[data-soon]').forEach(function(b){ b.addEventListener('click', function(){ toast('Этот месяц пока готовится.'); }); });
    app.querySelectorAll('textarea, .tag input').forEach(function(el){
      var k = el.getAttribute('data-key'), t;
      if (el.tagName === 'TEXTAREA') requestAnimationFrame(function(){ grow(el); });
      el.addEventListener('input', function(){ if (el.tagName === 'TEXTAREA') grow(el); st.notes[k] = el.value; st.notesT[k] = Date.now(); clearTimeout(t); t = setTimeout(function(){ saved(persist()); if (window.NSync) NSync.soon(); }, 400); });
    });
    app.querySelectorAll('[data-score]').forEach(function(b){ b.addEventListener('click', function(){
      var k = b.getAttribute('data-score'); st.notes[k] = b.getAttribute('data-v'); st.notesT[k] = Date.now(); saved(persist()); if (window.NSync) NSync.soon();
      b.parentNode.querySelectorAll('button').forEach(function(x){ x.classList.toggle('on', x === b); });
    }); });
    var copy = document.getElementById('copy');
    if (copy) copy.addEventListener('click', function(){
      var lines = ['Ностальгия · блокнот ведёт ' + st.name, ''];
      Object.keys(st.notes).sort().forEach(function(k){ if (st.notes[k]) lines.push(k + ': ' + st.notes[k]); });
      var text = lines.join('\n');
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function(){ toast('Записи скопированы. Вставь их в Заметки или отправь себе в Telegram.'); }, function(){ toast('Не получилось скопировать.'); });
      else toast('Не получилось скопировать.');
    });
    var rn = document.getElementById('rename');
    if (rn) rn.addEventListener('click', function(){ var v = prompt('Имя для проверки', st.name); if (v && v.trim()){ st.name = v.trim().slice(0, 30); persist(); render(); } });
  }

  window.addEventListener('hashchange', render);
  render();
  if (window.NSync){
    var pending = false;
    var calm = function(){ var a = document.activeElement; return !(a && (a.tagName === 'TEXTAREA' || a.tagName === 'INPUT')); };
    var refresh = function(){ if (calm()){ pending = false; var y = window.scrollY; render(); window.scrollTo(0, y); } else pending = true; };
    document.addEventListener('focusout', function(){ if (pending) setTimeout(refresh, 50); });
    NSync.init({ get: function(){ return st; }, set: function(s, fromServer){ st = s; persist(); if (fromServer) refresh(); } });
    NSync.run();
    window.NAPP = { setSync: function(k){ st.sync = k; persist(); NSync.run(); } };
  }
})();
