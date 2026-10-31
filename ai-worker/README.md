# 博客私享 AI 问答的接入与管理

博客窗口支持站内文章问答与自由聊天，模型由 DeepSeek 提供。只有博主私下发放邀请码的人才能使用。每个人一个邀请码，可以单独撤销；邀请码可以转交，因此它不是实名身份验证。当前生产配置默认关闭，完成下列步骤后再开放。

## 第一步 注册 Cloudflare

打开 https://dash.cloudflare.com/sign-up 注册并验证邮箱，然后登录。不需要迁移博客域名；博客继续留在 GitHub Pages，Cloudflare Worker 只承载授权和 AI 接口。

## 第二步 登录部署工具

在此目录打开终端，运行：

```powershell
npx wrangler login
npx wrangler deploy
```

第一次命令会通过浏览器让你登录并授权。请由账号本人操作。第二条上传接口并显示一个 HTTPS 的 workers.dev 地址。此时没有配置密钥，接口会保持关闭。

## 第三步 配置两个密钥

在 DeepSeek 开放平台 https://platform.deepseek.com 创建 API Key。这里需要 API Key，网页登录账号本身不能代替。API 使用情况与费用由你的 DeepSeek 账户承担。

```powershell
npx wrangler secret put DEEPSEEK_API_KEY
node access.mjs session-secret
npx wrangler secret put SESSION_SECRET
```

第一条命令提示时粘贴 DeepSeek API Key。第三条提示时粘贴本地 `.private/session-secret.txt` 的内容。密钥输入终端的交互提示或 Cloudflare 的 Secret 设置，不写入网页、GitHub、聊天消息或明文配置。

也可以在 Cloudflare 的 Workers & Pages 中找到该 Worker，进入 Settings 的 Variables and Secrets，以 Secret 类型设置这两个名字。不要使用明文变量类型。

## 第四步 批准一个人使用

```powershell
node access.mjs add friend1
node access.mjs upload
```

第一条生成一个独立邀请码，放在 `.private/friend1.txt`。把里面的码私下发给你同意的人。第二条将仅含哈希和标识的授权名单上传为 `ACCESS_CODES` Secret。每次添加或撤销后都要上传名单。

为自己创建一个独立的 `owner` 邀请码也使用相同步骤。这里没有对外开放“自助注册”接口；访客必须联系你获得许可。

## 第五步 把接口地址接进博客

```powershell
node configure-site.mjs https://你的Worker名称.你的账号.workers.dev
```

这个命令只更新 `custom/ai-config.json` 的公开地址及启用状态，不包含任何密钥。之后生成并发布 Hexo 博客。服务端通过构建产物 `/ai-index.json` 检索公开文章，所以博客索引也需要随窗口一起发布。

打开博客右下角“问一问”，输入你给自己的邀请码。分别检查博客问答和自由聊天；再用没有授权的浏览器检查无法直接调用聊天接口。真实模型调用必须在完成账号、密钥和线上索引配置后验证。

## 撤销与更换权限

```powershell
node access.mjs revoke friend1
node access.mjs upload
```

上传后，新请求会重新核对当前名单。该邀请码与此前签发的会话都会被拒绝，其他人的权限不受影响；已经开始的请求不会被追溯取消。Cloudflare 配置传播完成后生效。更换泄露的邀请码时先撤销再创建同名记录，并把新码私下发给本人。

窗口在当前浏览器标签页的 sessionStorage 保留临时会话，不保存邀请码或 DeepSeek 密钥；对话记录仅保留在页面内存，刷新后清除。会话有效期八小时，退出会清理会话及页面对话。

## 实现与边界

- 会话使用服务端 HMAC 签名；每次聊天重新验证当前授权名单。只在前端隐藏按钮不构成授权，本实现的拒绝发生在服务端。
- 站内问答由服务端读取博客生成的索引，按关键词检索文章片段；引用链接只来自同一博客域名。它不是全网搜索，也不是向量语义检索。
- 回答和问题由文本节点渲染，代码块可以显示；不执行模型输出的 HTML。
- 请求长度、对话角色、调用频率和输出长度受限；频率限制使用 Cloudflare 原生绑定，按地区近似计数，不是严格的每日消费封顶。需要额外预算控制时在 DeepSeek 账户侧管理余额和用量。
- 博客模式和自由聊天会把对应对话发送给 DeepSeek。站内问答还会发送检索到的公开文章节选。不在模型提示中放 API Key、邀请码和会话密钥。
- 当前只提供博主通过本地命令维护名单的方式，没有网页管理后台。

## 本地检查

```powershell
npm test
```

这些检查使用模拟的模型接口，不会调用真实 DeepSeek 或产生模型费用。上线前还需使用自己的账号完成真实联调。

参考：

- DeepSeek 接口：https://api-docs.deepseek.com/
- Cloudflare 上手：https://developers.cloudflare.com/workers/get-started/guide/
- Cloudflare 密钥：https://developers.cloudflare.com/workers/configuration/secrets/
- Cloudflare 频率限制：https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/
