export const fetchNames = async (
  query: string,
  page: number,
  config: string,
  filterFunction: any,
  signal?: AbortSignal
) => {
  const { data } = await filterFunction({
    url: `reporteria/${config}`,
    pageSize: 10,
    page: page,
    sum: false,
    distinct: false,
    signal,
    filters: {
      Filtros: [
        { Key: "Nombre", Value: "like", Operator: query.toLowerCase() },
      ],
    },
  });

  const filtered = data?.filter((item: any) =>
    item.nombre.toLowerCase().includes(query.toLowerCase())
  );

  const pageSize = 5;
  const startIndex = (page - 1) * pageSize;

  return {
    options: /* filtered.slice(startIndex, startIndex + pageSize) */ [],
    hasMore: startIndex + pageSize < filtered.length,
  };
};
