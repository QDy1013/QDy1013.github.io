import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const endpoint = new URL(process.argv[2] || '');
if (endpoint.protocol !== 'https:' || endpoint.pathname !== '/' || endpoint.search || endpoint.hash || endpoint.username || endpoint.password)
  throw Error('请提供 https://名称.账号.workers.dev 这样的接口根地址。');
const file = fileURLToPath(new URL('../custom/ai-config.json', import.meta.url));
await writeFile(file, JSON.stringify({ enabled: true, endpoint: endpoint.origin }, null, 2) + '\n');
console.log('已写入接口地址。重新生成并发布 Hexo 博客后，窗口才能连接新接口。');
