"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, ChevronDown } from "lucide-react";

interface OptionType {
    value: string;
    label: string;
    icon: React.ReactNode;
}

interface GroupedOptions {
    label: string;
    options: OptionType[];
}

interface CustomSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: GroupedOptions[];
    placeholder: string;
    inputId: string;
    ariaLabel: string;
}

export const CustomSelect = ({
    value,
    onChange,
    options,
    placeholder,
    inputId,
    ariaLabel
}: CustomSelectProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const selectRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLUListElement>(null);

    const allOptions = options.flatMap(group => group.options);
    const selectedOption = allOptions.find(opt => opt.value === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setFocusedIndex(-1);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleKeyDown = (event: React.KeyboardEvent) => {
        switch (event.key) {
            case "Enter":
            case " ":
                event.preventDefault();
                if (isOpen && focusedIndex >= 0) {
                    handleOptionClick(allOptions[focusedIndex].value);
                } else {
                    setIsOpen(!isOpen);
                }
                break;
            case "Escape":
                setIsOpen(false);
                setFocusedIndex(-1);
                break;
            case "ArrowDown":
                event.preventDefault();
                !isOpen ? setIsOpen(true) : setFocusedIndex(prev => (prev < allOptions.length - 1 ? prev + 1 : 0));
                break;
            case "ArrowUp":
                event.preventDefault();
                isOpen && setFocusedIndex(prev => (prev > 0 ? prev - 1 : allOptions.length - 1));
                break;
        }
    };

    const handleOptionClick = (optionValue: string) => {
        onChange(optionValue);
        setIsOpen(false);
        setFocusedIndex(-1);
    };

    const handleClear = (event: React.MouseEvent) => {
        event.stopPropagation();
        onChange("");
        setIsOpen(false);
        setFocusedIndex(-1);
    };

    return (
        <div ref={selectRef} className="relative">
            <div
                id={inputId}
                role="combobox"
                aria-expanded={isOpen}
                aria-haspopup="listbox"
                aria-label={ariaLabel}
                tabIndex={0}
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-zinc-700 text-gray-900 dark:text-gray-100 cursor-pointer transition-colors duration-150 flex items-center justify-between ${isOpen ? "border-blue-500 ring-2 ring-blue-500/10" : "border-gray-300 dark:border-zinc-600 hover:border-gray-400 dark:hover:border-zinc-500"
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
                        <span className="text-gray-900 dark:text-gray-100">{placeholder}</span>
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
                            <div className="px-3 py-2 text-xs font-semibold text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-600">
                                {group.label}
                            </div>
                            {group.options.map((option, index) => {
                                const absoluteIndex = allOptions.findIndex(opt => opt.value === option.value);
                                const isFocused = focusedIndex === absoluteIndex;
                                const isSelected = value === option.value;

                                return (
                                    <p
                                        key={option.value}
                                        role="option"
                                        aria-selected={isSelected}
                                        className={`px-3 py-2 text-gray-900 dark:text-gray-100 cursor-pointer flex items-center transition-colors ${isFocused ? "bg-blue-50 dark:bg-blue-900/20" :
                                            isSelected ? "bg-blue-100 dark:bg-blue-900/30" :
                                                "hover:bg-gray-50 dark:hover:bg-zinc-600"
                                            }`}
                                        onClick={() => handleOptionClick(option.value)}
                                    >
                                        {option.icon}
                                        <span>{option.label}</span>
                                    </p>
                                );
                            })}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};