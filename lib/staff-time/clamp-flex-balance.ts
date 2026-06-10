/**
 * Plafond du solde flexibilité — même règle que settle_staff_time_day en SQL :
 * v_new_balance := LEAST(v_prev + v_delta, v_max_credit)
 */
export function clampStaffFlexBalance(
  previousBalanceMinutes: number,
  appliedDeltaMinutes: number,
  maxCreditMinutes: number
): number {
  return Math.min(previousBalanceMinutes + appliedDeltaMinutes, maxCreditMinutes);
}
