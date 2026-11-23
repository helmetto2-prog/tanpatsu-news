/* KY絵本 全巻もくじ：話ごとの「作業の分類」と検索。
   もくじの .themes（「／」区切り）を1話ずつに分け、下の言葉の表で札を付ける。
   新しい巻は、もくじに足されればここで自動で仕分けられる（巻ごとの手作業は要らない）。
   分類を直したい時は KY_CATS の言葉を足す／外す。 */
var KY_CATS = [
  /* g:1＝作業でさがす／g:2＝場面でさがす */
  { g: 1, id: 'sentei', name: '剪定', re: /ツタ|つる|フジ棚|パーゴラ|こも巻き|スローウェイト|幹を切る|剪定|枝|高枝|ポールソー|樹上|木に登|木には登|登る前|木のまた|木肌|木を見上げ|吊るし切り|切り残し|のこぎり|脚立|はしご|可搬式作業台|高所作業車|雪吊り|冬囲い|墜落制止|ライフライン|メインロープ|カラビナ|シュロ縄|実のなる木|庭木|高木|ぎんなん|落ちた実/ },
  { g: 1, id: 'kusakari', name: '草刈', re: /刈払機|草刈|草むら|草は|草取り|草焼き|刈り草|芝刈|芝の中|集草袋|鎌|手刈り|法面|肩かけバンド|枯れ草|砂利の庭/ },
  { g: 1, id: 'bassai', name: '伐採', re: /伐採|チェーンソー|木を倒|倒す日|倒木|受け口|追い口|玉切り|丸太|切り株|竹の|枝・竹|かかり枝|枝が引っかか|枯れ木|傾いた木|根が浮|ウインチ|チッパー|キノコとうろ|退避/ },
  { g: 1, id: 'karikomi', name: '刈込', re: /トリマー|刈込|刈りこ|刈り込|生垣|バリカン|ヘッジトリマー|脚立|可搬式作業台/ },
  { g: 1, id: 'shokusai', name: '植栽・土', re: /掘り取る|平板|敷石|防草シート|根を切|フートン|植え穴|植栽|根鉢|穴掘り|掘削|掘る|掘った|スコップ|フォーク|支柱|杭|掛矢|庭石|重い石|石積み|石材|石灯籠|石と重い|ブロック塀|擁壁|土のう|肥料|石灰|埋設|埋め戻し|枕木|土留め|山留め|土や砂|ランマー|振動プレート|根上がり|ケーブルの通り道|管理機|ミキサー|生コン|植木鉢|プランター/ },
  { g: 1, id: 'shodoku', name: '消毒・薬', re: /薬をまく|薬は、計|薬剤|薬は使い切る|除草剤|消毒|防除|散布|動噴|ノズル|防腐塗料|溶剤|まぜるな/ },
  { g: 2, id: 'kuruma', name: '車・運搬', re: /信号|シートベルト|ナビは|踏切|左に曲がる|脱輪|キャリー|ダッシュボード|住宅街|最大積載|道順|車|運転|荷台|積み|積む|積んだ|荷くずれ|荷ゴム|固縛|トラック|ダンプ|ユニック|パワーゲート|ラダーレール|あおり|タイヤ|輪止め|駐車|運搬|運ぶ|運び|一輪車|かつ[いぐ]|かかえ|持ち上げ|持つ前|底を持つ|重い袋|重機|バケット|吊り荷|玉掛け|アウトリガー|荷下ろし|走り出|はみ出したまま|ライトをつけて/ },
  { g: 2, id: 'dougu', name: '道具・機械', re: /ドライバー|ドリル|カッター|ハンマー|オーガー|エアガン|スターター|たがね|ポンチ|巻き尺|なた|ビス|くぎ|釘|番線|スプレー缶|レーキ|はさみ|道具|機械|工具|刃物|刃は|刃が|刃を|刃の|切れない刃|エンジン|燃料|給油|ガソリン|携行缶|バッテリー|電池|充電|コード|コンセント|プラグ|漏電|感電|電線|引込線|ケーブル|ブロワー|高圧洗浄機|グラインダー|ラジエーター|マフラー|安全装置|安全カバー|始業前点検|ガスボンベ|投光器|ロープ|ワイヤー/ },
  { g: 2, id: 'hogogu', name: '保護具・からだ', re: /AED|上を向く仕事|一酸化炭素|排気ガス|ヘルメット|あごひも|保護メガネ|メガネ|手袋|耳せん|安全靴|長靴|靴|マスク|保護具|腰袋|腰痛|腰を|肩・腰|体調|具合|眠|お酒|持病|アレルギー|薬を飲|傷|けが|やけど|破傷風|救急|119|応急|手を洗|手洗い|目に入|体操|ストレッチ|休憩|朝ごはん|水筒|立ちくらみ|腱鞘炎|振動障害|難聴|粉じん|花粉/ },
  { g: 2, id: 'mushi', name: '虫・生きもの', re: /ハチ|蜂|スズメバチ|チャドクガ|毛虫|ムカデ|マダニ|蚊|マムシ|ヘビ|クマ|イノシシ|サル|カラス|鳥の巣|鳥よけ|ペット|生きもの|ウルシ|かぶれ|キョウチクトウ|とげ|イガ|虫よけ|すき間に素手|すき間に指/ },
  { g: 2, id: 'tenki', name: '暑さ寒さ・天気', re: /熱中症|暑|猛暑|水分|塩分|日焼け|日ざし|西日|汗|ファン付き|寒|冷え|凍|霜|氷|雪|かじかみ|カイロ|雨|カッパ|ぬれ|朝つゆ|霧の朝|台風|強風|風で|風向き|風を背|落雷|夕立|増水|地震|日暮れ|日没|暗く|夜明け/ },
  { g: 2, id: 'mawari', name: 'お客さま・まわり', re: /立入禁止|散水栓|柵|手すり|縁側|ウッドデッキ|室外機|給湯器|側溝|井戸|浄化槽|水路|ため池|池の|お客さま|ご家族|隣|となり|通行人|歩行者|子ども|住民|道路|歩道|通り道|境界|カーブミラー|標識|コーン|バリケード|囲い|個人情報|学校|保育園|公園|マンション|墓地|水道|戸締まり|鍵/ },
  { g: 2, id: 'katazuke', name: '掃除・片づけ', re: /落ち葉|熊手|掃く|掃いて|ほうき|ごみ|廃棄物|片づけ|整理整頓|置き忘れ|忘れ物|置き場|しまう|元の場所|戻して|袋は|ガラス|吸い殻|たばこ|火の始末/ },
  { g: 2, id: 'kokoro', name: '声かけ・段取り', re: /帰るまでが|いのち|連絡|伝言|スマホ|締め|朝礼|打合せ|声|合図|復唱|引き継ぎ|日報|ヒヤリ|下見|段取り|新人|新しい人|後輩|ひとり|一人|人数|見てて|教えて|資格|責任者|報告|判断|あわてない|ひと呼吸|止め」|いつもどおり|手順/ }
];
var KY_SONOTA = { g: 2, id: 'sonota', name: 'その他' };
/* 巻まるごとの札（番外編①②③は刈払機の3部作） */
var KY_VOL = { 'ky-ehon-bangai1.html': 'kusakari', 'ky-ehon-bangai2.html': 'kusakari', 'ky-ehon-bangai3.html': 'kusakari' };

