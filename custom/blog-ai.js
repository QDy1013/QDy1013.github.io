(() => {
  'use strict';
  if (document.getElementById('y-ai-launcher')) return;
  const icon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H5l-3 3v-9.5A7.5 7.5 0 0 1 9.5 5H13M18 2v6M15 5h6"/></svg>';
  const launcher = document.createElement('button');
  launcher.id = 'y-ai-launcher'; launcher.type = 'button'; launcher.innerHTML = icon + '<span>问一问</span>';
  launcher.setAttribute('aria-expanded', 'false'); launcher.setAttribute('aria-controls', 'y-ai-panel');
  launcher.setAttribute('aria-label', '打开 AI 问答窗口');
  const panel = document.createElement('section');
  panel.id = 'y-ai-panel'; panel.hidden = true; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', '奇点Y的问答窗口');
  panel.innerHTML = `
    <header class="y-ai-header"><button class="y-ai-symbol y-ai-move-handle" type="button" aria-label="移动问答窗口，可用方向键调整位置" title="拖动窗口 · 方向键微调"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v18M3 12h18M9 6l3-3 3 3M9 18l3 3 3-3M6 9l-3 3 3 3M18 9l3 3-3 3"/></svg></button><div class="y-ai-heading"><strong>随笔之间</strong><span>拖动顶部可移动 · 选中内容可提问</span></div><button class="y-ai-position-reset" aria-label="恢复窗口默认位置" title="恢复默认位置" type="button">↺</button><button class="y-ai-close" aria-label="关闭问答窗口" type="button">×</button></header>
    <div class="y-ai-access"><span class="y-ai-dot"></span><span class="y-ai-access-label">账号访问</span><button class="y-ai-admin-open" type="button" hidden>AI 权限</button><button class="y-ai-password-open" type="button" hidden>改密码</button><button class="y-ai-logout" type="button" hidden>退出</button></div>
    <form class="y-ai-unlock"><div class="y-ai-lock-mark">✧</div><h2>登录你的问答角落</h2><p>注册即可拥有账号，<br>AI 使用权限由博主单独开通。</p><div class="y-ai-auth-tabs"><button type="button" data-auth="login" aria-pressed="true">登录</button><button type="button" data-auth="register" aria-pressed="false">注册账号</button></div><label for="y-ai-username">用户名</label><input id="y-ai-username" name="username" type="text" autocomplete="username" spellcheck="false" placeholder="字母、数字、下划线或短横线" minlength="3" maxlength="32" required><label for="y-ai-password">密码</label><input id="y-ai-password" name="password" type="password" autocomplete="current-password" placeholder="10–128 位密码" minlength="10" maxlength="128" required><div class="y-ai-confirm-field" hidden><label for="y-ai-confirm">再次输入密码</label><input id="y-ai-confirm" type="password" autocomplete="new-password" maxlength="128"></div><button class="y-ai-auth-submit" type="submit">登录</button><div class="y-ai-login-error" role="status"></div></form>
    <div class="y-ai-waiting" hidden><div class="y-ai-lock-mark">✧</div><h2>账号已登录</h2><p class="y-ai-access-message">AI 权限等待博主开通。</p><button class="y-ai-refresh-access" type="button">刷新权限状态</button><p>开通后即可使用博客问答与自由聊天。</p><div class="y-ai-waiting-status" role="status"></div></div>
    <div class="y-ai-management" hidden><div class="y-ai-view-header"><button class="y-ai-back" type="button">← 返回</button><h2>AI 权限管理</h2><button class="y-ai-refresh-accounts" type="button">刷新</button></div><p class="y-ai-manage-note">注册不等于获得 AI 权限。开通后才能提问，撤销后立即停止使用。</p><div class="y-ai-manage-status" role="status"></div><div class="y-ai-accounts"></div><div class="y-ai-pagination"><button class="y-ai-prev" type="button">上一页</button><span class="y-ai-page-label"></span><button class="y-ai-next" type="button">下一页</button></div></div>
    <form class="y-ai-password-form" hidden><div class="y-ai-view-header"><button class="y-ai-back" type="button">← 返回</button><h2>修改密码</h2></div><label for="y-ai-old-password">当前密码</label><input id="y-ai-old-password" type="password" autocomplete="current-password" maxlength="128" required><label for="y-ai-new-password">新密码</label><input id="y-ai-new-password" type="password" autocomplete="new-password" minlength="10" maxlength="128" required><label for="y-ai-new-confirm">再次输入新密码</label><input id="y-ai-new-confirm" type="password" autocomplete="new-password" maxlength="128" required><button class="y-ai-password-submit" type="submit">保存新密码</button><div class="y-ai-password-status" role="status"></div></form>
    <div class="y-ai-chat" hidden><div class="y-ai-tabs" role="tablist" aria-label="选择问答方式"><button type="button" role="tab" aria-selected="true" data-mode="blog">博客问答</button><button type="button" role="tab" aria-selected="false" data-mode="general">自由聊天</button></div><div class="y-ai-messages" role="log" aria-label="对话内容" aria-live="polite" aria-relevant="additions"></div><div class="y-ai-status" role="status"></div><form class="y-ai-compose"><label class="y-ai-sr" for="y-ai-question">输入问题</label><textarea id="y-ai-question" rows="2" maxlength="4000" placeholder="想读懂哪篇文章？" required></textarea><div class="y-ai-compose-bottom"><button class="y-ai-clear" type="button">清空对话</button><span>Enter 发送 · Shift+Enter 换行</span><button class="y-ai-send" type="submit" aria-label="发送问题">↑</button></div></form><p class="y-ai-footnote">问题将发送给 DeepSeek，回答请结合原文判断。</p></div>`;
  // 手机上窗口改成右侧全高侧栏，左边留一条遮罩，点遮罩即可收起。
  const backdrop = document.createElement('div');
  backdrop.id = 'y-ai-backdrop'; backdrop.hidden = true;
  document.body.append(launcher, backdrop, panel);
  const $ = selector => panel.querySelector(selector);
  // 窄屏或触屏设备都用侧栏；有的手机浏览器把页面按七八百像素宽排版再整体缩小，只看宽度会误判成电脑。
  const narrowQuery = window.matchMedia('(max-width: 600px)'), touchQuery = window.matchMedia('(hover: none) and (pointer: coarse)');
  // 部分手机浏览器不报告 pointer/hover，或开着「电脑版」伪装成桌面；再看触点、触摸事件和浏览器标识。
  const mobileAgent = /Android|iPhone|iPad|iPod|HarmonyOS|Mobile/i.test(navigator.userAgent);
  const touchCapable = (navigator.maxTouchPoints || 0) > 0 || 'ontouchstart' in window;
  let drawerMode = false;
  function syncDrawer() {
    drawerMode = narrowQuery.matches || touchQuery.matches || mobileAgent || touchCapable && !window.matchMedia('(pointer: fine)').matches;
    const root = document.documentElement;
    root.classList.toggle('y-ai-drawer-mode', drawerMode);
    // 页面被缩小显示时，按「可见宽度 ÷ 屏幕宽度」把侧栏和按钮放大回正常字号。
    const viewWidth = window.visualViewport?.width || innerWidth, viewHeight = window.visualViewport?.height || innerHeight;
    const ratio = screen.width > 0 ? viewWidth / screen.width : 1;
    const zoom = drawerMode && ratio > 1.1 ? Math.min(3, ratio) : 1;
    if (zoom > 1) {
      root.style.setProperty('--ya-zoom', zoom.toFixed(3));
      root.style.setProperty('--ya-drawer-w', Math.min(viewWidth * 0.92, 440 * zoom) / zoom + 'px');
      root.style.setProperty('--ya-drawer-h', viewHeight / zoom + 'px');
    } else for (const name of ['--ya-zoom', '--ya-drawer-w', '--ya-drawer-h']) root.style.removeProperty(name);
    $('.y-ai-heading span').textContent = drawerMode ? '选中文章或代码即可提问' : '拖动顶部可移动 · 选中内容可提问';
  }
  for (const query of [narrowQuery, touchQuery]) query.addEventListener ? query.addEventListener('change', syncDrawer) : query.addListener?.(syncDrawer);
  window.addEventListener('resize', syncDrawer); window.visualViewport?.addEventListener('resize', syncDrawer); syncDrawer();
  // 网址带 ?ai-debug 时在页面顶部列出判断依据，方便用手机截图排查。
  if (/[?&#]ai-debug/.test(location.href)) {
    const debug = document.createElement('pre');
    debug.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:1300;margin:0;padding:10px;background:#000c;color:#fff;font:14px/1.5 monospace;white-space:pre-wrap;pointer-events:none';
    const scriptSrc = [...document.scripts].map(s => s.src).find(src => src.includes('blog-ai.js')) || '';
    const showDebug = () => {
      const media = query => window.matchMedia(query).matches ? '是' : '否';
      debug.textContent = ['版本 ' + (scriptSrc.split('v=')[1] || '未知'), '侧栏模式 ' + (drawerMode ? '是' : '否') + '  放大 ' + (getComputedStyle(document.documentElement).getPropertyValue('--ya-zoom') || '1'),
        '窗口宽 ' + innerWidth + '  可见宽 ' + Math.round(window.visualViewport?.width || 0) + '  屏幕宽 ' + screen.width + '  像素比 ' + devicePixelRatio,
        '窄屏 ' + media('(max-width: 600px)') + '  触屏查询 ' + media('(hover: none) and (pointer: coarse)') + '  精确指针 ' + media('(pointer: fine)'),
        '触点 ' + (navigator.maxTouchPoints || 0) + '  触摸事件 ' + ('ontouchstart' in window ? '有' : '无') + '  手机标识 ' + (mobileAgent ? '是' : '否'),
        navigator.userAgent].join('\n');
      debug.style.zoom = getComputedStyle(document.documentElement).getPropertyValue('--ya-zoom') || '1';
    };
    showDebug(); document.body.append(debug); window.addEventListener('resize', showDebug);
  }
  const quoteCard = document.createElement('div');
  quoteCard.className = 'y-ai-quote'; quoteCard.hidden = true;
  quoteCard.innerHTML = '<div class="y-ai-quote-heading"><span>引用片段</span><button type="button" class="y-ai-quote-remove" aria-label="移除引用片段">×</button></div><a class="y-ai-quote-title" target="_blank" rel="noopener"></a><pre class="y-ai-quote-preview"></pre><small class="y-ai-quote-meta"></small>';
  $('.y-ai-compose').prepend(quoteCard);
  const quoteNotice = document.createElement('div');
  quoteNotice.className = 'y-ai-context-notice'; quoteNotice.hidden = true;
  quoteNotice.innerHTML = '<span></span><button type="button" aria-label="移除引用片段">移除</button>';
  $('.y-ai-access').after(quoteNotice);
  const selectionMenu = document.createElement('div');
  selectionMenu.id = 'y-ai-selection-menu'; selectionMenu.hidden = true;
  selectionMenu.setAttribute('role', 'group'); selectionMenu.setAttribute('aria-label', '询问选中内容');
  selectionMenu.innerHTML = '<button type="button" data-selection-action="ask">✧ 问 AI</button><button type="button" data-selection-action="explain">解释这段</button>';
  document.body.append(selectionMenu);
  let quoted = null, candidate = null, selectionTimer, draggingSelection = false;
  const MAX_SELECTION = 6000;
  const history = { blog: [], general: [] };
  const visible = { blog: [], general: [] };
  let mode = 'blog', token = '', busy = false, endpoint = '', configPromise, controller, returnFocus;
  let account = null, authMode = 'login', accountPage = 0, epoch = 0;
  const sessionKey = 'y-blog-ai-account-session', accountKey = 'y-blog-ai-account-cache';
  // 上次确认过的账号状态只用来立刻显示界面；服务端每次聊天仍会重新检查权限。
  let cachedAccount = null, verifiedAt = 0, accountCheck = null;
  try {
    token = sessionStorage.getItem(sessionKey) || ''; sessionStorage.removeItem('y-private-ai-session');
    const saved = token && JSON.parse(sessionStorage.getItem(accountKey));
    if (saved && typeof saved.username === 'string' && typeof saved.aiAccess === 'string') cachedAccount = saved;
  } catch {}
  function saveToken(value) {
    token = value; epoch++; verifiedAt = 0; cachedAccount = null;
    try { value ? sessionStorage.setItem(sessionKey, value) : sessionStorage.removeItem(sessionKey); sessionStorage.removeItem(accountKey); } catch {}
  }
  function setView(view) {
    $('.y-ai-unlock').hidden = Boolean(account);
    $('.y-ai-chat').hidden = !account || account.aiAccess !== 'approved' || view !== 'chat';
    $('.y-ai-waiting').hidden = !account || account.aiAccess === 'approved' || view !== 'chat';
    $('.y-ai-management').hidden = !account || view !== 'admin';
    $('.y-ai-password-form').hidden = !account || view !== 'password';
  }
  function setAuthorized(value) {
    account = value || null;
    try { account && token ? sessionStorage.setItem(accountKey, JSON.stringify(account)) : sessionStorage.removeItem(accountKey); } catch {}
    $('.y-ai-logout').hidden = !account;
    $('.y-ai-password-open').hidden = !account;
    $('.y-ai-admin-open').hidden = account?.role !== 'admin';
    $('.y-ai-access-label').textContent = account ? account.username + (account.role === 'admin' ? ' · 管理员' : '') : '账号访问';
    $('.y-ai-access-message').textContent = account?.aiAccess === 'disabled' ? 'AI 权限已被撤销，请联系博主重新开通。' : 'AI 权限等待博主开通，请联系博主。';
    panel.classList.toggle('y-ai-authorized', Boolean(account));
    setView('chat');
    renderQuote();
  }
  function resetSession({ keepQuote = false } = {}) {
    controller?.abort(); saveToken(''); setAuthorized(null); setBusy(false);
    for (const name of ['blog', 'general']) { history[name] = []; visible[name] = []; }
    $('.y-ai-password-form').reset(); $('.y-ai-accounts').replaceChildren();
    if (!keepQuote) quoted = null; renderQuote();
  }
  function setAuthMode(value) {
    authMode = value;
    for (const tab of panel.querySelectorAll('[data-auth]')) tab.setAttribute('aria-pressed', String(tab.dataset.auth === value));
    $('.y-ai-confirm-field').hidden = value !== 'register';
    $('#y-ai-confirm').required = value === 'register';
    $('#y-ai-password').autocomplete = value === 'register' ? 'new-password' : 'current-password';
    $('.y-ai-auth-submit').textContent = value === 'register' ? '注册账号' : '登录';
    $('.y-ai-login-error').textContent = '';
  }
  async function loadAccount() {
    const current = token;
    const result = await request('/api/me', {});
    if (token === current) { verifiedAt = Date.now(); setAuthorized(result.account); renderConversation(); }
  }
  // 同一时间只发一次账号检查；一分钟内确认过就不再重复问服务端。
  function verifyAccount() {
    if (!token || Date.now() - verifiedAt < 60000) return Promise.resolve();
    if (!accountCheck) accountCheck = loadAccount().finally(() => { accountCheck = null; });
    return accountCheck;
  }
  function setBusy(value) {
    busy = value; $('.y-ai-send').disabled = value; $('.y-ai-clear').disabled = value;
    for (const tab of panel.querySelectorAll('[data-mode]')) tab.disabled = value;
    for (const button of document.querySelectorAll('#y-ai-selection-menu button, .y-ai-code-ask, .y-ai-quote-remove')) button.disabled = value;
    $('.y-ai-status').textContent = value ? (mode === 'blog' ? '正在读相关的文章…' : '正在想你的问题…') : '';
  }
  function renderQuote() {
    quoteCard.hidden = !quoted;
    quoteNotice.hidden = !quoted || account?.aiAccess === 'approved';
    $('#y-ai-question').required = !quoted;
    $('#y-ai-question').placeholder = quoted ? '想问这段什么？直接发送也可以解释片段。' : mode === 'blog' ? '想读懂哪篇文章？' : '输入你的问题…';
    if (!quoted) return;
    $('.y-ai-quote-title').textContent = quoted.title;
    $('.y-ai-quote-title').href = quoted.url;
    $('.y-ai-quote-preview').textContent = quoted.text;
    $('.y-ai-quote-meta').textContent = quoted.truncated ? '内容较长，已引用前 6,000 字符；可以分段提问。' : (quoted.kind === 'code' ? '代码' : '正文') + ' · ' + quoted.text.length + ' 字符 · 发送前可移除';
    quoteNotice.querySelector('span').textContent = account ? '片段已保留，开通 AI 权限后可提问。' : '片段已保留，登录后可继续提问。';
  }
  function removeQuote() { if (!busy) { quoted = null; renderQuote(); (account?.aiAccess === 'approved' ? $('#y-ai-question') : $('#y-ai-username')).focus(); } }
  $('.y-ai-quote-remove').addEventListener('click', removeQuote);
  quoteNotice.querySelector('button').addEventListener('click', removeQuote);
  function elementOf(node) { return node?.nodeType === Node.ELEMENT_NODE ? node : node?.parentElement; }
  function selectedText(range) {
    const fragment = range.cloneContents();
    fragment.querySelectorAll('.gutter, button, .copy-btn, .highlight-tools, script, style').forEach(node => node.remove());
    let text = '';
    function read(node) {
      if (node.nodeType === Node.TEXT_NODE) { text += node.textContent; return; }
      if (node.nodeName === 'BR') { text += '\n'; return; }
      const block = /^(P|DIV|PRE|LI|H[1-6]|TR|BLOCKQUOTE)$/.test(node.nodeName);
      if (block && text && !text.endsWith('\n')) text += '\n';
      node.childNodes.forEach(read);
      if (block && text && !text.endsWith('\n')) text += '\n';
    }
    read(fragment);
    return text.replace(/\r\n?/g, '\n').replace(/\u00a0/g, ' ').replace(/^\n+|\n+$/g, '');
  }
  function quoteFrom(range, body) {
    const start = elementOf(range.startContainer), end = elementOf(range.endContainer);
    if (!start || !end || start.closest('.gutter') && end.closest('.gutter')) return null;
    const text = selectedText(range);
    if (!text.trim()) return null;
    const article = body.closest('article') || body.parentElement;
    const titleNode = article.querySelector('.post-title');
    const url = new URL(titleNode?.querySelector('a')?.href || document.querySelector('link[rel="canonical"]')?.href || location.href, location.href);
    if (url.origin !== location.origin) return null;
    url.search = ''; url.hash = '';
    const heading = [...body.querySelectorAll('h2[id], h3[id], h4[id]')].filter(node => node.compareDocumentPosition(start) & Node.DOCUMENT_POSITION_FOLLOWING).at(-1);
    if (heading) url.hash = heading.id;
    const block = start.closest('figure.highlight, pre');
    return { title: (titleNode?.textContent.trim() || document.title).slice(0, 160), url: url.href,
      kind: block && block.contains(end) ? 'code' : 'text',
      text: text.slice(0, MAX_SELECTION).replace(/[\uD800-\uDBFF]$/, ''), truncated: text.length > MAX_SELECTION };
  }
  function hideSelectionMenu() { selectionMenu.hidden = true; candidate = null; }
  function inspectSelection() {
    if (selectionMenu.contains(document.activeElement)) return;
    hideSelectionMenu();
    if (draggingSelection) return;
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount !== 1) return;
    const range = selection.getRangeAt(0);
    const start = elementOf(range.startContainer), end = elementOf(range.endContainer);
    const body = start?.closest('.post-body');
    if (!body || end?.closest('.post-body') !== body) return;
    const quote = quoteFrom(range, body);
    if (!quote) return;
    const rect = [...range.getClientRects()].filter(r => r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight).at(-1);
    if (!rect) return;
    candidate = quote; selectionMenu.hidden = false;
    const box = selectionMenu.getBoundingClientRect();
    selectionMenu.style.left = Math.max(8, Math.min(innerWidth - box.width - 8, rect.left)) + 'px';
    const below = rect.bottom + 8;
    selectionMenu.style.top = Math.max(8, Math.min(innerHeight - box.height - 8, below + box.height < innerHeight ? below : rect.top - box.height - 8)) + 'px';
  }
  function scheduleSelection() { clearTimeout(selectionTimer); selectionTimer = setTimeout(inspectSelection, 100); }
  document.addEventListener('selectionchange', scheduleSelection);
  document.addEventListener('pointerdown', event => {
    if (selectionMenu.contains(event.target)) { event.preventDefault(); return; }
    draggingSelection = true; hideSelectionMenu();
  });
  document.addEventListener('pointerup', () => { draggingSelection = false; scheduleSelection(); });
  document.addEventListener('pointercancel', () => { draggingSelection = false; hideSelectionMenu(); });
  document.addEventListener('scroll', hideSelectionMenu, { passive: true, capture: true });
  window.addEventListener('resize', hideSelectionMenu);
  document.addEventListener('keydown', event => { if (event.key === 'Escape') hideSelectionMenu(); });
  async function askSelection(quote, explain = false) {
    if (!quote || busy) return;
    quoted = quote; hideSelectionMenu(); window.getSelection()?.removeAllRanges(); renderQuote();
    if (explain && !$('#y-ai-question').value.trim()) $('#y-ai-question').value = quote.kind === 'code'
      ? '请用通俗的语言逐行解释这段代码，说明语法、作用，以及输入和输出。' : '请用通俗的语言解释这段内容，必要时举一个例子。';
    await openPanel();
  }
  for (const button of selectionMenu.querySelectorAll('button')) button.addEventListener('click', () => askSelection(candidate, button.dataset.selectionAction === 'explain'));
  for (const block of document.querySelectorAll('.post-body figure.highlight, .post-body > pre')) {
    const actions = document.createElement('div'); actions.className = 'y-ai-code-actions';
    const button = document.createElement('button'); button.type = 'button'; button.className = 'y-ai-code-ask';
    button.textContent = '✧ 整段问 AI'; button.setAttribute('aria-label', '引用这段代码并向 AI 提问');
    button.addEventListener('click', () => {
      const code = block.querySelector('td.code pre') || block.querySelector('pre') || block;
      const range = document.createRange(); range.selectNodeContents(code);
      askSelection(quoteFrom(range, block.closest('.post-body')));
    });
    actions.append(button); block.before(actions);
  }
  // 点击代码块左侧行号选中整行，Shift 点击从上次点的行号连选到这一行；选中后沿用划词提问菜单。
  let lineAnchor = null;
  for (const gutter of document.querySelectorAll('.post-body figure.highlight td.gutter')) {
    const block = gutter.closest('figure.highlight');
    const numbers = [...gutter.querySelectorAll('.line')];
    const lines = [...block.querySelectorAll('td.code .line')];
    numbers.forEach((number, index) => {
      if (!lines[index]) return;
      number.classList.add('y-ai-line-number'); number.title = '点击选中这一行 · Shift 点击连选多行';
    });
    gutter.addEventListener('click', event => {
      const number = event.target.closest('.y-ai-line-number');
      if (!number) return;
      const index = numbers.indexOf(number);
      const extend = event.shiftKey && lineAnchor?.block === block;
      if (!extend) lineAnchor = { block, index };
      const from = extend ? Math.min(lineAnchor.index, index) : index;
      const to = extend ? Math.max(lineAnchor.index, index) : index;
      const range = document.createRange();
      range.setStart(lines[from], 0); range.setEnd(lines[to], lines[to].childNodes.length);
      const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range);
      scheduleSelection();
    });
  }
  // 固定窗口只通过顶部拖动，正文、输入框与代码选择不会触发拖动。
  const positionKey = 'y-blog-ai-panel-position';
  let panelPosition = null, drag = null;
  try {
    const saved = JSON.parse(sessionStorage.getItem(positionKey));
    if (saved && Number.isFinite(saved.left) && Number.isFinite(saved.top)) panelPosition = saved;
  } catch {}
  function viewportBounds() {
    const viewport = window.visualViewport;
    return { left: viewport?.offsetLeft || 0, top: viewport?.offsetTop || 0,
      width: viewport?.width || innerWidth, height: viewport?.height || innerHeight };
  }
  function applyPosition(left = panelPosition?.left, top = panelPosition?.top) {
    if (panel.hidden) return;
    const view = viewportBounds();
    panel.style.maxHeight = Math.max(180, view.height - 16) + 'px';
    if (!Number.isFinite(left) || !Number.isFinite(top)) return;
    const box = panel.getBoundingClientRect();
    // 窗口可以拖到屏幕左右或下方之外，只要还露出一截标题栏，手机上也能把它挪开看正文。
    const keepX = Math.min(box.width, 120), keepY = Math.min(box.height, header.offsetHeight + 8);
    panelPosition = { left: Math.max(view.left + keepX - box.width, Math.min(left, view.left + view.width - keepX)),
      top: Math.max(view.top + 8, Math.min(top, view.top + view.height - keepY)) };
    Object.assign(panel.style, { left: panelPosition.left + 'px', top: panelPosition.top + 'px', right: 'auto', bottom: 'auto' });
  }
  function savePosition() { try { sessionStorage.setItem(positionKey, JSON.stringify(panelPosition)); } catch {} }
  function resetPosition() {
    drag = null; panel.classList.remove('y-ai-dragging'); panelPosition = null;
    for (const property of ['left', 'top', 'right', 'bottom', 'max-height']) panel.style.removeProperty(property);
    try { sessionStorage.removeItem(positionKey); } catch {}
    applyPosition();
  }
  const header = $('.y-ai-header');
  header.addEventListener('pointerdown', event => {
    if (drawerMode || !event.isPrimary || event.button !== 0 || event.target.closest('button:not(.y-ai-move-handle)')) return;
    const box = panel.getBoundingClientRect();
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, left: box.left, top: box.top, moved: false };
    header.setPointerCapture(event.pointerId); event.preventDefault();
  });
  header.addEventListener('pointermove', event => {
    if (!drag || event.pointerId !== drag.id) return;
    const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
    if (!drag.moved && Math.abs(dx) + Math.abs(dy) < 4) return;
    drag.moved = true; panel.classList.add('y-ai-dragging');
    applyPosition(drag.left + dx, drag.top + dy);
  });
  function endDrag() {
    if (!drag) return;
    const previous = drag; drag = null; panel.classList.remove('y-ai-dragging');
    if (header.hasPointerCapture(previous.id)) header.releasePointerCapture(previous.id);
    if (previous.moved) { savePosition(); hideSelectionMenu(); window.getSelection()?.removeAllRanges(); }
  }
  for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) header.addEventListener(event, endDrag);
  window.addEventListener('blur', endDrag);
  $('.y-ai-position-reset').addEventListener('click', resetPosition);
  $('.y-ai-move-handle').addEventListener('keydown', event => {
    if (event.key === 'Home') { event.preventDefault(); event.stopPropagation(); resetPosition(); return; }
    const directions = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    if (!directions[event.key]) return;
    event.preventDefault(); event.stopPropagation();
    const box = panel.getBoundingClientRect(), step = event.shiftKey ? 40 : 16;
    applyPosition(box.left + directions[event.key][0] * step, box.top + directions[event.key][1] * step); savePosition();
  });
  function fitPanel() {
    if (panel.hidden) return;
    if (panelPosition) { applyPosition(); savePosition(); }
    else {
      applyPosition();
      const box = panel.getBoundingClientRect(), view = viewportBounds();
      if (box.top < view.top + 8 || box.bottom > view.top + view.height - 8) applyPosition(box.left, box.top);
    }
  }
  window.addEventListener('resize', fitPanel);
  window.visualViewport?.addEventListener('resize', fitPanel);
  window.visualViewport?.addEventListener('scroll', fitPanel);
  async function config() {
    if (!configPromise) configPromise = fetch('/ai-config.json', { cache: 'no-store' }).then(r => { if (!r.ok) throw Error(); return r.json(); }).then(c => {
      if (!c.enabled || !c.endpoint) throw Error('这个问答角落暂未开放，请稍后再来。');
      const u = new URL(c.endpoint);
      if (u.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(u.hostname)) throw Error();
      endpoint = u.origin; return c;
    }).catch(e => { configPromise = null; throw Error(e.message || '暂时连接不上，请稍后重试。'); });
    return configPromise;
  }
  async function request(path, body, signal) {
    await config();
    const response = await fetch(endpoint + path, { method: 'POST', headers: {
      'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {})
    }, body: JSON.stringify(body), signal: signal || AbortSignal.timeout(25000), credentials: 'omit' });
    let data; try { data = await response.json(); } catch { throw Error('没有收到完整回答，请重试。'); }
    if (!response.ok) {
      if (response.status === 401 && !['/api/session', '/api/register', '/api/password'].includes(path)) {
        resetSession({ keepQuote: true }); $('.y-ai-login-error').textContent = data.error || '登录已失效，请重新登录。';
      }
      if (response.status === 403 && path === '/api/chat') await loadAccount();
      const error = Error(data.error || '暂时无法回答，请稍后重试。'); error.status = response.status; throw error;
    }
    return data;
  }
  // 只借助 Marked 识别 Markdown，逐个创建允许的 DOM 元素；不执行回复中的 HTML。
  function renderMarkdown(parent, tokens, depth = 0) {
    function append(tag, token, target = parent) {
      const node = document.createElement(tag); target.append(node);
      if (token.tokens && depth < 32) renderMarkdown(node, token.tokens, depth + 1);
      else node.textContent = token.text || '';
      return node;
    }
    function textValue(value) {
      // 只解码独立实体，送进解码器的内容不能含标签或属性。
      return String(value || '').replace(/&(?:#\d+|#x[\da-f]+|[a-z][\da-z]*);/gi, entity => {
        const decoder = document.createElement('textarea'); decoder.innerHTML = entity; return decoder.value;
      });
    }
    function link(token) {
      let url;
      try { url = new URL(token.href, location.href); } catch { return append('span', token); }
      if (!['https:', 'http:', 'mailto:'].includes(url.protocol)) return append('span', token);
      const node = append('a', token); node.href = url.href;
      node.target = '_blank'; node.rel = 'noopener noreferrer';
      if (token.title) node.title = token.title;
      return node;
    }
    for (const token of tokens) {
      if (depth > 32) { parent.append(document.createTextNode(token.raw || token.text || '')); continue; }
      switch (token.type) {
        case 'space': case 'def': break;
        case 'paragraph': append('p', token); break;
        case 'heading': append('h' + Math.min(6, token.depth + 1), token); break;
        case 'strong': append('strong', token); break;
        case 'em': append('em', token); break;
        case 'del': append('del', token); break;
        case 'codespan': { const node = document.createElement('code'); node.textContent = token.text; parent.append(node); break; }
        case 'br': parent.append(document.createElement('br')); break;
        case 'hr': parent.append(document.createElement('hr')); break;
        case 'text': case 'escape': {
          if (token.tokens) renderMarkdown(parent, token.tokens, depth + 1);
          else parent.append(document.createTextNode(textValue(token.text)));
          break;
        }
        case 'html': {
          if (/^<br\s*\/?\s*>$/i.test(token.text.trim())) parent.append(document.createElement('br'));
          else parent.append(document.createTextNode(token.text));
          break;
        }
        case 'blockquote': append('blockquote', token); break;
        case 'link': link(token); break;
        case 'image': link({ ...token, text: token.text || '查看图片', tokens: null }); break;
        case 'list': {
          const list = document.createElement(token.ordered ? 'ol' : 'ul');
          if (token.ordered && Number.isSafeInteger(token.start) && token.start > 0) list.start = token.start;
          parent.append(list);
          for (const item of token.items) {
            const li = document.createElement('li'); list.append(li);
            if (item.task) { li.className = 'y-ai-task'; li.append(document.createTextNode(item.checked ? '☑ ' : '☐ ')); }
            renderMarkdown(li, item.tokens, depth + 1);
          }
          break;
        }
        case 'table': {
          const wrap = document.createElement('div'); wrap.className = 'y-ai-table-wrap'; wrap.tabIndex = 0;
          wrap.setAttribute('role', 'region'); wrap.setAttribute('aria-label', '回答中的表格，可横向滚动');
          const table = document.createElement('table'); wrap.append(table); parent.append(wrap);
          for (const [section, rows, cellTag] of [['thead', [token.header], 'th'], ['tbody', token.rows, 'td']]) {
            const group = document.createElement(section); table.append(group);
            for (const row of rows) {
              const tr = document.createElement('tr'); group.append(tr);
              row.forEach((cell, index) => {
                const td = append(cellTag, cell, tr);
                if (cellTag === 'th') td.scope = 'col';
                if (['left', 'right', 'center'].includes(token.align[index])) td.style.textAlign = token.align[index];
              });
            }
          }
          break;
        }
        case 'code': {
          const wrap = document.createElement('div'); wrap.className = 'y-ai-code-panel';
          const header = document.createElement('div'); header.className = 'y-ai-code-header';
          const language = document.createElement('span'); language.textContent = (token.lang || '代码').split(/\s+/)[0].slice(0, 32);
          const copy = document.createElement('button'); copy.type = 'button'; copy.textContent = '复制'; copy.setAttribute('aria-label', '复制这段代码');
          const pre = document.createElement('pre'); pre.className = 'y-ai-code-block';
          const code = document.createElement('code'); code.textContent = token.text; pre.append(code);
          copy.addEventListener('click', async () => {
            try { await navigator.clipboard.writeText(code.textContent); copy.textContent = '已复制'; }
            catch { copy.textContent = '请手动选择复制'; }
            setTimeout(() => { copy.textContent = '复制'; }, 2000);
          });
          header.append(language, copy); wrap.append(header, pre); parent.append(wrap); break;
        }
        default: parent.append(document.createTextNode(token.raw || token.text || ''));
      }
    }
  }
  function renderText(parent, text, markdown = true) {
    if (markdown && window.marked?.lexer) {
      const node = document.createElement('div'); node.className = 'y-ai-markdown';
      try { renderMarkdown(node, window.marked.lexer(String(text), { gfm: true, breaks: true })); parent.append(node); return; }
      catch { /* 解析器加载或解析失败时保留可阅读的纯文字。 */ }
    }
    const pieces = String(text).split(/```[^\n]*\n([\s\S]*?)```/g);
    pieces.forEach((part, i) => {
      const node = document.createElement(i % 2 ? 'pre' : 'div');
      node.className = i % 2 ? 'y-ai-code-block' : 'y-ai-answer-text';
      node.textContent = part; parent.append(node);
    });
  }
  function addMessage(item) {
    const message = document.createElement('div'); message.className = 'y-ai-message y-ai-' + item.role;
    const label = document.createElement('span'); label.className = 'y-ai-message-label'; label.textContent = item.role === 'user' ? '你' : '随笔助手';
    const content = document.createElement('div'); content.className = 'y-ai-message-content'; renderText(content, item.content, item.role === 'assistant');
    if (item.selection) {
      const details = document.createElement('details'); details.className = 'y-ai-message-quote';
      const summary = document.createElement('summary'); summary.textContent = '引用' + (item.selection.kind === 'code' ? '代码' : '正文') + ' · ' + item.selection.title;
      const pre = document.createElement('pre'); pre.textContent = item.selection.text;
      details.append(summary, pre); content.prepend(details);
    }
    message.append(label, content);
    if (item.sources?.length) {
      const refs = document.createElement('div'); refs.className = 'y-ai-sources';
      const title = document.createElement('small'); title.textContent = '参考文章'; refs.append(title);
      for (const source of item.sources) {
        let url; try { url = new URL(source.url); } catch { continue; }
        if (url.origin !== 'https://qdy1013.github.io') continue;
        const a = document.createElement('a'); a.href = url.href; a.target = '_blank'; a.rel = 'noopener'; a.textContent = source.title + ' ↗'; refs.append(a);
      }
      message.append(refs);
    }
    $('.y-ai-messages').append(message);
    $('.y-ai-messages').scrollTop = $('.y-ai-messages').scrollHeight;
  }
  function renderConversation() {
    $('.y-ai-messages').replaceChildren();
    if (!visible[mode].length) {
      const welcome = document.createElement('div'); welcome.className = 'y-ai-welcome';
      const heading = document.createElement('h2'); heading.textContent = mode === 'blog' ? '从一个问题，读懂一篇随笔。' : '有什么想聊的？';
      const text = document.createElement('p'); text.textContent = mode === 'blog' ? '选中文章或代码即可问我，点代码左侧的行号能直接选中一行。回答下方会列出参考文章。' : '代码、学习、想法，都可以从这里开始。选中片段也能带来一起聊。';
      welcome.append(heading, text);
      for (const question of mode === 'blog' ? ['RNN 怎样把声音变成文字？', 'WeNet 的两遍识别是什么？'] : ['帮我解释一段 Python 代码', '怎么安排今天的学习？']) {
        const button = document.createElement('button'); button.type = 'button'; button.textContent = question + ' ↗';
        button.addEventListener('click', () => { $('#y-ai-question').value = question; $('#y-ai-question').focus(); }); welcome.append(button);
      }
      $('.y-ai-messages').append(welcome);
    } else for (const item of visible[mode]) addMessage(item);
  }
  function close() {
    panel.hidden = true; backdrop.hidden = true; document.documentElement.classList.remove('y-ai-drawer-open');
    launcher.setAttribute('aria-expanded', 'false'); (returnFocus || launcher).focus();
  }
  async function openPanel() {
    if (panel.hidden) returnFocus = document.activeElement;
    panel.hidden = false; backdrop.hidden = false; document.documentElement.classList.add('y-ai-drawer-open'); syncDrawer();
    launcher.setAttribute('aria-expanded', 'true');
    fitPanel();
    setAuthorized(account || (token ? cachedAccount : null)); renderConversation();
    if (token) {
      // 有上次的账号状态就先显示、后台核对；没有时才等服务端回答。
      const known = Boolean(account);
      if (!known) $('.y-ai-access-label').textContent = '正在检查登录状态…';
      const check = verifyAccount().catch(error => { $('.y-ai-login-error').textContent = error.message; $('.y-ai-waiting-status').textContent = error.message; });
      if (!known) await check;
    }
    (account?.aiAccess === 'approved' ? $('#y-ai-question') : account ? $('.y-ai-refresh-access') : $('#y-ai-username')).focus();
  }
  launcher.addEventListener('click', () => { if (!panel.hidden) close(); else openPanel(); });
  $('.y-ai-close').addEventListener('click', close);
  backdrop.addEventListener('click', close);
  panel.addEventListener('keydown', e => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); } });
  for (const tab of panel.querySelectorAll('[data-auth]')) tab.addEventListener('click', () => setAuthMode(tab.dataset.auth));
  $('.y-ai-unlock').addEventListener('submit', async e => {
    e.preventDefault();
    const button = $('.y-ai-auth-submit'); button.disabled = true;
    for (const tab of panel.querySelectorAll('[data-auth]')) tab.disabled = true;
    $('.y-ai-login-error').textContent = '';
    try {
      if (authMode === 'register' && $('#y-ai-password').value !== $('#y-ai-confirm').value) throw Error('两次密码不一致。');
      const result = await request(authMode === 'register' ? '/api/register' : '/api/session', { username: $('#y-ai-username').value, password: $('#y-ai-password').value });
      if (authMode === 'register') {
        setAuthMode('login'); $('#y-ai-password').value = ''; $('#y-ai-confirm').value = '';
        $('.y-ai-login-error').textContent = result.message; $('#y-ai-password').focus();
      } else {
        if (typeof result.token !== 'string' || !result.account) throw Error('登录未完成，请重试。');
        saveToken(result.token); $('#y-ai-password').value = ''; $('#y-ai-confirm').value = '';
        setAuthorized(result.account); renderConversation();
        (account.aiAccess === 'approved' ? $('#y-ai-question') : $('.y-ai-refresh-access')).focus();
      }
    } catch (error) { $('.y-ai-login-error').textContent = error.message; }
    finally { button.disabled = false; for (const tab of panel.querySelectorAll('[data-auth]')) tab.disabled = false; }
  });
  $('.y-ai-logout').addEventListener('click', () => { resetSession(); setAuthMode('login'); $('#y-ai-username').focus(); });
  $('.y-ai-refresh-access').addEventListener('click', async () => {
    const button = $('.y-ai-refresh-access'); button.disabled = true; $('.y-ai-waiting-status').textContent = '';
    try { await loadAccount(); if (account?.aiAccess !== 'approved') $('.y-ai-waiting-status').textContent = '暂未开通，可以联系博主。'; }
    catch (error) { $('.y-ai-waiting-status').textContent = error.message; }
    finally { button.disabled = false; }
  });
  for (const button of panel.querySelectorAll('.y-ai-back')) button.addEventListener('click', () => setView('chat'));
  $('.y-ai-password-open').addEventListener('click', () => { setView('password'); $('.y-ai-password-status').textContent = ''; $('#y-ai-old-password').focus(); });
  $('.y-ai-password-form').addEventListener('submit', async e => {
    e.preventDefault(); const button = $('.y-ai-password-submit'); button.disabled = true;
    try {
      if ($('#y-ai-new-password').value !== $('#y-ai-new-confirm').value) throw Error('两次新密码不一致。');
      const result = await request('/api/password', { currentPassword: $('#y-ai-old-password').value, password: $('#y-ai-new-password').value });
      resetSession(); setAuthMode('login'); $('.y-ai-login-error').textContent = result.message;
    } catch (error) { $('.y-ai-password-status').textContent = error.message; }
    finally { button.disabled = false; }
  });
  async function loadAccounts() {
    const current = token; $('.y-ai-manage-status').textContent = '正在读取账号…';
    try {
      const result = await request('/api/admin/accounts', { page: accountPage });
      if (current !== token) return;
      const list = $('.y-ai-accounts'); list.replaceChildren();
      for (const person of result.accounts) {
        const row = document.createElement('div'); row.className = 'y-ai-account-row';
        const text = document.createElement('div');
        const name = document.createElement('strong'); name.textContent = person.username;
        const status = document.createElement('span'); status.textContent = person.role === 'admin' ? '管理员 · AI 已开通' : ({ pending: 'AI 待开通', approved: 'AI 已开通', disabled: 'AI 已撤销' }[person.aiAccess] || '未知状态');
        text.append(name, status); row.append(text);
        if (person.role !== 'admin') {
          const action = document.createElement('button'); action.type = 'button';
          action.textContent = person.aiAccess === 'approved' ? '撤销权限' : '开通 AI';
          action.addEventListener('click', async () => {
            action.disabled = true;
            try {
              const changed = await request('/api/admin/status', { id: person.id, status: person.aiAccess === 'approved' ? 'disabled' : 'approved' });
              await loadAccounts(); $('.y-ai-manage-status').textContent = changed.message;
            } catch (error) { $('.y-ai-manage-status').textContent = error.message; action.disabled = false; }
          }); row.append(action);
        }
        list.append(row);
      }
      $('.y-ai-prev').disabled = accountPage === 0; $('.y-ai-next').disabled = !result.hasMore;
      $('.y-ai-page-label').textContent = '第 ' + (accountPage + 1) + ' 页';
      $('.y-ai-manage-status').textContent = '';
    } catch (error) { $('.y-ai-manage-status').textContent = error.message; }
  }
  $('.y-ai-admin-open').addEventListener('click', () => { setView('admin'); accountPage = 0; loadAccounts(); });
  $('.y-ai-refresh-accounts').addEventListener('click', () => loadAccounts());
  $('.y-ai-prev').addEventListener('click', () => { if (accountPage > 0) { accountPage--; loadAccounts(); } });
  $('.y-ai-next').addEventListener('click', () => { accountPage++; loadAccounts(); });
  for (const tab of panel.querySelectorAll('[data-mode]')) tab.addEventListener('click', () => {
    if (busy) return; mode = tab.dataset.mode;
    for (const t of panel.querySelectorAll('[data-mode]')) t.setAttribute('aria-selected', String(t === tab));
    renderQuote();
    $('.y-ai-status').textContent = ''; renderConversation(); $('#y-ai-question').focus();
  });
  $('.y-ai-clear').addEventListener('click', () => { if (!busy) { history[mode] = []; visible[mode] = []; $('.y-ai-status').textContent = ''; renderConversation(); } });
  $('#y-ai-question').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); if (!busy) $('.y-ai-compose').requestSubmit(); } });
  $('.y-ai-compose').addEventListener('submit', async e => {
    e.preventDefault(); const draft = $('#y-ai-question').value.trim();
    const text = draft || (quoted ? quoted.kind === 'code' ? '请解释这段代码的作用和语法。' : '请解释这段内容。' : '');
    if (busy || !text) return;
    const turnEpoch = epoch;
    const selected = quoted;
    const turns = history[mode].slice(-8);
    const item = { role: 'user', content: text, ...(selected ? { selection: { title: selected.title, url: selected.url, kind: selected.kind, text: selected.text } } : {}) };
    const size = message => message.content.length + (message.selection ? message.selection.text.length + message.selection.title.length + message.selection.url.length + 150 : 0);
    while (turns.length && [...turns, item].reduce((n, m) => n + size(m), 0) > 20000) turns.splice(0, 2);
    visible[mode].push(item); renderConversation(); $('#y-ai-question').value = ''; setBusy(true); controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 75000);
    try { const data = await request('/api/chat', { mode, messages: [...turns, item] }, controller.signal);
      if (epoch !== turnEpoch) return;
      const answer = { role: 'assistant', content: data.answer, sources: data.sources };
      history[mode] = [...turns, item, { role: 'assistant', content: data.answer.slice(0, 5000) }]; visible[mode].push(answer); addMessage(answer);
      if (quoted === selected) { quoted = null; renderQuote(); }
    } catch (error) {
      if (epoch !== turnEpoch) {
        if (error.status === 401 && !token && !$('#y-ai-question').value.trim()) $('#y-ai-question').value = draft;
        return;
      }
      visible[mode] = visible[mode].filter(message => message !== item); renderConversation();
      if (!$('#y-ai-question').value.trim()) $('#y-ai-question').value = draft;
      $('.y-ai-status').textContent = error.name === 'AbortError' ? '等待已结束，问题与引用已保留，可以重试。' : error.message;
    }
    finally { clearTimeout(timer); if (epoch === turnEpoch) { const status = $('.y-ai-status').textContent; setBusy(false); $('.y-ai-status').textContent = status.startsWith('正在') ? '' : status; } }
  });
  // 页面空闲时先连上问答服务；已登录的读者顺便在后台确认账号，点开窗口时通常已经确认完了。
  function warmUp() {
    config().then(() => {
      const link = document.createElement('link');
      link.rel = 'preconnect'; link.href = endpoint; link.crossOrigin = 'anonymous'; document.head.append(link);
      return verifyAccount();
    }).catch(() => {});
  }
  if ('requestIdleCallback' in window) requestIdleCallback(warmUp, { timeout: 3000 }); else setTimeout(warmUp, 1500);
})();
