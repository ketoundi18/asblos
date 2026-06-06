-- Étape 1 sur 2 — Lance CE script SEUL, puis Run, puis lance 007_parent_role.sql

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'PARENT';
