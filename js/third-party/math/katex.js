/* global NexT, CONFIG */

// 只在正文里出现公式分隔符时才加载 KaTeX，没有公式的页面（首页、关于、归档等）一个字节都不下载
const hasMath = () => {
  const root = document.querySelector('.main-inner');
  if (!root) return false;
  // 跳过代码块和行内代码里的 $，避免误判
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: node => (node.parentElement.closest('pre, code, script, style, textarea')
      ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT)
  });
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (/\$[^$\s][^$]*\$|\\\(|\\\[/.test(node.nodeValue)) return true;
  }
  return false;
};

const loadStyle = (href, integrity) => {
  if (document.querySelector(`link[href="${href}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  if (integrity) {
    link.integrity = integrity;
    link.crossOrigin = 'anonymous';
  }
  document.head.append(link);
};

document.addEventListener('page:loaded', () => {
  if (!CONFIG.enableMath || !CONFIG.katex || !hasMath()) return;

  loadStyle(CONFIG.katex.css, CONFIG.katex.css_integrity);
  NexT.utils.getScript(CONFIG.katex.js)
    .then(() => NexT.utils.getScript(CONFIG.katex.auto_render_js))
    .then(() => {
      window.renderMathInElement(document.body, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false },
          { left: '\\(', right: '\\)', display: false },
          { left: '\\[', right: '\\]', display: true }
        ],
        ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code'],
        throwOnError: false
      });
      if (CONFIG.katex.copy_tex_js) NexT.utils.getScript(CONFIG.katex.copy_tex_js).catch(() => {});
    })
    .catch(() => {});
});
