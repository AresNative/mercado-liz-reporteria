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
    const dispatch = useAppDispatch();
    const skillsRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const [searchTerm, setSearchTerm] = useState("");
    const [showSkillsDropdown, setShowSkillsDropdown] = useState(false);
    const [selectedValue, setSelectedValue] = useState<string>("");
    const [formData, setFormData] = useState<{ skills: string[] }>({ skills: [] });
    const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

    // Filtrado de opciones (solo si no está cargando)
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

    // Sincronización con react-hook-form
    const saveData = useCallback(() => {
        if (cuestion.saveData && formData.skills.length) {
            props.setValue(cuestion.name, formData.skills.join(", "));
        } else {
            props.setValue(cuestion.name, selectedValue);
        }
    }, [cuestion.saveData, formData.skills, cuestion.name, props.setValue, selectedValue]);

    // Inicialización desde valueDefined
    useEffect(() => {
        if (cuestion.valueDefined) {
            if (cuestion.saveData) {
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
            }
        }
    }, [cuestion.valueDefined, cuestion.saveData]);

    useEffect(() => {
        saveData();
    }, [saveData]);

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
            if (cuestion.saveData) {
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
                triggerFormSubmit();
            }
            setHighlightedIndex(-1);
        },
        [cuestion.saveData, formData.skills, isLoading]
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
                if (cuestion.saveData && searchTerm.trim() !== "") {
                    if (!formData.skills.includes(searchTerm.trim())) {
                        setFormData((prev) => ({
                            ...prev,
                            skills: [...prev.skills, searchTerm.trim()],
                        }));
                    }
                    setSearchTerm("");
                    triggerFormSubmit();
                } else if (!cuestion.saveData && searchTerm.trim() !== "") {
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
        [showSkillsDropdown, filteredOptions, highlightedIndex, handleSelect, cuestion.saveData, searchTerm, formData.skills, isLoading]
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
            if (!cuestion.saveData && value !== selectedValue) {
                setSelectedValue("");
            }
        },
        [cuestion.options, dispatch, cuestion.saveData, selectedValue, isLoading]
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

    // --- Renderizado de badges en modo múltiple (respetando la interfaz de Badge) ---
    const renderBadges = () => {
        if (!cuestion.saveData) return null;
        return (
            <div className="flex flex-wrap items-center gap-1 flex-1">
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
                <input
                    ref={inputRef}
                    type="text"
                    placeholder={formData.skills.length === 0 ? cuestion.placeholder : ""}
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
            </div>
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

                {cuestion.saveData ? (
                    // Modo múltiple: contenedor con badges y input
                    <div
                        className={`
                                bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-800 rounded-md px-3 py-2 flex flex-wrap items-center gap-1 focus-within:border-green-500  transition-all min-h-[42px] cursor-text
                                ${isLoading ? "opacity-70 pointer-events-none" : ""}
                                `}
                        onClick={() => !isLoading && inputRef.current?.focus()}
                    >
                        {renderBadges()}
                    </div>
                ) : (
                    // Modo único: input con botón de limpiar o spinner
                    <div className="relative">
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder={isLoading ? "Cargando..." : cuestion.placeholder}
                            value={searchTerm}
                                className={`
                                    bg-white dark:bg-gray-900 dark:text-white border-gray-300 dark:border-gray-800 
                                    pl-10 pr-8 w-full rounded-md focus:outline-none border focus:border-green-500 focus:ring-green-500 transition-all 
                                    ${isLoading ? "opacity-70 cursor-not-allowed" : ""}
                                    `}
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
                        {isLoading && (
                            <LoaderCircle className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500 animate-spin" />
                        )}
                        {!isLoading && selectedValue && (
                            <button
                                type="button"
                                onClick={handleClear}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400 rounded-full p-0.5"
                                aria-label="Limpiar selección"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                )}

                {/* Dropdown de opciones */}
                {cuestion.options && showSkillsDropdown && (
                    <div
                        id="skills-listbox"
                        role="listbox"
                        className="absolute z-30 w-full bg-white dark:bg-zinc-800 
                        border border-gray-200 dark:border-zinc-700 rounded-md shadow-lg max-h-60 overflow-y-auto"
                    >
                        {isLoading ? (
                            <div className="flex items-center justify-center text-gray-500 dark:text-gray-400">
                                <LoaderCircle className="w-5 h-5 animate-spin text-green-500" />
                                <span>Cargando opciones...</span>
                            </div>
                        ) : filteredOptions.length > 0 ? (
                            <ul >
                                {filteredOptions.map((skill: any, index: number) => {
                                    const label = getOptionLabel(skill);
                                    const value = getOptionValue(skill);
                                    const isHighlighted = index === highlightedIndex;
                                    const isSelected = cuestion.saveData
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