# 博客 AI 账号与权限管理

网站：https://qdy1013.github.io/
接口：https://qdy-private-blog-ai.qdy-private-blog-ai.workers.dev

## 使用规则

1. 任何访客都可以注册。注册成功后即可登录，无需审批账号。
2. 新账号默认没有 AI 权限。登录后显示等待博主开通，不能通过直接调用接口绕过。
3. 管理员在窗口上方点击「AI 权限」，给指定账号「开通 AI」或「撤销权限」。
4. 开通后用户点击「刷新权限状态」即可开始提问。撤销后，已登录用户的后续 AI 请求也会立即被拦截，账号仍然能够登录和修改密码。
5. 管理员是 QDy，Q、D 大写，y 小写。用户名保留显示大小写，登录和去重时忽略大小写。密码不记录在本文或源码中。
6. 登录会话保存在当前标签页的 sessionStorage，8 小时有效；过期或关闭标签页后重新登录。可以使用浏览器的密码保存功能。

## 管理员操作

打开博客 → 点击右下角「问一问」→ 用户名和密码登录 → 点击上方「AI 权限」。
账号列表中，待开通与已撤销的账号可以「开通 AI」，已开通的账号可以「撤销权限」。列表每页 50 条，支持翻页。
「改密码」需要验证当前密码；修改成功后，所有旧登录会话失效。管理员账号不能通过页面给自己撤销权限。
密码忘记时由博主在原维护电脑运行 admin.mjs 的 reset-password 模式恢复；没有提供公开的无验证重置接口。

## 数据与密钥

账号保存在 Cloudflare D1 的 qdy-blog-ai-accounts 数据库。数据库仅保存随机盐与密码哈希，密码先经过服务端 pepper，再用 PBKDF2-SHA256（100000 次）派生。
D1 accounts.status 表示 AI 权限：pending 待开通、approved 已开通、disabled 已撤销；这些状态均不阻止正确密码登录。
role 只由服务端决定。公开注册接口只能创建普通账号，管理员由本地工具初始化。
SESSION_SECRET 和 DEEPSEEK_API_KEY 保存在 Worker Secrets，浏览器和 GitHub 不包含它们。SESSION_SECRET 同时用于密码 pepper，因此应妥善保留，不要随意更换；更换会导致现有密码无法验证。
.private、.wrangler、.env 等目录均禁止提交。不要把本地密码、会话令牌、签名密钥放到桌面说明文档或公开仓库。
旧版邀请码已经停用，ACCESS_CODES 即使仍保留在 Cloudflare 也不再参与校验。

## 维护与部署

当前已有部署不需要重复配置 API 密钥。日常修改后：

```powershell
node --test test/worker.test.mjs
npx wrangler d1 migrations apply qdy-blog-ai-accounts --remote
npx wrangler deploy
```

首次部署到其他 Cloudflare 账号时，先创建 D1 数据库，在 wrangler.jsonc 中替换 database_id，然后应用迁移。
使用 wrangler secret put 分别配置 DEEPSEEK_API_KEY 与至少 32 字符的 SESSION_SECRET。不要把值写进命令参数或源码。
管理员初始化工具 setup-admin.ps1 弹出本地输入窗口；admin.mjs 从标准输入读取密码，临时 SQL 文件仅包含加盐哈希，执行后删除。它只允许初始化唯一管理员，不会把公开注册用户提升为管理员。
原维护目录保留本地 session-secret.txt 供维护工具使用；复制到其他目录的公开代码不含该密钥，不能直接用于恢复管理员。

## 接口与验证

POST /api/register：注册，忽略客户端传来的 role、status。
POST /api/session：用户名密码登录，包括未获 AI 权限的账号。
POST /api/me：读取当前登录与 AI 权限。
POST /api/password：验证旧密码后修改密码。
POST /api/admin/accounts：管理员分页查看账号，无密码字段。
POST /api/admin/status：管理员开通或撤销普通账号的 AI 权限。
POST /api/chat：先验证会话和数据库中的 AI 权限，再调用 DeepSeek。

接口只接受博客来源的 JSON 请求，有请求体大小与登录、注册、聊天限流。博客问答从服务端读取公开文章索引，自由聊天不读取索引。
测试使用真正的 SQLite 执行生产 SQL，覆盖注册越权、大小写去重、开通撤销、密码修改、旧会话失效、分页和调用边界。浏览器另验证两种聊天方式、参考文章、手机布局及危险 HTML 作为文字显示。
