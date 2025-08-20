export const fetchNames = async (
  query: string,
  page: number,
  key: string,
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
      Filtros: [{ Key: key, Value: query.toLowerCase(), Operator: "like" }],
      Selects: [{ Key: key }],
    },
  });

  const nombres = data.data.map((row: any) => row[key]);
  return {
    options: nombres,
    hasMore: data.totalPages > page,
  };
};
