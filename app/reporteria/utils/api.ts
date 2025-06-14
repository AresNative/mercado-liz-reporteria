export const fetchNames = async (
  query: string,
  page: number,
  config: string,
  filterFunction: any,
  signal?: AbortSignal
): Promise<{ options: string[]; hasMore: boolean }> => {
  const { data } = await filterFunction({
    url: `reporteria/${config}`,
    pageSize: 5,
    page,
    sum: false,
    distinct: true,
    signal,
    filters: {
      Filtros: [
        { Key: "Nombre", Value: query.toLowerCase(), Operator: "like" },
      ],
      Selects: [{ Key: "Nombre" }],
    },
  });

  const nombres = data.data
    .map((row: any) => row.Nombre)
    .filter((nombre: any): nombre is string => typeof nombre === "string");

  const hasMore = data.totalPages >= page; // Si hay 5 elementos, puede haber más

  return {
    options: nombres,
    hasMore,
  };
};
