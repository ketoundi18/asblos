-- Diagnostic + réparation lien parent ↔ Lucas Nolan
-- Remplace l'e-mail si tu as utilisé un autre compte

-- 1) Voir l'état actuel
SELECT p.email, p.role, pcl.verified_at, c.first_name, c.last_name
FROM profiles p
LEFT JOIN parent_child_links pcl ON pcl.parent_id = p.id
LEFT JOIN children c ON c.id = pcl.child_id
WHERE p.email = 'marie.dupont.parent@test.com';

-- 2) Forcer le rôle PARENT + e-mail guardian
UPDATE profiles
SET role = 'PARENT', signup_source = 'parent'
WHERE email = 'marie.dupont.parent@test.com';

UPDATE guardians
SET email = 'marie.dupont.parent@test.com'
WHERE child_id = (
  SELECT id FROM children
  WHERE first_name ILIKE 'lucas' AND last_name ILIKE 'nolan'
  LIMIT 1
);

-- 3) Créer le lien si absent
INSERT INTO parent_child_links (parent_id, child_id, guardian_id)
SELECT p.id, g.child_id, g.id
FROM profiles p
JOIN guardians g ON lower(trim(g.email)) = lower(trim(p.email))
WHERE p.email = 'marie.dupont.parent@test.com'
ON CONFLICT (parent_id, child_id) DO NOTHING;
