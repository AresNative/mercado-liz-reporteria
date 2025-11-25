// components/SalesReport.tsx - VERSION MEJORADA & CORREGIDA
import { useState, useEffect, useCallback } from "react";
import { useMasivoQuery } from "../hooks/useMasivoQuery";

interface SalesData {
    Codigo: string;
    Cliente: string;
    Articulo: string;
    Nombre: string;
    Categoria: string;
    ImporteTotal: number;
    CostoTotal: number;
    Cantidad: number;
    FechaEmision: string;
    Almacen: string;
}

interface Stats {
    totalVentas: number;
    totalCosto: number;
    utilidad: number;
}

export const SalesReport = ({
    fechaInicio,
    fechaFin
}: {
    fechaInicio: string;
    fechaFin: string;
}) => {
    const { query, quickQuery, loading, error } = useMasivoQuery();

    const [useQuickQuery, setUseQuickQuery] = useState(false);
    const [salesData, setSalesData] = useState<SalesData[]>([]);
    const [stats, setStats] = useState<Stats>({
        totalVentas: 0,
        totalCosto: 0,
        utilidad: 0
    });

    // -----------------------------
    // 🔧 GENERADOR DE QUERIES
    // -----------------------------
    const buildQuery = useCallback(() => {
        const base = `
            VENTAD AS INVD
            INNER JOIN VENTA AS INV ON INVD.ID = INV.ID
            LEFT JOIN ART AS ART ON INVD.Articulo = ART.Articulo
            LEFT JOIN Cte AS C ON INV.Cliente = C.Cliente
        `;

        const commonFilters = [
            { Key: "INV.FechaEmision", Operator: ">=", Value: fechaInicio },
            { Key: "INV.FechaEmision", Operator: "<=", Value: fechaFin },
            { Key: "INV.Estatus", Operator: "=", Value: "CONCLUIDO" }
        ];

        const commonSelects = [
            { Key: "INVD.Codigo" },
            { Key: "C.Nombre", Alias: "Cliente" },
            { Key: "INVD.Articulo" },
            { Key: "ART.Descripcion1", Alias: "Nombre" },
            { Key: "ART.Categoria" },
            { Key: "INVD.Cantidad" },
            { Key: "INV.FechaEmision" },
            { Key: "INVD.Almacen" }
        ];

        // 🔥 MODO NORMAL = cálculos directos
        if (!useQuickQuery) {
            return {
                Table: base,
                Page: 1,
                PageSize: 40,
                Filtros: {
                    Filtros: commonFilters,
                    Selects: [
                        ...commonSelects,
                        { Key: "(INVD.Precio * INVD.Cantidad)", Alias: "ImporteTotal" },
                        { Key: "(INVD.Costo * INVD.Cantidad)", Alias: "CostoTotal" }
                    ],
                    Agregaciones: [],
                    Order: [{ Key: "INV.FechaEmision", Direction: "DESC" }]
                },
                IncludeTotalCount: false
            };
        }

        // ⚡ MODO RÁPIDO = menos columnas para respuesta ultra rápida
        return {
            Table: base,
            Page: 1,
            PageSize: 20,
            Filtros: {
                Filtros: commonFilters,
                Selects: [
                    ...commonSelects,
                    { Key: "INVD.Precio", Alias: "PrecioUnitario" },
                    { Key: "INVD.Costo", Alias: "CostoUnitario" }
                ],
                Agregaciones: [],
                Order: [{ Key: "INV.FechaEmision", Direction: "DESC" }]
            },
            IncludeTotalCount: false
        };
    }, [fechaInicio, fechaFin, useQuickQuery]);

    // -----------------------------
    // 📦 NORMALIZADOR DE DATOS
    // -----------------------------
    const normalizeData = (raw: any[]): SalesData[] => {
        return raw.map((item) => {
            const cantidad = parseInt(item.Cantidad) || 0;

            const precio =
                parseFloat(item.ImporteTotal) ||
                (parseFloat(item.PrecioUnitario) || 0) * cantidad;

            const costo =
                parseFloat(item.CostoTotal) ||
                (parseFloat(item.CostoUnitario) || 0) * cantidad;

            return {
                Codigo: item.Codigo,
                Cliente: item.Cliente,
                Articulo: item.Articulo,
                Nombre: item.Nombre,
                Categoria: item.Categoria,
                FechaEmision: item.FechaEmision,
                Almacen: item.Almacen,
                Cantidad: cantidad,
                ImporteTotal: precio,
                CostoTotal: costo
            };
        });
    };

    // -----------------------------
    // 📊 CALCULO DE ESTADÍSTICAS
    // -----------------------------
    const calculateStats = (data: SalesData[]) => {
        const totalVentas = data.reduce((s, d) => s + d.ImporteTotal, 0);
        const totalCosto = data.reduce((s, d) => s + d.CostoTotal, 0);

        setStats({
            totalVentas,
            totalCosto,
            utilidad: totalVentas - totalCosto
        });
    };

    // -----------------------------
    // 🚀 CARGA PRINCIPAL
    // -----------------------------
    const loadSalesReport = useCallback(async () => {
        try {
            const cfg = buildQuery();
            const fn = useQuickQuery ? quickQuery : query;

            const response = await fn(cfg);

            if (!response?.data || !Array.isArray(response.data)) {
                setSalesData([]);
                return;
            }

            const processed = normalizeData(response.data);

            setSalesData(processed);
            calculateStats(processed);
        } catch (e: any) {
            console.error("Error loading:", e);

            if (e?.message?.includes("GROUP BY") && !useQuickQuery) {
                setUseQuickQuery(true);
            }
        }
    }, [query, quickQuery, buildQuery, useQuickQuery]);

    // -----------------------------
    // ⏱️ DISPARAR CARGA AL CAMBIAR FECHAS
    // -----------------------------
    useEffect(() => {
        if (fechaInicio && fechaFin) {
            setSalesData([]);
            setUseQuickQuery(false);
            loadSalesReport();
        }
    }, [fechaInicio, fechaFin, loadSalesReport]);

    // -----------------------------
    // BOTÓN PARA CAMBIAR ESTRATEGIA
    // -----------------------------
    const reloadWithStrategy = (mode: "normal" | "quick") => {
        setUseQuickQuery(mode === "quick");
        setSalesData([]);
        loadSalesReport();
    };

    // ---------------------------------------------------
    // ------------------ RENDER --------------------------
    // ---------------------------------------------------

    if (loading) {
        return (
            <div className="flex flex-col items-center py-10">
                <div className="animate-spin h-10 w-10 border-b-2 border-blue-600 rounded-full"></div>
                <p className="mt-4 text-gray-600">
                    {useQuickQuery ? "Cargando (modo rápido)..." : "Cargando ventas..."}
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">

            {/* Estrategia */}
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                    <div>
                        <h4 className="font-semibold text-blue-800">Modo de consulta</h4>
                        <p className="text-sm text-blue-600">
                            {useQuickQuery
                                ? "Rápido: más veloz, menos columnas"
                                : "Completo: datos detallados"}
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => reloadWithStrategy("normal")}
                            className={`px-3 py-1 text-sm rounded ${!useQuickQuery
                                ? "bg-blue-600 text-white"
                                : "bg-white border border-blue-300 text-blue-600"
                                }`}
                        >
                            Completo
                        </button>

                        <button
                            onClick={() => reloadWithStrategy("quick")}
                            className={`px-3 py-1 text-sm rounded ${useQuickQuery
                                ? "bg-green-600 text-white"
                                : "bg-white border border-green-300 text-green-700"
                                }`}
                        >
                            Rápido
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard title="Ventas Totales" value={stats.totalVentas} format="currency" color="green" />
                <StatCard title="Costo Total" value={stats.totalCosto} format="currency" color="blue" />
                <StatCard
                    title="Utilidad"
                    value={stats.utilidad}
                    format="currency"
                    color={stats.utilidad >= 0 ? "green" : "red"}
                />
            </div>

            {/* Tabla */}
            <div className="bg-white border rounded-lg overflow-hidden">
                {salesData.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">No hay datos</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                                <tr>
                                    <th className="px-4 py-2">Fecha</th>
                                    <th className="px-4 py-2">Cliente</th>
                                    <th className="px-4 py-2">Producto</th>
                                    <th className="px-4 py-2">Cantidad</th>
                                    <th className="px-4 py-2">Venta</th>
                                    <th className="px-4 py-2">Costo</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y text-sm">
                                {salesData.map((row, i) => (
                                    <tr key={i} className="hover:bg-gray-50">
                                        <td className="px-4 py-2">
                                            {new Date(row.FechaEmision).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-2">{row.Cliente}</td>
                                        <td className="px-4 py-2">{row.Nombre}</td>
                                        <td className="px-4 py-2">{row.Cantidad}</td>
                                        <td className="px-4 py-2 text-green-700">
                                            ${row.ImporteTotal.toFixed(2)}
                                        </td>
                                        <td className="px-4 py-2 text-blue-700">
                                            ${row.CostoTotal.toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

// ---------------------------------------------------
// Tarjeta de estadística
// ---------------------------------------------------
const StatCard = ({
    title,
    value,
    format,
    color
}: {
    title: string;
    value: number;
    format: "currency" | "number";
    color: string;
}) => {
    const formatted =
        format === "currency" ? `$${value?.toFixed(2)}` : value.toString();

    return (
        <div className="bg-white border rounded-lg p-4">
            <p className="text-gray-600 text-sm">{title}</p>
            <p className={`text-2xl font-bold text-${color}-600`}>
                {formatted}
            </p>
        </div>
    );
};
