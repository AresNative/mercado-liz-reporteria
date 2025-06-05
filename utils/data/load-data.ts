import { formatJSON } from "@/utils/constants/format-values";
import {
  DynamicTableItem,
  formatFilter,
  formatLoadDate,
} from "@/utils/types/querys";

async function loadData(
  functionLoad: any,
  filter: formatLoadDate
): Promise<{ data: any; totalPages: number } | undefined> {
  try {
    // Ejecutar la función con la configuración recibida
    const response: any = await functionLoad(filter);

    // Extraer los datos y total de páginas
    const dataTable: any = response.data?.data;
    const dataTotalPages: any = response.data?.totalPages;

    return { data: dataTable, totalPages: dataTotalPages };
  } catch (error: any) {
    // Si el error es porque la solicitud fue cancelada, no lo mostramos
    if (error.name === "AbortError") return;

    console.log("Error en loadData:", error);
  }
}

export const loadDataFromAPI = async (
  getAPI: any,
  url: string,
  filtros: formatFilter[],
  currentPage: number
) => {
  try {
    const [tableResult] = await Promise.all([
      loadData(getAPI, {
        filters: { filtros /* , Selects: [{ key: "Categoria" }] */ },
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
