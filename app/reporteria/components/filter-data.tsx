"use client"

import type React from "react"

import { useForm, useFieldArray, Controller } from "react-hook-form"
import { X, User, Plus, ChevronDown, CalendarDays, FolderPen, BookCopy, Layers2, BookUser, ChevronsLeftRightEllipsis, MapPin, SendToBack, Type, Hash, ArrowLeftRight, Repeat2, Banknote, Bitcoin, Tally5 } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import AutocompleteSelect from "./auto-complete"

type FilterType = { Key: string; Value: string; Operator: string }
type SelectType = { Key: string }
type OrderByType = { Key: string; Direction: "asc" | "desc" }

interface FilterSectionProps {
    onApply: (filters: {
        Filtros: FilterType[]
        Selects: SelectType[]
        OrderBy: OrderByType
    }) => void
    onReset: () => void
}

type FormValues = {
    Filtros: FilterType[]
    Selects: SelectType[]
    OrderBy: OrderByType
    DateFilters: {
        startDate: string
        endDate: string
        preset: string
    }
}

const fieldOptions = [
    { value: "Nombre", label: "Nombre", icon: <FolderPen className="inline mr-2" />, category: "Datos de producto" },
    { value: "Categoria", label: "Categoria", icon: <BookCopy className="inline mr-2" />, category: "Datos de producto" },
    { value: "Grupo", label: "Grupo", icon: <Layers2 className="inline mr-2" />, category: "Datos de producto" },
    { value: "Familia", label: "Familia", icon: <BookUser className="inline mr-2" />, category: "Datos de producto" },
    { value: "Linea", label: "Linea", icon: <ChevronsLeftRightEllipsis className="inline mr-2" />, category: "Datos de producto" },

    { value: "Movimiento", label: "Movimiento", icon: <SendToBack className="inline mr-2" />, category: "Operaciones", },
    { value: "Cliente", label: "Cliente", icon: <User className="inline mr-2" />, category: "Operaciones", },
    { value: "Tipo", label: "Tipo", icon: <Type className="inline mr-2" />, category: "Operaciones", },
    { value: "Almacen", label: "Almacen", icon: <MapPin className="inline mr-2" />, category: "Operaciones", },

    { value: "Unidad", label: "Unidad", icon: <Hash className="inline mr-2" />, category: "Cotable", },
    { value: "Factor", label: "Factor", icon: <Repeat2 className="inline mr-2" />, category: "Cotable", },
    { value: "Equivalencia", label: "Equivalencia", icon: <ArrowLeftRight className="inline mr-2" />, category: "Cotable", },
    { value: "CostoUnitario", label: "Costo unitario", icon: <Banknote className="inline mr-2" />, category: "Cotable", },
    { value: "CostoTotal", label: "Costo total", icon: <Bitcoin className="inline mr-2" />, category: "Cotable", },
    { value: "ImporteUnitario", label: "Importe unitario", icon: <Banknote className="inline mr-2" />, category: "Cotable", },
    { value: "ImporteTotal", label: "Importe total", icon: <Bitcoin className="inline mr-2" />, category: "Cotable", },
    { value: "Cantidad", label: "Cantidad", icon: <Tally5 className="inline mr-2" />, category: "Cotable", },
]

const groupedFieldOptions = [
    { label: "Datos de producto", options: fieldOptions.filter((o) => o.category === "Datos de producto") },
    { label: "Operaciones", options: fieldOptions.filter((o) => o.category === "Operaciones") },
    { label: "Cotable", options: fieldOptions.filter((o) => o.category === "Cotable") },
]

const datePresets = [
    { value: "today", label: "Hoy" },
    { value: "yesterday", label: "Ayer" },
    { value: "last7days", label: "Últimos 7 días" },
    { value: "last30days", label: "Últimos 30 días" },
    { value: "thisMonth", label: "Este mes" },
    { value: "lastMonth", label: "Mes pasado" },
    { value: "thisYear", label: "Este año" },
    { value: "lastYear", label: "Año pasado" },
]

