/* ============================================================
   共用工具：切行、切區塊、抓補充欄位、找圖
   ------------------------------------------------------------
   資料本身放在 data/ 的四個 js 檔裡，格式是「一行一個欄位」的純文字，
   這支負責把那些文字拆成程式看得懂的東西。
   任何一行以 # 開頭都是註解，不會顯示。
   ============================================================ */

(function(){
  const CONFIG = CH.CONFIG;

  /* ---------- 從 CH.DATA 拿一段資料，沒有就報錯 ---------- */
  function requireData(key, file){
    const v = CH.DATA[key];
    if (v === undefined || v === null) {
      throw new Error(`找不到資料：請確認 ${file} 有被載入，而且裡面有 CH.DATA.${key}`);
    }
    return v;
  }

  /* ---------- 切成一行一行，去掉註解與尾端空白 ---------- */
  function toLines(text){
    return String(text)
      .replace(/\r\n?/g, '\n')
      .split('\n')
      .map(l => l.replace(/\s+$/, ''))
      .filter(l => !/^\s*#/.test(l));
  }

  /* ---------- 用單獨一行 --- 切區塊 ---------- */
  function toBlocks(text){
    return toLines(text)
      .join('\n')
      .split(/^-{3,}$/m)
      .map(b => b.replace(/^\n+|\n+$/g, ''));
  }

  /* ---------- 空行分段 ---------- */
  function toParagraphs(block){
    return String(block).split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
  }

  /* ============================================================
     補充欄位：正文後面可以寫「鍵：值」
     只有 keys 裡列出的鍵才算補充欄位，其餘都當成正文
     ============================================================ */
  function splitMeta(lines, keys){
    const meta = {};
    const body = [];
    const re = new RegExp(`^(${keys.join('|')})\\s*[：:]\\s*(.*)$`);

    for (const line of lines){
      const m = line.match(re);
      if (m) meta[m[1]] = m[2].trim();
      else   body.push(line);
    }
    return { meta, body };
  }

  /* ============================================================
     把資料物件的 key 轉成有順序的清單
       "1.員工1"      → 依開頭數字排序，數字順序就是頁面順序
       "1.員工1|png"  → 直線後面可以指定圖片副檔名，省去一個個試
     沒有數字前綴的排在最後面
     ============================================================ */
  function indexFrom(obj, label){
    if (!obj || typeof obj !== 'object') throw new Error(`${label} 的格式不對`);

    const items = Object.keys(obj).map((key, i) => {
      const [rawBase, rawExt] = key.split('|');
      const base = rawBase.trim();
      const m = base.match(/^\s*(\d+)\s*[.\-_、]\s*(.*)$/);
      return {
        key,                                    // 原本的 key，用來取內容
        base,                                   // 檔名，用來組圖片路徑
        label: m ? m[2] : base,                 // 去掉數字前綴後的名字
        ext  : (rawExt || '').trim().replace(/^\./, '').toLowerCase(),
        order: m ? Number(m[1]) : Number.MAX_SAFE_INTEGER,
        seq  : i
      };
    });

    if (!items.length) throw new Error(`${label} 是空的`);
    items.sort((a, b) => a.order - b.order || a.seq - b.seq);
    return items;
  }

  /* ============================================================
     圖片：資料檔只寫名字，這裡依序試 CONFIG.imageExtensions
     找到就把 <img> 塞進 mount，全部試完都沒有就呼叫 onFail

     ext      key 有用 |png 指定的話先試它，就不會白跑其他幾種
     valid()  圖片載回來的時候如果已經換人／換牌了，就回 false 丟掉，
              避免慢一步的圖蓋到現在這一張
     ============================================================ */
  function mountImage(mount, dir, base, opts){
    opts = opts || {};
    const alt       = opts.alt || '';
    const className = opts.className || '';
    const ext       = opts.ext || '';
    const valid     = opts.valid || (() => true);
    const onLoad    = opts.onLoad;
    const onFail    = opts.onFail;

    const exts = ext
      ? [ext].concat(CONFIG.imageExtensions.filter(e => e !== ext))
      : CONFIG.imageExtensions;
    const candidates = exts.map(e => dir + encodeURIComponent(base) + '.' + e);

    const img = new Image();
    if (className) img.className = className;
    img.alt = alt;
    img.decoding = 'async';

    let i = 0;
    img.addEventListener('error', () => {
      if (i < candidates.length) img.src = candidates[i++];
      else if (onFail && valid()) onFail();
    });
    img.addEventListener('load', () => {
      if (!valid()) return;
      if (!img.isConnected) mount.appendChild(img);
      if (onLoad) onLoad(img);
    });

    img.src = candidates[i++];
    return img;
  }

  /* ---------- 把錯誤畫在頁面上，而不是只留在 console ---------- */
  function showError(mount, err, hint){
    console.error(err);
    const box = document.createElement('div');
    box.className = 'load-error';
    box.innerHTML = `資料有問題：${escapeHtml(err.message || String(err))}`
                  + (hint ? '<br>' + escapeHtml(hint) : '');
    mount.replaceChildren(box);
  }

  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, c =>
      ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  }

  CH.util = { requireData, toLines, toBlocks, toParagraphs, splitMeta,
              indexFrom, mountImage, showError, escapeHtml };
})();
