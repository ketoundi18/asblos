export type CommandPriority = "urgent" | "attention" | "info";

export type CommandItem = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  priority: CommandPriority;
  actionLabel: string;
  /** Action directe depuis Ma journée (sans changer de page) */
  quickAction?: "validate_parent" | "confirm_school_support";
  quickActionId?: string;
};

export type CommandSection = {
  id: string;
  title: string;
  description: string;
  items: CommandItem[];
  priority: CommandPriority;
};

export type CommandCenterData = {
  /** Dossiers urgents ou à suivre (actions requises) */
  actionSections: CommandSection[];
  /** Infos utiles sans action immédiate (ex. activités de demain) */
  infoSections: CommandSection[];
  urgentCount: number;
  attentionCount: number;
  /** Aucune action urgente ni à suivre */
  allClear: boolean;
  loadError: string | null;
};