const getDateFromPreset = (preset: string) => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    switch (preset) {
        case "today":
            return {
                start: today.toISOString().split("T")[0],
                end: today.toISOString().split("T")[0],
            }
        case "yesterday":
            return {
                start: yesterday.toISOString().split("T")[0],
                end: yesterday.toISOString().split("T")[0],
            }
        case "last7days":
            const last7 = new Date(today)
            last7.setDate(last7.getDate() - 7)
            return {
                start: last7.toISOString().split("T")[0],
                end: today.toISOString().split("T")[0],
            }
        case "last30days":
            const last30 = new Date(today)
            last30.setDate(last30.getDate() - 30)
            return {
                start: last30.toISOString().split("T")[0],
                end: today.toISOString().split("T")[0],
            }
        case "thisMonth":
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
            return {
                start: startOfMonth.toISOString().split("T")[0],
                end: today.toISOString().split("T")[0],
            }
        case "lastMonth":
            const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
            const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0)
            return {
                start: startOfLastMonth.toISOString().split("T")[0],
                end: endOfLastMonth.toISOString().split("T")[0],
            }
        case "thisYear":
            const startOfYear = new Date(today.getFullYear(), 0, 1)
            return {
                start: startOfYear.toISOString().split("T")[0],
                end: today.toISOString().split("T")[0],
            }
        case "lastYear":
            const startOfLastYear = new Date(today.getFullYear() - 1, 0, 1)
            const endOfLastYear = new Date(today.getFullYear() - 1, 11, 31)
            return {
                start: startOfLastYear.toISOString().split("T")[0],
                end: endOfLastYear.toISOString().split("T")[0],
            }
        default:
            return { start: "", end: "" }
    }
}

interface CustomSelectProps {
    value: string
    onChange: (value: string) => void
    options: typeof groupedFieldOptions
    placeholder: string
    inputId: string
    ariaLabel: string
}

