"use client";

import Footer from "@/template/footer";
import Header from "@/template/header";
import { EnvConfig } from "@/utils/constants/env.config";
import { getCookie } from "@/utils/functions/cookies";
import { getLocalStorageItem } from "@/utils/functions/local-storage";
import { useState, ChangeEvent, FormEvent } from "react";

const USER_DATA_KEY = "userData";

// ============================================================================
// Tipos e interfaces (coinciden con el backend)
// ============================================================================

interface Filter {
    Key: string;
    Value: string;
    Operator?: string;
}

interface SelectItem {
    Key: string;
    Alias?: string;
}

interface AgregacionItem {
    Key: string;
    Operation?: string;
    Alias?: string;
}

interface OrderItem {
    Key: string;
    Direction?: string;
}

interface FiltrosRequest {
    Selects?: SelectItem[];
    Agregaciones?: AgregacionItem[];
    Filtros?: Filter[];
    FiltrosAnd?: { OperadorLogico: string; Filtros: Filter[] }[];
    FiltrosOr?: { OperadorLogico: string; Filtros: Filter[] }[];
    Order?: OrderItem[];
    Having?: Filter[];
    Page?: number;
    PageSize?: number;
}

interface ActualizarRequest {
    Data: Record<string, any>;
    Filtros: Filter[];
}

interface Notification {
    id: number;
    message: string;
    type: "success" | "error" | "info";
}

// ============================================================================
// Componente principal
// ============================================================================

