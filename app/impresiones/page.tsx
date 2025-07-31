"use client";
import { useState, useRef, useEffect } from 'react';
import Barcode from 'react-barcode'; // Corregida la importación

declare global {
    interface Navigator {
        serial?: any;
    }
}

interface TicketItem {
    id: number;
    name: string;
    price: number;
    quantity: number;
    barcode: string;
}

export default function TicketPrinter() {
    const [tickets, setTickets] = useState<TicketItem[]>([
        {
            id: 1,
            name: 'Producto Premium',
            price: 24.99,
            quantity: 1,
            barcode: '123456789012'
        },
        {
            id: 2,
            name: 'Producto Estándar',
            price: 15.50,
            quantity: 2,
            barcode: '987654321098'
        },
    ]);

    const [isConnected, setIsConnected] = useState(false);
    const [isSupported, setIsSupported] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const ticketRef = useRef<HTMLDivElement>(null);
    const portRef = useRef<any>(null);

    // Verificar soporte del navegador
    useEffect(() => {
        if (typeof window !== 'undefined' && 'serial' in navigator) {
            setIsSupported(true);
        } else {
            setIsSupported(false);
            setError('API Serial no soportada. Usa Chrome/Edge 89+');
        }
    }, []);

    // Conectar impresora
    const connectPrinter = async () => {
        try {
            setError(null);
            const port = await navigator.serial!.requestPort();
            await port.open({ baudRate: 9600 });
            portRef.current = port;
            setIsConnected(true);
        } catch (err) {
            console.error("Error de conexión:", err);
            setError('Error al conectar impresora');
            setIsConnected(false);
        }
    };

    // Desconectar impresora
    const disconnectPrinter = async () => {
        try {
            if (portRef.current) {
                const writer = portRef.current.writable?.getWriter();
                if (writer) {
                    await writer.releaseLock();
                }
                await portRef.current.close();
                portRef.current = null;
            }
            setIsConnected(false);
        } catch (err) {
            console.error("Error al desconectar:", err);
            setError('Error al desconectar');
        }
    };

    // Imprimir directamente a impresora serial
    const printToSerial = async (ticket: TicketItem) => {
        if (!portRef.current) {
            setError('Conecta la impresora primero');
            return;
        }

        try {
            const writer = portRef.current.writable.getWriter();
            const encoder = new TextEncoder();

            // 1. Configuración inicial
            const initCommands = [
                '\x1B\x40', // Inicializar impresora
                '\x1B\x74\x02', // Establecer codepage CP850 (código 02)
                '\x1B\x21\x30', // Texto grande (double height)
                `TICKET #${ticket.id}\n`,
                '\x1B\x21\x00', // Reset texto
                '----------------------------\n',
                `Producto: ${ticket.name}\n`,
                `Cantidad: ${ticket.quantity}\n`,
                `Precio: $${ticket.price.toFixed(2)}\n\n`,
            ].join('');

            // 2. Comando CORRECTO para código de barras CODE128
            const barcodeCommands = [
                '\x1D\x6B\x05' + ticket.barcode + '\x00'
            ].join('');

            // 3. Comandos finales
            const footerCommands = [
                '\n\n',
                '\x1B\x21\x30', // Texto grande para total
                `TOTAL: $${(ticket.price * ticket.quantity).toFixed(2)}\n\n`,
                '\x1B\x21\x00', // Reset texto
                'Gracias por su compra!\n',
                '\x1D\x56\x41\x00', // Cortar papel
            ].join('');

            // Convertir y enviar en bloques
            await writer.write(encoder.encode(initCommands));
            await writer.write(encoder.encode(barcodeCommands));
            await writer.write(encoder.encode(footerCommands));

            await writer.releaseLock();
        } catch (err) {
            console.error("Error al imprimir:", err);
            setError('Error al imprimir - ' + (err as Error).message);
        }
    };

    const calculateTotal = () => {
        return tickets.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    };

    const addTestTicket = () => {
        const newId = tickets.length > 0 ? Math.max(...tickets.map(t => t.id)) + 1 : 1;
        const newBarcode = Math.floor(Math.random() * 900000000000) + 100000000000;
        setTickets([
            ...tickets,
            {
                id: newId,
                name: `Producto ${newId}`,
                price: Math.round(Math.random() * 100 * 100) / 100,
                quantity: Math.floor(Math.random() * 5) + 1,
                barcode: newBarcode.toString()
            },
        ]);
    };

    const clearTickets = () => {
        setTickets([]);
    };

    return (
        <div className="p-4 max-w-md mx-auto bg-white rounded-xl shadow-md">
            <h1 className="text-xl font-bold text-center mb-4">Impresión de Tiquets</h1>

            {/* Conexión impresora */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <button
                    onClick={isConnected ? disconnectPrinter : connectPrinter}
                    className={`px-4 py-2 rounded-lg text-white font-semibold w-full mb-2 ${isConnected ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
                        }`}
                    disabled={!isSupported}
                >
                    {isConnected ? 'Desconectar Impresora' : 'Conectar Impresora'}
                </button>

                {error && (
                    <div className="mt-2 p-2 bg-red-100 text-red-700 rounded text-sm">
                        ⚠ {error}
                    </div>
                )}
            </div>

            {/* Controles */}
            <div className="flex flex-wrap gap-2 mb-4">
                <button
                    onClick={addTestTicket}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex-1"
                >
                    Añadir Tiquet
                </button>
                <button
                    onClick={clearTickets}
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 flex-1"
                >
                    Limpiar
                </button>
            </div>

            {/* Lista de tiquets */}
            <div className="space-y-3 mb-4">
                {tickets.map((ticket) => (
                    <div key={ticket.id} className="border rounded-lg p-3">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-bold">{ticket.name}</h3>
                                <p>Cantidad: {ticket.quantity}</p>
                                <p>Precio: ${ticket.price.toFixed(2)}</p>
                                <p>Total: ${(ticket.price * ticket.quantity).toFixed(2)}</p>
                            </div>
                            <div className="flex flex-col items-end">
                                <div className="mb-1">
                                    <Barcode
                                        value={ticket.barcode}
                                        format="CODE128"
                                        width={1.5}
                                        height={50}
                                        displayValue={false} // Propiedad corregida
                                    />
                                </div>
                                <div className="flex gap-2">
                                    {isConnected && (
                                        <button
                                            onClick={() => printToSerial(ticket)}
                                            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                                        >
                                            Imprimir
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Total */}
            {tickets.length > 0 && (
                <div className="p-3 bg-gray-50 rounded-lg font-bold text-lg">
                    Total General: ${calculateTotal().toFixed(2)}
                </div>
            )}

            {/* Tiquet para impresión (oculto) */}
            <div style={{ display: 'none' }}>
                <div
                    ref={ticketRef}
                    className="p-4"
                    style={{
                        width: '80mm',
                        minHeight: '150mm',
                        fontFamily: 'monospace',
                        fontSize: '14px'
                    }}
                >
                    <h2 className="text-center font-bold text-2xl mb-2">MI TIENDA</h2>
                    <p className="text-center text-sm mb-4">Calle Principal 123 • Tel: 555-1234</p>
                    <p className="text-center text-xs mb-4">
                        {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
                    </p>
                    <hr className="border-dashed border-black my-2" />

                    {tickets.map((ticket) => (
                        <div key={ticket.id} className="mb-4">
                            <div className="flex justify-between">
                                <span className="font-bold">{ticket.name}</span>
                                <span>${ticket.price.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>Cantidad: {ticket.quantity}</span>
                                <span>Subtotal: ${(ticket.price * ticket.quantity).toFixed(2)}</span>
                            </div>
                            <div className="my-2 flex justify-center">
                                <Barcode
                                    value={ticket.barcode}
                                    format="CODE128"
                                    width={1.5}
                                    height={50}
                                    displayValue={true} // Propiedad corregida
                                />
                            </div>
                            <hr className="border-dashed border-gray-300 my-2" />
                        </div>
                    ))}

                    <div className="mt-6 pt-2 border-t-2 border-black">
                        <div className="flex justify-between font-bold text-lg">
                            <span>TOTAL:</span>
                            <span>${calculateTotal().toFixed(2)}</span>
                        </div>
                    </div>

                    <p className="text-center text-sm mt-8">
                        ¡Gracias por su compra!
                    </p>
                    <p className="text-center text-xs mt-1">
                        * Presentar este tiquet para devoluciones *
                    </p>
                </div>
            </div>
        </div>
    );
}