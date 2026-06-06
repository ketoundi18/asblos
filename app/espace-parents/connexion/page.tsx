import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ParentLoginForm } from "@/components/auth/parent-login-form";

export default function ParentConnexionPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Espace parents</h1>
          <p className="text-muted-foreground">AsblOS</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Connexion</CardTitle>
            <CardDescription>
              Accède aux inscriptions et au suivi de tes enfants.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ParentLoginForm />
          </CardContent>
        </Card>
        <p className="text-center text-sm text-muted-foreground">
          Pas encore de compte ?{" "}
          <Link href="/espace-parents/inscription" className="text-primary underline">
            Créer un compte
          </Link>
        </p>
        <p className="text-center text-xs text-muted-foreground">
          Personnel ASBL ?{" "}
          <Link href="/connexion" className="underline">
            Connexion staff
          </Link>
        </p>
      </div>
    </main>
  );
}
