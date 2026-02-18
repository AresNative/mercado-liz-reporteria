import { formatDateISOString } from "@/utils/constants/format-values";
import { FilterGroup, ReportType } from "../types/consultas";
import { SearchColumn } from "../types/config";
import { DateRange } from "../types/sample";
import { CONFIG, QUERY_CONFIGS } from "../utils/config";

export interface FilterBuilderParams {
  quickMode: boolean;
  filterGroups: FilterGroup[];
  searchTerm: string;
  searchColumn: SearchColumn;
  almacenFilter: string;
  dateRange: DateRange;
  reportType: ReportType;
  searchApplied: boolean;
  includeSearchTerm?: boolean;
}

export class FilterBuilder {
  private params: FilterBuilderParams;

  constructor(params: FilterBuilderParams) {
    this.params = params;
  }

  build() {
    const {
      quickMode,
      filterGroups,
      searchTerm,
      searchColumn,
      almacenFilter,
      dateRange,
      reportType,
      searchApplied,
      includeSearchTerm = true,
    } = this.params;

    const filtrosAnd: any[] = [];
    const filtrosOr: any[] = [];

    if (quickMode) {
      const basicFilters: any[] = [];

      if (
        searchTerm.length >= 2 &&
        searchColumn.tableField &&
        includeSearchTerm &&
        searchApplied
      ) {
        basicFilters.push({
          Key: searchColumn.tableField,
          Operator: "LIKE",
          Value: searchTerm,
        });
      }

      if (almacenFilter) {
        let almacenField = "venta.Almacen";
        if (reportType === "compras") almacenField = "comprad.Almacen";
        else if (reportType === "mermas" || reportType === "inventario")
          almacenField = "invd.Almacen";
        else if (reportType === "comparacion") almacenField = "ventad.Almacen";
        basicFilters.push({
          Key: almacenField,
          Operator: "=",
          Value: almacenFilter,
        });
      }

      if (dateRange.from && dateRange.to) {
        const fechaField = QUERY_CONFIGS[reportType]?.fechaField;
        if (fechaField) {
          basicFilters.push(
            {
              Key: fechaField,
              Operator: ">=",
              Value: formatDateISOString(dateRange.from),
            },
            {
              Key: fechaField,
              Operator: "<=",
              Value: formatDateISOString(dateRange.to),
            },
          );
        }
      }

      // Filtros específicos por reporte
      if (reportType === "ventas") {
        basicFilters.push(
          {
            Key: "venta.Estatus",
            Operator: "=",
            Value: CONFIG.STATUS.CONCLUIDO,
          },
          {
            Key: "venta.Mov",
            Operator: "IN",
            Value: "Factura,Factura Credito,Nota",
          },
        );
      } else if (reportType === "compras") {
        basicFilters.push(
          {
            Key: "compra.Estatus",
            Operator: "=",
            Value: CONFIG.STATUS.CONCLUIDO,
          },
          { Key: "compra.Mov", Operator: "=", Value: "ENTRADA COMPRA" },
        );
      } else if (reportType === "mermas") {
        basicFilters.push(
          { Key: "inv.Estatus", Operator: "=", Value: CONFIG.STATUS.CONCLUIDO },
          { Key: "inv.Concepto", Operator: "LIKE", Value: "MERMAS" },
        );
      } else if (reportType === "inventario") {
        basicFilters.push({
          Key: "inv.Estatus",
          Operator: "=",
          Value: CONFIG.STATUS.CONCLUIDO,
        });
      } else if (reportType === "comparacion") {
        basicFilters.push(
          {
            Key: "venta.Estatus",
            Operator: "=",
            Value: CONFIG.STATUS.CONCLUIDO,
          },
          {
            Key: "venta.Mov",
            Operator: "IN",
            Value: "Factura,Factura Credito,Nota",
          },
          {
            Key: "compra.Estatus",
            Operator: "=",
            Value: CONFIG.STATUS.CONCLUIDO,
          },
          { Key: "compra.Mov", Operator: "=", Value: "ENTRADA COMPRA" },
        );
      }

      if (basicFilters.length > 0) {
        filtrosAnd.push({ Filtros: basicFilters, OperadorLogico: "AND" });
      }
    } else {
      // Modo avanzado: grupos de filtros
      filterGroups.forEach((group) => {
        const groupFilters = group.filters
          .filter((f) => f.column && (f.value || f.operator.includes("NULL")))
          .map((f) => ({
            Key: f.column,
            Operator: f.operator,
            Value: f.value || null,
          }));
        if (groupFilters.length > 0) {
          const filterGroup = {
            Filtros: groupFilters,
            OperadorLogico: group.logicalOperator,
          };
          if (group.logicalOperator === "AND") filtrosAnd.push(filterGroup);
          else filtrosOr.push(filterGroup);
        }
      });

      if (dateRange.from && dateRange.to) {
        const fechaField = QUERY_CONFIGS[reportType]?.fechaField;
        if (fechaField) {
          filtrosAnd.push({
            Filtros: [
              {
                Key: fechaField,
                Operator: ">=",
                Value: formatDateISOString(dateRange.from),
              },
              {
                Key: fechaField,
                Operator: "<=",
                Value: formatDateISOString(dateRange.to),
              },
            ],
            OperadorLogico: "AND",
          });
        }
      }
    }

    return { filtrosAnd, filtrosOr };
  }
}
