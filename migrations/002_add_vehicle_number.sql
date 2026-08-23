-- store_profiles に号車番号カラムを追加
ALTER TABLE store_profiles ADD COLUMN IF NOT EXISTS vehicle_number TEXT NOT NULL DEFAULT '';
