/* ============================================================
   占卜須知：內容在 data/notice.js
   ------------------------------------------------------------
   用單獨一行 --- 分成兩段：
     第一段　條目，空一行換一則
                第一行   = 標題
                第二行起 = 說明
     ---
     第二段　最下方的小字附註，換行就是換行
   第二段可以省略。
   ============================================================ */

CH.initNotice = function(){
  const { requireData, toBlocks, toParagraphs, showError, escapeHtml } = CH.util;

  const list = document.getElementById('notice-list');
  const foot = document.getElementById('notice-foot');
  if (!list) return;

  try {
    const [items, footnote] = toBlocks(requireData('notice', 'data/notice.js'));

    list.replaceChildren(...toParagraphs(items || '').map(entry => {
      const [title, ...rest] = entry.split('\n');

      const li  = document.createElement('li');
      const box = document.createElement('div');

      const h = document.createElement('strong');
      h.textContent = title.trim();
      box.appendChild(h);

      const desc = rest.join('\n').trim();
      if (desc){
        const p = document.createElement('p');
        p.textContent = desc;
        box.appendChild(p);
      }

      li.appendChild(box);
      return li;
    }));

    const footText = (footnote || '').trim();
    foot.innerHTML = footText.split('\n').map(escapeHtml).join('<br>');
    foot.hidden = !footText;
  } catch (err) {
    showError(list, err);
    if (foot) foot.hidden = true;
  }
};
