"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { CheckCircle2 } from "lucide-react";
import { createParentEnrollmentAction } from "@/lib/actions/parent-enrollment";
import { emptyParentEnrollmentState } from "@/lib/actions/parent-enrollment-state";
import {
  ParentEnrollmentStepper,
  buildEnrollmentWizardSteps,
} from "@/components/parent/parent-enrollment-stepper";
import {
  SchoolSupportEnrollmentSection,
  type OpenSchoolSupportProgram,
} from "@/components/enrollment/school-support-enrollment-section";
import { ParentChooseSlotsForm } from "@/components/parent/parent-choose-slots-form";
import { ParentSimulatePayButton } from "@/components/parent/parent-simulate-pay-button";
import { ParentPayButtons } from "@/components/parent/parent-pay-buttons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { GUARDIAN_RELATION_LABELS } from "@/lib/validations/child";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const STEP1_FIELD_KEYS = new Set([
  "first_name",
  "last_name",
  "birth_date",
  "school_name",
  "school_class",
  "allergies",
  "emergency_contact_name",
  "emergency_contact_phone",
]);

type Props = {
  schoolSupportFeeLabel: string;
  schoolSupportFeeCents: number;
  openPrograms: OpenSchoolSupportProgram[];
  guardianDefaults: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  mollieReady: boolean;
  simulationEnabled: boolean;
  initialStep?: string;
  initialChildId?: string;
  initialChildName?: string;
  initialSchoolSupport?: boolean;
  initialNeedsPayment?: boolean;
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm text-destructive">{message}</p>;
}

function EnrollSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full sm:flex-1" disabled={pending}>
      {pending ? (
        <>
          <LoadingSpinner />
          Enregistrement…
        </>
      ) : (
        "Enregistrer et continuer"
      )}
    </Button>
  );
}

