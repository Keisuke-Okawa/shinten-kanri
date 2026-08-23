-- store_profiles テーブルに不足していたカラムを追加
-- 2026-08-23 本番DBで手動実行済み
ALTER TABLE store_profiles ADD COLUMN IF NOT EXISTS key_custody_type TEXT NOT NULL DEFAULT '';
ALTER TABLE store_profiles ADD COLUMN IF NOT EXISTS keybox_code      TEXT NOT NULL DEFAULT '';
ALTER TABLE store_profiles ADD COLUMN IF NOT EXISTS open_category    TEXT NOT NULL DEFAULT '開店';
