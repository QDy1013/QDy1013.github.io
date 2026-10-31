CREATE TABLE accounts (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'admin')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'disabled')),
  session_version INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
-- 管理员由本地管理工具设置；公开注册接口永远只能创建待审批普通账号。
CREATE UNIQUE INDEX single_admin ON accounts(role) WHERE role = 'admin';
CREATE INDEX account_review ON accounts(status, created_at);
