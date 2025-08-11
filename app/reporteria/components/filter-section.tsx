"use client";

import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { ChevronDown, ChevronUp, Hash, Plus, Save, Trash2 } from "lucide-react";
import { FilterSectionProps, FormValues } from "../utils/types";
import { DateFilterSection } from "./date-filter-section";
import { FilterRow } from "./filter-row";
import { OrderBySection } from "./order-by-section";
import { SelectFieldRow } from "./select-field-row";
import { getLocalStorageItem, setLocalStorageItem, removeFromLocalStorage } from "@/utils/functions/local-storage";
import { cn } from "@/utils/functions/cn";

const SELECTS_STORAGE_KEY = "select_fields_config";
// Nueva clave para almacenar la visibilidad de secciones
const SECTION_VISIBILITY_KEY = "filter_sections_visibility";

export const FilterSection = ({
    onApply,
    onReset,
    config,
    filterFunction,
    cols
}: FilterSectionProps) => {
    // Estado inicial con valores por defecto
    const defaultVisibility = {
        filters: true,
        selectFields: true,
        orderBy: true,
        dateFilters: true
    };

    // Estado para controlar la visibilidad de cada sección
    const [sectionVisibility, setSectionVisibility] = useState(defaultVisibility);

    // Cargar estado de visibilidad desde localStorage al montar el componente
    useEffect(() => {
        const storedVisibility = getLocalStorageItem(SECTION_VISIBILITY_KEY);
        if (storedVisibility) {
            setSectionVisibility({
                ...defaultVisibility,
                ...storedVisibility
            });
        }
    }, []);

    const toggleSection = (section: keyof typeof sectionVisibility) => {
        const newVisibility = {
            ...sectionVisibility,
            [section]: !sectionVisibility[section]
        };
        setSectionVisibility(newVisibility);
        // Guardar en localStorage cada vez que cambia la visibilidad
        setLocalStorageItem(SECTION_VISIBILITY_KEY, newVisibility);
    };

    const {
        control,
        register,
        handleSubmit,
        reset,
        watch,
        setValue
    } = useForm<FormValues>({
        defaultValues: {
            Filtros: [{ Key: "", Value: "", Operator: "" }],
            Selects: [{ Key: "" }],
            OrderBy: { Key: "", Direction: "asc" },
            DateFilters: { startDate: "", endDate: "", preset: "" },
            sum: false,
            distinct: false,
        },
    });

    const {
        fields: filtros,
        append: addFiltro,
        remove: removeFiltro,
    } = useFieldArray({ control, name: "Filtros" });

    const sumValue = watch("sum");
    const distinctValue = watch("distinct");

    const {
        fields: selects,
        append: addSelectField,
        remove: removeSelectField,
        replace: replaceSelectFields,
    } = useFieldArray({ control, name: "Selects" });

    useEffect(() => {
        const storedSelects = getLocalStorageItem(SELECTS_STORAGE_KEY);
        if (storedSelects && Array.isArray(storedSelects)) {
            replaceSelectFields(storedSelects.length > 0 ? storedSelects : [{ Key: "" }]);
        }
    }, [replaceSelectFields]);

    const watchSelects = watch("Selects");
    useEffect(() => {
        if (watchSelects) {
            const cleaned = watchSelects.filter(s => s?.Key);
            setLocalStorageItem(SELECTS_STORAGE_KEY, cleaned);
        }
    }, [watchSelects]);

    const onSubmit = (data: FormValues) => {
        const baseFilters = data.Filtros
            .filter((f) => f.Key && f.Operator)
            .filter((f) => f.Key !== "FechaEmision");

        const dateFilters = data.Filtros.filter(
            (f) => f.Key === "FechaEmision" && f.Value
        );

        if (data.DateFilters.startDate) {
            dateFilters.push({
                Key: "FechaEmision",
                Value: data.DateFilters.startDate,
                Operator: ">=",
            });
        }

        if (data.DateFilters.endDate) {
            dateFilters.push({
                Key: "FechaEmision",
                Value: data.DateFilters.endDate,
                Operator: "<=",
            });
        }

        setLocalStorageItem(
            SELECTS_STORAGE_KEY,
            data.Selects.filter((s) => s.Key)
        );

        onApply({
            Filtros: [...baseFilters, ...dateFilters],
            Selects: data.Selects.filter((s) => s.Key),
            OrderBy: data.OrderBy.Key ? data.OrderBy : { Key: "", Direction: "asc" },
            sum: data.sum,
            distinct: data.distinct,
        });
    };

    const handleReset = () => {
        reset();
        removeFromLocalStorage(SELECTS_STORAGE_KEY);
        onReset();
    };

    const SELECTS_PROFILES_KEY = "select_profiles";

    const getAllSelectProfiles = () => {
        return getLocalStorageItem(SELECTS_PROFILES_KEY) || {};
    };

    const saveSelectProfile = (name: string, value: any[]) => {
        const profiles = getAllSelectProfiles();
        profiles[name] = value;
        setLocalStorageItem(SELECTS_PROFILES_KEY, profiles);
    };

    const deleteSelectProfile = (name: string) => {
        const profiles = getAllSelectProfiles();
        delete profiles[name];
        setLocalStorageItem(SELECTS_PROFILES_KEY, profiles);
    };

    const [profileName, setProfileName] = useState("");
    const [selectedProfile, setSelectedProfile] = useState("");
    const [availableProfiles, setAvailableProfiles] = useState<string[]>([]);

    const refreshProfiles = () => {
        const profiles = getAllSelectProfiles();
        setAvailableProfiles(Object.keys(profiles));
    };

    useEffect(() => {
        refreshProfiles();
    }, []);

    return (
        <form
            onSubmit={handleSubmit(onSubmit)}
            className="w-full mb-8 bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-700 space-y-8"
            role="form"
            aria-label="Formulario de filtros de datos"
        >
            {/* Botones de suma y distinct */}
            <div className="flex gap-2 justify-between items-center">
                <button
                    type="button"
                    onClick={() => setValue("sum", !sumValue)}
                    className={cn(
                        "inline-flex items-center gap-2 text-xs text-white px-2 py-1 md:px-3 md:py-2 rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-800",
                        sumValue
                            ? "bg-blue-600 hover:bg-blue-700"
                            : "bg-emerald-600 hover:bg-emerald-700"
                    )}
                    aria-label={`Suma de totales ${sumValue ? "activado" : "desactivado"}`}
                    aria-pressed={sumValue}
                >
                    <Plus size={16} />
                    Suma de totales
                    {sumValue && (
                        <span className="ml-1 text-xs font-semibold">✓</span>
                    )}
                </button>
                <button
                    type="button"
                    onClick={() => setValue("distinct", !distinctValue)}
                    className={cn(
                        "inline-flex items-center gap-2 text-xs text-white px-2 py-1 md:px-3 md:py-2 rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-800",
                        distinctValue
                            ? "bg-blue-600 hover:bg-blue-700"
                            : "bg-emerald-600 hover:bg-emerald-700"
                    )}
                    aria-label={`Obtener solo distintos ${distinctValue ? "activado" : "desactivado"}`}
                    aria-pressed={distinctValue}
                >
                    <Hash size={16} />
                    Obtener solo distintos
                    {distinctValue && (
                        <span className="ml-1 text-xs font-semibold">✓</span>
                    )}
                </button>
            </div>

            {/* Sección de Filtros */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => toggleSection('filters')}
                            className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100"
                            aria-expanded={sectionVisibility.filters}
                        >
                            {sectionVisibility.filters ?
                                <ChevronUp size={20} aria-hidden="true" /> :
                                <ChevronDown size={20} aria-hidden="true" />
                            }
                            <span>Filtros de búsqueda</span>
                        </button>
                    </div>
                    <button
                        type="button"
                        onClick={() => addFiltro({ Key: "", Value: "", Operator: "" })}
                        className="inline-flex items-center gap-2 text-xs bg-emerald-600 hover:bg-emerald-700 focus:bg-emerald-700 text-white px-2 py-1 md:px-3 md:py-2 rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-800"
                        aria-label="Agregar nuevo filtro"
                    >
                        <Plus size={16} />
                        Agregar filtro
                    </button>
                </div>

                {sectionVisibility.filters && (
                    <div
                        className="space-y-3"
                        role="group"
                        aria-label="Lista de filtros"
                    >
                        {filtros.map((field, idx) => (
                            <FilterRow
                                key={field.id}
                                index={idx}
                                control={control}
                                register={register}
                                onRemove={() => removeFiltro(idx)}
                                isLast={filtros.length <= 1}
                                filterFunction={filterFunction}
                                config={config}
                                cols={cols}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Sección de Campos a mostrar */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => toggleSection('selectFields')}
                            className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100"
                            aria-expanded={sectionVisibility.selectFields}
                        >
                            {sectionVisibility.selectFields ?
                                <ChevronUp size={20} aria-hidden="true" /> :
                                <ChevronDown size={20} aria-hidden="true" />
                            }
                            <span>Campos a mostrar</span>
                        </button>
                    </div>
                    <button
                        type="button"
                        onClick={() => addSelectField({ Key: "" })}
                        className="inline-flex items-center gap-2 text-xs bg-emerald-600 hover:bg-emerald-700 focus:bg-emerald-700 text-white px-2 py-1 md:px-3 md:py-2 rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-800"
                        aria-label="Agregar nuevo campo"
                    >
                        <Plus size={16} />
                        Agregar campo
                    </button>
                </div>

                {sectionVisibility.selectFields && (
                    <>
                        <div className="flex flex-col md:flex-row justify-between w-full gap-4 bg-gray-50 dark:bg-zinc-700 px-2 py-4 rounded-xl border  dark:border-zinc-700 pb-4 mb-4">
                            <fieldset className="space-y-3 w-full">
                                <legend className="text-sm font-medium text-gray-900 dark:text-gray-100">Seleccionar perfil existente</legend>
                                <div className="flex gap-3">
                                    <div className="flex-1">
                                        <label htmlFor="profile-select" className="sr-only">
                                            Seleccionar perfil
                                        </label>
                                        <select
                                            id="profile-select"
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-700 dark:border-zinc-600 dark:text-white dark:focus:ring-blue-400"
                                            value={selectedProfile}
                                            onChange={(e) => {
                                                const name = e.target.value
                                                setSelectedProfile(name)
                                                const profiles = getAllSelectProfiles()
                                                if (profiles[name]) {
                                                    replaceSelectFields(profiles[name])
                                                }
                                            }}
                                        >
                                            <option value="">Selecciona un perfil</option>
                                            {availableProfiles.map((name) => (
                                                <option key={name} value={name}>
                                                    {name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (selectedProfile) {
                                                deleteSelectProfile(selectedProfile)
                                                setSelectedProfile("")
                                                refreshProfiles()
                                            }
                                        }}
                                        disabled={!selectedProfile}
                                        className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                                        aria-label={`Eliminar perfil ${selectedProfile || "seleccionado"}`}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        <span className="ml-2 hidden sm:inline">Eliminar</span>
                                    </button>
                                </div>
                            </fieldset>

                            <fieldset className="space-y-3 w-full">
                                <legend className="text-sm font-medium text-gray-900 dark:text-gray-100">Crear nuevo perfil</legend>
                                <div className="flex gap-3">
                                    <div className="flex-1">
                                        <label htmlFor="profile-name" className="sr-only">
                                            Nombre del nuevo perfil
                                        </label>
                                        <input
                                            id="profile-name"
                                            type="text"
                                            placeholder="Nombre del nuevo perfil"
                                            value={profileName}
                                            onChange={(e) => setProfileName(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    e.preventDefault()
                                                    if (profileName.trim()) {
                                                        const cleaned = watch("Selects").filter((s) => s?.Key)
                                                        saveSelectProfile(profileName.trim(), cleaned)
                                                        setProfileName("")
                                                        refreshProfiles()
                                                    }
                                                }
                                            }}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-700 dark:border-zinc-600 dark:text-white dark:placeholder-zinc-500 dark:focus:ring-blue-400"
                                        />
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (profileName.trim()) {
                                                const cleaned = watch("Selects").filter((s) => s?.Key)
                                                saveSelectProfile(profileName.trim(), cleaned)
                                                setProfileName("")
                                                refreshProfiles()
                                            }
                                        }}
                                        disabled={!profileName.trim()}
                                        className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                                        aria-label="Guardar nuevo perfil"
                                    >
                                        <Save className="h-4 w-4" />
                                        <span className="ml-2 hidden sm:inline">Guardar</span>
                                    </button>
                                </div>
                            </fieldset>
                        </div>

                        <div
                            className="space-y-3"
                            role="group"
                            aria-label="Lista de campos a mostrar"
                        >
                            {selects.map((field, idx) => (
                                <SelectFieldRow
                                    key={field.id}
                                    index={idx}
                                    control={control}
                                    register={register}
                                    onRemove={() => removeSelectField(idx)}
                                    isLast={selects.length <= 1}
                                    cols={cols}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Sección de Ordenar por */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => toggleSection('orderBy')}
                            className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100"
                            aria-expanded={sectionVisibility.orderBy}
                        >
                            {sectionVisibility.orderBy ?
                                <ChevronUp size={20} aria-hidden="true" /> :
                                <ChevronDown size={20} aria-hidden="true" />
                            }
                            <span>Ordenar por</span>
                        </button>
                    </div>
                </div>

                {sectionVisibility.orderBy && (
                    <OrderBySection register={register} />
                )}
            </div>

            {/* Sección de Filtros de fecha */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => toggleSection('dateFilters')}
                            className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100"
                            aria-expanded={sectionVisibility.dateFilters}
                        >
                            {sectionVisibility.dateFilters ?
                                <ChevronUp size={20} aria-hidden="true" /> :
                                <ChevronDown size={20} aria-hidden="true" />
                            }
                            <span>Filtros de fecha</span>
                        </button>
                    </div>
                </div>

                {sectionVisibility.dateFilters && (
                    <DateFilterSection
                        register={register}
                        watch={watch}
                        setValue={setValue}
                    />
                )}
            </div>

            {/* Botones finales */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-200 dark:border-zinc-700">
                <button
                    type="button"
                    onClick={handleReset}
                    className="px-6 py-2.5 border border-gray-300 dark:border-zinc-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-700 focus:bg-gray-50 dark:focus:bg-zinc-700 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-800 font-medium"
                >
                    Restablecer filtros
                </button>
                <button
                    type="submit"
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 focus:bg-blue-700 text-white rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-800 font-medium"
                >
                    Aplicar filtros
                </button>
            </div>
        </form>
    );
};