const CustomSelect = ({ value, onChange, options, placeholder, inputId, ariaLabel }: CustomSelectProps) => {
    const [isOpen, setIsOpen] = useState(false)
    const [focusedIndex, setFocusedIndex] = useState(-1)
    const selectRef = useRef<HTMLDivElement>(null)
    const listRef = useRef<HTMLUListElement>(null)

    const allOptions = options.flatMap((group) => group.options)
    const selectedOption = allOptions.find((opt) => opt.value === value)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
                setIsOpen(false)
                setFocusedIndex(-1)
            }
        }

        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const handleKeyDown = (event: React.KeyboardEvent) => {
        switch (event.key) {
            case "Enter":
            case " ":
                event.preventDefault()
                if (isOpen && focusedIndex >= 0) {
                    const option = allOptions[focusedIndex]
                    onChange(option.value)
                    setIsOpen(false)
                    setFocusedIndex(-1)
                } else {
                    setIsOpen(!isOpen)
                }
                break
            case "Escape":
                setIsOpen(false)
                setFocusedIndex(-1)
                break
            case "ArrowDown":
                event.preventDefault()
                if (!isOpen) {
                    setIsOpen(true)
                } else {
                    setFocusedIndex((prev) => (prev < allOptions.length - 1 ? prev + 1 : 0))
                }
                break
            case "ArrowUp":
                event.preventDefault()
                if (isOpen) {
                    setFocusedIndex((prev) => (prev > 0 ? prev - 1 : allOptions.length - 1))
                }
                break
        }
    }

    const handleOptionClick = (optionValue: string) => {
        onChange(optionValue)
        setIsOpen(false)
        setFocusedIndex(-1)
    }

    const handleClear = (event: React.MouseEvent) => {
        event.stopPropagation()
        onChange("")
        setIsOpen(false)
        setFocusedIndex(-1)
    }

    return (
        <div ref={selectRef} className="relative">
            <div
                id={inputId}
                role="combobox"
                aria-expanded={isOpen}
                aria-haspopup="listbox"
                aria-label={ariaLabel}
                tabIndex={0}
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-zinc-700 text-gray-900 dark:text-gray-100 cursor-pointer transition-colors duration-150 flex items-center justify-between ${isOpen
                    ? "border-blue-500 ring-2 ring-blue-500/10"
                    : "border-gray-300 dark:border-zinc-600 hover:border-gray-400 dark:hover:border-zinc-500"
                    }`}
                onClick={() => setIsOpen(!isOpen)}
                onKeyDown={handleKeyDown}
            >
                <div className="flex items-center flex-1 min-w-0">
                    {selectedOption ? (
                        <>
                            {selectedOption.icon}
                            <span className="truncate">{selectedOption.label}</span>
                        </>
                    ) : (
                        <span className="text-gray-500 dark:text-gray-400">{placeholder}</span>
                    )}
                </div>
                <div className="flex items-center gap-1 ml-2">
                    {selectedOption && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-600 rounded transition-colors"
                            aria-label="Limpiar selección"
                        >
                            <X size={14} />
                        </button>
                    )}
                    <ChevronDown size={16} className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                </div>
            </div>

            {isOpen && (
                <ul
                    ref={listRef}
                    role="listbox"
                    className="absolute z-50 w-full mt-1 bg-white dark:bg-zinc-700 border border-gray-300 dark:border-zinc-600 rounded-lg shadow-lg max-h-60 overflow-auto"
                >
                    {options.map((group) => (
                        <li key={group.label} role="group">
                            <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-600">
                                {group.label}
                            </div>
                            {group.options.map((option) => {
                                const isFocused = focusedIndex === allOptions.findIndex((opt) => opt.value === option.value)
                                const isSelected = value === option.value

                                return (
                                    <p
                                        key={option.value}
                                        role="option"
                                        aria-selected={isSelected}
                                        className={`px-3 py-2 cursor-pointer flex items-center transition-colors ${isFocused
                                            ? "bg-blue-50 dark:bg-blue-900/20"
                                            : isSelected
                                                ? "bg-blue-100 dark:bg-blue-900/30"
                                                : "hover:bg-gray-50 dark:hover:bg-zinc-600"
                                            }`}
                                        onClick={() => handleOptionClick(option.value)}
                                    >
                                        {option.icon}
                                        <span>{option.label}</span>
                                    </p>
                                )
                            })}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}
const fetchNames = async (query: string, page: number) => {
    // Esta es una implementación simulada - reemplázala con una llamada real a tu API
    console.log(`Fetching names with query: ${query}, page: ${page}`)

    // Simulamos un retraso de red
    await new Promise(resolve => setTimeout(resolve, 500))

    // Generamos algunos datos de ejemplo
    const allNames = [
        "Producto 1", "Producto 2", "Producto 3", "Producto 4", "Producto 5",
        "Producto 6", "Producto 7", "Producto 8", "Producto 9", "Producto 10",
        "Producto 11", "Producto 12", "Producto 13", "Producto 14", "Producto 15",
    ]

    const filtered = allNames.filter(name =>
        name.toLowerCase().includes(query.toLowerCase())
    )

    const pageSize = 5
    const startIndex = (page - 1) * pageSize
    const paginated = filtered.slice(startIndex, startIndex + pageSize)

    return {
        options: paginated,
        hasMore: startIndex + pageSize < filtered.length
    }
}
export const FilterSection = ({ onApply, onReset }: FilterSectionProps) => {
    const { control, register, handleSubmit, reset, watch, setValue } = useForm<FormValues>({
        defaultValues: {
            Filtros: [{ Key: "", Value: "", Operator: "" }],
            Selects: [{ Key: "" }],
            OrderBy: { Key: "", Direction: "asc" },
            DateFilters: {
                startDate: "",
                endDate: "",
                preset: "",
            },
        },
    })

    const watchedPreset = watch("DateFilters.preset")

    const handlePresetChange = (preset: string) => {
        if (preset) {
            const dates = getDateFromPreset(preset)
            setValue("DateFilters.startDate", dates.start)
            setValue("DateFilters.endDate", dates.end)
        } else {
            setValue("DateFilters.startDate", "")
            setValue("DateFilters.endDate", "")
        }
    }

    useEffect(() => {
        handlePresetChange(watchedPreset)
    }, [watchedPreset])

    const { fields: filtros, append: addFiltro, remove: removeFiltro } = useFieldArray({ control, name: "Filtros" })
    const {
        fields: selects,
        append: addSelectField,
        remove: removeSelectField,
    } = useFieldArray({ control, name: "Selects" })

    const onSubmit = (data: FormValues) => {
        // Filtros base (excluyendo fechas)
        const baseFilters = data.Filtros.filter((f) => f.Key && f.Operator && f.Key !== "FechaEmision")

        // Agregar filtros de fecha si están definidos
        const dateFilters = []
        if (data.DateFilters.startDate) {
            dateFilters.push({
                Key: "FechaEmision",
                Value: data.DateFilters.startDate,
                Operator: ">=",
            })
        }
        if (data.DateFilters.endDate) {
            dateFilters.push({
                Key: "FechaEmision",
                Value: data.DateFilters.endDate,
                Operator: "<=",
            })
        }

        onApply({
            Filtros: [...baseFilters, ...dateFilters],
            Selects: data.Selects.filter((s) => s.Key),
            OrderBy: data.OrderBy.Key ? data.OrderBy : { Key: "", Direction: "asc" },
        })
    }

    const handleReset = () => {
        reset({
            Filtros: [{ Key: "", Value: "", Operator: "" }],
            Selects: [{ Key: "" }],
            OrderBy: { Key: "", Direction: "asc" },
            DateFilters: {
                startDate: "",
                endDate: "",
                preset: "",
            },
        })
        onReset()
    }

    return (
        <form
            onSubmit={handleSubmit(onSubmit)}
            className="w-full mb-8 bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-700 space-y-8"
            role="form"
            aria-label="Formulario de filtros de datos"
        >
            {/* Filtros */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Filtros de búsqueda</h3>
                    <button
                        type="button"
                        onClick={() => addFiltro({ Key: "", Value: "", Operator: "" })}
                        className="inline-flex items-center gap-2 text-xs bg-emerald-600 hover:bg-emerald-700 focus:bg-emerald-700 text-white px-3 py-2 rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-800"
                        aria-label="Agregar nuevo filtro"
                    >
                        <Plus size={16} />
                        Agregar filtro
                    </button>
                </div>

                <div className="space-y-3" role="group" aria-label="Lista de filtros">
                    {filtros.map((field, idx) => (
                        <div
                            key={field.id}
                            className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 bg-gray-50 dark:bg-zinc-700/50 rounded-lg border border-gray-200 dark:border-zinc-600"
                        >
                            <div className="md:col-span-5">
                                <label className="sr-only" htmlFor={`filter-field-${idx}`}>
                                    Campo para filtro {idx + 1}
                                </label>
                                <Controller
                                    name={`Filtros.${idx}.Key`}
                                    control={control}
                                    render={({ field }) => (
                                        <CustomSelect
                                            value={field.value}
                                            onChange={field.onChange}
                                            options={groupedFieldOptions}
                                            placeholder="Seleccionar campo"
                                            inputId={`filter-field-${idx}`}
                                            ariaLabel={`Campo para filtro ${idx + 1}`}
                                        />
                                    )}
                                />
                            </div>

                            <div className="md:col-span-3">
                                <label className="sr-only" htmlFor={`filter-operator-${idx}`}>
                                    Operador para filtro {idx + 1}
                                </label>
                                <select
                                    id={`filter-operator-${idx}`}
                                    {...register(`Filtros.${idx}.Operator`)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-150"
                                    aria-label={`Operador para filtro ${idx + 1}`}
                                >
                                    <option value="">Seleccionar operador</option>
                                    <option value="=">= Igual</option>
                                    <option value="<>">≠ Diferente</option>
                                    <option value=">">&gt; Mayor que</option>
                                    <option value="<">&lt; Menor que</option>
                                    <option value=">=">&ge; Mayor o igual</option>
                                    <option value="<=">&le; Menor o igual</option>
                                    <option value="like">Contiene</option>
                                </select>
                            </div>

                            <div className="md:col-span-3">
                                <label className="sr-only" htmlFor={`filter-value-${idx}`}>
                                    Valor para filtro {idx + 1}
                                </label>
                                <Controller
                                    name={`Filtros.${idx}.Value`}
                                    control={control}
                                    render={({ field }) => (
                                        <AutocompleteSelect
                                            value={field.value}
                                            onChange={field.onChange}
                                            fetchOptions={fetchNames}
                                            placeholder={`Valor a filtrar...`}
                                        />
                                    )}
                                />
                            </div>

                            <div className="md:col-span-1 flex justify-center">
                                <button
                                    type="button"
                                    onClick={() => removeFiltro(idx)}
                                    className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-800"
                                    disabled={filtros.length <= 1}
                                    aria-label={`Eliminar filtro ${idx + 1}`}
                                    title={filtros.length <= 1 ? "Debe mantener al menos un filtro" : `Eliminar filtro ${idx + 1}`}
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Campos a Mostrar */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Campos a mostrar</h3>
                    <button
                        type="button"
                        onClick={() => addSelectField({ Key: "" })}
                        className="inline-flex items-center gap-2 text-xs bg-emerald-600 hover:bg-emerald-700 focus:bg-emerald-700 text-white px-3 py-2 rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-800"
                        aria-label="Agregar nuevo campo"
                    >
                        <Plus size={16} />
                        Agregar campo
                    </button>
                </div>

                <div className="space-y-3" role="group" aria-label="Lista de campos a mostrar">
                    {selects.map((field, idx) => (
                        <div
                            key={field.id}
                            className="flex gap-3 p-4 bg-gray-50 dark:bg-zinc-700/50 rounded-lg border border-gray-200 dark:border-zinc-600"
                        >
                            <div className="flex-1">
                                <label className="sr-only" htmlFor={`select-field-${idx}`}>
                                    Campo a mostrar {idx + 1}
                                </label>
                                <input
                                    id={`select-field-${idx}`}
                                    {...register(`Selects.${idx}.Key`)}
                                    placeholder="Nombre del campo a mostrar"
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-150"
                                    aria-label={`Campo a mostrar ${idx + 1}`}
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => removeSelectField(idx)}
                                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-800"
                                disabled={selects.length <= 1}
                                aria-label={`Eliminar campo ${idx + 1}`}
                                title={selects.length <= 1 ? "Debe mantener al menos un campo" : `Eliminar campo ${idx + 1}`}
                            >
                                <X size={18} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Ordenar por */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Ordenamiento</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-zinc-700/50 rounded-lg border border-gray-200 dark:border-zinc-600">
                    <div>
                        <label htmlFor="order-field" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Campo para ordenar
                        </label>
                        <input
                            id="order-field"
                            {...register("OrderBy.Key")}
                            placeholder="Nombre del campo"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-150"
                        />
                    </div>
                    <div>
                        <label
                            htmlFor="order-direction"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                        >
                            Dirección
                        </label>
                        <select
                            id="order-direction"
                            {...register("OrderBy.Direction")}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-150"
                        >
                            <option value="asc">Ascendente (A-Z, 1-9)</option>
                            <option value="desc">Descendente (Z-A, 9-1)</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Filtros de Fecha */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <CalendarDays size={20} />
                    Filtros de fecha
                </h3>

                <div className="space-y-4 p-4 bg-gray-50 dark:bg-zinc-700/50 rounded-lg border border-gray-200 dark:border-zinc-600">
                    {/* Fechas predefinidas */}
                    <div>
                        <label htmlFor="date-preset" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Fechas clave
                        </label>
                        <select
                            id="date-preset"
                            {...register("DateFilters.preset")}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-150"
                        >
                            <option value="">Seleccionar fecha predefinida</option>
                            {datePresets.map((preset) => (
                                <option key={preset.value} value={preset.value}>
                                    {preset.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Separador */}
                    <div className="flex items-center gap-4">
                        <div className="flex-1 h-px bg-gray-300 dark:bg-zinc-600"></div>
                        <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                            O seleccionar rango personalizado
                        </span>
                        <div className="flex-1 h-px bg-gray-300 dark:bg-zinc-600"></div>
                    </div>

                    {/* Rango personalizado */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Fecha desde
                            </label>
                            <input
                                id="start-date"
                                type="date"
                                {...register("DateFilters.startDate")}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-150"
                            />
                        </div>
                        <div>
                            <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Fecha hasta
                            </label>
                            <input
                                id="end-date"
                                type="date"
                                {...register("DateFilters.endDate")}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-150"
                            />
                        </div>
                    </div>

                    {/* Información del rango seleccionado */}
                    {(watch("DateFilters.startDate") || watch("DateFilters.endDate")) && (
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <p className="text-sm text-blue-800 dark:text-blue-200">
                                <strong>Rango seleccionado:</strong>{" "}
                                {watch("DateFilters.startDate") && (
                                    <span>Desde {new Date(watch("DateFilters.startDate")).toLocaleDateString("es-ES")}</span>
                                )}
                                {watch("DateFilters.startDate") && watch("DateFilters.endDate") && " "}
                                {watch("DateFilters.endDate") && (
                                    <span>hasta {new Date(watch("DateFilters.endDate")).toLocaleDateString("es-ES")}</span>
                                )}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Botones */}
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
    )
}
