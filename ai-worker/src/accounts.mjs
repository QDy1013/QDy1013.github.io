// 账号只在服务端保存密码的加盐哈希。SESSION_SECRET 同时充当数据库以外的 pepper。
const encoder = new TextEncoder();
export const SESSION_MS = 8 * 3600 * 1000;
export const PASSWORD_ITERATIONS = 100000;
export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
const b64 = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes)))
  .replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
const unb64 = value => Uint8Array.from(atob(value.replaceAll('-', '+').replaceAll('_', '/')), c => c.charCodeAt(0));
const hex = bytes => [...new Uint8Array(bytes)].map(n => n.toString(16).padStart(2, '0')).join('');
const database = env => env.DB.withSession ? env.DB.withSession('first-primary') : env.DB;
async function hmacKey(secret) {
  return crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}
export function credentials(body) {
  const username = typeof body.username === 'string' ? body.username.trim() : '';
  if (!/^[a-z0-9][a-z0-9_-]{2,31}$/i.test(username)) throw new HttpError(400, '用户名需为 3–32 位字母、数字、下划线或短横线，以字母或数字开头。');
  if (typeof body.password !== 'string' || body.password.length < 10 || body.password.length > 128)
    throw new HttpError(400, '密码长度需为 10–128 位。');
  return { username, password: body.password };
}
export async function passwordHash(password, secret, salt = b64(crypto.getRandomValues(new Uint8Array(16)))) {
  // 先使用服务端密钥 HMAC，再 PBKDF2；仅拿到数据库也不能直接离线猜测密码。
  const peppered = await crypto.subtle.sign('HMAC', await hmacKey(secret), encoder.encode('blog-password-v1\0' + password));
  const key = await crypto.subtle.importKey('raw', peppered, 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: unb64(salt), iterations: PASSWORD_ITERATIONS }, key, 256);
  return { hash: hex(bits), salt };
}
async function checkPassword(password, account, env) {
  const value = await passwordHash(password, env.SESSION_SECRET, account?.password_salt || 'AAAAAAAAAAAAAAAAAAAAAA');
  const expected = account?.password_hash || '0'.repeat(64);
  let difference = 0;
  for (let i = 0; i < 64; i++) difference |= value.hash.charCodeAt(i) ^ expected.charCodeAt(i);
  return Boolean(account) && difference === 0;
}
export const publicAccount = row => ({ id: row.id, username: row.username, role: row.role, aiAccess: row.status, createdAt: row.created_at });
export async function issueSession(account, env, now) {
  const data = b64(encoder.encode(JSON.stringify({ type: 'account-v1', id: account.id, version: account.session_version,
    audience: env.SITE_ORIGIN, expires: now + SESSION_MS })));
  return data + '.' + b64(await crypto.subtle.sign('HMAC', await hmacKey(env.SESSION_SECRET), encoder.encode(data)));
}
export async function authorize(request, env, now) {
  const token = request.headers.get('Authorization')?.replace(/^Bearer /, '') || '';
  if (!/^[\w-]+\.[\w-]+$/.test(token) || token.length > 1200) throw new HttpError(401, '请先登录账号。');
  let value;
  try {
    const [data, signature] = token.split('.');
    if (!await crypto.subtle.verify('HMAC', await hmacKey(env.SESSION_SECRET), unb64(signature), encoder.encode(data))) throw Error();
    value = JSON.parse(new TextDecoder().decode(unb64(data)));
    if (value.type !== 'account-v1' || value.audience !== env.SITE_ORIGIN || !Number.isFinite(value.expires) || value.expires <= now ||
        typeof value.id !== 'string' || !Number.isSafeInteger(value.version)) throw Error();
  } catch { throw new HttpError(401, '登录已失效，请重新登录。'); }
  // 这里验证登录身份；AI 权限由聊天接口另外检查。未获 AI 权限也能登录、修改密码。
  const account = await database(env).prepare('SELECT * FROM accounts WHERE id = ?').bind(value.id).first();
  if (!account || account.session_version !== value.version)
    throw new HttpError(401, '账号授权已变更，请联系博主或重新登录。');
  return account;
}
export async function accountRoute(path, body, request, env, now) {
  const db = database(env);
  if (path === '/api/register' || path === '/api/session') {
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    if (!(await env.LOGIN_LIMIT.limit({ key: 'auth-ip:' + ip })).success) throw new HttpError(429, '尝试次数较多，请稍后再试。');
    const { username, password } = credentials(body);
    if (path === '/api/register') {
      if (!(await env.REGISTER_LIMIT.limit({ key: 'register:' + ip })).success) throw new HttpError(429, '注册次数较多，请稍后再试。');
      if (await db.prepare('SELECT id FROM accounts WHERE username = ? COLLATE NOCASE').bind(username).first()) throw new HttpError(409, '这个用户名已被使用。');
      const stored = await passwordHash(password, env.SESSION_SECRET);
      let inserted;
      try {
        inserted = await db.prepare(`INSERT INTO accounts (id, username, password_hash, password_salt, role, status, session_version, created_at, updated_at)
          SELECT ?, ?, ?, ?, 'user', 'pending', 1, ?, ? WHERE (SELECT COUNT(*) FROM accounts) < 1000`)
          .bind(crypto.randomUUID(), username, stored.hash, stored.salt, now, now).run();
      } catch (error) {
        if (String(error.message).includes('UNIQUE constraint failed')) throw new HttpError(409, '这个用户名已被使用。');
        throw error;
      }
      if (inserted.meta.changes !== 1) throw new HttpError(503, '注册名额暂满，请联系博主。');
      return { message: '注册成功，现在可以登录。使用 AI 需要博主另行开通权限。' };
    }
    if (!(await env.LOGIN_LIMIT.limit({ key: 'auth-user:' + username.toLowerCase() })).success) throw new HttpError(429, '这个账号尝试次数较多，请稍后再试。');
    const account = await db.prepare('SELECT * FROM accounts WHERE username = ? COLLATE NOCASE').bind(username).first();
    if (!await checkPassword(password, account, env)) throw new HttpError(401, '用户名或密码不正确。');
    return { token: await issueSession(account, env, now), expires: now + SESSION_MS, account: publicAccount(account) };
  }
  const account = await authorize(request, env, now);
  if (path === '/api/me') return { account: publicAccount(account) };
  if (path === '/api/password') {
    if (!(await env.LOGIN_LIMIT.limit({ key: 'password:' + account.id })).success) throw new HttpError(429, '尝试次数较多，请稍后再试。');
    if (typeof body.currentPassword !== 'string' || body.currentPassword.length > 128 || !await checkPassword(body.currentPassword, account, env))
      throw new HttpError(401, '当前密码不正确。');
    const { password } = credentials({ username: account.username, password: body.password });
    const stored = await passwordHash(password, env.SESSION_SECRET);
    const updated = await db.prepare(`UPDATE accounts SET password_hash = ?, password_salt = ?, session_version = session_version + 1, updated_at = ?
      WHERE id = ? AND session_version = ?`).bind(stored.hash, stored.salt, now, account.id, account.session_version).run();
    if (updated.meta.changes !== 1) throw new HttpError(409, '账号状态已变更，请重新登录。');
    return { message: '密码已修改，请使用新密码重新登录。' };
  }
  if (account.role !== 'admin') throw new HttpError(403, '只有管理员可以管理 AI 权限。');
  if (path === '/api/admin/accounts') {
    const page = Number.isSafeInteger(body.page) && body.page >= 0 && body.page <= 100 ? body.page : 0;
    const result = await db.prepare(`SELECT id, username, role, status, created_at FROM accounts
      ORDER BY CASE status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END, created_at DESC, id LIMIT 51 OFFSET ?`).bind(page * 50).all();
    return { accounts: result.results.slice(0, 50).map(publicAccount), hasMore: result.results.length > 50, page };
  }
  if (path === '/api/admin/status') {
    if (typeof body.id !== 'string' || body.id.length > 64 || !['approved', 'disabled'].includes(body.status)) throw new HttpError(400, '审批操作无效。');
    const updated = await db.prepare(`UPDATE accounts SET status = ?, updated_at = ? WHERE id = ? AND role = 'user'`)
      .bind(body.status, now, body.id).run();
    if (updated.meta.changes !== 1) throw new HttpError(400, '账号不存在，或不能修改管理员账号。');
    return { message: body.status === 'approved' ? '已开通这个账号的 AI 权限。' : '已撤销这个账号的 AI 权限。' };
  }
  throw new HttpError(404, '接口不存在。');
}
