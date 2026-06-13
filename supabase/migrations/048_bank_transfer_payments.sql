-- 048 Paiement virement — étape 1 : nouvelles valeurs enum
-- Prérequis : 010, 014, 045, 046
-- IMPORTANT : exécuter ce fichier SEUL dans SQL Editor, puis 049 (même session = 2 Runs).
-- PostgreSQL refuse d'utiliser une nouvelle valeur enum dans la même transaction que ALTER TYPE.

ALTER TYPE payment_provider ADD VALUE IF NOT EXISTS 'MANUAL';
ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'PROOF_SUBMITTED';
