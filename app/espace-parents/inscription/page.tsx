import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AuthPageShell } from "@/components/ui/auth-page-shell";
import { ParentSignupForm } from "@/components/auth/parent-signup-form";

export default function ParentInscriptionPage() {
  return (
    <AuthPageShell
      title="Créer un compte parent"
      description="Utilisez le même e-mail que sur la fiche de votre enfant."
      footer={
        <p className="text-center text-sm text-muted-foreground">
          Déjà un compte ?{" "}
          <Link href="/espace-parents/connexion" className="font-medium text-primary underline-offset-4 hover:underline">
            Se connecter
          </Link>
        </p>
      }
    >
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="font-heading text-lg">Inscription gratuite</CardTitle>
          <CardDescription className="text-base">
            Simple et sécurisée. L&apos;ASBL valide chaque lien enfant-parent.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ParentSignupForm />
        </CardContent>
      </Card>
    </AuthPageShell>
  );
}
