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
    <header class="y-ai-header"><div class="y-ai-symbol">${icon}</div><div class="y-ai-heading"><strong>随笔之间</strong><span>读文章，也聊聊你的问题</span></div><button class="y-ai-close" aria-label="关闭问答窗口" type="button">×</button></header>
    <div class="y-ai-access"><span class="y-ai-dot"></span><span class="y-ai-access-label">邀请访问</span><button class="y-ai-logout" type="button" hidden>退出</button></div>
    <form class="y-ai-unlock"><div class="y-ai-lock-mark">✧</div><h2>留给获邀朋友的问答角落</h2><p>博客问答与自由聊天，<br>凭博主提供的邀请码开启。</p><label for="y-ai-code">邀请码</label><div class="y-ai-code-row"><input id="y-ai-code" type="password" autocomplete="off" spellcheck="false" placeholder="粘贴你的专属邀请码" maxlength="128" required><button type="submit">开启</button></div><p class="y-ai-unlock-note">还没有邀请码？可以先联系博主。</p><div class="y-ai-login-error" role="status"></div></form>
    <div class="y-ai-chat" hidden><div class="y-ai-tabs" role="tablist" aria-label="选择问答方式"><button type="button" role="tab" aria-selected="true" data-mode="blog">博客问答</button><button type="button" role="tab" aria-selected="false" data-mode="general">自由聊天</button></div><div class="y-ai-messages" role="log" aria-label="对话内容" aria-live="polite" aria-relevant="additions"></div><div class="y-ai-status" role="status"></div><form class="y-ai-compose"><label class="y-ai-sr" for="y-ai-question">输入问题</label><textarea id="y-ai-question" rows="2" maxlength="4000" placeholder="想读懂哪篇文章？" required></textarea><div class="y-ai-compose-bottom"><button class="y-ai-clear" type="button">清空对话</button><span>Enter 发送 · Shift+Enter 换行</span><button class="y-ai-send" type="submit" aria-label="发送问题">↑</button></div></form><p class="y-ai-footnote">问题将发送给 DeepSeek，回答请结合原文判断。</p></div>`;
  document.body.append(launcher, panel);
  const $ = selector => panel.querySelector(selector);
  const history = { blog: [], general: [] };
  const visible = { blog: [], general: [] };
  let mode = 'blog', token = '', busy = false, endpoint = '', configPromise, controller, returnFocus;
  try { token = sessionStorage.getItem('y-private-ai-session') || ''; } catch {}
  function saveToken(value) { token = value; try { value ? sessionStorage.setItem('y-private-ai-session', value) : sessionStorage.removeItem('y-private-ai-session'); } catch {} }
  function setAuthorized(value) {
    $('.y-ai-unlock').hidden = value; $('.y-ai-chat').hidden = !value; $('.y-ai-logout').hidden = !value;
    $('.y-ai-access-label').textContent = value ? '已授权 · 私享问答' : '邀请访问';
    panel.classList.toggle('y-ai-authorized', value);
  }
  function setBusy(value) {
    busy = value; $('.y-ai-send').disabled = value; $('.y-ai-clear').disabled = value;
    for (const tab of panel.querySelectorAll('[data-mode]')) tab.disabled = value;
    $('.y-ai-status').textContent = value ? (mode === 'blog' ? '正在读相关的文章…' : '正在想你的问题…') : '';
  }
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
    }, body: JSON.stringify(body), signal, credentials: 'omit' });
    let data; try { data = await response.json(); } catch { throw Error('没有收到完整回答，请重试。'); }
    if (!response.ok) {
      if (response.status === 401 && path === '/api/chat') {
        saveToken(''); setAuthorized(false); $('.y-ai-login-error').textContent = data.error || '授权已失效，请联系博主。';
      }
      throw Error(data.error || '暂时无法回答，请稍后重试。');
    }
    return data;
  }
  function renderText(parent, text) {
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
    const content = document.createElement('div'); content.className = 'y-ai-message-content'; renderText(content, item.content);
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
      const text = document.createElement('p'); text.textContent = mode === 'blog' ? '我会从博客里找相关内容，把参考文章放在回答下面。' : '代码、学习、想法，都可以从这里开始。';
      welcome.append(heading, text);
      for (const question of mode === 'blog' ? ['RNN 怎样把声音变成文字？', 'WeNet 的两遍识别是什么？'] : ['帮我解释一段 Python 代码', '怎么安排今天的学习？']) {
        const button = document.createElement('button'); button.type = 'button'; button.textContent = question + ' ↗';
        button.addEventListener('click', () => { $('#y-ai-question').value = question; $('#y-ai-question').focus(); }); welcome.append(button);
      }
      $('.y-ai-messages').append(welcome);
    } else for (const item of visible[mode]) addMessage(item);
  }
  function close() { panel.hidden = true; launcher.setAttribute('aria-expanded', 'false'); (returnFocus || launcher).focus(); }
  launcher.addEventListener('click', () => {
    if (!panel.hidden) return close();
    returnFocus = document.activeElement; panel.hidden = false; launcher.setAttribute('aria-expanded', 'true');
    setAuthorized(Boolean(token)); renderConversation(); (token ? $('#y-ai-question') : $('#y-ai-code')).focus();
  });
  $('.y-ai-close').addEventListener('click', close);
  panel.addEventListener('keydown', e => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); } });
  $('.y-ai-unlock').addEventListener('submit', async e => {
    e.preventDefault(); const button = $('.y-ai-unlock button'); button.disabled = true; $('.y-ai-login-error').textContent = '';
    try { const result = await request('/api/session', { code: $('#y-ai-code').value.trim() });
      if (typeof result.token !== 'string') throw Error('授权未完成，请重试。');
      saveToken(result.token); $('#y-ai-code').value = ''; setAuthorized(true); renderConversation(); $('#y-ai-question').focus();
    } catch (error) { $('.y-ai-login-error').textContent = error.message; }
    finally { button.disabled = false; }
  });
  $('.y-ai-logout').addEventListener('click', () => { controller?.abort(); saveToken('');
    for (const name of ['blog', 'general']) { history[name] = []; visible[name] = []; }
    setAuthorized(false); setBusy(false); $('#y-ai-code').focus();
  });
  for (const tab of panel.querySelectorAll('[data-mode]')) tab.addEventListener('click', () => {
    if (busy) return; mode = tab.dataset.mode;
    for (const t of panel.querySelectorAll('[data-mode]')) t.setAttribute('aria-selected', String(t === tab));
    $('#y-ai-question').placeholder = mode === 'blog' ? '想读懂哪篇文章？' : '输入你的问题…';
    $('.y-ai-status').textContent = ''; renderConversation(); $('#y-ai-question').focus();
  });
  $('.y-ai-clear').addEventListener('click', () => { if (!busy) { history[mode] = []; visible[mode] = []; $('.y-ai-status').textContent = ''; renderConversation(); } });
  $('#y-ai-question').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); if (!busy) $('.y-ai-compose').requestSubmit(); } });
  $('.y-ai-compose').addEventListener('submit', async e => {
    e.preventDefault(); const text = $('#y-ai-question').value.trim(); if (busy || !text) return;
    const turns = history[mode].slice(-8);
    while (turns.length && turns.reduce((n, m) => n + m.content.length, 0) > 10000) turns.splice(0, 2);
    const item = { role: 'user', content: text };
    visible[mode].push(item); renderConversation(); $('#y-ai-question').value = ''; setBusy(true); controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 75000);
    try { const data = await request('/api/chat', { mode, messages: [...turns, item] }, controller.signal);
      const answer = { role: 'assistant', content: data.answer, sources: data.sources };
      history[mode] = [...turns, item, { role: 'assistant', content: data.answer.slice(0, 5000) }]; visible[mode].push(answer); addMessage(answer);
    } catch (error) { $('.y-ai-status').textContent = error.name === 'AbortError' ? '等待已结束，可以重新提问。' : error.message; }
    finally { clearTimeout(timer); const status = $('.y-ai-status').textContent; setBusy(false); $('.y-ai-status').textContent = status.startsWith('正在') ? '' : status; }
  });
})();
