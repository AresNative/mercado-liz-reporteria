import { FilterGroup } from "@/utils/types/consultas";
import { SearchColumn } from "./config";
import { ReportType } from "./consultas";
import { SortRule } from "../page";

export interface DateRange {
  from: Date | null;
  to: Date | null;
}
export interface AppliedFilters {
  reportType: ReportType;
  almacenFilter: string;
  searchTerm: string;
  searchColumn: SearchColumn;
  searchApplied: boolean;
  dateRange: DateRange;
  filterGroups: FilterGroup[];
  sortRules: SortRule[];
  quickMode: boolean;
}
