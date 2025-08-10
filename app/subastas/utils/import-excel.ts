import * as XLSX from "xlsx";

export const importFromExcel = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        // 1. Obtener datos binarios del archivo
        const data = e.target?.result as ArrayBuffer;

        // 2. Leer el libro de trabajo
        const workbook = XLSX.read(data, { type: "array" });

        // 3. Obtener la primera hoja
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // 4. Convertir a JSON usando la primera fila como headers
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1, // Extraer como matriz cruda
          defval: "", // Valor por defecto para celdas vacías
          blankrows: false, // Omitir filas completamente vacías
        });

        // 5. Extraer encabezados y crear objetos
        if (jsonData.length < 1) {
          resolve([]);
          return;
        }

        const headers = (jsonData[0] as string[]).map((header) =>
          header.trim().replace(/\s+/g, "_").toLowerCase()
        );

        const result = [];
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i] as any[];
          if (row.length === 0) continue;

          const obj: any = {};
          headers.forEach((header, index) => {
            obj[header] = index < row.length ? row[index] : null;
          });
          result.push(obj);
        }

        resolve(result);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};
