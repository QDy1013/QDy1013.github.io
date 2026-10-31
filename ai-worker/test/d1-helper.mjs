// 使用真正的 SQLite 执行生产 SQL，而不是用字符串分支模拟 SQL 的结果。
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
export function createTestDB() {
  const sqlite = new DatabaseSync(':memory:');
  for (const file of ['0001_accounts.sql', '0002_username_case.sql']) sqlite.exec(readFileSync(new URL('../migrations/' + file, import.meta.url), 'utf8'));
  const db = {
    sqlite,
    withSession: () => db,
    prepare(sql) {
      const statement = sqlite.prepare(sql);
      const bind = args => ({
        first: async () => statement.get(...args) || null,
        all: async () => ({ results: statement.all(...args) }),
        run: async () => ({ meta: { changes: statement.run(...args).changes } })
      });
      return { ...bind([]), bind: (...args) => bind(args) };
    }
  };
  return db;
}
