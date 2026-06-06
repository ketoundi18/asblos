-- Fix : le parent doit voir ses enfants liés (même en attente de validation)

DROP POLICY IF EXISTS "children_select_parent" ON children;

CREATE POLICY "children_select_parent"
  ON children FOR SELECT
  USING (
    deleted_at IS NULL
    AND public.is_active_user()
    AND public.is_parent()
    AND EXISTS (
      SELECT 1 FROM public.parent_child_links pcl
      WHERE pcl.child_id = children.id
        AND pcl.parent_id = auth.uid()
    )
  );
