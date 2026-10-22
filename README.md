# 奇点Y的随笔

博客地址：<https://qdy1013.github.io/>。

这里是 **Hexo 8 / NexT 8.25 Mist 的静态发布仓库**。文章是生成后的 HTML，仓库目前没有 Hexo 的 `_config.yml`、主题源文件或 Markdown 文章源文件，也没有需要安装的项目依赖。网站是公开的静态博客，没有用户登录服务。

## 本地预览

在仓库根目录执行 `python -m http.server 8000`，然后访问 <http://localhost:8000/>。不要直接双击 HTML；页面使用以 `/` 开头的资源地址，搜索也需要通过 HTTP 获取 `search.json`。

## 本次完善

- 首页增加主题入口，两篇旧文章使用摘要，正文保留在各自文章页。
- 所有页面补充归档入口、跳到正文链接，以及搜索和导航的键盘操作。
- 站内搜索直接读取 `search.json`，支持多关键词、标题优先排序、加载提示、失败重试、Esc 关闭及焦点恢复；不再依赖搜索组件的 CDN 脚本。
- 修复窄屏算法目录卡片的最小宽度，支持减少动态效果的系统设置。
- 动画、缩放和灯箱的外部脚本不可用时，正文和正常链接仍可使用。
- 标准网址与站内分享网址统一使用 HTTPS，补充静态 `404.html`。

## 继续维护

日常写作应在原来的 Hexo 源项目进行。再次执行 `hexo deploy` 可能覆盖这个仓库里的直接修改，甚至删除新增文件。请先把改动迁回源项目，再恢复原来的发布流程：

1. 将 Hexo `_config.yml` 中的 `url` 设置为 `https://qdy1013.github.io`，同步站点描述。
2. 在主题配置的菜单里添加 `archives: /archives/`。为旧文章添加摘要或 `<!-- more -->`。
3. 将首页简介、可访问性标记和 404 页面迁入源模板或 NexT 自定义注入；将 CSS 调整迁入自定义样式。
4. 保留这次的 `js/third-party/search/local-search.js`；停用原先从 CDN 加载的 `hexo-generator-searchdb/search.js`，继续生成同样结构的 `search.json`。
5. 将 `js/next-boot.js`、`js/utils.js` 和 `js/third-party/fancybox.js` 的容错与键盘改动同步到主题源文件。

这些直接修改提供了可审查的发布产物。迁回源项目之前，应保留当前 PR 和提交，方便重新应用；请勿把发布仓库当作完整的 Hexo 源项目。
