"use client"

import type React from "react"

import { useForm, useFieldArray, Controller } from "react-hook-form"
import { X, User, Calendar, Mail, Plus, ChevronDown } from "lucide-react"
import { useState, useRef, useEffect } from "react"

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
}

const fieldOptions = [
    { value: "Nombre", label: "Nombre", icon: <User className="inline mr-2" />, category: "Datos Personales" },
    { value: "email", label: "Correo", icon: <Mail className="inline mr-2" />, category: "Datos Personales" },
    {
        value: "created_at",
        label: "Fecha de creación",
        icon: <Calendar className="inline mr-2" />,
        category: "Metadatos",
    },
]

const groupedFieldOptions = [
    { label: "Datos Personales", options: fieldOptions.filter((o) => o.category === "Datos Personales") },
    { label: "Metadatos", options: fieldOptions.filter((o) => o.category === "Metadatos") },
]

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

export const FilterSection = ({ onApply, onReset }: FilterSectionProps) => {
    const { control, register, handleSubmit, reset } = useForm<FormValues>({
        defaultValues: {
            Filtros: [{ Key: "", Value: "", Operator: "" }],
            Selects: [{ Key: "" }],
            OrderBy: { Key: "", Direction: "asc" },
        },
    })

    const { fields: filtros, append: addFiltro, remove: removeFiltro } = useFieldArray({ control, name: "Filtros" })
    const {
        fields: selects,
        append: addSelectField,
        remove: removeSelectField,
    } = useFieldArray({ control, name: "Selects" })

    const onSubmit = (data: FormValues) => {
        onApply({
            Filtros: data.Filtros.filter((f) => f.Key && f.Operator),
            Selects: data.Selects.filter((s) => s.Key),
            OrderBy: data.OrderBy.Key ? data.OrderBy : { Key: "", Direction: "asc" },
        })
    }

    const handleReset = () => {
        reset({
            Filtros: [{ Key: "", Value: "", Operator: "" }],
            Selects: [{ Key: "" }],
            OrderBy: { Key: "", Direction: "asc" },
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
                                <input
                                    id={`filter-value-${idx}`}
                                    {...register(`Filtros.${idx}.Value`)}
                                    placeholder="Valor a filtrar"
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-150"
                                    aria-label={`Valor para filtro ${idx + 1}`}
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
