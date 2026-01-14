"use client";

import Footer from "@/template/footer";
import Header from "@/template/header";
import { EnvConfig } from "@/utils/constants/env.config";
import { getCookie } from "@/utils/functions/cookies";
import { getLocalStorageItem } from "@/utils/functions/local-storage";
import { useState, ChangeEvent } from "react";

const USER_DATA_KEY = "userData";

interface ParsedRow {
    [key: string]: string;
    Rama: string;
    Cuenta: string;
    Propiedad: string;
    Valor: string;
}

interface Filter {
    Key: string;
    Value: string;
    Operator: string;
}

interface UpdateRequest {
    Data: {
        Valor: number;
    };
    Filtros: {
        Filtros: Filter[];
    };
}

interface Notification {
    id: number;
    message: string;
    type: "success" | "error" | "info";
}

interface ApiError {
    row: number;
    cuenta: string;
    propiedad: string;
    error: string;
}

interface ApiResponse {
    ok: boolean;
    status?: number;
    statusText?: string;
    error?: string;
    data?: any;
}

const Page = () => {
    const [fileContent, setFileContent] = useState<string>("");
    const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
    const [isUploading, setIsUploading] = useState<boolean>(false);
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const [tableName, setTableName] = useState<string>("general");
    const [status, setStatus] = useState<string>("");
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [errors, setErrors] = useState<ApiError[]>([]);

    // Función para mostrar notificaciones
    const showNotification = (message: string, type: Notification["type"] = "info"): void => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, message, type }]);

        // Auto-remover notificación después de 5 segundos
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 5000);
    };

    // Función para parsear el archivo TXT
    const parseTxtFile = (content: string): ParsedRow[] => {
        const lines = content.split('\n');
        const data: ParsedRow[] = [];

        if (lines.length === 0) return data;

        // Asumimos que la primera línea son los encabezados
        const headers = lines[0].split('\t');

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const values = line.split('\t');
            const row: ParsedRow = {
                Rama: "",
                Cuenta: "",
                Propiedad: "",
                Valor: ""
            };

            headers.forEach((header, index) => {
                if (values[index]) {
                    const headerKey = header.trim() as keyof ParsedRow;
                    row[headerKey] = values[index].trim();
                }
            });

            // Solo agregar filas que tengan datos mínimos
            if (row.Cuenta && row.Propiedad && row.Valor) {
                data.push(row);
            }
        }

        return data;
    };

    // Manejar la carga del archivo
    const handleFileUpload = (e: ChangeEvent<HTMLInputElement>): void => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event: ProgressEvent<FileReader>) => {
            const content = event.target?.result as string;
            setFileContent(content);
            const parsed = parseTxtFile(content);
            setParsedData(parsed);
            showNotification(`${parsed.length} registros cargados exitosamente`, "success");
        };
        reader.readAsText(file);
    };
    const getAuthToken = async (): Promise<string | null> => {
        try {
            // Primero buscar en cookies
            let token = getCookie("token");

            // Si no hay token en cookies, buscar en localStorage
            if (!token) {
                const userData = getLocalStorageItem(USER_DATA_KEY);

                // userData es un objeto, necesitamos extraer el token
                if (userData && typeof userData === "object" && userData.token) {
                    token = userData.token;
                }
            }

            return token;
        } catch (error) {
            console.error("Error obteniendo token:", error);
            return null;
        }
    };
    // Función para hacer llamadas API
    const apiRequest = async (url: string, method: string, data: UpdateRequest): Promise<ApiResponse> => {
        try {
            const token = await getAuthToken();

            const headers: HeadersInit = {
                'Content-Type': 'application/json',
            };

            // Agregar token a los headers si existe
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(url, {
                method: method,
                headers,
                body: JSON.stringify(data)
            });

            return {
                ok: response.ok,
                status: response.status,
                statusText: response.statusText,
                data: await response.json()
            };
        } catch (error) {
            return {
                ok: false,
                error: error instanceof Error ? error.message : "Error desconocido"
            };
        }
    };

    // Función para procesar actualizaciones
    const processUpdates = async (): Promise<void> => {
        if (parsedData.length === 0) {
            showNotification("No hay datos para procesar", "error");
            return;
        }

        setIsUploading(true);
        setUploadProgress(0);
        setStatus("Iniciando actualización...");
        setErrors([]);

        let successCount = 0;
        let errorCount = 0;
        const errorList: ApiError[] = [];

        // Procesar cada registro
        for (let i = 0; i < parsedData.length; i++) {
            const row = parsedData[i];

            // Preparar el request
            const updateRequest: UpdateRequest = {
                Data: {
                    Valor: parseFloat(row.Valor) || 0
                },
                Filtros: {
                    Filtros: [
                        {
                            Key: "Cuenta",
                            Value: row.Cuenta,
                            Operator: "="
                        },
                        {
                            Key: "Propiedad",
                            Value: row.Propiedad,
                            Operator: "="
                        }
                    ]
                }
            };

            // Añadir Rama si existe en los datos
            if (row.Rama) {
                updateRequest.Filtros.Filtros.push({
                    Key: "Rama",
                    Value: row.Rama,
                    Operator: "="
                });
            }

            const { api_int: apiUrl } = EnvConfig();
            // Realizar la llamada API
            const response = await apiRequest(
                `${apiUrl}/v1/update/${tableName}`,
                "PUT",
                updateRequest
            );

            if (response.ok) {
                successCount++;
            } else {
                errorCount++;
                errorList.push({
                    row: i + 1,
                    cuenta: row.Cuenta,
                    propiedad: row.Propiedad,
                    error: response.error || response.statusText || "Error desconocido"
                });
            }

            // Actualizar progreso
            const progress = Math.round(((i + 1) / parsedData.length) * 100);
            setUploadProgress(progress);
            setStatus(`Procesando ${i + 1} de ${parsedData.length} registros...`);

            // Pequeño delay para no saturar el servidor
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        setIsUploading(false);
        setStatus(`Proceso completado. Éxitos: ${successCount}, Errores: ${errorCount}`);
        setErrors(errorList);

        if (errorCount > 0) {
            showNotification(`Se encontraron ${errorCount} errores`, "error");
        } else {
            showNotification(`Todos los ${successCount} registros fueron actualizados exitosamente`, "success");
        }
    };

    // Vista previa de los datos
    const renderPreview = () => {
        if (parsedData.length === 0) {
            return <p className="text-gray-500">No hay datos cargados</p>;
        }

        const headers = Object.keys(parsedData[0]);

        return (
            <div className="mt-4">
                <h3 className="font-semibold text-lg mb-2">Vista previa (primeras 5 filas):</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200">
                        <thead>
                            <tr className="bg-gray-50">
                                {headers.map((header) => (
                                    <th key={header} className="px-4 py-2 border text-left font-semibold">
                                        {header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {parsedData.slice(0, 5).map((row, index) => (
                                <tr key={index} className="hover:bg-gray-50">
                                    {headers.map((header, cellIndex) => (
                                        <td key={cellIndex} className="px-4 py-2 border">
                                            {row[header]}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {parsedData.length > 5 && (
                        <p className="text-sm text-gray-500 mt-2">
                            Mostrando 5 de {parsedData.length} registros
                        </p>
                    )}
                </div>
            </div>
        );
    };

    // Renderizar notificaciones
    const renderNotifications = () => {
        if (notifications.length === 0) return null;

        return (
            <div className="fixed top-20 right-4 z-50 space-y-2">
                {notifications.map((notification) => (
                    <div
                        key={notification.id}
                        className={`p-4 rounded-lg shadow-lg border ${notification.type === 'success'
                            ? 'bg-green-50 border-green-200 text-green-800'
                            : notification.type === 'error'
                                ? 'bg-red-50 border-red-200 text-red-800'
                                : 'bg-blue-50 border-blue-200 text-blue-800'
                            }`}
                    >
                        <div className="flex items-center">
                            {notification.type === 'success' && (
                                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            )}
                            {notification.type === 'error' && (
                                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            )}
                            <span>{notification.message}</span>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    // Renderizar errores
    const renderErrors = () => {
        if (errors.length === 0) return null;

        return (
            <div className="mt-6">
                <h3 className="font-semibold text-lg text-red-600 mb-2">Errores encontrados:</h3>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-h-60 overflow-y-auto">
                    {errors.map((error, index) => (
                        <div key={index} className="mb-2 pb-2 border-b border-red-100 last:border-0">
                            <p className="text-sm">
                                <span className="font-medium">Fila {error.row}:</span> Cuenta {error.cuenta}, Propiedad {error.propiedad}
                            </p>
                            <p className="text-sm text-red-700">Error: {error.error}</p>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <>
            <Header />
            {renderNotifications()}

            <section className="min-h-screen mx-auto max-w-7xl p-4 md:p-6">
                <h1 className="text-2xl font-bold text-gray-800">Actualizador Masivo de Bonos</h1>
                <p className="text-gray-600 mb-6">Carga un archivo TXT para actualizar los valores de bonos en la base de datos</p>

                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nombre de la tabla
                        </label>
                        <input
                            type="text"
                            value={tableName}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setTableName(e.target.value)}
                            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="general"
                        />
                        <p className="text-sm text-gray-500 mt-1">
                            Tabla en la base de datos donde se actualizarán los datos
                        </p>
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Cargar archivo TXT
                        </label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                            <input
                                type="file"
                                accept=".txt"
                                onChange={handleFileUpload}
                                className="hidden"
                                id="file-upload"
                            />
                            <label
                                htmlFor="file-upload"
                                className="cursor-pointer inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                                Seleccionar archivo
                            </label>
                            <p className="text-sm text-gray-500 mt-2">
                                Formato requerido: TXT con columnas separadas por tabulaciones (Rama, Cuenta, Propiedad, Valor)
                            </p>
                            {parsedData.length > 0 && (
                                <p className="text-green-600 font-medium mt-2">
                                    ✓ {parsedData.length} registros cargados exitosamente
                                </p>
                            )}
                        </div>
                    </div>

                    {renderPreview()}

                    {parsedData.length > 0 && (
                        <div className="mt-8">
                            <div className="flex flex-col md:flex-row gap-4">
                                <button
                                    onClick={processUpdates}
                                    disabled={isUploading}
                                    className={`px-6 py-3 font-medium rounded-md transition-colors ${isUploading
                                        ? "bg-gray-300 cursor-not-allowed"
                                        : "bg-green-600 hover:bg-green-700 text-white"
                                        }`}
                                >
                                    {isUploading ? "Procesando..." : "Iniciar Actualización Masiva"}
                                </button>

                                <button
                                    onClick={() => {
                                        setFileContent("");
                                        setParsedData([]);
                                        setUploadProgress(0);
                                        setStatus("");
                                        setErrors([]);
                                    }}
                                    className="px-6 py-3 font-medium bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition-colors"
                                >
                                    Limpiar Datos
                                </button>
                            </div>

                            {isUploading && (
                                <div className="mt-6">
                                    <div className="flex justify-between mb-2">
                                        <span className="text-sm font-medium">Progreso</span>
                                        <span className="text-sm font-medium">{uploadProgress}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-4">
                                        <div
                                            className="bg-blue-600 h-4 rounded-full transition-all duration-300"
                                            style={{ width: `${uploadProgress}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-2">{status}</p>
                                </div>
                            )}

                            {!isUploading && status && (
                                <div className="mt-4 p-4 bg-gray-50 rounded-md">
                                    <p className="font-medium">{status}</p>
                                </div>
                            )}

                            {renderErrors()}
                        </div>
                    )}
                </div>

                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-yellow-700">
                                <strong>Importante:</strong> Esta operación actualizará los registros existentes en la base de datos.
                                Asegúrate de que el formato del archivo sea correcto antes de proceder.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
            <Footer />
        </>
    );
};

export default Page;