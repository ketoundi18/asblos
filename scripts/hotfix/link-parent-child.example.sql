-- Template hotfix : lien parent ↔ enfant (remplace les placeholders avant exécution)
-- NE PAS committer ce fichier une fois paramétré.

-- 1) Diagnostic
SELECT p.email, p.role, pcl.verified_at, c.first_name, c.last_name
FROM profiles p
LEFT JOIN parent_child_links pcl ON pcl.parent_id = p.id
LEFT JOIN children c ON c.id = pcl.child_id
WHERE p.email = '{{PARENT_EMAIL}}';

-- 2) Rôle parent + e-mail guardian
UPDATE profiles
SET role = 'PARENT', signup_source = 'parent'
WHERE email = '{{PARENT_EMAIL}}';

UPDATE guardians
SET email = '{{PARENT_EMAIL}}'
WHERE child_id = (
  SELECT id FROM children
  WHERE first_name ILIKE '{{CHILD_FIRST_NAME}}'
    AND last_name ILIKE '{{CHILD_LAST_NAME}}'
  LIMIT 1
);

-- 3) Lien si absent
INSERT INTO parent_child_links (parent_id, child_id, guardian_id)
SELECT p.id, g.child_id, g.id
FROM profiles p
JOIN guardians g ON lower(trim(g.email)) = lower(trim(p.email))
WHERE p.email = '{{PARENT_EMAIL}}'
ON CONFLICT (parent_id, child_id) DO NOTHING;
