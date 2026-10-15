/* 人類創世ゲーム：動画の終わりに「次の年のアニメ」ボタンを出す（ゲン 2026-10-16）
   - 同じページの <video> を、ファイル名から年で見分ける
     （jinrui_annai_720p.mp4＝1年目、jinrui_yNNNN_720p.mp4＝N年目）。並び順は関係ない
   - 見終わったら動画の上に「▶ N年目のアニメへ」を出す。押すと次の年の動画へ移って再生する
   - 全画面のまま終わった時は、全画面を閉じてからボタンを出す
   - 次の年の動画がまだ無い時は「ここまでが最新」と出す。ボタンの外を押すと閉じる
   - 読み込みは <script src="/tanpatsu-news/jinrui/next-video.js" defer></script>（どの階層のページからでも同じ書き方） */
(function () {
  'use strict';

  function yearOf(v) {
    var src = v.currentSrc || v.src || '';
    if (!src) {
      var s = v.querySelector('source');
      if (s) src = s.src || s.getAttribute('src') || '';
    }
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
      '.nv-over{position:absolute;top:0;left:0;right:0;bottom:0;display:none;flex-direction:column;align-items:center;justify-content:center;gap:12px;background:rgba(0,0,0,.72);border-radius:10px;z-index:2;padding:12px;box-sizing:border-box}' +
      '.nv-over.show{display:flex}' +
      '.nv-next{font:inherit;font-size:1.1rem;font-weight:700;color:#2b2a26;background:#f3d9b1;border:0;border-radius:999px;padding:.75em 1.5em;cursor:pointer;-webkit-user-select:none;user-select:none}' +
      '.nv-again{font:inherit;font-size:.9rem;color:#fff;background:transparent;border:1px solid rgba(255,255,255,.65);border-radius:999px;padding:.45em 1.2em;cursor:pointer;-webkit-user-select:none;user-select:none}' +
      '.nv-msg{color:#fff;font-size:.95rem;line-height:1.6;text-align:center;max-width:26em}';
    document.head.appendChild(st);
  }

  function exitFullscreen(v) {
    try {
      if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen();
      else if (document.webkitFullscreenElement && document.webkitExitFullscreen) document.webkitExitFullscreen();
      if (v.webkitDisplayingFullscreen && v.webkitExitFullscreen) v.webkitExitFullscreen();
    } catch (e) { /* 閉じられなくても続ける */ }
  }

  function playFromStart(v) {
    try { v.currentTime = 0; } catch (e) {}
    var p = v.play();
    if (p && p.catch) p.catch(function () {});
  }

  function init() {
    var vids = Array.prototype.slice.call(document.querySelectorAll('video'));
    var byYear = {};
    vids.forEach(function (v) { var y = yearOf(v); if (y && !byYear[y]) byYear[y] = v; });
    var years = Object.keys(byYear).map(Number);
    if (!years.length) return;
    var latest = Math.max.apply(null, years);
    addStyle();

    vids.forEach(function (v) {
      var y = yearOf(v);
      if (!y || v.getAttribute('data-nv') === '1') return;
      v.setAttribute('data-nv', '1');

      var wrap = document.createElement('div');
      wrap.className = 'nv-wrap';
      v.parentNode.insertBefore(wrap, v);
      wrap.appendChild(v);

      var over = document.createElement('div');
      over.className = 'nv-over';
      var next = byYear[y + 1];
      if (next) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'nv-next';
        b.textContent = '▶ ' + (y + 1) + '年目のアニメへ';
        b.addEventListener('click', function () {
          over.classList.remove('show');
          var card = (next.closest && next.closest('section')) || next;
          card.scrollIntoView({ behavior: 'smooth', block: 'start' });
          playFromStart(next);
        });
        over.appendChild(b);
      } else {
        var msg = document.createElement('div');
        msg.className = 'nv-msg';
        msg.textContent = y >= latest
          ? 'ここまでが最新のアニメです。次の年のアニメは、できたらここに並びます。'
          : '次の年のアニメは、このページにはありません。';
        over.appendChild(msg);
      }
      var again = document.createElement('button');
      again.type = 'button';
      again.className = 'nv-again';
      again.textContent = 'もう一度見る';
      again.addEventListener('click', function () { over.classList.remove('show'); playFromStart(v); });
      over.appendChild(again);
      over.addEventListener('click', function (e) { if (e.target === over) over.classList.remove('show'); });
      wrap.appendChild(over);

      v.addEventListener('ended', function () { exitFullscreen(v); over.classList.add('show'); });
      v.addEventListener('play', function () { over.classList.remove('show'); });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
