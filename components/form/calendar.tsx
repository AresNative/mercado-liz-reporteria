import { InputFormProps } from "@/utils/types/interfaces";
import { Calendar1 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function CalendarComponent({ cuestion, setValue, register, errors }: InputFormProps) {
    const dropdownRef = useRef<HTMLDivElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);
    const [birthDate, setBirthDate] = useState("");
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [isTimeEnabled, setIsTimeEnabled] = useState(false);

    const currentDate = birthDate ? new Date(birthDate) : new Date();
    const [year, setYear] = useState(currentDate.getFullYear());
    const [month, setMonth] = useState(currentDate.getMonth());
    const [day, setDay] = useState(currentDate.getDate());
    const [hour, setHour] = useState(currentDate.getHours());
    const [minute, setMinute] = useState(currentDate.getMinutes());

    const years = Array.from({ length: 101 }, (_, i) => new Date().getFullYear() - i);
    const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const days = Array.from({ length: new Date(year, month + 1, 0).getDate() }, (_, i) => i + 1);
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const minutes = Array.from({ length: 60 }, (_, i) => i);

    const formatDisplayDate = (dateStr: string) => {
        if (!dateStr) return '';
        const [datePart, timePart] = dateStr.split('T');
        const [year, month, day] = datePart.split('-');
        if (!year || !month || !day) return '';
        let formattedDate = `${day}/${month}/${year}`;
        if (timePart) {
            const [hours, minutes] = timePart.split(':');
            formattedDate += ` ${hours}:${minutes}`;
        }
        return formattedDate;
    };

    useEffect(() => {
        setValue(cuestion.name, birthDate);
    }, [birthDate]);

    useEffect(() => {
        if (cuestion.valueDefined) {
            const parsedDate = new Date(cuestion.valueDefined);
            if (!isNaN(parsedDate.getTime())) {
                const hasTime = cuestion.valueDefined.includes('T');
                setIsTimeEnabled(hasTime);
                const year = parsedDate.getFullYear();
                const month = parsedDate.getMonth();
                const day = parsedDate.getDate();
                setYear(year);
                setMonth(month);
                setDay(day);
                if (hasTime) {
                    setHour(parsedDate.getHours());
                    setMinute(parsedDate.getMinutes());
                    const timeStr = `${String(parsedDate.getHours()).padStart(2, '0')}:${String(parsedDate.getMinutes()).padStart(2, '0')}`;
                    setBirthDate(`${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T${timeStr}`);
                } else {
                    setBirthDate(`${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
                }
            }
        }
    }, [cuestion.valueDefined]);

    // Cerrar modal al hacer clic fuera o presionar Escape
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (showDatePicker &&
                modalRef.current &&
                !modalRef.current.contains(event.target as Node) &&
                !dropdownRef.current?.contains(event.target as Node)) {
                setShowDatePicker(false);
            }
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && showDatePicker) {
                setShowDatePicker(false);
            }
        };

        if (showDatePicker) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [showDatePicker]);

    const handleAccept = () => {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        if (isTimeEnabled) {
            const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
            setBirthDate(`${dateStr}T${timeStr}`);
        } else {
            setBirthDate(dateStr);
        }
        setShowDatePicker(false);
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        setBirthDate("");
        setValue(cuestion.name, "");
    };

    const handleInputClick = () => {
        setShowDatePicker(!showDatePicker);
        const currentDate = birthDate ? new Date(birthDate) : new Date();
        if (!isNaN(currentDate.getTime())) {
            setYear(currentDate.getFullYear());
            setMonth(currentDate.getMonth());
            setDay(currentDate.getDate());
            setHour(currentDate.getHours());
            setMinute(currentDate.getMinutes());
        }
    };

    return (
        <div className="relative flex flex-col mb-12" ref={dropdownRef}>
            <label className="leading-loose flex items-center gap-2 dark:text-white">
                <Calendar1 className="w-4 h-4" />
                {cuestion.label}
            </label>
            <div className="w-full top-7 left-0 h-0">
                <input
                    type="text"
                    value={formatDisplayDate(birthDate)}
                    onClick={handleInputClick}
                    readOnly
                    className="bg-white dark:bg-zinc-800 px-4 py-2 border focus:ring-green-500 focus:border-green-900 w-full sm:text-sm border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none text-gray-600 dark:text-white [&:-webkit-autofill]:bg-white [&:-webkit-autofill]:text-gray-600 [&:-webkit-autofill]:dark:bg-zinc-800 [&:-webkit-autofill]:dark:text-white [&:-webkit-autofill]:transition-colors [&:-webkit-autofill]:duration-[999999s] cursor-pointer pr-8"
                    placeholder={cuestion.placeholder}
                    {...register(cuestion.name, cuestion.require ? { required: "El campo es obligatorio." } : {})}
                />
                {birthDate && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-white"
                        aria-label="Limpiar fecha"
                    >
                        ×
                    </button>
                )}
                {showDatePicker && (
                    <div
                        ref={modalRef}
                        className="absolute z-30 mt-1 w-full dark:text-white bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-md shadow-lg p-2"
                    >
                        <div className="grid grid-cols-3 gap-2">
                            <select
                                aria-label="Seleccionar año"
                                className="bg-white dark:bg-zinc-800 border-gray-300 px-2 py-1 border dark:border-zinc-700 rounded-md"
                                value={year}
                                onChange={(e) => setYear(parseInt(e.target.value))}
                            >
                                {years.map((y) => (
                                    <option key={y} value={y}>
                                        {y}
                                    </option>
                                ))}
                            </select>
                            <select
                                aria-label="Seleccionar mes"
                                className="bg-white dark:bg-zinc-800 border-gray-300 px-2 py-1 border dark:border-zinc-700 rounded-md"
                                value={month}
                                onChange={(e) => setMonth(parseInt(e.target.value))}
                            >
                                {months.map((m, index) => (
                                    <option key={m} value={index}>
                                        {m}
                                    </option>
                                ))}
                            </select>
                            <select
                                aria-label="Seleccionar día"
                                className="bg-white dark:bg-zinc-800 border-gray-300 px-2 py-1 border dark:border-zinc-700 rounded-md"
                                value={day}
                                onChange={(e) => setDay(parseInt(e.target.value))}
                            >
                                {days.map((d) => (
                                    <option key={d} value={d}>
                                        {d}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={isTimeEnabled}
                                onChange={(e) => setIsTimeEnabled(e.target.checked)}
                                className="h-4 w-4 text-blue-500 rounded border-gray-300 dark:bg-zinc-800 dark:border-zinc-700"
                                id="timeCheckbox"
                            />
                            <label htmlFor="timeCheckbox" className="text-sm">
                                Añadir hora
                            </label>
                        </div>
                        {isTimeEnabled && (
                            <div className="grid grid-cols-2 gap-2 mt-2">
                                <select
                                    aria-label="Seleccionar hora"
                                    className="bg-white dark:bg-zinc-800 border-gray-300 px-2 py-1 border dark:border-zinc-700 rounded-md"
                                    value={hour}
                                    onChange={(e) => setHour(parseInt(e.target.value))}
                                >
                                    {hours.map((h) => (
                                        <option key={h} value={h}>
                                            {String(h).padStart(2, '0')}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    aria-label="Seleccionar minuto"
                                    className="bg-white dark:bg-zinc-800 border-gray-300 px-2 py-1 border dark:border-zinc-700 rounded-md"
                                    value={minute}
                                    onChange={(e) => setMinute(parseInt(e.target.value))}
                                >
                                    {minutes.map((m) => (
                                        <option key={m} value={m}>
                                            {String(m).padStart(2, '0')}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div className="flex gap-2 mt-2">
                            <button
                                type="button"
                                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-zinc-700 text-gray-800 dark:text-white rounded-md hover:bg-gray-300 dark:hover:bg-zinc-600"
                                onClick={() => setShowDatePicker(false)}
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                                onClick={handleAccept}
                            >
                                Aceptar
                            </button>
                        </div>
                    </div>
                )}
            </div>
            {errors[cuestion.name] && <span className="text-red-400 p-1">{errors[cuestion.name]?.message}</span>}
        </div>
    );
}