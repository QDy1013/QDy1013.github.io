'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { stripHTML, unescapeHTML } = require('hexo-util');

hexo.extend.filter.register('after_generate', async function () {
  const root = this.base_dir;
  const config = JSON.parse(fs.readFileSync(path.join(root, 'custom/ai-config.json'), 'utf8'));
  const documents = this.locals.get('posts').toArray().filter(post => post.published !== false).map(post => {
    // 公开文章按段落切片；内容取自构建结果，不接受浏览器提供的所谓“文章”。
    const text = unescapeHTML(stripHTML(post.content.replace(/<\/(?:p|div|h[1-6]|li|pre)>/g, '\n')))
      .replace(/\r/g, '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
    const chunks = [];
    for (let offset = 0; offset < text.length && chunks.length < 200; offset += 1000) chunks.push(text.slice(offset, offset + 1150));
    return { title: post.title, url: new URL(post.path, this.config.url).href, chunks };
  });
  this.route.set('ai-index.json', JSON.stringify({ version: 1, documents }));
  this.route.set('ai-config.json', JSON.stringify({ enabled: config.enabled === true, endpoint: config.endpoint || '' }));
  for (const name of ['blog-ai.js', 'blog-ai.css']) this.route.set('js/private-ai/' + name, fs.readFileSync(path.join(root, 'custom', name)));
  this.route.set('js/private-ai/marked.min.js', fs.readFileSync(path.join(root, 'custom/vendor/marked.min.js')));
  this.route.set('js/private-ai/marked.LICENSE.txt', fs.readFileSync(path.join(root, 'custom/vendor/marked.LICENSE.md')));
  for (const name of this.route.list().filter(name => name.endsWith('.html'))) {
    const chunks = [];
    for await (const chunk of this.route.get(name)) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    let html = Buffer.concat(chunks).toString('utf8');
    if (html.includes('data-private-ai-assets')) {
      html = html.replace(/\/js\/private-ai\/blog-ai\.(css|js)(?:\?[^"']*)?/g, '/js/private-ai/blog-ai.$1?v=touch2-20261031');
      html = html.replace(/<script\b[^>]*src="\/js\/private-ai\/marked\.min\.js[^"\s]*"[^>]*><\/script>\s*/g, '');
      html = html.replace('<script src="/js/private-ai/blog-ai.js', '<script src="/js/private-ai/marked.min.js?v=touch2-20261031" defer></script>\n<script src="/js/private-ai/blog-ai.js');
    } else {
      html = html.replace('</head>', '<link data-private-ai-assets rel="stylesheet" href="/js/private-ai/blog-ai.css?v=touch2-20261031">\n</head>')
        .replace('</body>', '<script src="/js/private-ai/marked.min.js?v=touch2-20261031" defer></script>\n<script src="/js/private-ai/blog-ai.js?v=touch2-20261031" defer></script>\n</body>');
    }
    this.route.set(name, html);
  }
});
