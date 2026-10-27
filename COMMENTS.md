# 点赞与评论维护

评论使用 Utterances，登录 GitHub 后可以在文章底部发表评论。点赞按钮会打开该文章对应的 GitHub Issue，读者对主题添加 👍 后，回到博客会自动同步数量。数据保存在 GitHub，不向网页写入访问令牌。

`custom/post-interactions.js` 保存交互代码、样式和文章与 Issue 的固定对应关系。`scripts/post-interactions.js` 在 Hexo 生成结束后覆盖主题的 `js/third-party/comments/utterances.js`，因此无需直接修改主题。执行 `npm run build` 即可生成。

已有八篇文章对应 Issues #4–#11。新文章可以由 Utterances 在第一次评论时创建 Issue，脚本会尝试按文章路径查找；要从发布时就显示点赞入口，请先创建包含文章完整链接的 Issue，再将文章路径和 Issue 编号加入 `threads`。文章改名或迁移路径时，也应将新路径指向原 Issue，以保留互动数据。

评论可在 GitHub 对应 Issue 中编辑、删除或锁定。API 限流或评论服务不可用时，页面提供重试和 GitHub 直达入口，不会将失败显示为零条评论或零个赞。
