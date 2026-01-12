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

    useEffect(() => {
        if (cuestion.multiple) {
            const data = formData as RangeDateData;
            let value = '';
            if (data.interviewDateStart && data.interviewDateEnd) {
                value = `${data.interviewDateStart} - ${data.interviewDateEnd}`;
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
    }, [formData, cuestion.multiple]);

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

    const inputValue = cuestion.multiple
        ? (() => {
            const data = formData as RangeDateData;
            if (data.interviewDateStart && data.interviewDateEnd) {
                return `${data.interviewDateStart} - ${data.interviewDateEnd}`;
            } else if (data.interviewDateStart) {
                return data.interviewDateStart;
            } else if (data.interviewDateEnd) {
                return data.interviewDateEnd;
            }
            return '';
        })()
        : (formData as SingleDateData).interviewDate;

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
                    className="bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-700 px-4 py-2 border focus:ring-green-500 focus:border-green-900 w-full sm:text-sm rounded-md focus:outline-none text-gray-600 dark:text-white cursor-pointer"
                    placeholder={cuestion.multiple ? "Seleccionar fechas" : "Seleccionar fecha"}
                />
                {showInterviewDatePicker && (
                    <div className="z-10 mt-1 w-full bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-700 border rounded-md shadow-lg">
                        <div className="p-2">
                            {cuestion.multiple ? (
                                <div className="grid grid-cols-2 gap-4 dark:text-white">
                                    <div>
                                        <p className="mb-1 font-semibold">Fecha inicial</p>
                                        <input
                                            type="date"
                                            value={(formData as RangeDateData).interviewDateStart}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...(formData as RangeDateData),
                                                    interviewDateStart: e.target.value,
                                                })
                                            }
                                            className="bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-700 w-full px-2 py-1 border rounded-md"
                                        />
                                    </div>
                                    <div>
                                        <p className="mb-1 font-semibold">Fecha final</p>
                                        <input
                                            type="date"
                                            value={(formData as RangeDateData).interviewDateEnd}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...(formData as RangeDateData),
                                                    interviewDateEnd: e.target.value,
                                                })
                                            }
                                            className="bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-700 w-full px-2 py-1 border rounded-md"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <p className="mb-1 font-semibold">Seleccionar fecha</p>
                                    <input
                                        type="date"
                                        value={(formData as SingleDateData).interviewDate}
                                        onChange={(e) =>
                                            setFormData({ interviewDate: e.target.value })
                                        }
                                        className="bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-700 w-full px-2 py-1 border rounded-md"
                                    />
                                </div>
                            )}
                            <button
                                type="button"
                                className="mt-4 w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                                onClick={() => setShowInterviewDatePicker(false)}
                            >
                                Aceptar
                            </button>
                        </div>
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
