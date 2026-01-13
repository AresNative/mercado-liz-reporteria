// components/pdf/PurchaseOrderGenerator.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/button";
import { Download, FileText, Printer, Calendar, AlertCircle, Package, Building } from "lucide-react";
import { generatePurchaseOrderPDF } from "../utils/purchase-order-PDF";

interface PurchaseOrderItem {
    id: string;
    productCode: string;
    description: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    total: number;
    stock: number;
    minStock: number;
    reorderPoint: number;
    supplierCode?: string;
    expirationDate?: string;
    batchNumber?: string;
}

interface PurchaseOrderData {
    orderNumber: string;
    orderDate: string;
    deliveryDate: string;
    validityDate: string;
    supplier: {
        code: string;
        name: string;
        address: string;
        phone: string;
        email: string;
        rfc: string;
    };
    warehouse: {
        code: string;
        name: string;
        address: string;
    };
    items: PurchaseOrderItem[];
    subtotal: number;
    tax: number;
    total: number;
    currency: string;
    terms: string;
    notes: string;
    createdBy: string;
    approvedBy?: string;
}

interface PurchaseOrderGeneratorProps {
    orderData: PurchaseOrderData;
    showPreview?: boolean;
    onDownload?: () => void;
}

export default function PurchaseOrderGenerator({
    orderData,
    showPreview = false,
    onDownload
}: PurchaseOrderGeneratorProps) {
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGeneratePDF = async (action: "download" | "print" = "download") => {
        setIsGenerating(true);

        try {
            await generatePurchaseOrderPDF(orderData, action);

            if (onDownload) {
                onDownload();
            }

        } catch (error) {
            console.error("Error generando PDF:", error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handlePrint = () => {
        handleGeneratePDF("print");
    };

    const handleDownload = () => {
        handleGeneratePDF("download");
    };

    // Calcular saldo necesario para cada ítem
    const calculateBalanceNeeded = (item: PurchaseOrderItem): number => {
        const currentBalance = item.stock;
        const safetyStock = item.minStock + item.reorderPoint;
        return Math.max(0, safetyStock - currentBalance);
    };

    // Verificar si hay ítems con fechas de expiración próximas
    const getExpiringItems = (): PurchaseOrderItem[] => {
        const today = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(today.getDate() + 30);

        return orderData.items.filter(item => {
            if (!item.expirationDate) return false;
            const expDate = new Date(item.expirationDate);
            return expDate <= thirtyDaysFromNow;
        });
    };

    const expiringItems = getExpiringItems();

    return (
        <div className="space-y-6">
            {/* Encabezado con acciones */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                        <FileText className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-gray-800">
                            Orden de Compra #{orderData.orderNumber}
                        </h3>
                        <p className="text-sm text-gray-600">
                            Fecha: {new Date(orderData.orderDate).toLocaleDateString('es-ES')} |
                            Proveedor: {orderData.supplier.name}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    <Button
                        onClick={handleDownload}
                        disabled={isGenerating}
                    >
                        {isGenerating ? (
                            <>
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                Generando...
                            </>
                        ) : (
                            <>
                                <Download className="h-4 w-4" />
                                Descargar PDF
                            </>
                        )}
                    </Button>

                    <Button
                        onClick={handlePrint}
                        disabled={isGenerating}
                    >
                        <Printer className="h-4 w-4" />
                        Imprimir
                    </Button>
                </div>
            </div>

            {/* Alertas importantes */}
            <div className="space-y-3">
                {/* Alertas de saldo */}
                {orderData.items.some(item => calculateBalanceNeeded(item) > 0) && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                            <div className="flex-1">
                                <h4 className="font-semibold text-yellow-800">Atención: Saldos Bajos</h4>
                                <p className="text-sm text-yellow-700 mt-1">
                                    Los siguientes productos requieren atención por saldos bajos:
                                </p>
                                <ul className="mt-2 space-y-1">
                                    {orderData.items
                                        .filter(item => calculateBalanceNeeded(item) > 0)
                                        .map((item, index) => (
                                            <li key={item.id} className="text-sm text-yellow-800">
                                                • {item.description}: Stock actual {item.stock},
                                                mínimo requerido {item.minStock + item.reorderPoint},
                                                faltan {calculateBalanceNeeded(item)} unidades
                                            </li>
                                        ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {/* Alertas de expiración */}
                {expiringItems.length > 0 && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-start gap-3">
                            <Calendar className="h-5 w-5 text-red-600 mt-0.5" />
                            <div className="flex-1">
                                <h4 className="font-semibold text-red-800">Productos por Expirar</h4>
                                <p className="text-sm text-red-700 mt-1">
                                    Los siguientes productos tienen fechas de expiración próximas (≤ 30 días):
                                </p>
                                <ul className="mt-2 space-y-1">
                                    {expiringItems.map((item) => (
                                        <li key={item.id} className="text-sm text-red-800">
                                            • {item.description}: Expira el {new Date(item.expirationDate!).toLocaleDateString('es-ES')}
                                            {item.batchNumber && ` (Lote: ${item.batchNumber})`}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {/* Fechas importantes */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <Calendar className="h-5 w-5 text-blue-600" />
                            <h4 className="font-semibold text-blue-800">Fecha de Emisión</h4>
                        </div>
                        <p className="text-lg font-bold text-blue-900">
                            {new Date(orderData.orderDate).toLocaleDateString('es-ES', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </p>
                    </div>

                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <Calendar className="h-5 w-5 text-green-600" />
                            <h4 className="font-semibold text-green-800">Fecha de Entrega</h4>
                        </div>
                        <p className="text-lg font-bold text-green-900">
                            {new Date(orderData.deliveryDate).toLocaleDateString('es-ES', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </p>
                    </div>

                    <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <Calendar className="h-5 w-5 text-purple-600" />
                            <h4 className="font-semibold text-purple-800">Validez de la Orden</h4>
                        </div>
                        <p className="text-lg font-bold text-purple-900">
                            Hasta: {new Date(orderData.validityDate).toLocaleDateString('es-ES')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Resumen de la orden */}
            <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Información del proveedor */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <Building className="h-5 w-5 text-gray-600" />
                            <h4 className="font-semibold text-gray-800">Proveedor</h4>
                        </div>
                        <div className="space-y-2 text-sm">
                            <p><span className="font-medium">Nombre:</span> {orderData.supplier.name}</p>
                            <p><span className="font-medium">RFC:</span> {orderData.supplier.rfc}</p>
                            <p><span className="font-medium">Dirección:</span> {orderData.supplier.address}</p>
                            <p><span className="font-medium">Teléfono:</span> {orderData.supplier.phone}</p>
                            <p><span className="font-medium">Email:</span> {orderData.supplier.email}</p>
                        </div>
                    </div>

                    {/* Información del almacén */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <Package className="h-5 w-5 text-gray-600" />
                            <h4 className="font-semibold text-gray-800">Almacén de Destino</h4>
                        </div>
                        <div className="space-y-2 text-sm">
                            <p><span className="font-medium">Código:</span> {orderData.warehouse.code}</p>
                            <p><span className="font-medium">Nombre:</span> {orderData.warehouse.name}</p>
                            <p><span className="font-medium">Dirección:</span> {orderData.warehouse.address}</p>
                        </div>
                    </div>
                </div>

                {/* Totales */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex justify-end">
                        <div className="text-right space-y-1">
                            <p className="text-sm text-gray-600">Subtotal: {orderData.currency} {orderData.subtotal.toFixed(2)}</p>
                            <p className="text-sm text-gray-600">Impuestos: {orderData.currency} {orderData.tax.toFixed(2)}</p>
                            <p className="text-lg font-bold text-gray-800">Total: {orderData.currency} {orderData.total.toFixed(2)}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}