/* 「／」で話に分ける（かっこの中の「／」では分けない） */
function kySplit(s) {
  var out = [], cur = '', d = 0;
  for (var i = 0; i < s.length; i++) {
    var ch = s.charAt(i);
    if (ch === '（' || ch === '(') d++;
    else if (ch === '）' || ch === ')') d = Math.max(0, d - 1);
    if (ch === '／' && d === 0) { if (cur.trim()) out.push(cur.trim()); cur = ''; }
    else cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}
function kyTags(text, href) {
  var t = [], v = KY_VOL[href];
  if (v) t.push(v);
  for (var i = 0; i < KY_CATS.length; i++) if (KY_CATS[i].re.test(text) && t.indexOf(KY_CATS[i].id) < 0) t.push(KY_CATS[i].id);
  return t.length ? t : [KY_SONOTA.id];
}
/* 検索用：全角半角・カタカナひらがな・大文字小文字をそろえる */
function kyNorm(s) {
  return String(s).normalize('NFKC').toLowerCase().replace(/[ァ-ヶ]/g, function (c) {
    return String.fromCharCode(c.charCodeAt(0) - 0x60);
  });
}
if (typeof module !== 'undefined') module.exports = { KY_CATS: KY_CATS, kySplit: kySplit, kyTags: kyTags, kyNorm: kyNorm };

if (typeof document !== 'undefined') (function () {
  var list = document.getElementById('list'), box = document.getElementById('kybox');
  if (!list || !box) return;
  var cats = KY_CATS.concat([KY_SONOTA]), name = {};
  cats.forEach(function (c) { name[c.id] = c.name; });

  var stories = [];
  [].forEach.call(list.querySelectorAll('a.vol'), function (a) {
    var q = function (s) { var e = a.querySelector(s); return e ? e.textContent.trim() : ''; };
    var no = q('.no'), title = q('.title'), href = a.getAttribute('href');
    kySplit(q('.themes')).forEach(function (t, i) {
      stories.push({ t: t, n: kyNorm(t + ' ' + title + ' ' + no), no: no, title: title, href: href, i: i + 1, tags: kyTags(t, href) });
    });
  });

  var esc = function (s) { return s.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var cnt = {}; stories.forEach(function (s) { s.tags.forEach(function (g) { cnt[g] = (cnt[g] || 0) + 1; }); });
  box.innerHTML =
    '<div id="kychips">' + [[1, 'きょうの作業からさがす'], [2, '場面からさがす']].map(function (g) {
      return '<div class="kyh">' + g[1] + '</div><div class="kyrow">' + cats.filter(function (c) { return c.g === g[0]; }).map(function (c) {
        return '<button type="button" data-c="' + c.id + '">' + c.name + '<small>' + (cnt[c.id] || 0) + '</small></button>';
      }).join('') + '</div>';
    }).join('') + '</div>' +
    '<div class="kyq"><input id="kyq" type="search" placeholder="ことばでさがす（例：脚立　ハチ　電線）" autocomplete="off" enterkeyhint="search">' +
    '<button type="button" id="kyclr">もどす</button></div>' +
    '<div id="kymsg"></div>';
  var hits = document.createElement('div'); hits.id = 'kyhits'; list.parentNode.insertBefore(hits, list);
  var inp = document.getElementById('kyq'), msg = document.getElementById('kymsg'), chips = document.getElementById('kychips');
  var cur = '';

  function draw() {
    var words = kyNorm(inp.value).split(/\s+/).filter(Boolean), on = !!(cur || words.length);
    [].forEach.call(chips.querySelectorAll('button'), function (b) { b.classList.toggle('on', b.getAttribute('data-c') === cur); });
    list.style.display = on ? 'none' : ''; hits.style.display = on ? '' : 'none';
    document.getElementById('kyclr').style.visibility = on ? 'visible' : 'hidden';
    try { history.replaceState(null, '', on ? '#c=' + cur + '&q=' + encodeURIComponent(inp.value.trim()) : location.pathname + location.search); } catch (e) {}
    if (!on) { msg.textContent = ''; hits.innerHTML = ''; return; }
    var r = stories.filter(function (s) {
      return (!cur || s.tags.indexOf(cur) >= 0) && words.every(function (w) { return s.n.indexOf(w) >= 0; });
    });
    msg.textContent = (cur ? '「' + name[cur] + '」' : '') + (words.length ? '「' + inp.value.trim() + '」' : '') + ' の話：' + r.length + ' 件（新しい順）';
    hits.innerHTML = r.length ? r.map(function (s) {
      return '<a class="hit" href="' + esc(s.href) + '"><div class="ht">' + esc(s.t) + '</div>' +
        '<div class="hm"><span class="hn">' + esc(s.no) + '・' + s.i + '話目</span>' +
        s.tags.map(function (g) { return '<span class="hg">' + name[g] + '</span>'; }).join('') + '</div></a>';
    }).join('') : '<div class="hnone">見つかりませんでした。ことばを短くするか、分類だけでさがしてください。</div>';
  }
  chips.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    var c = b.getAttribute('data-c'); cur = (cur === c) ? '' : c; draw();
  });
  inp.addEventListener('input', draw);
  document.getElementById('kyclr').addEventListener('click', function () { cur = ''; inp.value = ''; draw(); window.scrollTo(0, 0); });

  var m = /^#c=([a-z]*)&q=(.*)$/.exec(location.hash);
  if (m) { if (name[m[1]]) cur = m[1]; try { inp.value = decodeURIComponent(m[2]); } catch (e) {} }
  draw();
})();
