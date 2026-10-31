-- 显示保留注册时的大小写；登录与用户名唯一性忽略英文字母大小写。
CREATE UNIQUE INDEX username_case_insensitive ON accounts(username COLLATE NOCASE);
