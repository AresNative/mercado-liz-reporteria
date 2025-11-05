export const fetchNames = async (
  query: string,
  page: number,
  key: string,
  config: string,
  filterFunction: any,
  signal?: AbortSignal
): Promise<{ options: string[]; hasMore: boolean }> => {
  const { data } = await filterFunction({
    table: `COMPRAD InvD 
                  INNER JOIN COMPRA INV ON INVD.ID = INV.ID
                  LEFT JOIN ART ON INVD.Articulo = ART.Articulo
                  LEFT JOIN PROV C ON INV.Proveedor = C.Proveedor`,
    pageSize: 5,
    page,
    signal,
    filtros: {
      Filtros: [{ Key: key, Value: query.toLowerCase(), Operator: "like" }],
      Selects: [{ Key: "Nombre" }],
      OrderBy: [
        {
          Key: "FechaEmision",
          Direction: "desc",
        },
      ],
    },
  });

  const nombres = data.data.map((row: any) => row[key]);
  return {
    options: nombres,
    hasMore: data.totalPages > page,
  };
};
