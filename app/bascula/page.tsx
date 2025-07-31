"use client";
import { useState, useEffect, useRef } from 'react';

// Extender la interfaz Navigator para incluir serial
declare global {
    interface Navigator {
        serial?: any;
    }
}

export default function ScaleReader() {
    const [weight, setWeight] = useState('0.00 kg');
    const [isConnected, setIsConnected] = useState(false);
    const [isSupported, setIsSupported] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const readerRef = useRef<ReadableStreamDefaultReader | null>(null);
    const portRef = useRef<any>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    // Verificar soporte del navegador
    useEffect(() => {
        if (typeof window !== 'undefined' && 'serial' in navigator) {
            setIsSupported(true);
        } else {
            setIsSupported(false);
            setError('API Serial no soportada en este navegador. Usa Chrome/Edge 89+');
        }
    }, []);

    // Limpieza al desmontar
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            disconnectScale();
        };
    }, []);

    const connectToScale = async () => {
        if (!isSupported) return;

        try {
            setError(null);
            // Solicitar acceso al puerto serial
            const port = await navigator.serial!.requestPort();
            await port.open({ baudRate: 9600 });

            portRef.current = port;
            setIsConnected(true);

            const reader = port.readable.getReader();
            readerRef.current = reader;
            abortControllerRef.current = new AbortController();

            // Leer datos
            readData(reader, abortControllerRef.current.signal);

        } catch (error) {
            console.error("Error de conexión:", error);
            setError('Error al conectar. Asegúrate de seleccionar el dispositivo correcto.');
            setIsConnected(false);
        }
    };

    const readData = async (reader: ReadableStreamDefaultReader, signal: AbortSignal) => {
        try {
            while (!signal.aborted) {
                const { value, done } = await reader.read();
                if (done || signal.aborted) break;

                const text = new TextDecoder().decode(value);
                processScaleData(text);
            }
        } catch (error) {
            if (!signal.aborted) {
                console.error("Error de lectura:", error);
                setError('Error al leer datos de la báscula');
            }
        } finally {
            reader.releaseLock();
        }
    };

    const processScaleData = (data: string) => {
        // Expresión regular mejorada para diferentes formatos
        const match = data.match(/(\d+[.,]\d+)/);
        if (match) {
            // Normalizar separador decimal
            const weightValue = match[0].replace(',', '.');
            setWeight(`${weightValue} kg`);
        }
    };

    const disconnectScale = async () => {
        try {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
                abortControllerRef.current = null;
            }

            if (readerRef.current) {
                await readerRef.current.cancel();
                readerRef.current = null;
            }

            if (portRef.current) {
                await portRef.current.close();
                portRef.current = null;
            }

            setIsConnected(false);
            setWeight('0.00 kg');

        } catch (error) {
            console.error("Error al desconectar:", error);
            setError('Error al desconectar la báscula');
        }
    };

    return (
        <div className="p-4 max-w-md mx-auto bg-white rounded-xl shadow-md">
            <h1 className="text-xl font-bold text-center mb-4">Conexión de Báscula Digital</h1>

            <div className="flex flex-col items-center">
                <button
                    onClick={isConnected ? disconnectScale : connectToScale}
                    className={`px-6 py-3 rounded-lg text-white font-semibold ${isConnected
                        ? 'bg-red-500 hover:bg-red-600'
                        : 'bg-blue-500 hover:bg-blue-600'
                        } transition-colors shadow-md`}
                    disabled={!isSupported}
                >
                    {isConnected ? 'Desconectar Báscula' : 'Conectar Báscula'}
                </button>

                <div className="mt-6 p-6 bg-gray-50 rounded-xl text-center w-full border border-gray-200">
                    <span className="text-sm text-gray-500 block">Peso actual</span>
                    <span className="text-4xl font-bold text-gray-800">{weight}</span>
                </div>
            </div>

            {error && (
                <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                    ⚠ {error}
                </div>
            )}

            {!isSupported && (
                <div className="mt-4 p-3 bg-yellow-100 text-yellow-800 rounded-lg text-sm">
                    ⚠ Tu navegador no soporta la conexión directa con básculas.
                    Para usar esta función:
                    <ul className="mt-2 list-disc pl-5">
                        <li>Usa Chrome, Edge u otro navegador basado en Chromium</li>
                        <li>Asegúrate de usar la versión 89 o superior</li>
                        <li>Accede a la aplicación mediante HTTPS</li>
                    </ul>
                </div>
            )}

            <div className="mt-6 text-sm text-gray-500">
                <h3 className="font-medium mb-2">Instrucciones:</h3>
                <ol className="list-decimal pl-5 space-y-1">
                    <li>Conecta tu báscula al computador</li>
                    <li>Haz clic en "Conectar Báscula"</li>
                    <li>Selecciona tu dispositivo en el cuadro de diálogo</li>
                    <li>El peso aparecerá automáticamente</li>
                </ol>
            </div>
        </div>
    );
}