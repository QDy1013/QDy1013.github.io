/* global CONFIG, NexT */
// Read the generated index locally and render article content only as text.
document.addEventListener('DOMContentLoaded', () => {
  const input = document.querySelector('.search-input');
  const container = document.querySelector('.search-result-container');
  const overlay = document.querySelector('.search-pop-overlay');
  const dialog = document.querySelector('.search-popup');
  const closeButton = document.querySelector('.popup-btn-close');
  if (!input || !container || !overlay || !dialog || !closeButton) return;
  let articles, loading, returnFocus;
  const normalize = value => String(value || '').normalize('NFKC').toLocaleLowerCase();
  const message = text => {
    const element = document.createElement('p');
    element.className = 'search-message';
    element.textContent = text;
    container.replaceChildren(element);
  };
  const render = () => {
    if (!articles) return;
    const query = input.value.trim();
    const words = normalize(query).split(/\s+/).filter(Boolean);
    if (!words.length) {
      message('输入关键词搜索文章，支持标题和正文。按 Esc 关闭。');
      return;
    }
    const results = articles.map(article => {
      const title = normalize(article.title), content = normalize(article.content);
      return { article, title, content, score: words.reduce((score, word) => score + (title.includes(word) ? 10 : 0) + (content.includes(word) ? 1 : 0), 0) };
    }).filter(result => words.every(word => result.title.includes(word) || result.content.includes(word)))
      .sort((a, b) => b.score - a.score);
    if (!results.length) {
      message('没有找到“' + query + '”相关的文章，试试更短的关键词。');
      return;
    }
    const stats = document.createElement('p');
    stats.className = 'search-stats';
    stats.textContent = '找到 ' + results.length + ' 篇文章';
    const list = document.createElement('ul');
    list.className = 'search-result-list';
    results.forEach(({ article }) => {
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.className = 'search-result-title';
      link.href = article.url;
      link.textContent = article.title;
      const snippet = document.createElement('p');
      snippet.className = 'search-result';
      const text = String(article.content || '').replace(/\s+/g, ' ');
      const position = Math.max(0, text.toLocaleLowerCase().indexOf(query.toLocaleLowerCase()));
      const start = Math.max(0, position - 35);
      snippet.textContent = (start ? '…' : '') + text.slice(start, start + 160) + (text.length > start + 160 ? '…' : '');
      item.append(link, snippet);
      list.append(item);
    });
    container.replaceChildren(stats, list);
  };
  const load = () => {
    if (articles) { render(); return Promise.resolve(); }
    if (loading) return loading;
    message('正在加载搜索索引…');
    container.setAttribute('aria-busy', 'true');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    loading = fetch(CONFIG.path || '/search.json', { signal: controller.signal })
      .then(response => {
        if (!response.ok) throw new Error('Search index unavailable');
        return response.json();
      }).then(data => {
        if (!Array.isArray(data)) throw new Error('Invalid search index');
        articles = data.filter(article => {
          if (!article || typeof article.title !== 'string' || typeof article.url !== 'string') return false;
          try {
            const url = new URL(article.url, location.origin);
            return url.origin === location.origin && ['http:', 'https:'].includes(url.protocol);
          } catch { return false; }
        });
        render();
      }).catch(() => {
        message('搜索索引暂时加载失败，请重试，或通过归档浏览文章。');
        const retry = document.createElement('button');
        retry.type = 'button';
        retry.className = 'search-retry';
        retry.textContent = '重新加载';
        retry.addEventListener('click', () => { load(); input.focus(); });
        container.append(retry);
      }).finally(() => {
        clearTimeout(timeout);
        container.setAttribute('aria-busy', 'false');
        loading = null;
      });
    return loading;
  };
  const open = trigger => {
    if (!document.body.classList.contains('search-active')) returnFocus = trigger || document.activeElement;
    NexT.utils.setGutter();
    document.body.classList.add('search-active');
    overlay.removeAttribute('inert');
    overlay.setAttribute('aria-hidden', 'false');
    input.focus({ preventScroll: true });
    load();
  };
  const close = () => {
    if (!document.body.classList.contains('search-active')) return;
    document.body.classList.remove('search-active');
    NexT.utils.setGutter('0');
    returnFocus?.focus({ preventScroll: true });
    overlay.setAttribute('inert', '');
    overlay.setAttribute('aria-hidden', 'true');
  };
  overlay.setAttribute('inert', '');
  overlay.setAttribute('aria-hidden', 'true');
  document.querySelectorAll('.popup-trigger').forEach(trigger => trigger.addEventListener('click', () => open(trigger)));
  closeButton.addEventListener('click', close);
  overlay.addEventListener('click', event => { if (event.target === overlay) close(); });
  input.addEventListener('input', render);
  document.addEventListener('pjax:success', close);
  document.addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      open();
    }
    if (!document.body.classList.contains('search-active')) return;
    if (event.key === 'Escape') { event.preventDefault(); close(); }
    if (event.key === 'Tab') {
      const focusable = [...dialog.querySelectorAll('input, button, a[href], [tabindex="0"]')];
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
});

