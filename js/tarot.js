/* ============================================================
   線上抽牌：翻牌動畫與結果顯示
   牌的內容全部來自 data/cards.js，這裡只負責抽與畫
   ============================================================ */

(function(){

/* U+FE0E：強制 ♑ ♈ 這類符號用文字樣式，不要被瀏覽器換成彩色表情符號 */
const VS15 = String.fromCharCode(0xFE0E);

CH.initTarot = function(){
  const { mountImage, showError } = CH.util;
  const IMG_DIR = CH.CONFIG.images.cards;

  const section = document.getElementById('tarot');
  const card    = document.getElementById('card');
  const btn     = document.getElementById('draw');
  const result  = document.getElementById('result');
  const before  = document.getElementById('draw-before');
  if (!card) return;

  const front = card.querySelector('.front');
  const el = id => document.getElementById(id);

  let DECK;
  try {
    DECK = CH.loadDeck();
  } catch (err) {
    showError(section.querySelector('.stage'), err, '請檢查 data/cards.js 的內容。');
    btn.disabled = true;
    return;
  }

  btn.disabled = false;

  let drawn = false;
  let busy  = false;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* 是否出現逆位：auto = 牌義有寫逆位才隨機 */
  function pickReversed(c){
    const mode = CH.CONFIG.tarot.reversed;
    if (mode === false) return false;
    if (mode === 'auto' && !c.rv) return false;
    return Math.random() < 0.5;
  }

  let generation = 0;

  function paint(c, reversed){
    const gen = ++generation;          // 牌面圖慢一步回來時用來判斷是否已經換牌

    /* ---------- 牌面 ---------- */
    el('c-num').textContent     = c.num;
    el('c-glyph').textContent   = c.glyph ? c.glyph + VS15 : '';
    el('c-name').textContent    = c.name;
    el('c-caption').textContent = c.name;

    front.classList.remove('has-art');
    front.querySelectorAll('.art-img').forEach(n => n.remove());
    mountImage(front, IMG_DIR, c.base, {
      alt      : c.name,
      className: 'art-img',
      ext      : c.ext,
      valid    : () => gen === generation,
      onLoad   : () => front.classList.add('has-art')
    });

    /* ---------- 下方解讀 ---------- */
    const side = reversed && c.rv ? c.rv : c.up;
    el('r-name').textContent  = c.en ? c.name + '　' + c.en : c.name;
    el('r-keys').textContent  = side.keys;
    el('r-scene').textContent = c.scene;
    el('r-voice').textContent = side.voice;

    const showPos = CH.CONFIG.tarot.reversed !== false
                 && (c.rv || CH.CONFIG.tarot.reversed === true);
    el('r-pos').textContent = showPos ? (reversed ? '逆位' : '正位') : '';
    el('r-pos').className   = reversed ? 'pos rev' : 'pos';
    el('r-pos').hidden      = !showPos;

    card.classList.toggle('reversed', reversed);
  }

  function reveal(){
    if (busy) return;
    busy = true;

    const c = DECK[Math.floor(Math.random() * DECK.length)];
    const reversed = pickReversed(c);

    const show = () => {
      paint(c, reversed);
      card.classList.add('flipped');
      result.classList.add('on');
      card.setAttribute('aria-label', '已抽到 ' + c.name + '，再點一次換一張');
      busy = false;
    };

    if (drawn){
      // 已經有牌：先蓋回去，再翻新的
      card.classList.remove('flipped');
      result.classList.remove('on');
      setTimeout(show, reduce ? 0 : CH.CONFIG.tarot.flipBackMs);
    } else {
      // 第一次抽完，說明與按鈕就退場，之後直接點牌面重抽
      drawn = true;
      before.hidden = true;
      show();
    }
  }

  btn.addEventListener('click', reveal);
  card.addEventListener('click', reveal);
  card.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); reveal(); }
  });
};

})();
