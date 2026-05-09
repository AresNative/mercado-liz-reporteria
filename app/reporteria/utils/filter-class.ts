import { FilterGroup } from "@/utils/types/consultas";
import { SearchColumn } from "../types/config";
import { DateRange } from "../types/filter";
import { ReportType } from "../types/consultas";
import { formatDateISOString } from "@/utils/constants/format-values";
import { CONFIG, QUERY_CONFIGS } from "./config-constants";

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
          Key: searchColumn.prefix + searchColumn.tableField,
          Operator: "LIKE",
          Value: searchTerm,
        });
      }

      if (almacenFilter && reportType !== "comparacion") {
        let almacenField = "venta.Almacen";
        if (reportType === "compras") almacenField = "comprad.Almacen";
        else if (reportType === "mermas" || reportType === "inventario")
          almacenField = "invd.Almacen";
        basicFilters.push({
          Key: almacenField,
          Operator: "=",
          Value: almacenFilter,
        });
      }

      if (dateRange.from && dateRange.to && reportType !== "comparacion") {
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
            Operator: "IN",
            Value: "CONCLUIDO,PROCESAR",
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
        // Para comparación emitimos UN grupo por sub-tabla.
        // El saneador de makePayload en page.tsx descarta los grupos cuyo alias
        // no pertenece a la sub-query activa, de forma que cada consulta
        // (ventas / compras / mermas) recibe solo sus propios filtros.

        // Grupo ventas
        const ventasFilters: any[] = [
          {
            Key: "venta.Estatus",
            Operator: "IN",
            Value: "CONCLUIDO,PROCESAR",
          },
          {
            Key: "venta.Mov",
            Operator: "IN",
            Value: "Factura,Factura Credito,Nota",
          },
        ];
        if (almacenFilter) {
          ventasFilters.push({
            Key: "ventad.Almacen",
            Operator: "=",
            Value: almacenFilter,
          });
        }
        if (dateRange.from && dateRange.to) {
          ventasFilters.push(
            {
              Key: QUERY_CONFIGS.ventas.fechaField,
              Operator: ">=",
              Value: formatDateISOString(dateRange.from),
            },
            {
              Key: QUERY_CONFIGS.ventas.fechaField,
              Operator: "<=",
              Value: formatDateISOString(dateRange.to),
            },
          );
        }

        // Grupo compras
        const comprasFilters: any[] = [
          {
            Key: "compra.Estatus",
            Operator: "=",
            Value: CONFIG.STATUS.CONCLUIDO,
          },
          { Key: "compra.Mov", Operator: "=", Value: "ENTRADA COMPRA" },
        ];
        if (almacenFilter) {
          comprasFilters.push({
            Key: "comprad.Almacen",
            Operator: "=",
            Value: almacenFilter,
          });
        }
        if (dateRange.from && dateRange.to) {
          comprasFilters.push(
            {
              Key: QUERY_CONFIGS.compras.fechaField,
              Operator: ">=",
              Value: formatDateISOString(dateRange.from),
            },
            {
              Key: QUERY_CONFIGS.compras.fechaField,
              Operator: "<=",
              Value: formatDateISOString(dateRange.to),
            },
          );
        }

        // Grupo mermas
        const mermasFilters: any[] = [
          { Key: "inv.Estatus", Operator: "=", Value: CONFIG.STATUS.CONCLUIDO },
          { Key: "inv.Concepto", Operator: "LIKE", Value: "MERMAS" },
        ];
        if (almacenFilter) {
          mermasFilters.push({
            Key: "invd.Almacen",
            Operator: "=",
            Value: almacenFilter,
          });
        }
        if (dateRange.from && dateRange.to) {
          mermasFilters.push(
            {
              Key: QUERY_CONFIGS.mermas.fechaField,
              Operator: ">=",
              Value: formatDateISOString(dateRange.from),
            },
            {
              Key: QUERY_CONFIGS.mermas.fechaField,
              Operator: "<=",
              Value: formatDateISOString(dateRange.to),
            },
          );
        }

        // Reemplazar basicFilters por los tres grupos independientes
        // (vaciamos basicFilters para que el push genérico de abajo no los duplique)
        basicFilters.length = 0;
        filtrosAnd.push(
          { Filtros: ventasFilters, OperadorLogico: "AND" },
          { Filtros: comprasFilters, OperadorLogico: "AND" },
          { Filtros: mermasFilters, OperadorLogico: "AND" },
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
