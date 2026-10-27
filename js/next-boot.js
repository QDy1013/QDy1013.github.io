/* global NexT, CONFIG */

NexT.boot = {};

NexT.boot.registerEvents = function() {

  // Support the theme's existing button-like controls with a keyboard.
  document.addEventListener('keydown', event => {
    const control = event.target.closest('[role="button"]');
    if (control && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      control.click();
    }
  });

  NexT.utils.registerScrollPercent();
  NexT.utils.registerCanIUseTag();
  NexT.utils.updateFooterPosition();

  // Mobile top menu bar.
  document.querySelector('.site-nav-toggle .toggle').addEventListener('click', event => {
    event.currentTarget.classList.toggle('toggle-close');
    const siteNav = document.querySelector('.site-nav');
    if (!siteNav) return;
    siteNav.style.setProperty('--scroll-height', siteNav.scrollHeight + 'px');
    document.body.classList.toggle('site-nav-on');
    event.currentTarget.setAttribute('aria-expanded', document.body.classList.contains('site-nav-on'));
  });

  document.querySelectorAll('.sidebar-nav li').forEach((element, index) => {
    element.addEventListener('click', () => {
      NexT.utils.activateSidebarPanel(index);
    });
  });

  window.addEventListener('hashchange', () => {
    const tHash = location.hash;
    if (tHash !== '' && !tHash.match(/%\S{2}/)) {
      const target = document.querySelector(`.tabs ul.nav-tabs li a[href="${tHash}"]`);
      target?.click();
    }
  });

  window.addEventListener('tabs:click', e => {
    NexT.utils.registerCodeblock(e.target);
  });
};

NexT.boot.refresh = function() {

  /**
   * Register JS handlers by condition option.
   * Need to add config option in Front-End at 'scripts/helpers/next-config.js' file.
   */
  CONFIG.prism && window.Prism.highlightAll();
  CONFIG.mediumzoom && typeof window.mediumZoom === 'function' && window.mediumZoom('.post-body :not(a) > img, .post-body > img', {
    background: 'var(--content-bg-color)'
  });
  CONFIG.lazyload && window.lozad('.post-body img').observe();
  if (CONFIG.pangu) {
    // Polyfill for requestIdleCallback if not supported
    if (!window.requestIdleCallback) {
      window.requestIdleCallback = function(cb) {
        cb({
          didTimeout   : false,
          timeRemaining: () => 100
        });
      };
    }
    [...document.getElementsByTagName('main')].forEach(e => window.pangu.spacingNode(e));
  }

  CONFIG.exturl && NexT.utils.registerExtURL();
  NexT.utils.wrapTableWithBox();
  NexT.utils.registerCodeblock();
  NexT.utils.registerTabsTag();
  NexT.utils.registerActiveMenuItem();
  NexT.utils.registerLangSelect();
  NexT.utils.registerSidebarTOC();
  NexT.utils.registerPostReward();
  NexT.utils.registerVideoIframe();
};

NexT.boot.motion = function() {
  if (typeof window.anime?.timeline !== 'function' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.body.classList.remove('use-motion');
    NexT.utils.updateSidebarPosition();
    return;
  }
  // Define Motion Sequence & Bootstrap Motion.
  if (CONFIG.motion.enable) {
    NexT.motion.integrator
      .add(NexT.motion.middleWares.header)
      .add(NexT.motion.middleWares.sidebar)
      .add(NexT.motion.middleWares.postList)
      .add(NexT.motion.middleWares.footer)
      .bootstrap();
  }
  NexT.utils.updateSidebarPosition();
};

document.addEventListener('DOMContentLoaded', () => {
  NexT.boot.registerEvents();
  NexT.boot.refresh();
  NexT.boot.motion();
});


/* y-reading-tools-loader */
(() => {
  const load = () => {
    if (document.getElementById('y-reading-tools-script')) return;
    const style = document.createElement('link');
    style.rel = 'stylesheet';
    style.href = '/css/reading-tools.css?v=20261027r1';
    const script = document.createElement('script');
    script.id = 'y-reading-tools-script';
    script.src = '/js/reading-tools.js?v=20261027r1';
    style.addEventListener('load', () => document.body.append(script), { once: true });
    document.head.append(style);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', load, { once: true });
  else load();
})();
