/* 人類創世ゲーム：村のアニメを「大きい画面のまま続けて見る」（v2・まとん 2026-11-14）
   もとは「動画の終わりに次の年のボタンを出す」（ゲン 2026-10-16）。義樹さんの頼みで作り直した。
   - 同じページの <video> を、ファイル名から年で見分ける
     （jinrui_annai_720p.mp4＝1年目、jinrui_yNNNN_720p.mp4＝N年目）。並び順は関係ない
   - 動画の絵を押すと、画面いっぱいの「見る部屋」が開く。ブラウザの操作の帯は出さない
     ＝始まりの字幕に帯やお知らせが重ならない
   - 始まる前に「N年目の村」の札を少しだけ出す（全画面のお知らせが消えるのを待つ）
   - 見終わったら、大きい画面のまま「▶ 次の年へ」を出す。押すとそのまま次が始まる
   - 画面を押すと、上下に操作の帯（とじる・前の年・止める・次の年・進み具合）が3秒出る
   - 読み込みは <script src="/tanpatsu-news/jinrui/next-video.js" defer></script>（どの階層のページからでも同じ書き方） */
(function () {
  'use strict';

  var FIRST_WAIT = 2600;   // 最初の札を出しておく時間（ミリ秒）
  var NEXT_WAIT = 1300;    // 次の年へ進んだ時の札の時間
  var BAR_MS = 3000;       // 操作の帯を出しておく時間

  function srcOf(v) {
    var src = v.currentSrc || v.src || '';
    if (!src) {
      var s = v.querySelector('source');
      if (s) src = s.src || s.getAttribute('src') || '';
    }
    return src;
  }
  function yearOfSrc(src) {
    if (/jinrui_annai_/.test(src)) return 1;
    var m = src.match(/jinrui_y0*(\d+)_/);
    return m ? parseInt(m[1], 10) : null;
  }

  function addStyle() {
    if (document.getElementById('nv-style')) return;
    var st = document.createElement('style');
    st.id = 'nv-style';
    st.textContent =
      '.nv-wrap{position:relative}' +
      '.nv-cover{position:absolute;top:0;left:0;right:0;bottom:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;background:rgba(0,0,0,.18);border:0;border-radius:10px;cursor:pointer;z-index:2;padding:0;margin:0;width:100%;font:inherit;color:#fff;-webkit-tap-highlight-color:transparent}' +
      '.nv-cover i{display:flex;align-items:center;justify-content:center;width:68px;height:68px;border-radius:50%;background:rgba(0,0,0,.62);font-style:normal;font-size:30px;padding-left:5px;box-sizing:border-box}' +
      '.nv-cover span{font-size:.9rem;font-weight:700;background:rgba(0,0,0,.62);border-radius:999px;padding:.25em 1em}' +
      '#nv-th{position:fixed;top:0;left:0;right:0;bottom:0;width:100%;height:100%;background:#000;z-index:2147483000;display:none;color:#fff;font-family:"Hiragino Sans","Yu Gothic UI","Meiryo",sans-serif;-webkit-user-select:none;user-select:none;touch-action:manipulation}' +
      '#nv-th.open{display:block}' +
      '#nv-th video{position:absolute;top:0;left:0;width:100%;height:100%;object-fit:contain;background:#000}' +
      '.nv-layer{position:absolute;top:0;left:0;right:0;bottom:0;display:none;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:16px;box-sizing:border-box;text-align:center}' +
      '.nv-layer.show{display:flex}' +
      '.nv-card{background:rgba(0,0,0,.55)}' +
      '.nv-card b{font-size:clamp(1.5rem,6vw,2.6rem);letter-spacing:.08em}' +
      '.nv-card small{font-size:.95rem;opacity:.85}' +
      '.nv-end{background:rgba(0,0,0,.74)}' +
      '.nv-big{font:inherit;font-size:clamp(1.15rem,4.5vw,1.6rem);font-weight:700;color:#2b2a26;background:#f3d9b1;border:0;border-radius:999px;padding:.8em 1.8em;cursor:pointer}' +
      '.nv-sub{font:inherit;font-size:1rem;color:#fff;background:transparent;border:1px solid rgba(255,255,255,.65);border-radius:999px;padding:.5em 1.3em;cursor:pointer}' +
      '.nv-row{display:flex;gap:12px;flex-wrap:wrap;justify-content:center}' +
      '.nv-msg{font-size:1rem;line-height:1.7;max-width:26em}' +
      '.nv-top,.nv-bot{position:absolute;left:0;right:0;display:none;align-items:center;gap:10px;padding:10px 14px;box-sizing:border-box;background:rgba(0,0,0,.6)}' +
      '.nv-top{top:0;justify-content:space-between;padding-top:calc(10px + env(safe-area-inset-top))}' +
      '.nv-bot{bottom:0;padding-bottom:calc(10px + env(safe-area-inset-bottom))}' +
      '#nv-th.bar .nv-top,#nv-th.bar .nv-bot{display:flex}' +
      '.nv-btn{font:inherit;font-size:.95rem;color:#fff;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.5);border-radius:999px;padding:.45em 1em;cursor:pointer;white-space:nowrap}' +
      '.nv-btn[disabled]{opacity:.35}' +
      '.nv-name{font-size:1rem;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
      '.nv-seek{flex:1;min-width:60px;height:28px}' +
      '.nv-time{font-size:.85rem;font-variant-numeric:tabular-nums;white-space:nowrap}';
    document.head.appendChild(st);
  }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    if (tag === 'button') e.type = 'button';
    return e;
  }
  function mmss(t) {
    t = Math.max(0, Math.floor(t || 0));
    var s = t % 60;
    return Math.floor(t / 60) + ':' + (s < 10 ? '0' : '') + s;
  }

  function init() {
    var vids = Array.prototype.slice.call(document.querySelectorAll('video'));
    var list = {};      // 年 → {y, src, poster, title}
    vids.forEach(function (v) {
      var src = srcOf(v), y = yearOfSrc(src);
      if (!y || list[y]) return;
      var sec = v.closest && v.closest('section');
      var h = sec && sec.querySelector('h2,h3');
      list[y] = { y: y, src: src, poster: v.getAttribute('poster') ? v.poster : '', title: (h && h.textContent.trim()) || (y + '年目の村'), el: v };
    });
    var years = Object.keys(list).map(Number).sort(function (a, b) { return a - b; });
    if (!years.length) return;
    var latest = years[years.length - 1];
    addStyle();

    // ---- 見る部屋（1つだけ作って使い回す）----
    var th = el('div'); th.id = 'nv-th';
    var tv = el('video'); tv.setAttribute('playsinline', ''); tv.setAttribute('webkit-playsinline', ''); tv.preload = 'auto';
    var card = el('div', 'nv-layer nv-card');
    var cardT = el('b'), cardS = el('small', null, 'まもなく始まります');
    var cardGo = el('button', 'nv-big', '▶ 始める'); cardGo.style.display = 'none';
    card.appendChild(cardT); card.appendChild(cardS); card.appendChild(cardGo);
    var end = el('div', 'nv-layer nv-end');
    var endMsg = el('div', 'nv-msg');
    var endNext = el('button', 'nv-big');
    var endRow = el('div', 'nv-row');
    var endAgain = el('button', 'nv-sub', 'もう一度見る');
    var endClose = el('button', 'nv-sub', 'とじる');
    endRow.appendChild(endAgain); endRow.appendChild(endClose);
    end.appendChild(endMsg); end.appendChild(endNext); end.appendChild(endRow);
    var top = el('div', 'nv-top');
    var name = el('div', 'nv-name');
    var bClose = el('button', 'nv-btn', '✕ とじる');
    top.appendChild(name); top.appendChild(bClose);
    var bot = el('div', 'nv-bot');
    var bPrev = el('button', 'nv-btn', '◀ 前の年');
    var bPlay = el('button', 'nv-btn', '止める');
    var seek = el('input', 'nv-seek'); seek.type = 'range'; seek.min = 0; seek.max = 1000; seek.value = 0; seek.setAttribute('aria-label', '進み具合');
    var time = el('span', 'nv-time', '0:00');
    var bNext = el('button', 'nv-btn', '次の年 ▶');
    bot.appendChild(bPrev); bot.appendChild(bPlay); bot.appendChild(seek); bot.appendChild(time); bot.appendChild(bNext);
    th.appendChild(tv); th.appendChild(card); th.appendChild(end); th.appendChild(top); th.appendChild(bot);
    document.body.appendChild(th);

    var cur = null, wasFs = false, barTimer = null, cardTimer = null, waiting = false, seeking = false;

    function nextOf(y) { return list[y + 1] || null; }
    function prevOf(y) { return list[y - 1] || null; }
    function fsEl() { return document.fullscreenElement || document.webkitFullscreenElement || null; }

    function showBar() {
      th.classList.add('bar');
      clearTimeout(barTimer);
      barTimer = setTimeout(function () { if (!tv.paused && !seeking) th.classList.remove('bar'); }, BAR_MS);
    }
    function hideBar() { clearTimeout(barTimer); th.classList.remove('bar'); }

    function reallyPlay() {
      waiting = false;
      card.classList.remove('show');
      tv.muted = false;
      var p = tv.play();
      if (p && p.catch) p.catch(function () {
        // 自動で始められない機種：札にボタンを出して、押してもらう
        cardGo.style.display = ''; cardS.textContent = ''; card.classList.add('show');
      });
    }

    function load(y, wait) {
      var it = list[y]; if (!it) return;
      cur = y;
      clearTimeout(cardTimer);
      end.classList.remove('show'); hideBar();
      name.textContent = it.title;
      bPrev.disabled = !prevOf(y); bNext.disabled = !nextOf(y);
      cardT.textContent = it.title; cardS.textContent = 'まもなく始まります'; cardGo.style.display = 'none';
      card.classList.add('show');
      seek.value = 0; time.textContent = '0:00';
      tv.pause();
      if (it.poster) tv.poster = it.poster; else tv.removeAttribute('poster');
      tv.src = it.src;
      // 押した時のうちに、音なしで一度だけ再生をかけて止める（あとで自動で始められるようにする）
      waiting = true; tv.muted = true;
      var p = tv.play();
      var hold = function () { if (waiting) { tv.pause(); try { tv.currentTime = 0; } catch (e) {} } };
      if (p && p.then) p.then(hold, function () {}); else hold();
      cardTimer = setTimeout(reallyPlay, wait);
    }

    function open(y) {
      th.classList.add('open');
      document.documentElement.style.overflow = 'hidden';
      wasFs = false;
      try {
        var r = th.requestFullscreen ? th.requestFullscreen() : (th.webkitRequestFullscreen ? th.webkitRequestFullscreen() : null);
        if (r && r.then) r.then(function () {
          wasFs = true;
          try { if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(function () {}); } catch (e) {}
        }, function () {});
        else if (fsEl()) wasFs = true;
      } catch (e) { /* 全画面にできない機種は、画面いっぱいの表示だけで続ける */ }
      load(y, FIRST_WAIT);
    }

    function close() {
      if (!th.classList.contains('open')) return;
      clearTimeout(cardTimer); waiting = false;
      tv.pause(); tv.removeAttribute('src'); try { tv.load(); } catch (e) {}
      th.classList.remove('open'); hideBar(); card.classList.remove('show'); end.classList.remove('show');
      document.documentElement.style.overflow = '';
      try { if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock(); } catch (e) {}
      try {
        if (fsEl()) { if (document.exitFullscreen) document.exitFullscreen(); else if (document.webkitExitFullscreen) document.webkitExitFullscreen(); }
      } catch (e) {}
      var it = list[cur];
      if (it && it.el) { var sec = (it.el.closest && it.el.closest('section')) || it.el; try { sec.scrollIntoView({ block: 'center' }); } catch (e) {} }
    }

    function onFsChange() {
      if (fsEl()) { wasFs = true; return; }
      if (wasFs && th.classList.contains('open')) close();   // 戻るボタンなどで全画面が閉じられた
    }
    document.addEventListener('fullscreenchange', onFsChange);
    document.addEventListener('webkitfullscreenchange', onFsChange);

    tv.addEventListener('ended', function () {
      hideBar();
      var n = nextOf(cur);
      if (n) { endMsg.textContent = ''; endNext.style.display = ''; endNext.textContent = '▶ ' + n.y + '年目へ'; }
      else {
        endNext.style.display = 'none';
        endMsg.textContent = cur >= latest
          ? 'ここまでが最新のアニメです。次の年のアニメは、できたらここに並びます。'
          : '次の年のアニメは、このページにはありません。';
      }
      end.classList.add('show');
    });
    tv.addEventListener('timeupdate', function () {
      if (seeking || waiting) return;
      var d = tv.duration || 0;
      if (d) seek.value = Math.round(tv.currentTime / d * 1000);
      time.textContent = mmss(tv.currentTime) + ' / ' + mmss(d);
    });
    tv.addEventListener('play', function () { bPlay.textContent = '止める'; });
    tv.addEventListener('pause', function () { bPlay.textContent = '▶ 再生'; if (!waiting && !tv.ended) th.classList.add('bar'); });
    tv.addEventListener('click', function () { if (th.classList.contains('bar')) hideBar(); else showBar(); });

    endNext.addEventListener('click', function () { var n = nextOf(cur); if (n) load(n.y, NEXT_WAIT); });
    endAgain.addEventListener('click', function () { load(cur, NEXT_WAIT); });
    endClose.addEventListener('click', close);
    bClose.addEventListener('click', close);
    cardGo.addEventListener('click', function () { clearTimeout(cardTimer); reallyPlay(); });
    bPrev.addEventListener('click', function () { var p = prevOf(cur); if (p) load(p.y, NEXT_WAIT); });
    bNext.addEventListener('click', function () { var n = nextOf(cur); if (n) load(n.y, NEXT_WAIT); });
    bPlay.addEventListener('click', function () {
      if (waiting) return;
      if (tv.paused) { var p = tv.play(); if (p && p.catch) p.catch(function () {}); showBar(); } else tv.pause();
    });
    seek.addEventListener('input', function () { seeking = true; showBar(); var d = tv.duration || 0; time.textContent = mmss(d * seek.value / 1000) + ' / ' + mmss(d); });
    seek.addEventListener('change', function () { var d = tv.duration || 0; if (d) { try { tv.currentTime = d * seek.value / 1000; } catch (e) {} } seeking = false; showBar(); });
    document.addEventListener('keydown', function (e) {
      if (!th.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      else if (e.key === ' ') { e.preventDefault(); bPlay.click(); }
    });

    // ---- ページの中の動画に「大きい画面で見る」のふたを付ける ----
    vids.forEach(function (v) {
      var y = yearOfSrc(srcOf(v));
      if (!y || v.getAttribute('data-nv') === '2') return;
      v.setAttribute('data-nv', '2');
      var wrap = el('div', 'nv-wrap');
      v.parentNode.insertBefore(wrap, v);
      wrap.appendChild(v);
      var cover = el('button', 'nv-cover');
      cover.setAttribute('aria-label', y + '年目のアニメを大きい画面で見る');
      cover.appendChild(el('i', null, '▶'));
      cover.appendChild(el('span', null, '大きい画面で見る'));
      cover.addEventListener('click', function () { try { v.pause(); } catch (e) {} open(y); });
      wrap.appendChild(cover);
    });

    window.__nv = { open: open, close: close, years: years };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
