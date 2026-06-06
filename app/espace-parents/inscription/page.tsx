import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ParentSignupForm } from "@/components/auth/parent-signup-form";

export default function ParentInscriptionPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Créer un compte parent</h1>
          <p className="text-muted-foreground">
            Utilise le même e-mail que sur la fiche de ton enfant.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Inscription</CardTitle>
            <CardDescription>
              Gratuit et sécurisé. L&apos;ASBL valide chaque lien enfant-parent.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ParentSignupForm />
          </CardContent>
        </Card>
        <p className="text-center text-sm text-muted-foreground">
          Déjà un compte ?{" "}
          <Link href="/espace-parents/connexion" className="text-primary underline">
            Se connecter
          </Link>
        </p>
      </div>
    </main>
  );
}
