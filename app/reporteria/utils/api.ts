export const fetchNames = async (query: string, page: number) => {
  // Implementación simulada (reemplazar con API real)
  await new Promise((resolve) => setTimeout(resolve, 500));

  const allNames = Array.from({ length: 15 }, (_, i) => `Producto ${i + 1}`);
  const filtered = allNames.filter((name) =>
    name.toLowerCase().includes(query.toLowerCase())
  );

  const pageSize = 5;
  const startIndex = (page - 1) * pageSize;

  return {
    options: filtered.slice(startIndex, startIndex + pageSize),
    hasMore: startIndex + pageSize < filtered.length,
  };
};
