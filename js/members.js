/* ============================================================
   店員名單：內容在 data/members.js，立繪在 images/members/
   ------------------------------------------------------------
   一位店員 ＝ data/members.js 裡的一段文字 ＋ images/members/ 裡的一張圖，
   兩邊的名字要一樣：

     data/members.js  裡的  "1.員工1"
     images/members/1.員工1.png

   名字開頭的數字＝頁面順序。

   文字格式
     第一行    名字
     第二行    身分
     第三行起  自我介紹（空一行換段）
     之後可選  英文名：Tiara La
               引言：「牌不會替你決定。」
   ============================================================ */

(function(){

const MEMBER_META_KEYS = ['英文名', '引言'];

CH.initMembers = function(){
  const { requireData, indexFrom, toLines, splitMeta, showError } = CH.util;

  const roster = document.getElementById('roster');
  if (!roster) return;

  let members;
  try {
    const data  = requireData('members', 'data/members.js');
    const index = indexFrom(data, 'CH.DATA.members');
    members = index.map(item => parseMember(item, data[item.key]));
  } catch (err) {
    showError(roster, err, '請檢查 data/members.js 的內容。');
    return;
  }

  const loading = roster.querySelector('.loading');
  if (loading) loading.remove();
  roster.querySelector('.roster-body').hidden = false;
  roster.querySelector('.thumbs').hidden = false;

  startCarousel(roster, members);

  /* ---------- 把一段文字拆成一位店員 ---------- */
  function parseMember(item, text){
    const lines = toLines(text);
    while (lines.length && !lines[0].trim()) lines.shift();

    const name = (lines.shift() || item.label).trim();
    const role = (lines.shift() || '').trim();

    const { meta, body } = splitMeta(lines, MEMBER_META_KEYS);
    const intro = body.join('\n').split(/\n{2,}/).map(p => p.trim()).filter(Boolean);

    return {
      base : item.base,
      ext  : item.ext,
      name,
      role,
      intro,
      en   : meta['英文名'] || '',
      quote: meta['引言']   || ''
    };
  }
};

/* ============================================================
   輪播：自動播放 ＋ 點頭像 ＋ 左右滑 ＋ 鍵盤左右鍵
   ============================================================ */
function startCarousel(roster, MEMBERS){
  const { mountImage } = CH.util;
  const IMG_DIR = CH.CONFIG.images.members;

  const DURATION  = CH.CONFIG.roster.duration;
  const THRESHOLD = CH.CONFIG.roster.threshold;
  const OUT_MS    = CH.CONFIG.roster.outMs;
  const IN_MS     = CH.CONFIG.roster.inMs;
  const OFFSET    = CH.CONFIG.roster.offset;

  const thumbs = document.getElementById('m-thumbs');
  const figure = document.getElementById('m-figure');
  const body   = roster.querySelector('.roster-body');
  const bio    = roster.querySelector('.bio');
  const el = id => document.getElementById(id);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 立繪外框固定不動，只有框裡的內容跟著滑
  const figInner = document.createElement('div');
  figInner.className = 'fig-inner';
  figure.replaceChildren(figInner);

  let index = 0, elapsed = 0, last = null, paused = false;
  let hovering = false, dragging = false, animating = false;
  const syncPause = () => paused = hovering || dragging || animating;

  /* ---------- 下方頭像：有圖用圖，沒圖用名字第一個字 ---------- */
  thumbs.style.gridTemplateColumns =
    'repeat(' + Math.min(MEMBERS.length, 7) + ',minmax(0,1fr))';

  thumbs.replaceChildren(...MEMBERS.map((m, i) => {
    const b = document.createElement('button');
    b.className = 'thumb';
    b.type = 'button';
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
    b.setAttribute('aria-label', m.name);

    const slot = document.createElement('span');
    slot.textContent = m.name.charAt(0) || '✦';
    b.appendChild(slot);

    mountImage(b, IMG_DIR, m.base, {
      alt: '',
      ext: m.ext,
      onLoad: () => slot.remove()
    });

    const bar = document.createElement('span');
    bar.className = 'bar';
    b.appendChild(bar);

    b.addEventListener('click', () => goTo(i));
    return b;
  }));

  const tabs = [...thumbs.querySelectorAll('.thumb')];
  const bars = [...thumbs.querySelectorAll('.bar')];

  /* ---------- 換內容 ---------- */
  let generation = 0;

  function paint(i){
    const m = MEMBERS[i];
    const gen = ++generation;          // 圖片慢一步回來時用來判斷是否已經換人

    const ph = document.createElement('span');
    ph.className = 'ph';
    ph.textContent = '角色立繪';
    figInner.replaceChildren(ph);

    mountImage(figInner, IMG_DIR, m.base, {
      alt   : m.name,
      ext   : m.ext,
      valid : () => gen === generation,
      onLoad: () => ph.remove()
    });

    el('m-zh').firstChild.nodeValue = m.name;
    el('m-en').textContent   = m.en;
    el('m-role').textContent = m.role;

    el('m-text').replaceChildren(...m.intro.map(t => {
      const p = document.createElement('p');
      p.textContent = t;
      return p;
    }));

    el('m-quote').textContent = m.quote;
    el('m-quote').hidden      = !m.quote;

    tabs.forEach((t, k) => t.setAttribute('aria-selected', k === i ? 'true' : 'false'));
  }

  /* ---------- 位移：立繪走得比文字慢，做出前後層次 ---------- */
  function shift(px, opacity){
    figInner.style.transform = 'translate3d(' + (px * 0.36) + 'px,0,0)';
    bio.style.transform      = 'translate3d(' + px + 'px,0,0)';
    figInner.style.opacity   = String(1 - (1 - opacity) * 0.6);
    bio.style.opacity        = String(opacity);
  }

  function anim(on, ms){
    if (on) body.style.setProperty('--dur', ms + 'ms');
    body.classList.toggle('anim', on);
  }

  function resetTimer(){
    elapsed = 0;
    bars.forEach(b => b.style.width = '0');
  }

  /* ---------- 切換：舊的滑出去，新的從另一邊滑進來 ---------- */
  function goTo(i, dir){
    if (animating) return;
    if (i === index){ resetTimer(); return; }

    if (dir === undefined){
      const forward = (i - index + MEMBERS.length) % MEMBERS.length;
      dir = forward <= MEMBERS.length / 2 ? 1 : -1;
    }

    if (reduce){ index = i; paint(i); resetTimer(); return; }

    animating = true; syncPause();

    anim(true, OUT_MS);
    shift(-dir * OFFSET, 0);

    setTimeout(() => {
      index = i;
      paint(i);

      anim(false);                    // 先無動畫地擺到另一側
      shift(dir * OFFSET, 0);
      void body.offsetWidth;          // 強制重排，讓下一步真的有動畫

      anim(true, IN_MS);
      shift(0, 1);
      resetTimer();

      setTimeout(() => { animating = false; syncPause(); }, IN_MS);
    }, OUT_MS + 20);
  }

  /* ---------- 自動輪播 ---------- */
  function frame(ts){
    if (last === null) last = ts;
    const dt = ts - last;
    last = ts;

    if (!paused && !document.hidden && MEMBERS.length > 1){
      elapsed += dt;
      if (elapsed >= DURATION){
        resetTimer();
        goTo((index + 1) % MEMBERS.length, 1);
      } else {
        bars[index].style.width = (elapsed / DURATION * 100) + '%';
      }
    }
    requestAnimationFrame(frame);
  }

  /* ---------- 暫停條件 ---------- */
  roster.addEventListener('mouseenter', () => { hovering = true;  syncPause(); });
  roster.addEventListener('mouseleave', () => { hovering = false; syncPause(); });
  roster.addEventListener('focusin',    () => { hovering = true;  syncPause(); });
  roster.addEventListener('focusout',   () => { hovering = false; syncPause(); });

  /* ---------- 左右滑動 ---------- */
  let startX = 0, startY = 0, moveX = 0;
  let tracking = false, decided = false, horizontal = false;

  // 拖到後段會愈來愈重，手感比等比位移紮實
  function damp(x){
    const s = Math.sign(x), a = Math.abs(x);
    return s * (a <= 110 ? a : 110 + (a - 110) * 0.3);
  }

  body.addEventListener('pointerdown', e => {
    if (animating || MEMBERS.length < 2) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    tracking = true; decided = false; horizontal = false;
    startX = e.clientX; startY = e.clientY; moveX = 0;
  });

  body.addEventListener('pointermove', e => {
    if (!tracking) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    if (!decided){
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      decided = true;
      horizontal = Math.abs(dx) > Math.abs(dy);
      if (!horizontal){ tracking = false; return; }
      body.classList.add('dragging');
      anim(false);
      dragging = true; syncPause();
      try { body.setPointerCapture(e.pointerId); } catch (_) {}
    }

    moveX = damp(dx);
    shift(moveX, 1 - Math.min(Math.abs(moveX) / 300, 0.72));
  });

  function endDrag(){
    if (!tracking) return;
    tracking = false;
    body.classList.remove('dragging');
    dragging = false; syncPause();

    if (horizontal && Math.abs(moveX) > THRESHOLD){
      const dir = moveX < 0 ? 1 : -1;              // 往左滑＝下一位
      goTo((index + dir + MEMBERS.length) % MEMBERS.length, dir);
    } else {
      anim(true, 300);                             // 沒滑夠，彈回原位
      shift(0, 1);
    }
    moveX = 0;
  }

  body.addEventListener('pointerup', endDrag);
  body.addEventListener('pointercancel', endDrag);
  body.addEventListener('lostpointercapture', endDrag);

  /* ---------- 鍵盤 ---------- */
  thumbs.addEventListener('keydown', e => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    const dir  = e.key === 'ArrowRight' ? 1 : -1;
    const next = (index + dir + MEMBERS.length) % MEMBERS.length;
    goTo(next, dir);
    tabs[next].focus();
  });

  paint(0);
  shift(0, 1);
  requestAnimationFrame(frame);
}

})();
