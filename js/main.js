/* ============================================================
   進入點：把四個區塊各自畫出來
   任何一區出錯都不會影響其他區
   ============================================================ */

(function(){
  const run = (name, fn) => {
    try { fn(); }
    catch (err) { console.error(name + ' 發生錯誤：', err); }
  };

  run('店家故事', CH.initStory);
  run('占卜須知', CH.initNotice);
  run('店員介紹', CH.initMembers);
  run('線上抽牌', CH.initTarot);
})();
