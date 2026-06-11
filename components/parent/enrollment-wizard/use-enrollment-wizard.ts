"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState } from "react-dom";
import { createParentEnrollmentAction } from "@/lib/actions/parent-enrollment";
import { emptyParentEnrollmentState } from "@/lib/actions/parent-enrollment-state";
import { buildEnrollmentWizardSteps } from "@/lib/parent/enrollment-wizard-steps";
import {
  STEP1_FIELD_KEYS,
  type EnrollmentWizardProps,
  type Step1Draft,
} from "@/components/parent/enrollment-wizard/types";

const STEPS_REQUIRING_CHILD = new Set(["jours", "paiement", "termine"]);
const LOCAL_REQUIRED_MESSAGE =
  "Merci de remplir tous les champs obligatoires marqués d'un astérisque (*).";

function validateRequiredFields(
  form: HTMLFormElement,
  names: readonly string[]
): boolean {
  for (const name of names) {
    const el = form.elements.namedItem(name) as HTMLInputElement | null;
    if (!el) continue;

    if (el.type === "checkbox") {
      if (el.required && !el.checked) {
        el.reportValidity();
        return false;
      }
      continue;
    }

    if (!el.value.trim()) {
      el.focus();
      el.reportValidity();
      return false;
    }
  }
  return true;
}

function captureStep1Draft(form: HTMLFormElement): Step1Draft {
  const read = (name: string) => {
    const el = form.elements.namedItem(name) as HTMLInputElement | null;
    return el?.value?.trim() ?? "";
  };
  const readCheck = (name: string) => {
    const el = form.elements.namedItem(name) as HTMLInputElement | null;
    return el?.checked ?? false;
  };

  return {
    first_name: read("first_name"),
    last_name: read("last_name"),
    birth_date: read("birth_date"),
    school_name: read("school_name"),
    school_class: read("school_class"),
    allergies: read("allergies"),
    emergency_contact_name: read("emergency_contact_name"),
    emergency_contact_phone: read("emergency_contact_phone"),
    image_rights: readCheck("image_rights"),
    outing_authorization: readCheck("outing_authorization"),
  };
}

export function useEnrollmentWizard({
  initialStep,
  initialChildId,
  initialChildName,
  initialSchoolSupport = false,
  initialNeedsPayment = false,
}: Pick<
  EnrollmentWizardProps,
  | "initialStep"
  | "initialChildId"
  | "initialChildName"
  | "initialSchoolSupport"
  | "initialNeedsPayment"
>) {
  const formRef = useRef<HTMLFormElement>(null);
  const [stepKey, setStepKey] = useState(initialStep ?? "enfant");
  const [childId, setChildId] = useState(initialChildId ?? "");
  const [childName, setChildName] = useState(initialChildName ?? "");
  const [schoolSupport, setSchoolSupport] = useState(initialSchoolSupport);
  const [needsPayment, setNeedsPayment] = useState(initialNeedsPayment);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmSummary, setConfirmSummary] = useState("");
  const [localValidationError, setLocalValidationError] = useState<string | null>(
    null
  );
  const [resumeError, setResumeError] = useState<string | null>(null);
  const [step1Draft, setStep1Draft] = useState<Step1Draft | null>(null);

  const [enrollState, enrollAction] = useFormState(
    createParentEnrollmentAction,
    emptyParentEnrollmentState
  );

  const steps = buildEnrollmentWizardSteps({ schoolSupport, needsPayment });
  const showEnrollmentForm = stepKey === "enfant" || stepKey === "formule";

  useEffect(() => {
    if (!STEPS_REQUIRING_CHILD.has(stepKey) || childId) return;
    setStepKey("enfant");
    setResumeError("Reprise impossible, recommencez l'inscription.");
  }, [stepKey, childId]);

  useEffect(() => {
    if (!enrollState.success || !enrollState.childId) return;

    setConfirmOpen(false);
    setResumeError(null);
    setLocalValidationError(null);
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

    const fieldIds = ["first_name", "last_name", "birth_date"] as const;

    for (const id of fieldIds) {
      const el = form.querySelector(`#${id}`) as HTMLInputElement | null;
      if (!el?.value.trim()) {
        el?.focus();
        el?.reportValidity();
        setLocalValidationError(LOCAL_REQUIRED_MESSAGE);
        return false;
      }
    }

    setLocalValidationError(null);
    return true;
  }

  function validateStep2Form(form: HTMLFormElement): boolean {
    const ok = validateRequiredFields(form, [
      "guardian_first_name",
      "guardian_last_name",
      "guardian_phone",
    ] as const);

    if (!ok) {
      setLocalValidationError(LOCAL_REQUIRED_MESSAGE);
      return false;
    }

    const plan = (
      form.querySelector('input[name="membership_plan"]:checked') as HTMLInputElement | null
    )?.value;
    setSchoolSupport(plan === "SCHOOL_SUPPORT");
    setLocalValidationError(null);
    return true;
  }

  function validateStep2(event: React.FormEvent<HTMLFormElement>) {
    if (!validateStep2Form(event.currentTarget)) {
      event.preventDefault();
    }
  }

  function goToFormulaStep() {
    const form = formRef.current;
    if (!form || !validateStep1()) return;
    setStep1Draft(captureStep1Draft(form));
    setStepKey("formule");
  }

  function openEnrollmentConfirm() {
    const form = formRef.current;
    if (!form || !validateStep2Form(form)) return;

    const summary = step1Draft
      ? [step1Draft.first_name, step1Draft.last_name].filter(Boolean).join(" ")
      : [
          (form.elements.namedItem("first_name") as HTMLInputElement | null)?.value.trim(),
          (form.elements.namedItem("last_name") as HTMLInputElement | null)?.value.trim(),
        ]
          .filter(Boolean)
          .join(" ");
    setConfirmSummary(summary || "votre enfant");
    setConfirmOpen(true);
  }

  function confirmEnrollment() {
    formRef.current?.requestSubmit();
  }

  function goBackToChildStep() {
    setStepKey("enfant");
    setLocalValidationError(null);
  }

  function goToPostSlotsStep() {
    setStepKey(needsPayment ? "paiement" : "termine");
  }

  return {
    formRef,
    stepKey,
    setStepKey,
    childId,
    childName,
    schoolSupport,
    needsPayment,
    confirmOpen,
    setConfirmOpen,
    confirmSummary,
    localValidationError,
    resumeError,
    enrollState,
    enrollAction,
    steps,
    showEnrollmentForm,
    validateStep1,
    validateStep2,
    goToFormulaStep,
    goBackToChildStep,
    step1Draft,
    openEnrollmentConfirm,
    confirmEnrollment,
    goToPostSlotsStep,
  };
}
