"use client";

import { useState, useRef } from "react";
import { InputFormProps } from "@/utils/types/interfaces";
import { CircleCheckBig, Plus, Trash2, User } from "lucide-react";

export function RadioInputListComponent(props: InputFormProps) {
    const { cuestion } = props;

    // Cada elemento del arreglo representa una fila: un radio + un input.
    let [rows, setRows] = useState<string[]>([`${cuestion.name}_0`]);

    // Contador que solo incrementa, nunca se reutiliza,
    // así evitamos nombres/keys duplicados al agregar y quitar filas.
    const nextIdRef = useRef(1);

    const handleAddRow = () => {
        const newFieldName = `${cuestion.name}_${nextIdRef.current}`;
        nextIdRef.current += 1;
        setRows((prev) => [...prev, newFieldName]);
    };

    const handleRemoveRow = (index: number) => {
        setRows((prev) => prev.filter((_, i) => i !== index));
    };

    const handleInputChange = (
        fieldName: string,
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const { value } = event.target;
        props.setError(fieldName, {});
        props.setValue(fieldName, value);
    };

    return (
        <div className="flex flex-col gap-2">
            {cuestion.label && (
                <label className="leading-loose flex items-center gap-2 dark:text-white">
                    <span className="w-4 h-4 flex items-center justify-center">
                        {cuestion.icon ? cuestion.icon : <CircleCheckBig className="w-4 h-4" />}
                            </span>
                    {cuestion.label}
                </label>
            )}

            <div className="flex flex-col gap-3">
                {rows.map((fieldName, index) => {
                    const currentValue = props.watch(fieldName) || "";
                    return (
                        <div key={fieldName} className="flex flex-col">
                            <div className="flex items-center gap-3">
                                {/* Radio: mismo "name" (cuestion.name) en todas las filas
                    para que funcionen como un solo grupo de radio */}
                                <input
                                    type="radio"
                                    name={cuestion.name}
                                    value={fieldName}
                                    {...props.register(cuestion.name, {})}
                                    className="w-5 h-5 accent-purple-500 shrink-0"
                                />

                                <div className="relative w-full">
                                    <input
                                        type="text"
                                        name={fieldName}
                                        onChange={(e) => handleInputChange(fieldName, e)}
                                        className="bg-white dark:bg-gray-900 dark:text-white border-gray-300 dark:border-gray-800 py-2 px-4 w-full rounded-md focus:outline-none border focus:border-green-500 focus:ring-green-500"
                                        placeholder={cuestion.placeholder}
                                        maxLength={cuestion.maxLength}
                                        {...props.register(
                                            fieldName,
                                            cuestion.require
                                                ? { required: "El campo es obligatorio." }
                                                : {}
                                        )}
                                    />
                                    {cuestion.maxLength && (
                                        <span className="absolute right-2 top-2 text-xs text-gray-400">
                                            {currentValue.length}/{cuestion.maxLength}
                                        </span>
                                    )}
                                </div>

                                {rows.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveRow(index)}
                                        className="text-red-400 hover:text-red-600 shrink-0"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            {props.errors[fieldName] && props.errors[fieldName]?.message && (
                                <span className="text-red-400 p-1 text-sm pl-8">
                                    {props.errors[fieldName]?.message as string}
                                </span>
                            )}
                        </div>
                    );
                })}

                <button
                    type="button"
                    onClick={handleAddRow}
                    className="flex items-center gap-1 text-green-600 dark:text-green-400 text-sm w-fit mt-1 pl-8"
                >
                    <Plus className="w-4 h-4" />
                    Agregar opción
                </button>
            </div>
        </div>
    );
}