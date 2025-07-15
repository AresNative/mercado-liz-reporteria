import { formatJSON } from "@/utils/constants/format-values";
import { DynamicTableItem, formatFilter } from "@/utils/types/querys";
import { loadData } from "./sql/format-filter";

export const loadDataFromAPI = async (
  getAPI: any,
  url: string,
  filtros: formatFilter[],
  currentPage: number
) => {
  try {
    const [tableResult] = await Promise.all([
      loadData(getAPI, {
        filters: { filtros },
        page: currentPage,
        url,
        pageSize: 10,
        sum: false,
      }),
    ]);

    let inventario = 0;
    const newStates = {
      totalPages: 0,
      dataTable: [] as DynamicTableItem[],
    };
    if (tableResult) {
      newStates.totalPages = tableResult.totalPages;
      newStates.dataTable = formatJSON(tableResult.data) as DynamicTableItem[];
    }

    return { newStates, inventario };
  } catch (error) {
    throw new Error("Error al cargar datos. Intente nuevamente.");
  }
};
