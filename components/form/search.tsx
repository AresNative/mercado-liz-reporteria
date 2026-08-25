import { SearchableSelectProps } from "@/utils/types/interfaces";
import { Search, Star, X, LoaderCircle } from "lucide-react";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import Badge from "../badge";
import { searchData } from "@/hooks/reducers/filter";
import { useAppDispatch } from "@/hooks/selector";
import { triggerFormSubmit } from "@/utils/functions/form-active";

interface ExtendedSearchableSelectProps extends SearchableSelectProps {
    isLoading?: boolean;
}

export function SearchComponent(props: ExtendedSearchableSelectProps) {
    const { cuestion, isLoading = false } = props;
    const isMulti = cuestion.saveData ?? false;
    const dispatch = useAppDispatch();
    const skillsRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const [searchTerm, setSearchTerm] = useState("");
    const [showSkillsDropdown, setShowSkillsDropdown] = useState(false);
    const [selectedValue, setSelectedValue] = useState<string>("");
    const [formData, setFormData] = useState<{ skills: string[] }>({ skills: [] });
    const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

    const filteredOptions = useMemo(() => {
        if (isLoading || !cuestion.options) return [];
        return cuestion.options.filter((skill: any) => {
            if (!searchTerm) return true;
            const searchText =
                typeof skill === "object" && skill !== null
                    ? skill.label
                    : skill.toString();
            return searchText.toLowerCase().includes(searchTerm.toLowerCase());
        });
    }, [cuestion.options, searchTerm, isLoading]);

    // --- Efecto para sincronizar con el formulario (modo múltiple y respaldo) ---
    const saveData = useCallback(() => {
        if (isMulti) {
            // Importante: sincronizar también cuando skills.length === 0, si no,
            // al quitar el último tag el formulario se queda con el valor
            // anterior y el filtro "fantasma" se sigue aplicando.
            props.setValue(cuestion.name, formData.skills.length ? formData.skills.join(", ") : "");
        } else {
            // En modo único, el valor ya se actualiza directamente, pero lo dejamos como respaldo
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
                            ? cuestion.valueDefined.split(",").map((s) => s.trim()).filter(Boolean)
                            : Array.isArray(cuestion.valueDefined)
                                ? cuestion.valueDefined
                                : [];
                    if (skillsArray.length) {
                        setFormData((prev) => ({
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
                // <-- Actualizar inmediatamente el formulario en modo único
                props.setValue(cuestion.name, defaultValue);
            }
        }
    }, [cuestion.valueDefined, isMulti, props.setValue, cuestion.name]);

    // Cerrar dropdown al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (skillsRef.current && !skillsRef.current.contains(e.target as Node)) {
                setShowSkillsDropdown(false);
                setHighlightedIndex(-1);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // --- Manejadores ---
    const handleSelect = useCallback(
        (skill: string) => {
            if (isLoading) return;
            if (isMulti) {
                if (skill.trim() !== "" && !formData.skills.includes(skill.trim())) {
                    setFormData((prev) => ({
                        ...prev,
                        skills: [...prev.skills, skill.trim()],
                    }));
                }
                setSearchTerm("");
                inputRef.current?.focus();
            } else {
                setSelectedValue(skill);
                setSearchTerm(skill);
                setShowSkillsDropdown(false);
                // <-- Actualizar el formulario inmediatamente en modo único
                props.setValue(cuestion.name, skill);
                triggerFormSubmit();
            }
            setHighlightedIndex(-1);
        },
        [isMulti, formData.skills, isLoading, props.setValue, cuestion.name]
    );

    const handleRemoveSkill = useCallback(
        (skill: string) => {
            if (isLoading) return;
            setFormData((prev) => ({
                ...prev,
                skills: prev.skills.filter((s) => s !== skill),
            }));
            inputRef.current?.focus();
        },
        [isLoading]
    );

    const handleClear = useCallback(() => {
        if (isLoading) return;
        setSelectedValue("");
        setSearchTerm("");
        inputRef.current?.focus();
        // <-- Limpiar el formulario inmediatamente en modo único
        props.setValue(cuestion.name, "");
    }, [cuestion.name, props.setValue, isLoading]);

    const handleKeyDown = useCallback(
        (event: React.KeyboardEvent<HTMLInputElement>) => {
            if (isLoading) return;

            if (showSkillsDropdown && filteredOptions.length > 0) {
                if (event.key === "ArrowDown") {
                    event.preventDefault();
                    setHighlightedIndex((prev) =>
                        prev < filteredOptions.length - 1 ? prev + 1 : 0
                    );
                    return;
                }
                if (event.key === "ArrowUp") {
                    event.preventDefault();
                    setHighlightedIndex((prev) =>
                        prev > 0 ? prev - 1 : filteredOptions.length - 1
                    );
                    return;
                }
                if (event.key === "Enter" && highlightedIndex >= 0) {
                    event.preventDefault();
                    const selected = filteredOptions[highlightedIndex];
                    const value =
                        typeof selected === "object" && selected !== null && "label" in selected
                            ? (selected as any).label.toString()
                            : selected.toString();
                    handleSelect(value);
                    return;
                }
            }

            if (event.key === "Enter") {
                event.preventDefault();
                if (isMulti && searchTerm.trim() !== "") {
                    const term = searchTerm.trim();
                    const updatedSkills = formData.skills.includes(term)
                        ? formData.skills
                        : [...formData.skills, term];

                    if (updatedSkills !== formData.skills) {
                        setFormData((prev) => ({
                            ...prev,
                            skills: updatedSkills,
                        }));
                    }

                    // triggerFormSubmit() dispara el submit de forma síncrona, en el
                    // mismo tick. No podemos esperar al useEffect de saveData() (que
                    // corre después del próximo render) para escribir el valor en el
                    // formulario, o el submit saldría con el término anterior y no
                    // con el que el usuario acaba de escribir.
                    props.setValue(cuestion.name, updatedSkills.join(", "));
                    setSearchTerm("");
                    triggerFormSubmit();
                } else if (!isMulti && searchTerm.trim() !== "") {
                    // <-- Al presionar Enter en modo único, seleccionar el texto escrito (si no hay opción resaltada)
                    handleSelect(searchTerm.trim());
                }
                setShowSkillsDropdown(false);
                setHighlightedIndex(-1);
                return;
            }

            if (event.key === "Escape") {
                setShowSkillsDropdown(false);
                setHighlightedIndex(-1);
                inputRef.current?.blur();
            }
        },
        [showSkillsDropdown, filteredOptions, highlightedIndex, handleSelect, isMulti, searchTerm, formData.skills, isLoading, props.setValue, cuestion.name]
    );

    const handleInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            if (isLoading) return;
            const value = e.target.value;
            setSearchTerm(value);
            setShowSkillsDropdown(true);
            setHighlightedIndex(-1);
            if (cuestion.options) {
                dispatch(searchData(value));
            }
            if (isMulti) {
                // page.tsx arma las sugerencias tomando el último segmento
                // separado por comas del valor del campo como el término que
                // se está escribiendo (aún no confirmado con Enter). Si no lo
                // escribimos aquí en cada tecla, ese último segmento nunca
                // cambia y las sugerencias se quedan congeladas después de la
                // primera búsqueda.
                const preview = value.trim()
                    ? [...formData.skills, value].join(", ")
                    : formData.skills.join(", ");
                props.setValue(cuestion.name, preview);
            }
            if (!isMulti && value !== selectedValue) {
                setSelectedValue("");
                // <-- Si el usuario escribe algo diferente, limpiamos el valor del formulario
                props.setValue(cuestion.name, "");
            }
        },
        [cuestion.options, dispatch, isMulti, selectedValue, isLoading, props.setValue, cuestion.name, formData.skills]
    );

    const getOptionLabel = (option: any): string => {
        return typeof option === "object" && option !== null
            ? option.label
            : option.toString();
    };
    const getOptionValue = (option: any): string => {
        return typeof option === "object" && option !== null
            ? option.value.toString()
            : option.toString();
    };

    // --- Renderizado de badges (modo múltiple) ---
    const renderBadges = () => {
        if (!isMulti) return null;
        return (
            <>
                {formData.skills.map((skill) => (
                    <div key={skill} className="flex items-center gap-0.5">
                        <Badge text={skill} color="green" />
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveSkill(skill);
                            }}
                            disabled={isLoading}
                            className="text-red-600 hover:text-red-800 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400 rounded-full p-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label={`Eliminar ${skill}`}
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                ))}
            </>
        );
    };

    // --- Renderizado principal ---
    return (
        <div className="relative flex flex-col dark:text-white" ref={skillsRef}>
            <label className="leading-loose flex items-center gap-2 dark:text-white">
                <span className="w-4 h-4 flex items-center justify-center">
                    {cuestion.icon ? cuestion.icon : <Star className="w-4 h-4" />}
                </span>
                {cuestion.label}
                {isLoading && (
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
                        ${isLoading ? "opacity-70 pointer-events-none" : "cursor-text"}
                    `}
                    onClick={() => !isLoading && inputRef.current?.focus()}
                >
                    {/* Ícono de búsqueda solo en modo único */}
                    {!isMulti && (
                        <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    )}

                    {/* Badges (modo múltiple) */}
                    {renderBadges()}

                    {/* Input común */}
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder={
                            isLoading
                                ? "Cargando..."
                                : isMulti && formData.skills.length > 0
                                    ? ""
                                    : cuestion.placeholder
                        }
                        value={searchTerm}
                        className="bg-transparent border-none outline-none flex-1 min-w-[80px] p-0 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 disabled:opacity-70 disabled:cursor-not-allowed"
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        onFocus={() => !isLoading && setShowSkillsDropdown(true)}
                        disabled={isLoading}
                        aria-label={cuestion.label}
                        role="combobox"
                        aria-expanded={showSkillsDropdown}
                        aria-controls="skills-listbox"
                        aria-autocomplete="list"
                    />

                    {/* Botón de limpiar (solo modo único y cuando hay valor) */}
                    {!isMulti && !isLoading && selectedValue && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400 rounded-full p-0.5 flex-shrink-0"
                            aria-label="Limpiar selección"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}

                    {/* Spinner de carga (solo modo único) */}
                    {isLoading && !isMulti && (
                        <LoaderCircle className="w-5 h-5 text-green-500 animate-spin flex-shrink-0" />
                    )}
                </div>

                {/* Dropdown de opciones (común) */}
                {cuestion.options && showSkillsDropdown && (
                    <div
                        id="skills-listbox"
                        role="listbox"
                        className="absolute z-30 w-full bg-white dark:bg-zinc-800 
                        border border-gray-200 dark:border-zinc-700 rounded-md shadow-lg max-h-60 overflow-y-auto mt-1"
                    >
                        {isLoading ? (
                            <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400 py-3">
                                <LoaderCircle className="w-5 h-5 animate-spin text-green-500" />
                                <span>Cargando opciones...</span>
                            </div>
                        ) : filteredOptions.length > 0 ? (
                            <ul>
                                {filteredOptions.map((skill: any, index: number) => {
                                    const label = getOptionLabel(skill);
                                    const value = getOptionValue(skill);
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
                                            onClick={() => handleSelect(value)}
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
                                Sin resultados
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}