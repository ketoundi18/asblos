/** Re-export serveur — la logique pure vit dans lib/asbl/fee-utils.ts (client-safe). */
export {
  buildEnrollmentQuote,
  parseMembershipPlan,
  parseProgramId,
  parseSelectedSlotIds,
  type EnrollmentQuote,
  type EnrollmentQuoteLine,
} from "@/lib/asbl/fee-utils";
