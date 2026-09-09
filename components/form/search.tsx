import { SearchableSelectProps, SelectOption } from "@/utils/types/interfaces";
import { Search, X, LoaderCircle } from "lucide-react";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import Badge from "../badge";
import { useAppDispatch } from "@/hooks/selector";
import { triggerFormSubmit } from "@/utils/functions/form-active";
import { searchData } from "@/hooks/reducers/filter"; // si se usa

// Extendemos las props para incluir el estado de carga externo
interface ExtendedSearchableSelectProps extends SearchableSelectProps {
    isLoading?: boolean;
}

// Tipo para opciones: puede ser array o función que retorna una promesa de array
type OptionsType = string[] | SelectOption[] | ((term: string) => Promise<SelectOption[]>);

// Ajustamos la definición de cuestion para que options sea del tipo flexible
// (en la interfaz original es string[] | SelectOption[], pero la extendemos)
export function SearchComponent(props: ExtendedSearchableSelectProps) {
    const { cuestion, isLoading = false } = props;
    const isMulti = cuestion.saveData ?? false;
    const dispatch = useAppDispatch();
    const skillsRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    // Estado local
    const [searchTerm, setSearchTerm] = useState("");
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedValue, setSelectedValue] = useState<string>("");
    const [formData, setFormData] = useState<{ skills: string[] }>({ skills: [] });
    const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

    // Estado para sugerencias dinámicas (cuando options es función)
    const [suggestions, setSuggestions] = useState<SelectOption[]>([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);

    // Determinar si options es función o array
    const isOptionsFunction = typeof cuestion.options === "function";

    // --- Efecto para obtener sugerencias (si options es función) ---
    useEffect(() => {
        if (!isOptionsFunction) return;

        // Si no hay término o es muy corto, limpiar sugerencias
        if (!searchTerm || searchTerm.length < 2) {
            setSuggestions([]);
            setLoadingSuggestions(false);
            return;
        }

        // Debounce
        const handler = setTimeout(async () => {
            // Cancelar petición anterior
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            const controller = new AbortController();
            abortControllerRef.current = controller;

            setLoadingSuggestions(true);
            try {
                const fetchFn = cuestion.options as unknown as (term: string) => Promise<SelectOption[]>;
                const result = await fetchFn(searchTerm);
                // Verificar si la petición aún es válida
                if (!controller.signal.aborted) {
                    setSuggestions(result);
                }
            } catch (error) {
                if (!controller.signal.aborted) {
                    console.error("Error fetching suggestions:", error);
                    setSuggestions([]);
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoadingSuggestions(false);
                }
            }
        }, 300);

        return () => {
            clearTimeout(handler);
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
                abortControllerRef.current = null;
            }
        };
    }, [searchTerm, isOptionsFunction, cuestion.options]);

    // --- Filtrado local (si options es array) ---
    const filteredOptions = useMemo(() => {
        if (isOptionsFunction) {
            // Cuando es función, usamos las sugerencias obtenidas
            return suggestions;
        }
        // Caso array
        const opts = cuestion.options as string[] | SelectOption[];
        if (!opts) return [];
        if (!searchTerm) return opts.map(opt => normalizeOption(opt));
        return opts
            .map(opt => normalizeOption(opt))
            .filter(opt =>
                opt.label.toLowerCase().includes(searchTerm.toLowerCase())
            );
    }, [cuestion.options, searchTerm, isOptionsFunction, suggestions]);

    // Helper para normalizar opción a { label, value }
    function normalizeOption(opt: string | SelectOption): SelectOption {
        if (typeof opt === "object" && opt !== null && "label" in opt) {
            return { label: opt.label, value: opt.value ?? opt.label };
        }
        return { label: String(opt), value: String(opt) };
    }

    // --- Sincronizar valor del formulario ---
    const saveData = useCallback(() => {
        if (isMulti) {
            props.setValue(cuestion.name, formData.skills.length ? formData.skills.join(", ") : "");
        } else {
            props.setValue(cuestion.name, selectedValue || "");
        }
    }, [isMulti, formData.skills, cuestion.name, props.setValue, selectedValue]);

    useEffect(() => {
        saveData();
    }, [saveData]);

    // --- Inicialización desde valueDefined ---
    useEffect(() => {
        if (cuestion.valueDefined) {
            if (isMulti) {
                try {
                    const skillsArray =
                        typeof cuestion.valueDefined === "string"
                            ? cuestion.valueDefined.split(",").map(s => s.trim()).filter(Boolean)
                            : Array.isArray(cuestion.valueDefined)
                                ? cuestion.valueDefined
                                : [];
                    if (skillsArray.length) {
                        setFormData(prev => ({
                            ...prev,
                            skills: [...new Set([...prev.skills, ...skillsArray])],
                        }));
                    }
                } catch (error) {
                    console.error("Error parsing valueDefined for skills:", error);
                }
            } else {
                const defaultValue =
                    typeof cuestion.valueDefined === "string"
                        ? cuestion.valueDefined
                        : cuestion.valueDefined.toString();
                setSelectedValue(defaultValue);
                setSearchTerm(defaultValue);
                props.setValue(cuestion.name, defaultValue);
            }
        }
    }, [cuestion.valueDefined, isMulti, props.setValue, cuestion.name]);

    // --- Cerrar dropdown al hacer clic fuera ---
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (skillsRef.current && !skillsRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
                setHighlightedIndex(-1);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // --- Manejadores ---
    const handleSelect = useCallback(
        (option: SelectOption) => {
            if (isLoading || loadingSuggestions) return;
            const value = option.value;

            if (isMulti) {
                if (!formData.skills.includes(value)) {
                    setFormData(prev => ({
                        ...prev,
                        skills: [...prev.skills, value],
                    }));
                    // Actualizar inmediatamente el valor del formulario y enviar
                    const updatedSkills = [...formData.skills, value];
                    props.setValue(cuestion.name, updatedSkills.join(", "));
                    // Disparamos submit para actualizar filtros
                    triggerFormSubmit();
                }
                setSearchTerm("");
                inputRef.current?.focus();
            } else {
                setSelectedValue(value);
                setSearchTerm(option.label);
                setShowDropdown(false);
                props.setValue(cuestion.name, value);
                triggerFormSubmit();
            }
            setHighlightedIndex(-1);
        },
        [isMulti, formData.skills, isLoading, loadingSuggestions, props.setValue, cuestion.name]
    );

    const handleRemoveSkill = useCallback(
        (skill: string) => {
            if (isLoading) return;
            setFormData(prev => ({
                ...prev,
                skills: prev.skills.filter(s => s !== skill),
            }));
            // Actualizar valor del formulario (y enviar si se desea)
            const updatedSkills = formData.skills.filter(s => s !== skill);
            props.setValue(cuestion.name, updatedSkills.join(", "));
            // Opcional: disparar submit para actualizar filtros al quitar un tag
            triggerFormSubmit();
            inputRef.current?.focus();
        },
        [isLoading, formData.skills, props.setValue, cuestion.name]
    );

    const handleClear = useCallback(() => {
        if (isLoading) return;
        setSelectedValue("");
        setSearchTerm("");
        props.setValue(cuestion.name, "");
        inputRef.current?.focus();
    }, [cuestion.name, props.setValue, isLoading]);

    const handleKeyDown = useCallback(
        (event: React.KeyboardEvent<HTMLInputElement>) => {
            if (isLoading || loadingSuggestions) return;

            const optionsList = filteredOptions;

            if (showDropdown && optionsList.length > 0) {
                if (event.key === "ArrowDown") {
                    event.preventDefault();
                    setHighlightedIndex(prev =>
                        prev < optionsList.length - 1 ? prev + 1 : 0
                    );
                    return;
                }
                if (event.key === "ArrowUp") {
                    event.preventDefault();
                    setHighlightedIndex(prev =>
                        prev > 0 ? prev - 1 : optionsList.length - 1
                    );
                    return;
                }
                if (event.key === "Enter" && highlightedIndex >= 0) {
                    event.preventDefault();
                    const selected = optionsList[highlightedIndex];
                    handleSelect(selected);
                    return;
                }
            }

            if (event.key === "Enter") {
                event.preventDefault();
                if (isMulti && searchTerm.trim() !== "") {
                    const term = searchTerm.trim();
                    if (!formData.skills.includes(term)) {
                        const updatedSkills = [...formData.skills, term];
                        setFormData(prev => ({
                            ...prev,
                            skills: updatedSkills,
                        }));
                        props.setValue(cuestion.name, updatedSkills.join(", "));
                        triggerFormSubmit();
                    }
                    setSearchTerm("");
                } else if (!isMulti && searchTerm.trim() !== "") {
                    // Modo único: seleccionar el texto escrito si no hay opción resaltada
                    const term = searchTerm.trim();
                    const exactMatch = optionsList.find(opt => opt.label.toLowerCase() === term.toLowerCase());
                    if (exactMatch) {
                        handleSelect(exactMatch);
                    } else {
                        // Si no hay match exacto, podríamos crear una opción nueva o simplemente asignar el valor
                        setSelectedValue(term);
                        setSearchTerm(term);
                        props.setValue(cuestion.name, term);
                        triggerFormSubmit();
                        setShowDropdown(false);
                    }
                }
                setShowDropdown(false);
                setHighlightedIndex(-1);
                return;
            }

            if (event.key === "Escape") {
                setShowDropdown(false);
                setHighlightedIndex(-1);
                inputRef.current?.blur();
            }
        },
        [
            showDropdown,
            filteredOptions,
            highlightedIndex,
            handleSelect,
            isMulti,
            searchTerm,
            formData.skills,
            isLoading,
            loadingSuggestions,
            props.setValue,
            cuestion.name
        ]
    );

    const handleInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            if (isLoading) return;
            const value = e.target.value;
            setSearchTerm(value);
            setShowDropdown(true);
            setHighlightedIndex(-1);

            if (cuestion.options && typeof cuestion.options !== "function") {
                dispatch(searchData(value));
            }

            if (isMulti) {
                // Vista previa: skills actuales + término en edición
                const preview = value.trim()
                    ? [...formData.skills, value].join(", ")
                    : formData.skills.join(", ");
                props.setValue(cuestion.name, preview);
            }
            if (!isMulti && value !== selectedValue) {
                setSelectedValue("");
                props.setValue(cuestion.name, "");
            }
        },
        [cuestion.options, dispatch, isMulti, selectedValue, isLoading, props.setValue, cuestion.name, formData.skills]
    );

    // --- Renderizado de badges (modo múltiple) ---
    const renderBadges = () => {
        if (!isMulti) return null;
        return formData.skills.map(skill => (
            <div key={skill} className="flex items-center gap-0.5">
                <Badge text={skill} color="green" />
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveSkill(skill);
                    }}
                    className="text-red-600 hover:text-red-800 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400 rounded-full p-0.5"
                    aria-label={`Eliminar ${skill}`}
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>
        ));
    };

    // --- Indicador de carga para sugerencias ---
    const showLoading = (isLoading || loadingSuggestions) && isOptionsFunction;

    // --- Renderizado principal ---
    return (
        <div className="relative flex flex-col dark:text-white" ref={skillsRef}>
            <label className="leading-loose flex items-center gap-2 dark:text-white">
                <span className="w-4 h-4 flex items-center justify-center">
                    {cuestion.icon ? cuestion.icon : <Search className="w-4 h-4" />}
                </span>
                {cuestion.label}
                {showLoading && (
                    <LoaderCircle className="w-4 h-4 ml-2 animate-spin text-green-500" />
                )}
            </label>

            <div className="relative flex-1">
                {/* Contenedor unificado */}
                <div
                    className={`
                        bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-800 
                        rounded-md px-3 py-2 flex items-center gap-2 
                        focus-within:border-green-500 transition-all min-h-[42px] 
                        ${isLoading || loadingSuggestions ? "opacity-70 pointer-events-none" : "cursor-text"}
                    `}
                    onClick={() => !isLoading && !loadingSuggestions && inputRef.current?.focus()}
                >
                    {/* Ícono de búsqueda solo en modo único */}
                    {!isMulti && (
                        <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    )}

                    {renderBadges()}

                    <input
                        ref={inputRef}
                        type="text"
                        placeholder={
                            isLoading || loadingSuggestions
                                ? "Cargando..."
                                : isMulti && formData.skills.length > 0
                                    ? ""
                                    : cuestion.placeholder
                        }
                        value={searchTerm}
                        className="bg-transparent border-none outline-none flex-1 min-w-[80px] p-0 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        onFocus={() => !isLoading && !loadingSuggestions && setShowDropdown(true)}
                        aria-label={cuestion.label}
                        role="combobox"
                        aria-expanded={showDropdown}
                        aria-controls="suggestions-listbox"
                        aria-autocomplete="list"
                    />

                    {/* Botón de limpiar (solo modo único y cuando hay valor) */}
                    {!isMulti && !isLoading && !loadingSuggestions && selectedValue && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400 rounded-full p-0.5 flex-shrink-0"
                            aria-label="Limpiar selección"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Dropdown de opciones */}
                {showDropdown && (
                    <div
                        id="suggestions-listbox"
                        role="listbox"
                        className="absolute z-30 w-full bg-white dark:bg-zinc-800 
                        border border-gray-200 dark:border-zinc-700 rounded-md shadow-lg max-h-60 overflow-y-auto mt-1"
                    >
                        {loadingSuggestions ? (
                            <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400 py-3">
                                <LoaderCircle className="w-5 h-5 animate-spin text-green-500" />
                                <span>Buscando...</span>
                            </div>
                        ) : filteredOptions.length > 0 ? (
                            <ul>
                                {filteredOptions.map((option, index) => {
                                    const { label, value } = option;
                                    const isHighlighted = index === highlightedIndex;
                                    const isSelected = isMulti
                                        ? formData.skills.includes(value)
                                        : selectedValue === value;

                                    return (
                                        <li
                                            key={value}
                                            role="option"
                                            aria-selected={isSelected}
                                            className={`px-4 py-2 cursor-pointer transition-colors flex items-center justify-between ${isHighlighted
                                                ? "bg-green-100 dark:bg-green-900/40"
                                                : isSelected
                                                    ? "bg-green-50 dark:bg-green-900/20"
                                                    : "hover:bg-zinc-100 dark:hover:bg-zinc-700"
                                                }`}
                                            onClick={() => handleSelect(option)}
                                            onMouseEnter={() => setHighlightedIndex(index)}
                                        >
                                            <span>{label}</span>
                                            {isSelected && (
                                                <span className="text-green-600 dark:text-green-400 text-sm font-medium">
                                                    ✓
                                                </span>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : (
                            <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                                {searchTerm.length >= 2 ? "Sin resultados" : "Escribe al menos 2 caracteres"}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}