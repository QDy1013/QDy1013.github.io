/* global CONFIG */
(() => {
  'use strict';

  const REPO = 'QDy1013/QDy1013.github.io';
  // Stable article-to-issue mapping; counts always come from GitHub.
  const threads = {
    '/2025/10/11/Y的算法学习小记/': 4,
    '/2025/10/11/奇点的朋友们大家好/': 5,
    '/2026/10/17/WeNet论文入门导读/': 6,
    '/2026/10/18/正则化与学习率调度学习讲义/': 7,
    '/2026/10/19/ACM常用数学结论研究笔记/': 8,
    '/2026/10/20/二项式系数十大恒等式与生成函数推导/': 9,
    '/2026/10/22/ACM算法板子合集/': 10,
    '/2026/10/22/语音识别研究周报/': 11
  };

  const theme = () => document.documentElement.dataset.theme === 'dark' ? 'github-dark' : 'github-light';
  const normalize = value => {
    try { return decodeURIComponent(value).replace(/index\.html$/, '').replace(/\/?$/, '/'); }
    catch { return value; }
  };

  function init() {
    if (typeof CONFIG === 'undefined' || !CONFIG.page.comments) return;
    const container = document.querySelector('.utterances-container');
    if (!container || container.dataset.interactions) return;
    container.dataset.interactions = 'ready';
    const isPost = Boolean(CONFIG.page.isPost);
    let issueNumber = isPost ? threads[normalize(location.pathname)] : null;
    let issueUrl = issueNumber ? `https://github.com/${REPO}/issues/${issueNumber}` : '';
    let frame, loading = false, loaded = false, loadTimer, refreshing = false, lastRefresh = 0;

    if (!document.getElementById('y-interaction-styles')) {
      const style = document.createElement('style');
      style.id = 'y-interaction-styles';
      style.textContent = `
        .y-discussion { text-align:left; color:var(--text-color,#4a4038); }
        .y-discussion h2 { margin:0 0 6px; font-size:23px; font-weight:650; border:0; }
        .y-discussion .y-discussion-lead { margin:0 0 18px; font-size:14px; opacity:.8; line-height:1.8; }
        .y-discussion-actions { display:flex; flex-wrap:wrap; align-items:center; gap:10px; margin:0 0 12px; }
        .y-discussion .y-action { display:inline-flex; align-items:center; justify-content:center; gap:7px; box-sizing:border-box; min-height:44px; padding:8px 16px; border:1px solid rgba(157,111,78,.3); border-radius:24px; color:var(--text-color,#534236); background:rgba(201,100,66,.07); font:inherit; font-size:14px; line-height:1.5; text-decoration:none; cursor:pointer; }
        .y-discussion .y-like { background:#a94f35; color:#fff; border-color:transparent; }
        .y-discussion .y-action:hover { filter:brightness(1.08); border-color:#c96442; }
        .y-discussion .y-action:focus-visible, .y-discussion button:focus-visible, .y-discussion a:focus-visible { outline:3px solid #c96442; outline-offset:4px; }
        .y-discussion .y-count { font-variant-numeric:tabular-nums; }
        .y-discussion .y-discussion-note { margin:0 0 6px; font-size:12px; line-height:1.8; opacity:.8; }
        .y-discussion .y-feedback { min-height:1.8em; margin:4px 0; font-size:12px; opacity:.8; }
        .y-discussion .y-feedback:empty { display:none; }
        .y-discussion .y-refresh, .y-discussion .y-retry { padding:4px 8px; min-height:36px; border:0; background:transparent; color:var(--link-color,#a94f35); font:inherit; font-size:12px; cursor:pointer; }
        .y-discussion .y-widget { margin-top:14px; min-height:230px; }
        .y-discussion .utterances { max-width:100%; }
        .y-discussion [hidden] { display:none !important; }
        html[data-theme=dark] .y-discussion .y-like { background:#bd6449; color:#fff; }
        @media(max-width:600px) { .comments.y-discussion { padding:22px 14px; } .y-discussion h2 { font-size:21px; } .y-discussion .y-action { padding:8px 12px; } }
      `;
      document.head.append(style);
    }
    container.classList.add('y-discussion');
    container.setAttribute('aria-label', isPost ? '文章点赞与评论' : '留言区');
    container.innerHTML = `
      <h2>${isPost ? '读后，聊两句' : '留言区'}</h2>
      <p class="y-discussion-lead">${isPost ? '一个赞，一点想法，都是继续记录的动力。' : '欢迎分享想法，一起交流。'}</p>
      <div class="y-discussion-actions">
        <a class="y-action y-like" target="_blank" rel="noopener noreferrer" hidden><span aria-hidden="true">👍</span> 去 GitHub 点赞 <span class="y-count y-like-count">—</span></a>
        <button class="y-action y-write" type="button">写评论 <span class="y-count y-comment-count">—</span></button>
        <button class="y-refresh" type="button" hidden>刷新数量</button>
      </div>
      <p class="y-discussion-note">登录 GitHub 后即可发表评论。</p>
      <p class="y-discussion-note y-like-note" hidden>点赞：在新页面给文章主题添加 👍，返回这里后数量会自动更新。</p>
      <p class="y-feedback y-count-status" role="status"></p>
      <p class="y-feedback y-widget-status" role="status">评论区将在滚动到这里时加载。</p>
      <button class="y-retry" type="button" hidden>重新加载评论</button>
      <a class="y-discussion-note y-github-link" target="_blank" rel="noopener noreferrer">也可直接在 GitHub 查看和评论 ↗</a>
      <div class="y-widget" id="post-comment-editor" tabindex="-1"></div>
    `;
    const $ = selector => container.querySelector(selector);
    const host = $('.y-widget');
    const like = $('.y-like');
    const countStatus = $('.y-count-status');
    const widgetStatus = $('.y-widget-status');
    const retry = $('.y-retry');
    const refresh = $('.y-refresh');
    const githubLink = $('.y-github-link');
    $('.y-comment-count').hidden = !issueNumber;
    githubLink.href = `https://github.com/${REPO}/issues?q=${encodeURIComponent(normalize(location.pathname))}`;

    function setIssue(number) {
      if (!Number.isSafeInteger(number) || number <= 0) return;
      issueNumber = number;
      issueUrl = `https://github.com/${REPO}/issues/${number}`;
      githubLink.href = `${issueUrl}#new_comment_field`;
      $('.y-comment-count').hidden = false;
      if (isPost) {
        like.href = issueUrl;
        like.hidden = false;
        $('.y-like-note').hidden = false;
        refresh.hidden = false;
      }
    }
    if (issueNumber) setIssue(issueNumber);

    async function getJSON(url) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10000);
      try {
        const response = await fetch(url, { headers: { Accept: 'application/vnd.github+json' }, signal: controller.signal });
        if (!response.ok) throw new Error(`GitHub ${response.status}`);
        return await response.json();
      } finally { clearTimeout(timer); }
    }

    async function updateCounts(force = false) {
      if (!issueNumber || refreshing || (!force && Date.now() - lastRefresh < 5000)) return;
      refreshing = true;
      refresh.disabled = true;
      countStatus.textContent = '正在同步点赞和评论数量…';
      try {
        const issue = await getJSON(`https://api.github.com/repos/${REPO}/issues/${issueNumber}`);
        if (!Number.isInteger(issue.reactions?.['+1']) || !Number.isInteger(issue.comments)) throw new Error('Invalid counts');
        $('.y-like-count').textContent = String(issue.reactions['+1']);
        $('.y-comment-count').textContent = String(issue.comments);
        countStatus.textContent = '';
        lastRefresh = Date.now();
      } catch {
        countStatus.textContent = '数量暂时无法同步，可刷新重试；仍可在 GitHub 点赞和评论。';
      } finally { refreshing = false; refresh.disabled = false; }
    }

    // New posts without a fixed mapping can discover the issue Utterances creates.
    async function discoverIssue() {
      if (issueNumber || !isPost) return;
      try {
        const pathname = normalize(location.pathname).slice(1);
        const query = `repo:${REPO} is:issue "${pathname}" in:title,body`;
        const result = await getJSON(`https://api.github.com/search/issues?q=${encodeURIComponent(query)}&per_page=10`);
        const match = result.items?.find(issue => {
          const content = normalize(`${issue.title}\n${issue.body || ''}`);
          return !issue.pull_request && content.includes(pathname);
        });
        if (match) { setIssue(match.number); updateCounts(true); }
      } catch { /* The comment widget and GitHub fallback work independently. */ }
    }

    function syncTheme() {
      frame?.contentWindow?.postMessage({ type: 'set-theme', theme: theme() }, 'https://utteranc.es');
    }
    function failWidget() {
      loading = false;
      loaded = false;
      clearTimeout(loadTimer);
      widgetStatus.textContent = '评论加载较慢或暂时不可用。可以重试，或点击上方链接前往 GitHub。';
      retry.hidden = false;
    }
    function loadWidget() {
      if (loading || loaded) return;
      loading = true;
      retry.hidden = true;
      widgetStatus.textContent = '正在加载评论…';
      host.replaceChildren();
      frame = null;
      const script = document.createElement('script');
      script.src = 'https://utteranc.es/client.js';
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.setAttribute('repo', REPO);
      if (issueNumber) script.setAttribute('issue-number', String(issueNumber));
      else script.setAttribute('issue-term', CONFIG.utterances?.issue_term || 'pathname');
      script.setAttribute('theme', theme());
      script.onerror = failWidget;
      loadTimer = setTimeout(failWidget, 18000);
      host.append(script);
    }
    new MutationObserver(() => {
      const nextFrame = host.querySelector('iframe.utterances-frame');
      if (!nextFrame || nextFrame === frame) return;
      frame = nextFrame;
      frame.title = '文章评论（使用 GitHub 登录）';
      frame.addEventListener('load', syncTheme);
    }).observe(host, { childList: true, subtree: true });
    window.addEventListener('message', event => {
      if (event.origin !== 'https://utteranc.es' || event.source !== frame?.contentWindow || event.data?.type !== 'resize') return;
      const firstResize = !loaded;
      loaded = true;
      loading = false;
      clearTimeout(loadTimer);
      widgetStatus.textContent = '';
      retry.hidden = true;
      if (firstResize) syncTheme();
    });
    new MutationObserver(syncTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    refresh.addEventListener('click', () => updateCounts(true));
    retry.addEventListener('click', loadWidget);
    $('.y-write').addEventListener('click', () => {
      loadWidget();
      host.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
      host.focus({ preventScroll: true });
    });
    function activate() {
      loadWidget();
      if (issueNumber) updateCounts();
      else discoverIssue();
    }
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) { observer.disconnect(); activate(); }
      }, { rootMargin: '400px' });
      observer.observe(container);
    } else activate();
    function refreshOnReturn() {
      if (!container.isConnected || document.visibilityState !== 'visible') return;
      if (issueNumber) updateCounts(true);
      else discoverIssue();
    }
    window.addEventListener('focus', refreshOnReturn);
    document.addEventListener('visibilitychange', refreshOnReturn);
  }
  document.addEventListener('page:loaded', init);
  document.addEventListener('DOMContentLoaded', init);
  if (document.readyState !== 'loading') init();
})();
