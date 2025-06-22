import * as XLSX from "xlsx";

export const exportToExcel = (data: any[], fileName: string = "data.xlsx") => {
  // 1. Crear una hoja de trabajo a partir de los datos
  const worksheet = XLSX.utils.json_to_sheet(data);
  // Convertir todas las celdas a tipo texto
  for (const key in worksheet) {
    if (key[0] !== "!") {
      // Ignorar metadatos (como !ref, !cols, etc.)
      const cell = worksheet[key];
      // Si el valor es nulo o indefinido, establecer como cadena vacía
      if (cell.v === null || cell.v === undefined) {
        cell.v = "";
      }
      // Convertir cualquier valor a string y forzar tipo 's' (texto)
      cell.v = String(cell.v); // Convierte a string
      cell.t = "s"; // Fuerza el tipo a texto
    }
  }
  // 2. Crear un libro de trabajo y agregar la hoja
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

  // 3. Generar archivo Excel y descargarlo
  XLSX.writeFile(workbook, fileName);
};
