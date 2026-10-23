/* global NexT, CONFIG */

document.addEventListener('page:loaded', () => {
  if (!CONFIG.enableMath) return;

  if (typeof window.renderMathInElement === 'function') {
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
  }

  if (CONFIG.katex && CONFIG.katex.copy_tex_js) {
    NexT.utils.getScript(CONFIG.katex.copy_tex_js).catch(() => {});
  }
});
