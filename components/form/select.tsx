import { useEffect, useRef, useState, useMemo } from "react";
import { SearchableSelectProps } from "@/utils/types/interfaces";
import { ChevronDown, Star, X } from "lucide-react";
import Badge from "../badge";
import { triggerFormSubmit } from "@/utils/functions/form-active";
import { useAppDispatch } from "@/hooks/selector";
import { dataFilter } from "@/hooks/reducers/filter";

export function SelectComponent(props: SearchableSelectProps) {
    const { cuestion } = props;
    const dispatch = useAppDispatch();
    const containerRef = useRef<HTMLDivElement>(null);

    const [isTouched, setIsTouched] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [skills, setSkills] = useState<string[]>([]);

    // ----------------------------------------
    // 🔹 Normalizar opciones (si son string u objeto)
    // ----------------------------------------
    const normalizedOptions = useMemo(() => {
        return (cuestion.options || []).map((opt: any) =>
            typeof opt === "object"
                ? { label: opt.label, value: String(opt.value) }
                : { label: String(opt), value: String(opt) }
        );
    }, [cuestion.options]);

    // ----------------------------------------
    // 🔹 Restaurar valor inicial (valueDefined)
    // ----------------------------------------
    useEffect(() => {
        if (cuestion.valueDefined) {
            const parts = cuestion.valueDefined
                .split(",")
                .map((p: any) => p.trim())
                .filter(Boolean);

            setSkills(cuestion.multi ? parts : parts.slice(0, 1));
        }
    }, [cuestion.valueDefined]);

    // ----------------------------------------
    // 🔹 Enviar valor a react-hook-form cuando cambia
    // ----------------------------------------
    useEffect(() => {
        const value = cuestion.multi ? skills.join(", ") : skills[0] || "";
        props.setValue(cuestion.name, value);

        // Manejo Redux especial para tu filtro
        if (cuestion.name === "columnas-search" && skills[0]) {
            dispatch(dataFilter({ key: "key", value: skills[0], type: "form" }));
            triggerFormSubmit();
        }
    }, [skills]);

    // ----------------------------------------
    // 🔹 Validación
    // ----------------------------------------
    useEffect(() => {
        const value = cuestion.multi ? skills.join(", ") : skills[0] || "";

        if ((isTouched || props.errors[cuestion.name]) && cuestion.require) {
            if (!value) {
                props.setError(cuestion.name, {
                    type: "required",
                    message: "Este campo es obligatorio.",
                });
            } else {
                props.clearErrors(cuestion.name);
            }
        }
    }, [skills, isTouched]);

    // ----------------------------------------
    // 🔹 Abrir/cerrar dropdown
    // ----------------------------------------
    const toggleDropdown = () => {
        setShowDropdown((prev) => !prev);
        setIsTouched(true);
    };

    const handleClickOutside = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
            setShowDropdown(false);
        }
    };

    useEffect(() => {
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // ----------------------------------------
    // 🔹 Seleccionar / quitar valores
    // ----------------------------------------
    const handleSelect = (value: string) => {
        setIsTouched(true);

        if (!cuestion.multi) {
            setSkills([value]);
            setShowDropdown(false);
            return;
        }

        setSkills((prev) =>
            prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
        );
    };

    const handleRemove = (value: string) => {
        setIsTouched(true);
        setSkills((prev) => prev.filter((v) => v !== value));
    };

    // ----------------------------------------
    // 🔹 Filtrado por búsqueda
    // ----------------------------------------
    const filteredOptions = normalizedOptions.filter((opt) =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // ----------------------------------------
    // 🔹 Texto visible en el selector
    // ----------------------------------------
    const displayText =
        skills.length === 0
            ? cuestion.valueDefined ?? `Seleccionar ${cuestion.name}`
            : cuestion.multi
                ? `${skills.length} seleccionadas`
                : skills[0];

    return (
        <div className="flex flex-col dark:text-white" ref={containerRef}>
            <label className="leading-loose flex items-center gap-2">
                <span className="w-4 h-4 flex items-center justify-center">
                    {cuestion.icon ?? <Star className="w-4 h-4" />}
                </span>
                {cuestion.label}
            </label>

            {/* Selector */}
            <div className="relative bg-white dark:bg-zinc-800">
                <div
                    className="px-4 py-2 border dark:border-zinc-700 rounded-md flex items-center justify-between cursor-pointer"
                    onClick={toggleDropdown}
                >
                    <span>{displayText}</span>
                    <ChevronDown className="w-4 h-4" />
                </div>

                {showDropdown && (
                    <div className="absolute z-30 w-full mt-1 bg-white dark:bg-zinc-800 border dark:border-zinc-700 rounded-md shadow-lg">

                        {cuestion.Search && (
                            <div className="p-2">
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border rounded-md dark:bg-zinc-800 dark:border-zinc-700"
                                    placeholder={`Buscar ${cuestion.name}...`}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        )}

                        <ul className="max-h-60 overflow-y-auto">
                            {filteredOptions.map((opt) => (
                                <li
                                    key={opt.value}
                                    className={`px-4 py-2 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-900 ${skills.includes(opt.value)
                                        ? "dark:bg-zinc-800"
                                        : ""
                                        }`}
                                    onClick={() => handleSelect(opt.value)}
                                >
                                    {opt.label}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {/* Badges */}
            {cuestion.multi && (
                <div className="flex flex-wrap gap-2 mt-2">
                    {skills.map((value) => (
                        <div key={value} className="flex items-center">
                            <Badge text={value} color="green" />
                            <button onClick={() => handleRemove(value)}>
                                <X className="w-4 h-4 ml-1 text-blue-600 hover:text-blue-800" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Error */}
            {props.errors[cuestion.name]?.message && (
                <span className="text-red-400 p-1">
                    {props.errors[cuestion.name]?.message}
                </span>
            )}
        </div>
    );
}
