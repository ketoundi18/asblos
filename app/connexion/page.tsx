import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoginForm } from "@/components/auth/login-form";

export default function ConnexionPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-2xl font-bold text-primary-foreground">
            A
          </div>
          <h1 className="text-2xl font-bold tracking-tight">AsblOS</h1>
          <p className="mt-1 text-muted-foreground">
            Gestion simple pour ton ASBL
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Connexion</CardTitle>
            <CardDescription>
              Entre ton e-mail et ton mot de passe pour accéder à l&apos;application.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Pas d&apos;inscription publique — ton administrateur crée ton compte.
        </p>
      </div>
    </main>
  );
}
