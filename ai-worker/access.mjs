// 仅在博主自己的电脑运行。真实邀请码写入 .private，永远不要提交该目录。
import { randomBytes, createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = dirname(fileURLToPath(import.meta.url));
const privateDir = join(root, '.private');
await mkdir(privateDir, { recursive: true });
const file = join(privateDir, 'access-codes.json');
let list;
try { list = JSON.parse(await readFile(file, 'utf8')); } catch (error) { if (error.code !== 'ENOENT') throw error; list = []; }
const [action, id] = process.argv.slice(2);
if (action === 'add') {
  if (!/^[\w-]{1,64}$/.test(id || '')) throw Error('名称只能使用英文字母、数字、横线和下划线。');
  if (list.some(x => x.id === id)) throw Error('名称已存在；请先撤销，或使用另一个名称。');
  const code = randomBytes(32).toString('base64url');
  list.push({ id, hash: createHash('sha256').update(code).digest('hex'), enabled: true });
  await writeFile(file, JSON.stringify(list, null, 2), { mode: 0o600 });
  await writeFile(join(privateDir, id + '.txt'), code + '\n', { mode: 0o600 });
  console.log('已创建。将 .private/' + id + '.txt 内的邀请码私下发给获准的人；再运行 node access.mjs upload 更新服务端。');
} else if (action === 'revoke') {
  if (!list.some(x => x.id === id)) throw Error('没有找到这个名称。');
  list = list.filter(x => x.id !== id);
  await writeFile(file, JSON.stringify(list, null, 2), { mode: 0o600 });
  console.log('本地名单已撤销。运行 node access.mjs upload 后生效，已开始的请求不会被追溯取消。');
} else if (action === 'upload') {
  const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const result = spawnSync(command, ['wrangler', 'secret', 'put', 'ACCESS_CODES'], {
    cwd: root, input: JSON.stringify(list), stdio: ['pipe', 'inherit', 'inherit'], shell: process.platform === 'win32'
  });
  process.exit(result.status ?? 1);
} else if (action === 'session-secret') {
  const destination = join(privateDir, 'session-secret.txt');
  try { await writeFile(destination, randomBytes(48).toString('base64url'), { mode: 0o600, flag: 'wx' }); }
  catch (error) { if (error.code !== 'EEXIST') throw error; }
  console.log('会话签名密钥保存在 .private/session-secret.txt；配置为 Worker 的 SESSION_SECRET。');
} else {
  console.log('node access.mjs add friend1\nnode access.mjs revoke friend1\nnode access.mjs upload\nnode access.mjs session-secret');
}
