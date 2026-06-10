export type OpenServiceEntry = {
  id: string;
  startedAt: string;
};

export type ServiceHistoryDay = {
  date: string;
  dateLabel: string;
  totalMinutes: number;
  sessionsCount: number;
};

export type ActiveContract = {
  targetMinutes: number;
  workDays: number[];
};

export type ServiceLedgerMovement = {
  id: string;
  referenceDate: string;
  referenceDateLabel: string;
  deltaMinutes: number;
  balanceAfter: number;
  label: string;
};

export type MyServiceDashboard = {
  openEntry: OpenServiceEntry | null;
  todayWorkedMinutes: number;
  monthWorkedMinutes: number;
  balanceMinutes: number;
  /** false si la requête solde a échoué (≠ solde réel à zéro) */
  balanceAvailable: boolean;
  /** false si la requête contrat a échoué (≠ pas de contrat configuré) */
  contractAvailable: boolean;
  /** false si la requête ledger a échoué */
  ledgerAvailable: boolean;
  history: ServiceHistoryDay[];
  ledgerMovements: ServiceLedgerMovement[];
  activeContract: ActiveContract | null;
  loadError: string | null;
  /** Codes pour bandeau discret (ex. balance_unavailable) */
  partialLoadErrors: string[];
};
