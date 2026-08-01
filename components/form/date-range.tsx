import { formatDateDisplay } from "@/utils/constants/format-values";
import { InputFormProps } from "@/utils/types/interfaces";
import { CalendarRange } from "lucide-react";
import { useRef, useEffect, useState } from "react";

interface SingleDateData {
    interviewDate: string;
}

interface RangeDateData {
    interviewDateStart: string;
    interviewDateEnd: string;
}

export function DateRangeComponent(props: InputFormProps) {
    const { cuestion } = props;

    const [formData, setFormData] = useState<SingleDateData | RangeDateData>(() => {
        if (cuestion.multiple) {
            return {
                interviewDateStart: '',
                interviewDateEnd: '',
            } as RangeDateData;
        } else {
            return {
                interviewDate: '',
            } as SingleDateData;
        }
    });

    const [showInterviewDatePicker, setShowInterviewDatePicker] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Actualiza el valor del formulario cuando cambia el estado local
    useEffect(() => {
        if (cuestion.multiple) {
            const data = formData as RangeDateData;
            let value = '';
            if (data.interviewDateStart && data.interviewDateEnd) {
                value = `${data.interviewDateStart} AND ${data.interviewDateEnd}`;
            } else if (data.interviewDateStart) {
                value = data.interviewDateStart;
            } else if (data.interviewDateEnd) {
                value = data.interviewDateEnd;
            }
            props.setValue(cuestion.name, value);
        } else {
            const data = formData as SingleDateData;
            props.setValue(cuestion.name, data.interviewDate);
        }
    }, [formData, cuestion.multiple, cuestion.name, props]);

    // Cierra el selector al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowInterviewDatePicker(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Función para formatear una fecha ISO (YYYY-MM-DD) a formato legible
    const formatDate = (dateString: string): string => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '';
            return formatDateDisplay(date);
        } catch {
            return '';
        }
    };

    // Valor que se muestra en el input (con formato legible)
    const inputValue = (() => {
        if (cuestion.multiple) {
            const data = formData as RangeDateData;
            if (data.interviewDateStart && data.interviewDateEnd) {
                return `${formatDate(data.interviewDateStart)} AND ${formatDate(data.interviewDateEnd)}`;
            } else if (data.interviewDateStart) {
                return formatDate(data.interviewDateStart);
            } else if (data.interviewDateEnd) {
                return formatDate(data.interviewDateEnd);
            }
            return '';
        } else {
            const data = formData as SingleDateData;
            return formatDate(data.interviewDate);
        }
    })();

    return (
        <div className="flex flex-col" ref={dropdownRef}>
            <label className="leading-loose flex items-center gap-2 dark:text-white">
                <CalendarRange className="w-4 h-4" />
                {cuestion.label}
            </label>
            <div className="relative">
                <input
                    type="text"
                    name={cuestion.multiple ? "interviewDates" : "interviewDate"}
                    value={inputValue}
                    onClick={() => setShowInterviewDatePicker(true)}
                    readOnly
                    className="bg-white dark:bg-gray-900 dark:text-white border-gray-300 dark:border-gray-800 py-2 px-4 w-full rounded-md focus:outline-none border focus:border-green-500 focus:ring-green-500 cursor-pointer"
                    placeholder={cuestion.multiple ? "Seleccionar fechas" : "Seleccionar fecha"}
                />
                {showInterviewDatePicker && (
                    <div className="absolute z-50 mt-1 p-3 bg-white dark:bg-gray-900 dark:text-white border border-gray-300 dark:border-gray-800 rounded shadow-lg w-full">
                        {cuestion.multiple ? (
                            <>
                                <div className="flex flex-col gap-2">
                                    <div>
                                        <label className="block text-sm font-medium">Desde:</label>
                                        <input
                                            type="date"
                                            value={(formData as RangeDateData).interviewDateStart}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...(formData as RangeDateData),
                                                    interviewDateStart: e.target.value,
                                                })
                                            }
                                            className="w-full border border-gray-300 dark:border-gray-800 rounded p-1 bg-white dark:bg-gray-800"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium">Hasta:</label>
                                        <input
                                            type="date"
                                            value={(formData as RangeDateData).interviewDateEnd}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...(formData as RangeDateData),
                                                    interviewDateEnd: e.target.value,
                                                })
                                            }
                                            className="w-full border border-gray-300 dark:border-gray-800 rounded p-1 bg-white dark:bg-gray-800"
                                        />
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                    onClick={() => setShowInterviewDatePicker(false)}
                                >
                                    Aplicar
                                </button>
                            </>
                        ) : (
                            <>
                                <div>
                                    <label className="block text-sm font-medium">Fecha:</label>
                                    <input
                                        type="date"
                                        value={(formData as SingleDateData).interviewDate}
                                        onChange={(e) =>
                                            setFormData({ interviewDate: e.target.value })
                                        }
                                        className="w-full border border-gray-300 dark:border-gray-800 rounded p-1 bg-white dark:bg-gray-800"
                                    />
                                </div>
                                <button
                                    type="button"
                                    className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                    onClick={() => setShowInterviewDatePicker(false)}
                                >
                                    Aplicar
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>
            {props.errors[cuestion.name] && props.errors[cuestion.name]?.message && (
                <span className="text-red-400 p-1">
                    {props.errors[cuestion.name]?.message}
                </span>
            )}
        </div>
    );
}