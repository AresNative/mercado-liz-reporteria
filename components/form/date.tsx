import { formatDateDisplay } from "@/utils/constants/format-values";
import { InputFormProps } from "@/utils/types/interfaces";
import { CalendarRange } from "lucide-react";
import { useRef, useEffect, useState } from "react";

interface DateRange {
    from: Date | null;
    to: Date | null;
}

const DATE_PERIODS = [
    { label: "Últimos 7 días", days: 7 },
    { label: "Últimos 30 días", days: 30 },
    { label: "Últimos 90 días", days: 90 },
    { label: "Este mes", days: null, custom: true },
    { label: "Mes anterior", days: null, custom: true },
    { label: "Este año", days: null, custom: true },
    { label: "Personalizado", days: null, custom: true },
];


export function DateRangeComponent(props: InputFormProps) {
    const { cuestion } = props;

    const [formData, setFormData] = useState<DateRange>({
        from: new Date(new Date().setDate(new Date().getDate() - 30)),
        to: new Date(),
    });

    const [showInterviewDatePicker, setShowInterviewDatePicker] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const applyDatePeriod = (period: (typeof DATE_PERIODS)[0]) => {
        const today = new Date();
        let from: Date | null = null;
        let to: Date | null = today;
        if (period.days) {
            from = new Date(today);
            from.setDate(today.getDate() - period.days);
        } else if (period.label === "Este mes") {
            from = new Date(today.getFullYear(), today.getMonth(), 1);
            to = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        } else if (period.label === "Mes anterior") {
            from = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            to = new Date(today.getFullYear(), today.getMonth(), 0);
        } else if (period.label === "Este año") {
            from = new Date(today.getFullYear(), 0, 1);
            to = new Date(today.getFullYear(), 11, 31);
        }
    setFormData({ from, to });
    setShowInterviewDatePicker(false);
    };

    useEffect(() => {
            const data = formData;
            let value = '';
            if (data.from && data.to) {
                value = `${data.from.toISOString().split("T")[0]} AND ${data.to.toISOString().split("T")[0]}`;
            } else if (data.from) {
                value = data.from.toISOString().split("T")[0];
            } else if (data.to) {
                value = data.to.toISOString().split("T")[0];
            }
            props.setValue(cuestion.name, value);
    }, [formData]);

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
    
    const inputValue =  (() => {
            const data = formData;
            if (data.from && data.to) {
                return `${formatDateDisplay(data.from)} AND ${formatDateDisplay(data.to)}`;
            } else if (data.from) {
                return formatDateDisplay(data.from);
            } else if (data.to) {
                return formatDateDisplay(data.to);
            }
            return '';
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
                    name={cuestion.name}
                    value={inputValue.replace(/ AND /g, " - ")}
                    onClick={() => setShowInterviewDatePicker(true)}
                    readOnly
                    className="bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-700 py-2 px-4 w-full rounded-md focus:outline-none border focus:border-green-500 focus:ring-green-500"
                />
                {showInterviewDatePicker && (
                    <dt className="absolute z-50 mt-1 p-3 bg-white border border-gray-300 rounded shadow-lg">
                        <dl><label>Desde:</label><input type="date" value={formData.from?.toISOString().split("T")[0]} onChange={e => setFormData(prev => ({ ...prev, from: new Date(e.target.value) }))} className="w-full border border-gray-300 rounded p-1" /></dl>
                        <dl><label>Hasta:</label><input type="date" value={formData.to?.toISOString().split("T")[0]} onChange={e => setFormData(prev => ({ ...prev, to: new Date(e.target.value) }))} className="w-full border border-gray-300 rounded p-1" /></dl>
                        <dl className="flex flex-wrap gap-1 mt-2">{DATE_PERIODS.map(p => <button key={p.label} onClick={() => applyDatePeriod(p)} className="text-xs px-2 py-1 bg-gray-100 rounded">{p.label}</button>)}</dl>
                        <dl className="flex justify-end mt-2"><button onClick={() => setShowInterviewDatePicker(false)} className="px-3 py-1 bg-blue-600 text-white rounded">Aplicar</button></dl>
                    </dt>
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
