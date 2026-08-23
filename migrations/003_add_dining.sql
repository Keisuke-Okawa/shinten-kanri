-- 飲食トグルと、飲食タスクの表示条件カラム
ALTER TABLE store_profiles ADD COLUMN IF NOT EXISTS dining TEXT NOT NULL DEFAULT 'true';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS requires_dining TEXT NOT NULL DEFAULT 'false';

-- 完了済み店舗は飲食オフ（完了が巻き戻らないようにする）
UPDATE store_profiles
SET dining = 'false'
WHERE store_id IN (SELECT id FROM stores WHERE status = 'completed');
