"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface AutocompleteSelectProps {
    value: string;
    onChange: (value: string) => void;
    fetchOptions: (query: string, page: number) => Promise<{ options: string[]; hasMore: boolean }>;
    placeholder?: string;
}

export const AutoComplete = ({ value, onChange, fetchOptions, placeholder }: AutocompleteSelectProps) => {
    const [inputValue, setInputValue] = useState(value);
    const [options, setOptions] = useState<string[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLUListElement>(null);
    const observerRef = useRef<IntersectionObserver>(null);

    const lastOptionRef = useCallback((node: HTMLLIElement) => {
        if (loading || !node || !hasMore) return;

        if (observerRef.current) observerRef.current.disconnect();

        observerRef.current = new IntersectionObserver(
            (entries) => entries[0].isIntersecting && hasMore && loadMore(),
            { threshold: 1.0 }
        );

        observerRef.current.observe(node);
    }, [loading, hasMore]);

    useEffect(() => {
        const fetchData = async () => {
            if (!isOpen) return;

            setLoading(true);
            try {
                const { options: newOptions, hasMore } = await fetchOptions(inputValue, 1);
                setOptions(newOptions);
                setHasMore(hasMore);
                setPage(1);
            } finally {
                setLoading(false);
            }
        };

        const timer = setTimeout(fetchData, 300);
        return () => clearTimeout(timer);
    }, [inputValue, isOpen, fetchOptions]);

    const loadMore = useCallback(async () => {
        if (loading || !hasMore) return;

        setLoading(true);
        try {
            const { options: newOptions, hasMore: newHasMore } = await fetchOptions(inputValue, page + 1);
            setOptions(prev => [...prev, ...newOptions]);
            setHasMore(newHasMore);
            setPage(prev => prev + 1);
        } finally {
            setLoading(false);
        }
    }, [inputValue, page, loading, hasMore, fetchOptions]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev => Math.min(prev + 1, options.length - 1));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => Math.max(prev - 1, 0));
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0 && selectedIndex < options.length) {
                    handleSelect(options[selectedIndex]);
                }
                break;
            case 'Escape':
                e.preventDefault();
                setIsOpen(false);
                break;
        }
    };

    const handleSelect = (option: string) => {
        setInputValue(option);
        onChange(option);
        setIsOpen(false);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
        if (!isOpen) setIsOpen(true);
        setSelectedIndex(-1);
    };

    const handleFocus = () => !isOpen && setIsOpen(true);

    return (
        <div ref={containerRef} className="relative">
            <input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onFocus={handleFocus}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-150"
            />

            {isOpen && (
                <ul
                    ref={listRef}
                    className="absolute z-50 w-full mt-1 max-h-60 overflow-y-auto bg-white dark:bg-zinc-700 border border-gray-300 dark:border-zinc-600 rounded-lg shadow-lg"
                >
                    {options.length > 0 ? (
                        <>
                            {options.map((option, index) => (
                                <li
                                    key={`${option}-${index}`}
                                    ref={index === options.length - 1 ? lastOptionRef : null}
                                    className={`px-3 py-2 cursor-pointer ${index === selectedIndex ? 'bg-blue-100 dark:bg-blue-900/30' : 'hover:bg-gray-50 dark:hover:bg-zinc-600'}`}
                                    onClick={() => handleSelect(option)}
                                >
                                    {option}
                                </li>
                            ))}
                            {loading && <LoadingItem />}
                        </>
                    ) : !loading ? (
                        <NoResultsItem />
                    ) : (
                        <LoadingItem />
                    )}
                </ul>
            )}
        </div>
    );
};

const LoadingItem = () => (
    <li className="px-3 py-2 text-center text-gray-500 dark:text-gray-400">
        Cargando...
    </li>
);

const NoResultsItem = () => (
    <li className="px-3 py-2 text-center text-gray-500 dark:text-gray-400">
        No se encontraron resultados
    </li>
);