export function ParentEnrollmentWizard({
  schoolSupportFeeLabel,
  schoolSupportFeeCents,
  openPrograms,
  guardianDefaults,
  mollieReady,
  simulationEnabled,
  initialStep,
  initialChildId,
  initialChildName,
  initialSchoolSupport = false,
  initialNeedsPayment = false,
}: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [stepKey, setStepKey] = useState(initialStep ?? "enfant");
  const [childId, setChildId] = useState(initialChildId ?? "");
  const [childName, setChildName] = useState(initialChildName ?? "");
  const [schoolSupport, setSchoolSupport] = useState(initialSchoolSupport);
  const [needsPayment, setNeedsPayment] = useState(initialNeedsPayment);

  const [enrollState, enrollAction] = useFormState(
    createParentEnrollmentAction,
    emptyParentEnrollmentState
  );

  const steps = buildEnrollmentWizardSteps({ schoolSupport, needsPayment });

  useEffect(() => {
    if (!enrollState.success || !enrollState.childId) return;

    setChildId(enrollState.childId);
    setChildName(enrollState.childFirstName ?? "votre enfant");
    const support = enrollState.schoolSupport ?? false;
    const payment = enrollState.needsPayment ?? false;
    setSchoolSupport(support);
    setNeedsPayment(payment);

    if (support) {
      setStepKey("jours");
    } else if (payment) {
      setStepKey("paiement");
    } else {
      setStepKey("termine");
    }
  }, [enrollState]);

  useEffect(() => {
    const fieldKeys = Object.keys(enrollState.fieldErrors);
    if (fieldKeys.length === 0) return;

    const hasStep1FieldError = fieldKeys.some((key) => STEP1_FIELD_KEYS.has(key));
    if (hasStep1FieldError && stepKey === "formule") {
      setStepKey("enfant");
    }
  }, [enrollState.fieldErrors, stepKey]);

  function validateStep1(): boolean {
    const form = formRef.current;
    if (!form) return false;
    const required = ["first_name", "last_name", "birth_date"] as const;
    for (const name of required) {
      const el = form.elements.namedItem(name) as HTMLInputElement | null;
      if (!el?.value.trim()) {
        el?.focus();
        return false;
      }
    }
    return true;
  }

  function validateStep2(event: React.FormEvent<HTMLFormElement>) {
    const form = event.currentTarget;
    const required = [
      "guardian_first_name",
      "guardian_last_name",
      "guardian_phone",
    ] as const;
    for (const name of required) {
      const el = form.elements.namedItem(name) as HTMLInputElement | null;
      if (!el?.value.trim()) {
        event.preventDefault();
        el?.focus();
        return;
      }
    }
    const plan = (
      form.querySelector('input[name="membership_plan"]:checked') as HTMLInputElement | null
    )?.value;
    setSchoolSupport(plan === "SCHOOL_SUPPORT");
  }

  function afterSlotsComplete() {
    if (needsPayment) setStepKey("paiement");
    else setStepKey("termine");
  }

  function skipDaysStep() {
    if (needsPayment) setStepKey("paiement");
    else setStepKey("termine");
  }

  const showEnrollmentForm = stepKey === "enfant" || stepKey === "formule";

  return (
    <div className="space-y-6">
      <ParentEnrollmentStepper steps={steps} currentKey={stepKey} />

      {showEnrollmentForm ? (
        <form
          ref={formRef}
          action={enrollAction}
          onSubmit={stepKey === "formule" ? validateStep2 : undefined}
          className="space-y-6"
          noValidate
        >
          <div className={cn(stepKey !== "enfant" && "hidden")}>
            <Card>
              <CardHeader>
                <CardTitle>Étape 1 — Votre enfant</CardTitle>
                <CardDescription>Identité et informations de base</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">Prénom *</Label>
                    <Input id="first_name" name="first_name" />
                    <FieldError message={enrollState.fieldErrors.first_name} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Nom *</Label>
                    <Input id="last_name" name="last_name" />
                    <FieldError message={enrollState.fieldErrors.last_name} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birth_date">Date de naissance *</Label>
                  <Input id="birth_date" name="birth_date" type="date" />
                  <FieldError message={enrollState.fieldErrors.birth_date} />
                </div>
                <input type="hidden" name="status" value="ACTIF" />
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Scolarité</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="school_name">École</Label>
                  <Input id="school_name" name="school_name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="school_class">Classe</Label>
                  <Input
                    id="school_class"
                    name="school_class"
                    placeholder="Ex. 3ème primaire"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Santé &amp; sécurité</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="allergies">Allergies</Label>
                  <Textarea id="allergies" name="allergies" placeholder="Ex. arachides…" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="emergency_contact_name">Contact d&apos;urgence</Label>
                    <Input id="emergency_contact_name" name="emergency_contact_name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emergency_contact_phone">Téléphone urgence</Label>
                    <Input
                      id="emergency_contact_phone"
                      name="emergency_contact_phone"
                      type="tel"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Autorisations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <label className="flex items-center gap-3 rounded-lg border p-3">
                  <input type="checkbox" name="image_rights" className="h-4 w-4" />
                  <span className="text-sm">Droit à l&apos;image accordé</span>
                </label>
                <label className="flex items-center gap-3 rounded-lg border p-3">
                  <input type="checkbox" name="outing_authorization" className="h-4 w-4" />
                  <span className="text-sm">Autorisation de sortie accordée</span>
                </label>
              </CardContent>
            </Card>

            {enrollState.error && stepKey === "enfant" ? (
              <div
                className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                role="alert"
              >
                {enrollState.error}
              </div>
            ) : null}

            <Button
              type="button"
              size="lg"
              className="mt-6 w-full"
              onClick={() => {
                if (validateStep1()) setStepKey("formule");
              }}
            >
              Continuer — Formule
            </Button>
          </div>

          <div className={cn(stepKey !== "formule" && "hidden")}>
            <Card>
              <CardHeader>
                <CardTitle>Étape 2 — Parent &amp; formule</CardTitle>
                <CardDescription>Vos coordonnées et type d&apos;inscription</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="guardian_relation">Lien de parenté *</Label>
                  <select
                    id="guardian_relation"
                    name="guardian_relation"
                    defaultValue="MERE"
                    className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-base"
                  >
                    {Object.entries(GUARDIAN_RELATION_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="guardian_first_name">Prénom *</Label>
                    <Input
                      id="guardian_first_name"
                      name="guardian_first_name"
                      defaultValue={guardianDefaults.first_name}
                    />
                    <FieldError message={enrollState.fieldErrors.guardian_first_name} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="guardian_last_name">Nom *</Label>
                    <Input
                      id="guardian_last_name"
                      name="guardian_last_name"
                      defaultValue={guardianDefaults.last_name}
                    />
                    <FieldError message={enrollState.fieldErrors.guardian_last_name} />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="guardian_phone">Téléphone *</Label>
                    <Input
                      id="guardian_phone"
                      name="guardian_phone"
                      type="tel"
                      defaultValue={guardianDefaults.phone}
                    />
                    <FieldError message={enrollState.fieldErrors.guardian_phone} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="guardian_email">E-mail</Label>
                    <Input
                      id="guardian_email"
                      name="guardian_email"
                      type="email"
                      defaultValue={guardianDefaults.email}
                    />
                  </div>
                </div>
                <label className="flex items-center gap-3 rounded-lg border p-3">
                  <input
                    type="checkbox"
                    name="guardian_can_pickup"
                    defaultChecked
                    className="h-4 w-4"
                  />
                  <span className="text-sm">Autorisé(e) à récupérer l&apos;enfant</span>
                </label>
              </CardContent>
            </Card>

            <div className="mt-6">
              <SchoolSupportEnrollmentSection
                programs={openPrograms}
                schoolSupportFeeCents={schoolSupportFeeCents}
                schoolSupportFeeLabel={schoolSupportFeeLabel}
              />
            </div>

            {enrollState.error ? (
              <div
                className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                role="alert"
              >
                {enrollState.error}
              </div>
            ) : null}

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:flex-1"
                onClick={() => setStepKey("enfant")}
              >
                Retour
              </Button>
              <EnrollSubmitButton />
            </div>
          </div>

          <Button asChild variant="outline" className="w-full">
            <Link href="/espace-parents">Annuler</Link>
          </Button>
        </form>
      ) : null}

      {stepKey === "jours" && childId ? (
        <Card>
          <CardHeader>
            <CardTitle>Étape 3 — Jours de soutien (optionnel)</CardTitle>
            <CardDescription>
              Indiquez les jours qui conviennent à {childName}. Vous pouvez aussi passer
              cette étape.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ParentChooseSlotsForm
              childId={childId}
              childName={childName}
              programs={openPrograms}
              wizardMode
              onComplete={afterSlotsComplete}
            />
            <Button type="button" variant="ghost" className="w-full" onClick={skipDaysStep}>
              Passer — choisir plus tard
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {stepKey === "paiement" && childId ? (
        <Card>
          <CardHeader>
            <CardTitle>Étape 4 — Cotisation</CardTitle>
            <CardDescription>
              Finalisez le paiement pour {childName}.
              {schoolSupportFeeLabel !== "Gratuit" ? ` Total : ${schoolSupportFeeLabel}` : ""}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {simulationEnabled ? <ParentSimulatePayButton childId={childId} wizardMode /> : null}
            {mollieReady ? (
              <ParentPayButtons childId={childId} feeLabel={schoolSupportFeeLabel} />
            ) : null}
            {!simulationEnabled && !mollieReady ? (
              <p className="text-sm text-amber-800">
                Paiement en ligne bientôt disponible. Contactez l&apos;ASBL.
              </p>
            ) : null}
            <Button asChild variant="outline" className="w-full">
              <Link href={`/espace-parents/paiement/${childId}?wizard=1`}>
                Ouvrir la page paiement complète
              </Link>
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => setStepKey("termine")}
            >
              J&apos;ai déjà payé / continuer
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {stepKey === "termine" ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
            <div>
              <p className="text-lg font-semibold">Inscription enregistrée</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {childName ? (
                  <>
                    La fiche de <strong>{childName}</strong> est bien reçue. L&apos;ASBL
                    validera le dossier sous peu.
                  </>
                ) : (
                  <>L&apos;ASBL validera le dossier sous peu.</>
                )}
              </p>
            </div>
            <Button asChild className="w-full max-w-sm">
              <Link href="/espace-parents">Retour — Mes enfants</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
