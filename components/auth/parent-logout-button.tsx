import { parentLogoutAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function ParentLogoutButton() {
  return (
    <form action={parentLogoutAction}>
      <Button type="submit" variant="ghost" size="sm">
        <LogOut className="h-4 w-4" />
        Déconnexion
      </Button>
    </form>
  );
}
