import Link from "next/link";
import { UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AccountLink() {
  return (
    <Button asChild variant="ghost" size="sm">
      <Link href="/mon-compte">
        <UserCircle className="h-4 w-4" aria-hidden />
        <span className="sr-only sm:not-sr-only sm:inline">Mon compte</span>
      </Link>
    </Button>
  );
}
