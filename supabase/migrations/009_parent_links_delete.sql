-- Admin : refuser un lien parent = suppression (policy DELETE staff)

CREATE POLICY "parent_links_delete_staff"
  ON parent_child_links FOR DELETE
  USING (public.is_active_user() AND public.is_staff_full());
