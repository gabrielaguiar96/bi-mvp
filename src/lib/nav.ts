import {
  LayoutDashboard,
  Gauge,
  Filter,
  Users,
  Stethoscope,
  Baby,
  Sparkles,
  Target,
  CalendarRange,
  type LucideIcon,
} from "lucide-react";

export type SectionId =
  | "visao-geral"
  | "geral"
  | "geral-funil"
  | "indicacao"
  | "nutrologia"
  | "pediatria"
  | "dermatologia"
  | "metas"
  | "resumo-anual";

export type NavItem = {
  id: SectionId;
  label: string;
  subtitle: string;
  icon: LucideIcon;
};

export const NAV_ITEMS: NavItem[] = [
  { id: "visao-geral", label: "Visão Geral", subtitle: "Simulador & KPIs", icon: LayoutDashboard },
  { id: "geral", label: "Geral", subtitle: "Indicadores principais", icon: Gauge },
  { id: "geral-funil", label: "Funil Comercial", subtitle: "Conversão por canal", icon: Filter },
  { id: "indicacao", label: "Indicação", subtitle: "Pacientes & funil", icon: Users },
  { id: "nutrologia", label: "Nutrologia", subtitle: "Dr. Fernando", icon: Stethoscope },
  { id: "pediatria", label: "Pediatria", subtitle: "Dra. Isa", icon: Baby },
  { id: "dermatologia", label: "Dermatologia", subtitle: "Dra. Thaís", icon: Sparkles },
  { id: "metas", label: "Metas", subtitle: "Realizado vs meta", icon: Target },
  { id: "resumo-anual", label: "Resumo Anual", subtitle: "2025 vs 2026", icon: CalendarRange },
];
