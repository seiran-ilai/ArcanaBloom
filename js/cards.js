/* ============================================================
   牌組：內容在 data/cards.js，牌面在 images/cards/
   ------------------------------------------------------------
   一張牌 ＝ data/cards.js 裡的一段文字 ＋ images/cards/ 裡的一張圖，
   兩邊的名字要一樣：

     data/cards.js  裡的  "愚者"
     images/cards/愚者.png

   文字格式
     第一行    卡牌名稱
     第二行    卡牌關鍵字
     第三行    卡牌敘述
     第四行起  卡牌解析
     之後可選  英文名：The Fool
               編號：0
               符號：♅            ← 沒有牌面圖時，正面顯示的符號
               逆位關鍵字：魯莽　逃避
               逆位解析：……        ← 有寫才會出現逆位
   ============================================================ */

(function(){

const CARD_META_KEYS = ['英文名', '編號', '符號', '逆位關鍵字', '逆位解析'];

/* 把整副牌讀出來，順序照名字開頭的數字（沒寫數字就照排列順序） */
CH.loadDeck = function(){
  const { requireData, indexFrom, toLines, splitMeta } = CH.util;

  const data  = requireData('cards', 'data/cards.js');
  const index = indexFrom(data, 'CH.DATA.cards');

  return index.map(item => {
    const lines = toLines(data[item.key]);
    while (lines.length && !lines[0].trim()) lines.shift();

    const name  = (lines.shift() || item.label).trim();
    const keys  = (lines.shift() || '').trim();
    const scene = (lines.shift() || '').trim();

    const { meta, body } = splitMeta(lines, CARD_META_KEYS);
    const voice = body.join('\n').trim();

    return {
      base : item.base,
      ext  : item.ext,
      name,
      en   : meta['英文名'] || '',
      num  : meta['編號']   || '',
      glyph: meta['符號']   || '✦',
      up   : { keys, voice },
      rv   : (meta['逆位關鍵字'] || meta['逆位解析'])
               ? { keys: meta['逆位關鍵字'] || keys, voice: meta['逆位解析'] || voice }
               : null,
      scene
    };
  });
};

})();
