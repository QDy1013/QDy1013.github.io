/* 奇点Y · 稍后读、阅读位置与阅读工具。无需账号，数据留在当前浏览器。 */
(() => {
  'use strict';
  if (window.yReadingTools) return;
  window.yReadingTools = true;
  const KEY = 'y-reading-state-v1';
  const FONT_KEY = 'y-reading-font-v1';
  let durable = true;
  const pathOf = value => {
    try {
      const url = new URL(value, location.origin);
      if (url.origin !== location.origin || !/^https?:$/.test(url.protocol)) return null;
      return decodeURIComponent(url.pathname).replace(/index\.html$/, '').replace(/\/?$/, '/');
    } catch { return null; }
  };
  function readState() {
    try {
      const data = JSON.parse(localStorage.getItem(KEY) || '[]');
      if (!Array.isArray(data)) return [];
      return data.filter(item => item && pathOf(item.path) && typeof item.title === 'string')
        .slice(0, 200).map(item => ({
          path: pathOf(item.path), title: item.title.slice(0, 240), saved: item.saved === true,
          progress: Math.max(0, Math.min(1, Number(item.progress) || 0)),
          anchor: typeof item.anchor === 'string' ? item.anchor.slice(0, 500) : '',
          fraction: Math.max(0, Math.min(1, Number(item.fraction) || 0)),
          updated: Number.isFinite(item.updated) ? item.updated : 0
        }));
    } catch { durable = false; return null; }
  }
  let state = readState() || [];
  function change(path, patch) {
    const latest = durable ? (readState() || state) : state;
    const previous = latest.find(item => item.path === path) || { path, title: '', progress: 0, saved: false };
    const next = { ...previous, ...patch, updated: Date.now() };
    state = [next, ...latest.filter(item => item.path !== path)]
      .sort((a, b) => Number(b.saved) - Number(a.saved) || b.updated - a.updated).slice(0, 200);
    try { localStorage.setItem(KEY, JSON.stringify(state)); durable = true; }
    catch { durable = false; }
    updateUI();
  }
  function button(text, className, handler) {
    const node = document.createElement('button');
    node.type = 'button'; node.className = className; node.textContent = text;
    node.addEventListener('click', handler);
    return node;
  }
  function say(text) {
    let toast = document.querySelector('.y-reading-toast');
    if (!toast) {
      toast = document.createElement('div'); toast.className = 'y-reading-toast';
      toast.setAttribute('role', 'status'); document.body.append(toast);
    }
    toast.textContent = text; toast.classList.add('show');
    clearTimeout(say.timer); say.timer = setTimeout(() => toast.classList.remove('show'), 2600);
  }
  const percent = item => item.progress >= .98 ? '已读完' : item.progress > .02 ? `读到 ${Math.round(item.progress * 100)}%` : '尚未开始';
  let trigger, dialog, list, note, saveButton, currentPath, currentTitle, continueCard;

  function renderList() {
    if (!list) return;
    list.replaceChildren();
    const saved = state.filter(item => item.saved).sort((a, b) => b.updated - a.updated);
    if (!saved.length) {
      const empty = document.createElement('li'); empty.className = 'y-reading-empty';
      empty.textContent = '把感兴趣的文章加入「稍后读」，下次来这里接着看。'; list.append(empty);
    }
    saved.forEach(item => {
      const row = document.createElement('li'); row.className = 'y-reading-item';
      const content = document.createElement('div');
      const link = document.createElement('a'); link.textContent = item.title; link.href = item.path + (item.progress > .02 && item.progress < .98 ? '?resume=1' : '');
      const meta = document.createElement('p'); meta.textContent = percent(item);
      const remove = button('移除', 'y-reading-remove', () => { change(item.path, { saved: false }); renderList(); });
      remove.setAttribute('aria-label', `从稍后读移除《${item.title}》`);
      content.append(link, meta); row.append(content, remove); list.append(row);
    });
    note.textContent = durable ? '清单和阅读进度仅保存在当前浏览器。' : '浏览器未允许保存数据；当前页可用，刷新后可能无法保留。';
  }
  function updateUI() {
    const count = state.filter(item => item.saved).length;
    if (trigger) {
      trigger.textContent = `稍后读${count ? ' · ' + count : ''}`;
      trigger.setAttribute('aria-label', `打开稍后读清单，${count} 篇文章`);
    }
    if (saveButton) {
      const saved = Boolean(state.find(item => item.path === currentPath)?.saved);
      saveButton.textContent = saved ? '✓ 已加入清单' : '＋ 稍后读';
      saveButton.setAttribute('aria-pressed', String(saved));
    }
    if (dialog?.open) renderList();
    if (continueCard) renderContinue();
  }
  function setupLibrary() {
    dialog = document.createElement('dialog'); dialog.className = 'y-reading-dialog';
    dialog.setAttribute('aria-labelledby', 'y-reading-dialog-title');
    const header = document.createElement('div'); header.className = 'y-reading-dialog-head';
    const title = document.createElement('h2'); title.id = 'y-reading-dialog-title'; title.textContent = '留给下次的好文章';
    const close = button('×', 'y-reading-close', () => dialog.close()); close.setAttribute('aria-label', '关闭稍后读清单');
    header.append(title, close);
    note = document.createElement('p'); note.className = 'y-reading-note';
    list = document.createElement('ol'); list.className = 'y-reading-list';
    dialog.append(header, note, list); document.body.append(dialog);
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const r = dialog.getBoundingClientRect();
      if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();
    });
    let opener;
    dialog.addEventListener('close', () => { trigger.setAttribute('aria-expanded', 'false'); opener?.focus({ preventScroll: true }); });
    trigger = button('稍后读', 'y-reading-trigger', () => {
      opener = document.activeElement; renderList(); dialog.showModal();
      trigger.setAttribute('aria-expanded', 'true');
    });
    trigger.setAttribute('aria-haspopup', 'dialog'); trigger.setAttribute('aria-expanded', 'false');
    document.body.append(trigger); updateUI();
  }
  function renderContinue() {
    continueCard.replaceChildren();
    const item = [...state].sort((a, b) => b.updated - a.updated).find(entry => entry.progress > .03 && entry.progress < .98);
    continueCard.hidden = !item;
    if (!item) return;
    const label = document.createElement('span'); label.className = 'y-reading-eyebrow'; label.textContent = '接着上次的思路';
    const title = document.createElement('a'); title.className = 'y-reading-continue-title'; title.textContent = item.title; title.href = item.path + '?resume=1';
    const meta = document.createElement('p'); meta.textContent = `上次${percent(item)}，阅读位置已为你记住。`;
    const link = document.createElement('a'); link.className = 'y-reading-continue-link'; link.textContent = '继续阅读 →'; link.href = title.href;
    const text = document.createElement('div'); text.append(label, title, meta); continueCard.append(text, link);
  }
  function setupHome() {
    const home = document.querySelector('.main-inner.index .home-card');
    if (!home) return;
    continueCard = document.createElement('section'); continueCard.className = 'y-reading-continue';
    continueCard.setAttribute('aria-label', '继续上次阅读'); home.after(continueCard); renderContinue();
  }
  function setupArticle() {
    if (typeof CONFIG === 'undefined' || !CONFIG.page?.isPost) return;
    const body = document.querySelector('.main-inner.post .post-body');
    const header = document.querySelector('.main-inner.post .post-header');
    if (!body || !header) return;
    currentPath = pathOf(new URL(document.querySelector('link[rel=canonical]')?.href || location.href).pathname);
    currentTitle = document.querySelector('.post-title')?.textContent.trim() || document.title;
    const previous = state.find(item => item.path === currentPath);
    const tools = document.createElement('div'); tools.className = 'y-reader-tools';
    tools.setAttribute('role', 'toolbar'); tools.setAttribute('aria-label', '文章阅读工具');
    const group = document.createElement('div'); group.className = 'y-reader-font'; group.setAttribute('aria-label', '字号');
    const baseFont = parseFloat(getComputedStyle(body).fontSize);
    let size = 0;
    try { const saved = Number(localStorage.getItem(FONT_KEY)); if (Number.isInteger(saved) && saved >= -1 && saved <= 2) size = saved; } catch { /* Defaults remain usable. */ }
    const smaller = button('A−', 'y-reader-control', () => setFont(size - 1)); smaller.setAttribute('aria-label', '缩小正文字号');
    const reset = button('默认', 'y-reader-control y-reader-font-reset', () => setFont(0)); reset.setAttribute('aria-label', '恢复默认字号');
    const larger = button('A＋', 'y-reader-control', () => setFont(size + 1)); larger.setAttribute('aria-label', '放大正文字号');
    function setFont(value) {
      size = Math.max(-1, Math.min(2, value));
      body.style.fontSize = `${baseFont + size * 2}px`;
      smaller.disabled = size === -1; larger.disabled = size === 2;
      reset.textContent = ['小', '默认', '大', '更大'][size + 1];
      try { localStorage.setItem(FONT_KEY, String(size)); } catch { /* Current-page font controls still work. */ }
    }
    setFont(size); group.append(smaller, reset, larger);
    saveButton = button('＋ 稍后读', 'y-reader-control y-reader-save', () => {
      const saved = Boolean(state.find(item => item.path === currentPath)?.saved);
      if (!saved && state.filter(item => item.saved).length >= 200) { say('清单最多保留 200 篇，请先移除一些文章。'); return; }
      change(currentPath, { title: currentTitle, saved: !saved });
      say(durable ? (saved ? '已从稍后读移除' : '已加入稍后读，下次慢慢看') : '已更新本次清单；浏览器未允许长期保存');
    });
    const focus = button('专注阅读', 'y-reader-control', () => toggleFocus()); focus.setAttribute('aria-pressed', 'false');
    function toggleFocus(force) {
      const on = typeof force === 'boolean' ? force : !document.documentElement.classList.contains('y-focus-reading');
      document.documentElement.classList.toggle('y-focus-reading', on);
      focus.textContent = on ? '退出专注' : '专注阅读'; focus.setAttribute('aria-pressed', String(on));
    }
    const copy = button('复制链接', 'y-reader-control', async () => {
      const url = new URL(currentPath, location.origin).href;
      try {
        if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
        await navigator.clipboard.writeText(url); say('文章链接已复制');
      } catch {
        const input = document.createElement('input'); input.className = 'y-reader-copy-input'; input.value = url;
        input.setAttribute('aria-label', '文章链接，可手动复制'); tools.append(input); input.select();
        say('可在链接框中手动复制'); input.addEventListener('blur', () => input.remove(), { once: true });
      }
    });
    tools.append(saveButton, group, focus, copy); header.after(tools); updateUI();
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !dialog.open && !document.querySelector('.search-pop-overlay[style*="display: block"]')) toggleFocus(false);
    });

    let dirty = false, engaged = false, autoResumeCancelled = false, timer, banner;
    const top = node => node.getBoundingClientRect().top + scrollY;
    const headings = () => [...body.querySelectorAll('h2[id], h3[id]')];
    function record() {
      if (!dirty) return;
      dirty = false;
      const start = top(body), range = Math.max(1, body.offsetHeight - innerHeight + 140);
      const progress = Math.max(0, Math.min(1, (scrollY + 90 - start) / range));
      const sections = headings();
      let index = -1;
      sections.forEach((node, i) => { if (top(node) <= scrollY + 120) index = i; });
      const node = sections[index], end = sections[index + 1];
      const fraction = node ? Math.max(0, Math.min(1, (scrollY + 120 - top(node)) / Math.max(1, (end ? top(end) : start + body.offsetHeight) - top(node)))) : 0;
      change(currentPath, { title: currentTitle, progress, anchor: node?.id || '', fraction });
    }
    function resume(item) {
      banner?.remove(); engaged = true;
      requestAnimationFrame(() => {
        const sections = headings(), index = sections.findIndex(node => node.id === item.anchor);
        const node = sections[index], end = sections[index + 1];
        const start = top(body);
        const y = node ? top(node) + item.fraction * ((end ? top(end) : start + body.offsetHeight) - top(node)) - 120
          : start + item.progress * Math.max(1, body.offsetHeight - innerHeight + 140) - 90;
        window.scrollTo({ top: Math.max(0, y), behavior: 'instant' });
        say('已回到上次的阅读位置');
      });
    }
    const request = new URL(location.href);
    if (request.searchParams.get('resume') === '1') {
      request.searchParams.delete('resume'); history.replaceState(null, '', request.pathname + request.search + request.hash);
      if (previous && previous.progress > .03 && previous.progress < .98) {
        const restore = () => { if (!autoResumeCancelled) resume(previous); };
        Promise.race([document.fonts?.ready, new Promise(resolve => setTimeout(resolve, 1200))]).then(restore);
        if (document.readyState !== 'complete') window.addEventListener('load', restore, { once: true });
      }
    } else if (previous && previous.progress > .03 && previous.progress < .98 && !location.hash && body.offsetHeight > innerHeight * 1.4) {
      banner = document.createElement('div'); banner.className = 'y-reading-resume';
      const text = document.createElement('span'); text.textContent = `上次读到 ${Math.round(previous.progress * 100)}%，接着看？`;
      const yes = button('继续阅读 →', 'y-reader-control', () => resume(previous));
      const no = button('从头开始', 'y-reader-control', () => { banner.remove(); engaged = true; change(currentPath, { title: currentTitle, progress: 0, anchor: '', fraction: 0 }); });
      banner.append(text, yes, no); tools.after(banner);
    }
    const engage = () => { engaged = true; autoResumeCancelled = true; };
    window.addEventListener('wheel', engage, { passive: true });
    window.addEventListener('touchmove', engage, { passive: true });
    document.addEventListener('pointerdown', engage, { passive: true });
    document.addEventListener('click', event => { if (event.target.closest('.post-toc a, .post-body a')) engage(); });
    document.addEventListener('keydown', event => {
      if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key) && !event.target.closest('input, textarea, [contenteditable=true]')) engage();
    });
    window.addEventListener('scroll', () => {
      if (!engaged) return;
      dirty = true; clearTimeout(timer); timer = setTimeout(record, 900);
    }, { passive: true });
    window.addEventListener('pagehide', record);
    document.addEventListener('visibilitychange', () => { if (document.hidden) record(); });
  }
  function init() {
    if (document.querySelector('.y-reading-trigger')) return;
    setupLibrary(); setupHome(); setupArticle();
    window.addEventListener('storage', event => { if (event.key === KEY) { state = readState() || state; updateUI(); } });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
