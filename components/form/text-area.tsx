"use client";

import { InputFormProps } from "@/utils/types/interfaces";
import { Briefcase, Link, Code, List, ListOrdered, Quote, Bold, Italic, CodeSquare } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Modal } from "@/components/modal";
import { Button } from "../button";
import { useAppDispatch } from "@/hooks/selector";
import { openModalReducer, closeModalReducer } from "@/hooks/reducers/drop-down";

export function TextAreaComponent(props: InputFormProps) {
    const { cuestion } = props;
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const dispatch = useAppDispatch();

    // Estado local: fuente de verdad inmediata para el textarea.
    // Antes el valor salía directo de props.watch(cuestion.name), pero watch()
    // llamado así en el render no es reactivo por sí mismo: solo se actualizaba
    // cuando el formulario padre volvía a renderizar, lo que hacía que insertar
    // negrita/enlace/código/etc. se viera con retraso o se perdiera la posición del cursor.
    const [currentValue, setCurrentValue] = useState<string>(
        () => props.watch(cuestion.name) || ""
    );

    // Posición de cursor pendiente por restaurar después del próximo render
    const pendingCursorPos = useRef<number | null>(null);

    const [linkUrl, setLinkUrl] = useState("");
    const [linkText, setLinkText] = useState("");
    const modalName = `link-modal-${cuestion.name}`;

    // Sincroniza el valor definido inicialmente
    useEffect(() => {
        if (cuestion.valueDefined !== undefined && cuestion.valueDefined !== null) {
            setCurrentValue(cuestion.valueDefined);
            props.setValue(cuestion.name, cuestion.valueDefined);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cuestion.valueDefined]);

    // Restaura el foco y la posición del cursor justo después de que el DOM
    // refleje el nuevo valor (reemplaza al setTimeout(10) original, que podía
    // correr antes de que React terminara de pintar el nuevo texto).
    useLayoutEffect(() => {
        if (pendingCursorPos.current !== null && textareaRef.current) {
            const pos = pendingCursorPos.current;
            textareaRef.current.focus();
            textareaRef.current.setSelectionRange(pos, pos);
            pendingCursorPos.current = null;
        }
    }, [currentValue]);

    // Actualiza el valor local + el formulario, y agenda la posición de cursor a restaurar
    const updateValue = (newValue: string, cursorPos?: number) => {
        setCurrentValue(newValue);
        props.setValue(cuestion.name, newValue);
        if (cursorPos !== undefined) {
            pendingCursorPos.current = cursorPos;
        }
    };

    // --- Funciones de inserción ---

    const insertAtCursor = (textToInsert: string) => {
        const textarea = textareaRef.current;
        if (!textarea) {
            // Sin referencia disponible: agrega al final como fallback
            updateValue(currentValue + textToInsert);
            return;
        }

        const start = textarea.selectionStart ?? currentValue.length;
        const end = textarea.selectionEnd ?? currentValue.length;

        const newValue = currentValue.substring(0, start) + textToInsert + currentValue.substring(end);
        const newCursorPos = start + textToInsert.length;

        updateValue(newValue, newCursorPos);
    };

    // Envuelve la selección actual con marcadores (negrita, itálica, código en línea).
    // Si no hay selección, inserta un placeholder y deja el cursor dentro de él.
    const wrapSelection = (before: string, after: string, placeholder: string) => {
        const textarea = textareaRef.current;
        if (!textarea) {
            insertAtCursor(`${before}${placeholder}${after}`);
            return;
        }

        const start = textarea.selectionStart ?? currentValue.length;
        const end = textarea.selectionEnd ?? currentValue.length;
        const selectedText = currentValue.substring(start, end);

        if (selectedText) {
            const newValue =
                currentValue.substring(0, start) + before + selectedText + after + currentValue.substring(end);
            const newCursorPos = start + before.length + selectedText.length + after.length;
            updateValue(newValue, newCursorPos);
        } else {
            const newValue =
                currentValue.substring(0, start) + before + placeholder + after + currentValue.substring(end);
            // Deja el cursor seleccionando el placeholder para que el usuario lo sobreescriba
            updateValue(newValue, start + before.length + placeholder.length);
        }
    };

    // --- Manejadores de las herramientas ---

    const handleOpenLinkModal = () => {
        setLinkUrl("");
        setLinkText("");
        dispatch(openModalReducer({ modalName }));
    };

    const handleConfirmLink = () => {
        if (!linkUrl.trim()) return;
        const text = linkText.trim() || linkUrl.trim();
        const linkMarkdown = `[${text}](${linkUrl.trim()})`;
        insertAtCursor(linkMarkdown);
        dispatch(closeModalReducer({ modalName }));
    };

    const handleCancelLink = () => {
        dispatch(closeModalReducer({ modalName }));
    };

    const handleInlineCode = () => wrapSelection("`", "`", "código");
    const handleBold = () => wrapSelection("**", "**", "texto");
    const handleItalic = () => wrapSelection("*", "*", "texto");

    const handleCodeBlock = () => {
        insertAtCursor("\n```\ncódigo\n```\n");
    };

    const handleUnorderedList = () => {
        insertAtCursor("\n- Item de lista\n");
    };

    const handleOrderedList = () => {
        insertAtCursor("\n1. Item de lista\n");
    };

    const handleQuote = () => {
        insertAtCursor("\n> Cita importante\n");
    };

    // --- Registro de react-hook-form ---
    // Se conserva onBlur (antes se descartaba junto con onChange, perdiendo
    // la validación en blur configurada por react-hook-form).
    const { ref, onChange: _rhfOnChange, onBlur, ...registerRest } = props.register(cuestion.name,
        cuestion.require ? { required: "El campo es obligatorio." } : {}
    ) as any;

    return (
        <>
            <div className="flex flex-col">
                <label className="leading-loose flex items-center gap-2 dark:text-white">
                    <span className="w-4 h-4 flex items-center justify-center">
                        {cuestion.icon ? cuestion.icon : <Briefcase className="w-4 h-4" />}
                    </span>
                    {cuestion.label}
                </label>
                <div className="relative">
                    <textarea
                        {...registerRest}
                        ref={(e) => {
                            // Asignar el ref de react-hook-form
                            ref(e);
                            // Asignar nuestro ref
                            textareaRef.current = e;
                        }}
                        name={cuestion.name}
                        value={currentValue}
                        onChange={(e) => updateValue(e.target.value)}
                        onBlur={onBlur}
                        className="bg-white field-sizing-content dark:bg-zinc-800 px-4 py-2 border focus:ring-green-500 focus:border-green-900 w-full sm:text-sm border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none text-gray-600 dark:text-gray-100 min-h-[120px] pb-14
[&:-webkit-autofill]:bg-white [&:-webkit-autofill]:text-gray-600 [&:-webkit-autofill]:dark:bg-zinc-800 [&:-webkit-autofill]:dark:text-white [&:-webkit-autofill]:transition-colors [&:-webkit-autofill]:duration-[999999s]"
                        placeholder={cuestion.placeholder}
                        rows={3}
                        maxLength={cuestion.maxLength}
                        minLength={cuestion.minLength}
                    />

                    {/* Barra de herramientas con fondo semitransparente */}
                    <div className="absolute bottom-2 right-2 flex gap-1 items-center flex-wrap bg-white/80 dark:bg-zinc-800/80 p-1 rounded-md backdrop-blur-sm">
                        <Button type="button" onClick={handleOpenLinkModal} color="ship" size="small">
                            <Link className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        </Button>
                        <Button type="button" onClick={handleBold} color="ship" size="small">
                            <Bold className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        </Button>
                        <Button type="button" onClick={handleItalic} color="ship" size="small">
                            <Italic className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        </Button>
                        <Button type="button" onClick={handleInlineCode} color="ship" size="small">
                            <Code className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        </Button>
                        <Button type="button" onClick={handleCodeBlock} color="ship" size="small">
                            <CodeSquare className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        </Button>
                        <Button type="button" onClick={handleUnorderedList} color="ship" size="small">
                            <List className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        </Button>
                        <Button type="button" onClick={handleOrderedList} color="ship" size="small">
                            <ListOrdered className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        </Button>
                        <Button type="button" onClick={handleQuote} color="ship" size="small">
                            <Quote className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        </Button>
                        <span className="flex gap-2 justify-between items-center ml-1">
                            {cuestion.minLength && (
                                <span className="text-xs text-gray-400">
                                    {currentValue.length}/{cuestion.minLength} min
                                </span>
                            )}
                            {cuestion.maxLength && (
                                <span className="text-xs text-gray-400">
                                    {currentValue.length}/{cuestion.maxLength}
                                </span>
                            )}
                        </span>
                    </div>
                </div>

                {props.errors[cuestion.name] && props.errors[cuestion.name]?.message && (
                    <span className="text-red-400 p-1">
                        {props.errors[cuestion.name]?.message}
                    </span>
                )}
            </div>

            {/* Modal para insertar enlace (controlado por Redux) */}
            <Modal modalName={modalName} title="Insertar enlace" maxWidth="md">
                <div className="flex flex-col gap-5 p-4">
                    <div>
                        <label htmlFor={`${modalName}-url`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            URL
                        </label>
                        <input
                            id={`${modalName}-url`}
                            type="url"
                            value={linkUrl}
                            onChange={(e) => setLinkUrl(e.target.value)}
                            placeholder="https://ejemplo.com"
                            className="block w-full rounded-md border-gray-300 dark:border-zinc-700 shadow-sm focus:border-green-500 focus:ring-green-500 dark:bg-zinc-800 dark:text-white sm:text-sm p-2.5"
                            autoFocus
                        />
                    </div>
                    <div>
                        <label htmlFor={`${modalName}-text`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Texto a mostrar <span className="text-gray-400 text-xs">(opcional)</span>
                        </label>
                        <input
                            id={`${modalName}-text`}
                            type="text"
                            value={linkText}
                            onChange={(e) => setLinkText(e.target.value)}
                            placeholder="Texto del enlace"
                            className="block w-full rounded-md border-gray-300 dark:border-zinc-700 shadow-sm focus:border-green-500 focus:ring-green-500 dark:bg-zinc-800 dark:text-white sm:text-sm p-2.5"
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-2 border-t border-gray-200 dark:border-zinc-700">
                        <Button type="button" onClick={handleCancelLink} color="ship">
                            Cancelar
                        </Button>
                        <Button type="button" onClick={handleConfirmLink} color="success">
                            Insertar
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
}