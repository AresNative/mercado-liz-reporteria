import { financial } from "@/utils/functions/format-financial";
import { formatLoadDate } from "../../types/querys";

export interface ChartData {
  name: string;
  data: { x: string; y: number }[];
}

export async function loadDataGrafic(
  functionLoad: any,
  filter: any,
  nameX: string | string[],
  nameY: string
): Promise<ChartData[]> {
  try {
    // Cargar datos desde la función proporcionada
    const response = await functionLoad(filter);
    const dataTable: any = response.data?.data;

    // Determinar campos para agrupación y eje X
    const [groupBy, xField] = Array.isArray(nameX) ? nameX : [undefined, nameX];

    // Objeto para almacenar datos agrupados
    const groupedData: {
      [key: string]: { name: string; data: { x: any; y: number }[] };
    } = {};

    // Procesar cada fila de datos
    dataTable.forEach((item: any) => {
      // Obtener la clave de agrupación (si existe)
      const groupKey = groupBy ? item[groupBy] : "default";

      // Obtener el valor para el eje X
      const xValue = item[xField];

      // Obtener y formatear el valor para el eje Y
      const yValue = parseFloat(financial(item[nameY])); // Asegurar que sea número

      // Inicializar el grupo si no existe
      if (!groupedData[groupKey]) {
        groupedData[groupKey] = {
          name: groupKey,
          data: [],
        };
      }

      // Agregar el punto de datos al grupo correspondiente
      groupedData[groupKey].data.push({
        x: xValue,
        y: isNaN(yValue) ? 0 : yValue, // Manejo de valores no numéricos
      });
    });

    // Convertir el objeto agrupado a un array de ChartData
    const chartData: ChartData[] = Object.values(groupedData);

    return chartData;
  } catch (error) {
    console.log("Error al cargar los datos para la gráfica:", error);
    throw error; // Relanzar el error para manejarlo en el componente que llama a esta función
  }
}
export async function loadData(
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
