"use client";

import Footer from "@/template/footer";
import Header from "@/template/header";
import { EnvConfig } from "@/utils/constants/env.config";
import { getCookie } from "@/utils/functions/cookies";
import { getLocalStorageItem } from "@/utils/functions/local-storage";
import { useState, ChangeEvent, FormEvent } from "react";

const USER_DATA_KEY = "userData";

// ============================================================================
// Tipos
// ============================================================================

interface Filter {
Key: string;
Value: string;
Operator?: string;
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
// Componente
// ============================================================================

const Page = () => {
const [activeTab, setActiveTab] = useState<"registrar" | "actualizarMasivo">("registrar");
const [notifications, setNotifications] = useState<Notification[]>([]);
const [isLoading, setIsLoading] = useState(false);

// ── REGISTRAR (NUEVO) ─────────────────────────────────────
const [regTable, setRegTable] = useState("ArtUnidad");
const [regItems, setRegItems] = useState<any[]>([
    {
        Articulo: "",
        Unidad: "Pieza",
        Factor: 1,
        Peso: null,
        Volumen: null,
        AltoTarima: null,
        LargoTarima: null,
        AnchoTarima: null,
        CantidadUnidadTarima: null,
        CantidadCamaTarima: null,
        FactorAduana: null,
        CartaPorteCveUnidadPeso: null,
        CartaPorteAlto: null,
        CartaPorteLargo: null,
        CartaPorteAncho: null,
        CartaPorteVolumen: null,
        CartaPorteTipoEmbalaje: null
    }
]);
const [regResult, setRegResult] = useState<any>(null);

// ── MASIVO ───────────────────────────────────────────────
const [parsedData, setParsedData] = useState<any[]>([]);
const [uploadProgress, setUploadProgress] = useState(0);
const [massiveStatus, setMassiveStatus] = useState("");
const [massiveErrors, setMassiveErrors] = useState<any[]>([]);

// ========================================================================
// Helpers
// ========================================================================

const showNotification = (message: string, type: Notification["type"] = "info") => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4000);
};

const getAuthToken = async () => {
    let token = getCookie("token");
    if (!token) {
        const userData = getLocalStorageItem(USER_DATA_KEY);
        token = userData?.token;
    }
    return token;
};

const apiRequest = async (url: string, method: string, body?: any) => {
    const token = await getAuthToken();

    const headers: HeadersInit = {
        "Content-Type": "application/json",
    };

    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data?.message || "Error en request");
    }

    return data;
};

// ========================================================================
// REGISTRAR (MULTI)
// ========================================================================

const addRegItem = () => {
    setRegItems([...regItems, { ...regItems[0] }]);
};

const removeRegItem = (idx: number) => {
    setRegItems(regItems.filter((_, i) => i !== idx));
};

const updateRegItem = (idx: number, field: string, value: any) => {
    const newItems = [...regItems];
    newItems[idx][field] = value === "" ? null : value;
    setRegItems(newItems);
};

const handleRegistrar = async (e: FormEvent) => {
    e.preventDefault();

    if (regItems.length === 0) {
        showNotification("No hay registros", "error");
        return;
    }

    setIsLoading(true);

    let success = 0;
    let errors: any[] = [];

    try {
        const { api_int } = EnvConfig();
        const url = `${api_int}v1/register?table=${encodeURIComponent(regTable)}`;

        for (let i = 0; i < regItems.length; i++) {
            try {
                await apiRequest(url, "POST", regItems[i]);
                success++;
            } catch (err: any) {
                errors.push({ index: i, error: err.message });
            }
        }

        setRegResult({ success, errors });

        if (errors.length === 0) {
            showNotification(`✅ ${success} insertados`, "success");
        } else {
            showNotification(`⚠️ ${errors.length} errores`, "error");
        }

    } catch (err: any) {
        showNotification(err.message, "error");
    } finally {
        setIsLoading(false);
    }
};

// ========================================================================
// MASIVO (YA EXISTENTE)
// ========================================================================

const parseTxtFile = (content: string): any[] => {
    const lines = content.split("\n");
    const headers = lines[0].split("\t");

    return lines.slice(1).map((line) => {
        const values = line.split("\t");
        const obj: any = {};
        headers.forEach((h, i) => (obj[h] = values[i]));
        return obj;
    });
};

const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const text = e.target?.result as string;
        setParsedData(parseTxtFile(text));
    };
    reader.readAsText(file);
};

const processMassiveUpdates = async () => {
    setIsLoading(true);

    let success = 0;
    let errors: any[] = [];

    const { api_int } = EnvConfig();
    const url = `${api_int}v1/update/general`;

    for (let i = 0; i < parsedData.length; i++) {
        try {
            await apiRequest(url, "PUT", parsedData[i]);
            success++;
        } catch (err: any) {
            errors.push(err.message);
        }

        setUploadProgress(Math.round(((i + 1) / parsedData.length) * 100));
    }

    setMassiveStatus(`OK: ${success} / ERR: ${errors.length}`);
    setMassiveErrors(errors);
    setIsLoading(false);
};

// ========================================================================
// UI
// ========================================================================

return (
    <>
        <Header />

        <div className="p-6 max-w-6xl mx-auto">

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
                <button onClick={() => setActiveTab("registrar")} className="bg-green-600 text-white px-4 py-2 rounded">
                    Registrar
                </button>
                <button onClick={() => setActiveTab("actualizarMasivo")} className="bg-orange-600 text-white px-4 py-2 rounded">
                    Masivo
                </button>
            </div>

            {/* REGISTRAR */}
            {activeTab === "registrar" && (
                <form onSubmit={handleRegistrar} className="space-y-4">

                    <input
                        value={regTable}
                        onChange={(e) => setRegTable(e.target.value)}
                        className="border p-2 w-full"
                    />

                    {regItems.map((item, idx) => (
                        <div key={idx} className="border p-4 rounded">

                            <div className="flex justify-between">
                                <b>Registro #{idx + 1}</b>
                                <button type="button" onClick={() => removeRegItem(idx)}>❌</button>
                            </div>

                            <div className="grid grid-cols-3 gap-2 mt-2">

                                <input placeholder="Articulo"
                                    value={item.Articulo}
                                    onChange={(e) => updateRegItem(idx, "Articulo", e.target.value)}
                                    className="border p-1"
                                />

                                <input placeholder="Unidad"
                                    value={item.Unidad}
                                    onChange={(e) => updateRegItem(idx, "Unidad", e.target.value)}
                                    className="border p-1"
                                />

                                <input type="number" placeholder="Factor"
                                    value={item.Factor}
                                    onChange={(e) => updateRegItem(idx, "Factor", Number(e.target.value))}
                                    className="border p-1"
                                />

                            </div>
                        </div>
                    ))}

                    <button type="button" onClick={addRegItem} className="text-blue-600">
                        + Agregar
                    </button>

                    <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">
                        {isLoading ? "Insertando..." : "Registrar"}
                    </button>

                    {regResult && (
                        <pre className="bg-gray-100 p-2 mt-2">
                            {JSON.stringify(regResult, null, 2)}
                        </pre>
                    )}

                </form>
            )}

            {/* MASIVO */}
            {activeTab === "actualizarMasivo" && (
                <div>
                    <input type="file" onChange={handleFileUpload} />
                    <button onClick={processMassiveUpdates} className="bg-orange-600 text-white px-4 py-2">
                        Ejecutar
                    </button>

                    <div>{uploadProgress}%</div>
                    <div>{massiveStatus}</div>
                </div>
            )}

        </div>

        <Footer />
    </>
);

};

export default Page;