const Page = () => {
    // Estado global
    const [activeTab, setActiveTab] = useState<
        "consultaId" | "consultaAvanzada" | "registrar" | "actualizarMasivo" | "archivar" | "eliminar"
    >("actualizarMasivo");
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // ── Consulta por ID ──────────────────────────────────────────────────────
    const [consultaIdTable, setConsultaIdTable] = useState("general");
    const [consultaIdColumn, setConsultaIdColumn] = useState("id");
    const [consultaIdValue, setConsultaIdValue] = useState("");
    const [consultaIdResult, setConsultaIdResult] = useState<any>(null);

    // ── Consulta avanzada ───────────────────────────────────────────────────
    const [advFromClause, setAdvFromClause] = useState("");
    const [advPage, setAdvPage] = useState(1);
    const [advPageSize, setAdvPageSize] = useState(10);
    const [advFilters, setAdvFilters] = useState<Filter[]>([{ Key: "", Value: "", Operator: "=" }]);
    const [advResult, setAdvResult] = useState<any>(null);

    // ── Registrar ───────────────────────────────────────────────────────────
    const [regTable, setRegTable] = useState("general");
    const [regJson, setRegJson] = useState("{\n  \"campo\": \"valor\"\n}");
    const [regResult, setRegResult] = useState<any>(null);

    // ── Actualización masiva (original) ─────────────────────────────────────
    const [fileContent, setFileContent] = useState<string>("");
    const [parsedData, setParsedData] = useState<any[]>([]);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [massiveTable, setMassiveTable] = useState("general");
    const [massiveStatus, setMassiveStatus] = useState("");
    const [massiveErrors, setMassiveErrors] = useState<any[]>([]);

    // ── Archivar / Eliminar ─────────────────────────────────────────────────
    const [deleteTable, setDeleteTable] = useState("general");
    const [deleteColumn, setDeleteColumn] = useState("id");
    const [deleteId, setDeleteId] = useState("");
    const [deleteResult, setDeleteResult] = useState<any>(null);

    // ============================================================================
    // Helpers
    // ============================================================================

    const showNotification = (message: string, type: Notification["type"] = "info") => {
        const id = Date.now();
        setNotifications((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setNotifications((prev) => prev.filter((n) => n.id !== id));
        }, 5000);
    };

    const getAuthToken = async (): Promise<string | null> => {
        try {
            let token = getCookie("token");
            if (!token) {
                const userData = getLocalStorageItem(USER_DATA_KEY);
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

    const apiRequest = async (url: string, method: string, body?: any) => {
        const token = await getAuthToken();
        const headers: HeadersInit = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const response = await fetch(url, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
        });

        let data = null;
        try {
            data = await response.json();
        } catch {
            // sin body
        }

        if (!response.ok) {
            throw new Error(data?.Message || data?.message || response.statusText);
        }
        return data;
    };

    // ============================================================================
    // Manejadores específicos
    // ============================================================================

    // ── Consulta por ID ──────────────────────────────────────────────────────
    const handleConsultaId = async (e: FormEvent) => {
        e.preventDefault();
        if (!consultaIdValue) {
            showNotification("Ingrese un valor ID", "error");
            return;
        }
        setIsLoading(true);
        try {
            const { api_int } = EnvConfig();
            const url = `${api_int}/v1/consultar/${encodeURIComponent(consultaIdValue)}?table=${encodeURIComponent(consultaIdTable)}&column=${encodeURIComponent(consultaIdColumn)}`;
            const data = await apiRequest(url, "GET");
            setConsultaIdResult(data);
            showNotification("Consulta exitosa", "success");
        } catch (err: any) {
            showNotification(err.message, "error");
            setConsultaIdResult({ error: err.message });
        } finally {
            setIsLoading(false);
        }
    };

    // ── Consulta avanzada ────────────────────────────────────────────────────
    const handleConsultaAvanzada = async (e: FormEvent) => {
        e.preventDefault();
        if (!advFromClause.trim()) {
            showNotification("El campo FROM clause es obligatorio", "error");
            return;
        }
        setIsLoading(true);
        try {
            const body: FiltrosRequest = {
                Page: advPage,
                PageSize: advPageSize,
                Filtros: advFilters.filter((f) => f.Key && f.Value),
            };
            const { api_int } = EnvConfig();
            const url = `${api_int}/v1/consultar?fromClause=${encodeURIComponent(advFromClause)}`;
            const data = await apiRequest(url, "POST", body);
            setAdvResult(data);
            showNotification("Consulta avanzada exitosa", "success");
        } catch (err: any) {
            showNotification(err.message, "error");
            setAdvResult({ error: err.message });
        } finally {
            setIsLoading(false);
        }
    };

    const addAdvFilter = () => {
        setAdvFilters([...advFilters, { Key: "", Value: "", Operator: "=" }]);
    };
    const removeAdvFilter = (idx: number) => {
        setAdvFilters(advFilters.filter((_, i) => i !== idx));
    };
    const updateAdvFilter = (idx: number, field: keyof Filter, value: string) => {
        const newFilters = [...advFilters];
        newFilters[idx][field] = value;
        setAdvFilters(newFilters);
    };

    // ── Registrar ────────────────────────────────────────────────────────────
   const handleRegistrar = async (e: FormEvent) => {
    e.preventDefault();

    let jsonData;
    try {
        jsonData = JSON.parse(regJson);
    } catch {
        showNotification("JSON inválido", "error");
        return;
    }

    setIsLoading(true);

    try {
        const { api_int } = EnvConfig();
        const url = `${api_int}/v1/register?table=${encodeURIComponent(regTable)}`;

        // 👉 Caso 1: Array = múltiples inserts
        if (Array.isArray(jsonData)) {
            let success = 0;
            let errors: any[] = [];

            for (let i = 0; i < jsonData.length; i++) {
                const item = jsonData[i];

                try {
                    await apiRequest(url, "POST", item);
                    success++;
                } catch (err: any) {
                    errors.push({
                        index: i,
                        error: err.message,
                        data: item,
                    });
                }
            }

            setRegResult({
                total: jsonData.length,
                success,
                errors,
            });

            if (errors.length === 0) {
                showNotification(`Todos los registros fueron insertados (${success})`, "success");
            } else {
                showNotification(`${success} insertados, ${errors.length} errores`, "error");
            }

        } else {
            // 👉 Caso 2: Objeto normal
            const data = await apiRequest(url, "POST", jsonData);
            setRegResult(data);
            showNotification("Registro insertado", "success");
        }

    } catch (err: any) {
        showNotification(err.message, "error");
        setRegResult({ error: err.message });
    } finally {
        setIsLoading(false);
    }
};

    // ── Actualización masiva (desde archivo TXT) ────────────────────────────
    const parseTxtFile = (content: string): any[] => {
        const lines = content.split("\n");
        if (lines.length === 0) return [];
        const headers = lines[0].split("\t");
        const data: any[] = [];
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            const values = line.split("\t");
            const row: any = {};
            headers.forEach((header, idx) => {
                row[header.trim()] = values[idx]?.trim() || "";
            });
            if (row.Cuenta && row.Propiedad) data.push(row);
        }
        return data;
    };

    const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            setFileContent(content);
            const parsed = parseTxtFile(content);
            setParsedData(parsed);
            showNotification(`${parsed.length} registros cargados`, "success");
        };
        reader.readAsText(file);
    };

    const processMassiveUpdates = async () => {
        if (parsedData.length === 0) {
            showNotification("No hay datos cargados", "error");
            return;
        }
        setIsLoading(true);
        setUploadProgress(0);
        setMassiveStatus("Iniciando...");
        setMassiveErrors([]);
        let success = 0;
        let errors: any[] = [];
        const { api_int } = EnvConfig();
        const baseUrl = `${api_int}v1/update/${encodeURIComponent(massiveTable)}`;

        for (let i = 0; i < parsedData.length; i++) {
            const row = parsedData[i];
            const updateRequest: ActualizarRequest = {
                Filtros: [
                    {
                        Key: "Articulo",
                        Value: row.Articulo,
                        Operator: "="
                    }
                ],
                Data: Object.fromEntries(
                    Object.entries(row)
                        .filter(([k]) => k !== "Articulo")
                        .map(([k, v]) => [k, Number(v) || 0])
                )
            };
            try {
                await apiRequest(baseUrl, "PUT", updateRequest);
                success++;
            } catch (err: any) {
                errors.push({ row: i + 1, cuenta: row.Cuenta, propiedad: row.Propiedad, error: err.message });
            }
            const progress = Math.round(((i + 1) / parsedData.length) * 100);
            setUploadProgress(progress);
            setMassiveStatus(`Procesando ${i + 1} de ${parsedData.length}`);
            await new Promise((r) => setTimeout(r, 100));
        }
        setIsLoading(false);
        setMassiveStatus(`Completado. Éxitos: ${success}, Errores: ${errors.length}`);
        setMassiveErrors(errors);
        if (errors.length === 0) {
            showNotification("Todos los registros fueron actualizados", "success");
        } else {
            showNotification(`${errors.length} errores encontrados`, "error");
        }
    };

    // ── Archivar / Eliminar ──────────────────────────────────────────────────
    const handleArchive = async () => {
        if (!deleteId) {
            showNotification("Ingrese un ID", "error");
            return;
        }
        setIsLoading(true);
        try {
            const { api_int } = EnvConfig();
            const url = `${api_int}v1/archivar/${encodeURIComponent(deleteId)}?table=${encodeURIComponent(deleteTable)}&column=${encodeURIComponent(deleteColumn)}`;
            const data = await apiRequest(url, "DELETE");
            setDeleteResult(data);
            showNotification("Registro archivado", "success");
        } catch (err: any) {
            showNotification(err.message, "error");
            setDeleteResult({ error: err.message });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) {
            showNotification("Ingrese un ID", "error");
            return;
        }
        setIsLoading(true);
        try {
            const { api_int } = EnvConfig();
            const url = `${api_int}v1/delete/${encodeURIComponent(deleteId)}?table=${encodeURIComponent(deleteTable)}&column=${encodeURIComponent(deleteColumn)}`;
            const data = await apiRequest(url, "DELETE");
            setDeleteResult(data);
            showNotification("Registro eliminado permanentemente", "success");
        } catch (err: any) {
            showNotification(err.message, "error");
            setDeleteResult({ error: err.message });
        } finally {
            setIsLoading(false);
        }
    };

    // ============================================================================
    // Renderizado
    // ============================================================================

    const renderNotifications = () => (
        <div className="fixed top-20 right-4 z-50 space-y-2">
            {notifications.map((n) => (
                <div
                    key={n.id}
                    className={`p-4 rounded-lg shadow-lg border ${n.type === "success"
                            ? "bg-green-50 border-green-200 text-green-800"
                            : n.type === "error"
                                ? "bg-red-50 border-red-200 text-red-800"
                                : "bg-blue-50 border-blue-200 text-blue-800"
                        }`}
                >
                    {n.message}
                </div>
            ))}
        </div>
    );

    const renderTabButton = (
        id: typeof activeTab,
        label: string,
        color: string = "blue"
    ) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`px-4 py-2 font-medium rounded-t-lg transition-colors ${activeTab === id
                    ? `bg-${color}-600 text-white`
                    : `bg-gray-200 text-gray-700 hover:bg-gray-300`
                }`}
        >
            {label}
        </button>
    );

    return (
        <>
            <Header />
            {renderNotifications()}
            <section className="min-h-screen mx-auto max-w-7xl p-4 md:p-6">
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Panel de Administración</h1>
                <p className="text-gray-600 mb-6">Consume todos los endpoints del API general</p>

                {/* Pestañas */}
                <div className="flex flex-wrap gap-2 border-b mb-6">
                    {renderTabButton("consultaId", "Consultar por ID", "blue")}
                    {renderTabButton("consultaAvanzada", "Consulta avanzada", "purple")}
                    {renderTabButton("registrar", "Registrar", "green")}
                    {renderTabButton("actualizarMasivo", "Actualización masiva", "orange")}
                    {renderTabButton("archivar", "Archivar", "yellow")}
                    {renderTabButton("eliminar", "Eliminar", "red")}
                </div>

                {/* Contenido dinámico */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    {activeTab === "consultaId" && (
                        <form onSubmit={handleConsultaId} className="space-y-4">
                            <h2 className="text-xl font-semibold">Consultar registro por ID</h2>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium">Tabla</label>
                                    <input
                                        type="text"
                                        value={consultaIdTable}
                                        onChange={(e) => setConsultaIdTable(e.target.value)}
                                        className="w-full border rounded p-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium">Columna ID</label>
                                    <input
                                        type="text"
                                        value={consultaIdColumn}
                                        onChange={(e) => setConsultaIdColumn(e.target.value)}
                                        className="w-full border rounded p-2"
                                        placeholder="id"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium">Valor ID</label>
                                    <input
                                        type="text"
                                        value={consultaIdValue}
                                        onChange={(e) => setConsultaIdValue(e.target.value)}
                                        className="w-full border rounded p-2"
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                            >
                                {isLoading ? "Consultando..." : "Consultar"}
                            </button>
                            {consultaIdResult && (
                                <pre className="mt-4 p-2 bg-gray-100 rounded overflow-auto max-h-96">
                                    {JSON.stringify(consultaIdResult, null, 2)}
                                </pre>
                            )}
                        </form>
                    )}

                    {activeTab === "consultaAvanzada" && (
                        <form onSubmit={handleConsultaAvanzada} className="space-y-4">
                            <h2 className="text-xl font-semibold">Consulta avanzada (POST /consultar)</h2>
                            <div>
                                <label className="block text-sm font-medium">FROM clause (ej: MiTabla AS t)</label>
                                <input
                                    type="text"
                                    value={advFromClause}
                                    onChange={(e) => setAdvFromClause(e.target.value)}
                                    className="w-full border rounded p-2"
                                    placeholder="Ej: PersonalPropValor AS p"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label>Página</label>
                                    <input
                                        type="number"
                                        value={advPage}
                                        onChange={(e) => setAdvPage(Number(e.target.value))}
                                        className="w-full border rounded p-2"
                                    />
                                </div>
                                <div>
                                    <label>Filas por página</label>
                                    <input
                                        type="number"
                                        value={advPageSize}
                                        onChange={(e) => setAdvPageSize(Number(e.target.value))}
                                        className="w-full border rounded p-2"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block font-medium mb-2">Filtros (AND entre todos)</label>
                                {advFilters.map((f, idx) => (
                                    <div key={idx} className="flex gap-2 mb-2">
                                        <input
                                            placeholder="Columna"
                                            value={f.Key}
                                            onChange={(e) => updateAdvFilter(idx, "Key", e.target.value)}
                                            className="border rounded p-1 flex-1"
                                        />
                                        <select
                                            value={f.Operator}
                                            onChange={(e) => updateAdvFilter(idx, "Operator", e.target.value)}
                                            className="border rounded p-1"
                                        >
                                            <option value="=">=</option>
                                            <option value="!=">!=</option>
                                            <option value=">">{">"}</option>
                                            <option value=">=">{">="}</option>
                                            <option value="<">{"<"}</option>
                                            <option value="<=">{"<="}</option>
                                            <option value="LIKE">LIKE</option>
                                        </select>
                                        <input
                                            placeholder="Valor"
                                            value={f.Value}
                                            onChange={(e) => updateAdvFilter(idx, "Value", e.target.value)}
                                            className="border rounded p-1 flex-1"
                                        />
                                        <button type="button" onClick={() => removeAdvFilter(idx)} className="text-red-500">
                                            ✖
                                        </button>
                                    </div>
                                ))}
                                <button type="button" onClick={addAdvFilter} className="text-blue-600 text-sm">
                                    + Agregar filtro
                                </button>
                            </div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                            >
                                {isLoading ? "Consultando..." : "Ejecutar consulta"}
                            </button>
                            {advResult && (
                                <pre className="mt-4 p-2 bg-gray-100 rounded overflow-auto max-h-96">
                                    {JSON.stringify(advResult, null, 2)}
                                </pre>
                            )}
                        </form>
                    )}

                    {activeTab === "registrar" && (
                        <form onSubmit={handleRegistrar} className="space-y-4">
                            <h2 className="text-xl font-semibold">Registrar nuevo (POST /register)</h2>
                            <div>
                                <label>Tabla</label>
                                <input
                                    type="text"
                                    value={regTable}
                                    onChange={(e) => setRegTable(e.target.value)}
                                    className="w-full border rounded p-2"
                                />
                            </div>
                            <div>
                                <label>JSON con los datos</label>
                                <textarea
                                    value={regJson}
                                    onChange={(e) => setRegJson(e.target.value)}
                                    rows={6}
                                    className="w-full border rounded p-2 font-mono text-sm"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                            >
                                {isLoading ? "Insertando..." : "Registrar"}
                            </button>
                            {regResult && (
                                <pre className="mt-4 p-2 bg-gray-100 rounded overflow-auto">
                                    {JSON.stringify(regResult, null, 2)}
                                </pre>
                            )}
                        </form>
                    )}

                    {activeTab === "actualizarMasivo" && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold">Actualización masiva desde TXT</h2>
                            <div>
                                <label>Tabla destino</label>
                                <input
                                    type="text"
                                    value={massiveTable}
                                    onChange={(e) => setMassiveTable(e.target.value)}
                                    className="w-full border rounded p-2"
                                />
                            </div>
                            <div className="border-2 border-dashed p-6 text-center">
                                <input type="file" accept=".txt" onChange={handleFileUpload} className="hidden" id="massiveFile" />
                                <label htmlFor="massiveFile" className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded">
                                    Seleccionar archivo TXT
                                </label>
                                {parsedData.length > 0 && (
                                    <p className="mt-2 text-green-600">✓ {parsedData.length} registros cargados</p>
                                )}
                            </div>
                            {parsedData.length > 0 && (
                                <>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full border">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="p-2 border">Cuenta</th>
                                                    <th className="p-2 border">Propiedad</th>
                                                    <th className="p-2 border">Valor</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {parsedData.slice(0, 5).map((row, i) => (
                                                    <tr key={i}>
                                                        <td className="p-2 border">{row.Cuenta}</td>
                                                        <td className="p-2 border">{row.Propiedad}</td>
                                                        <td className="p-2 border">{row.Valor}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <button
                                        onClick={processMassiveUpdates}
                                        disabled={isLoading}
                                        className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
                                    >
                                        {isLoading ? "Procesando..." : "Iniciar actualización masiva"}
                                    </button>
                                    {isLoading && (
                                        <div className="mt-4">
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div className="bg-orange-600 h-2 rounded-full" style={{ width: `${uploadProgress}%` }} />
                                            </div>
                                            <p className="text-sm mt-1">{massiveStatus}</p>
                                        </div>
                                    )}
                                    {massiveErrors.length > 0 && (
                                        <div className="mt-4 p-2 bg-red-50 border border-red-200 rounded">
                                            <p className="font-semibold">Errores:</p>
                                            {massiveErrors.map((err, i) => (
                                                <p key={i} className="text-sm">Fila {err.row}: {err.error}</p>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {activeTab === "archivar" && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold">Archivar registro (DELETE /archivar/{`{id}`})</h2>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label>Tabla</label>
                                    <input value={deleteTable} onChange={(e) => setDeleteTable(e.target.value)} className="w-full border rounded p-2" />
                                </div>
                                <div>
                                    <label>Columna ID</label>
                                    <input value={deleteColumn} onChange={(e) => setDeleteColumn(e.target.value)} className="w-full border rounded p-2" />
                                </div>
                                <div>
                                    <label>Valor ID</label>
                                    <input value={deleteId} onChange={(e) => setDeleteId(e.target.value)} className="w-full border rounded p-2" />
                                </div>
                            </div>
                            <button onClick={handleArchive} className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700">
                                Archivar
                            </button>
                            {deleteResult && <pre className="mt-4 p-2 bg-gray-100 rounded">{JSON.stringify(deleteResult, null, 2)}</pre>}
                        </div>
                    )}

                    {activeTab === "eliminar" && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold">Eliminar registro (DELETE /delete/{`{id}`})</h2>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label>Tabla</label>
                                    <input value={deleteTable} onChange={(e) => setDeleteTable(e.target.value)} className="w-full border rounded p-2" />
                                </div>
                                <div>
                                    <label>Columna ID</label>
                                    <input value={deleteColumn} onChange={(e) => setDeleteColumn(e.target.value)} className="w-full border rounded p-2" />
                                </div>
                                <div>
                                    <label>Valor ID</label>
                                    <input value={deleteId} onChange={(e) => setDeleteId(e.target.value)} className="w-full border rounded p-2" />
                                </div>
                            </div>
                            <button onClick={handleDelete} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
                                Eliminar permanentemente
                            </button>
                            {deleteResult && <pre className="mt-4 p-2 bg-gray-100 rounded">{JSON.stringify(deleteResult, null, 2)}</pre>}
                        </div>
                    )}
                </div>
            </section>
            <Footer />
        </>
    );
};

export default Page;
