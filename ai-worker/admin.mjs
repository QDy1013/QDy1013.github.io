// 管理员初始化：密码仅从标准输入进入内存，不写入文件、参数或日志。
import { readFile, writeFile, mkdir, unlink } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';
import { credentials, passwordHash } from './src/accounts.mjs';
const directory = fileURLToPath(new URL('.', import.meta.url));
const quote = value => "'" + String(value).replaceAll("'", "''") + "'";
let sqlFile;
try {
  if (process.stdin.isTTY) process.stdin.setRawMode(true);
  const lines = createInterface({ input: process.stdin, terminal: false });
  let input = await new Promise(resolve => lines.once('line', resolve));
  lines.close(); process.stdin.pause();
  if (process.stdin.isTTY) process.stdin.setRawMode(false);
  if (input.length > 2000) throw Error('输入过长。');
  const { username, password } = credentials(JSON.parse(input));
  input = '';
  const secret = (await readFile(new URL('.private/session-secret.txt', import.meta.url), 'utf8')).trim();
  if (secret.length < 32) throw Error('找不到本地服务密钥，请在原配置目录运行。');
  const stored = await passwordHash(password, secret);
  await mkdir(new URL('.private/', import.meta.url), { recursive: true });
  sqlFile = '.private/admin-setup-' + crypto.randomUUID() + '.sql';
  const timestamp = Date.now();
  const sql = process.argv[2] === 'reset-password'
    ? `UPDATE accounts SET password_hash = ${quote(stored.hash)}, password_salt = ${quote(stored.salt)}, session_version = session_version + 1, updated_at = ${timestamp}
      WHERE username = ${quote(username)} COLLATE NOCASE AND role = 'admin' RETURNING username;`
    : `INSERT INTO accounts (id, username, password_hash, password_salt, role, status, session_version, created_at, updated_at)
    SELECT ${quote(crypto.randomUUID())}, ${quote(username)}, ${quote(stored.hash)}, ${quote(stored.salt)}, 'admin', 'approved', 1, ${timestamp}, ${timestamp}
    WHERE NOT EXISTS (SELECT 1 FROM accounts WHERE role = 'admin') RETURNING username;`;
  await writeFile(new URL(sqlFile, import.meta.url), sql + `\nSELECT username FROM accounts WHERE username = ${quote(username)} COLLATE NOCASE AND role = 'admin' AND password_hash = ${quote(stored.hash)};`, { mode: 0o600 });
  // 命令文本不含用户输入；SQL 临时文件仅含加盐哈希，执行后删除。
  const command = `npx --yes wrangler@4 d1 execute qdy-blog-ai-accounts --remote --file ${sqlFile} --json`;
  const child = spawn('cmd.exe', ['/d', '/s', '/c', command], { cwd: directory, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  let output = '';
  child.stdout.on('data', chunk => { output += chunk; });
  child.stderr.on('data', () => {});
  const code = await new Promise((resolve, reject) => { child.once('error', reject); child.once('exit', resolve); });
  if (code !== 0) throw Error('创建未完成。请检查 Cloudflare 登录状态或更换用户名。');
  const jsonStart = output.search(/\[\s*\{\s*"results"/);
  if (jsonStart < 0) throw Error('无法读取创建结果，请检查账号状态后再试。');
  const result = JSON.parse(output.slice(jsonStart));
  if (!result.some(item => item.results?.some(row => typeof row.username === 'string' && row.username.toLowerCase() === username.toLowerCase()))) throw Error('管理员已存在或账号不匹配，请检查管理账号。');
  process.stdout.write(JSON.stringify({ ok: true, username }));
} catch (error) {
  process.stdout.write(JSON.stringify({ ok: false, error: error.message?.startsWith('ENOENT') ? '请在原配置目录运行，或联系维护者恢复管理权限。' : error.message }));
  process.exitCode = 1;
} finally { if (sqlFile) await unlink(new URL(sqlFile, import.meta.url)).catch(() => {}); }
