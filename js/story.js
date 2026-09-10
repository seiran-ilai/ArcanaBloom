/* ============================================================
   店家故事：內容在 data/story.js
   ------------------------------------------------------------
   用單獨一行 --- 分成三段：
     第一段　內文，空一行換一個段落，第一段會自動放大並加首字
     ---
     第二段　側欄資訊，一行一筆，格式「標籤：內容」
     ---
     第三段　側欄下方的小字附註
   第二、三段可以整段省略。
   ============================================================ */

CH.initStory = function(){
  const { requireData, toBlocks, toParagraphs, toLines, showError } = CH.util;

  const body   = document.getElementById('story-body');
  const list   = document.getElementById('story-plaque-list');
  const note   = document.getElementById('story-note');
  const plaque = document.getElementById('story-plaque');
  if (!body) return;

  try {
    const [text, info, footnote] = toBlocks(requireData('story', 'data/story.js'));

    /* 內文 */
    const paras = toParagraphs(text || '');
    body.replaceChildren(...paras.map((p, i) => {
      const el = document.createElement('p');
      if (i === 0) el.className = 'lead drop';
      el.textContent = p;
      return el;
    }));

    /* 側欄資訊 */
    const rows = toLines(info || '')
      .map(l => l.match(/^\s*(.+?)\s*[：:]\s*(.*)$/))
      .filter(Boolean);

    list.replaceChildren(...rows.flatMap(([, label, value]) => {
      const dt = document.createElement('dt');
      const dd = document.createElement('dd');
      dt.textContent = label;
      dd.textContent = value;
      return [dt, dd];
    }));

    /* 附註 */
    const noteText = (footnote || '').trim();
    note.textContent = noteText;
    note.hidden = !noteText;

    plaque.hidden = rows.length === 0 && !noteText;
  } catch (err) {
    showError(body, err);
    if (plaque) plaque.hidden = true;
  }
};
