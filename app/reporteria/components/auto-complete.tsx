"use client";

import useDebounce from "@/hooks/use-debounce";
import { useState, useEffect, useRef, useCallback } from "react";

interface AutocompleteSelectProps {
    value: string;
    onChange: (value: string) => void;
    fetchOptions: (
        query: string,
        page: number,
        signal?: AbortSignal
    ) => Promise<{ options: string[]; hasMore: boolean }>;
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

    const debouncedValue = useDebounce(inputValue, 200);
    async function onClickInput() {
        const controller = new AbortController();

        const { options: newOptions, hasMore } = await fetchOptions("a", 1, controller.signal);
        setOptions(newOptions);
        setHasMore(hasMore);
        setPage(1);
    }
    useEffect(() => {
        const controller = new AbortController();
        const fetchData = async () => {
            if (!isOpen || !debouncedValue) return;

            setLoading(true);
            try {
                const { options: newOptions, hasMore } = await fetchOptions(debouncedValue, 1, controller.signal);
                setOptions(newOptions);
                setHasMore(hasMore);
                setPage(1);
            } catch (error) {
                if ((error as any).name !== 'AbortError') {
                    console.error("Error fetching options:", error);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchData();

        return () => controller.abort();
    }, [debouncedValue, isOpen]);

    const loadMore = useCallback(async () => {
        if (loading || !hasMore) return;

        const controller = new AbortController();
        setLoading(true);

        const nextPage = page + 1;

        try {
            const { options: newOptions, hasMore: newHasMore } = await fetchOptions(
                debouncedValue, // usa el valor debounced
                nextPage,
                controller.signal
            );
            setOptions(prev => [...prev, ...newOptions]);
            setHasMore(newHasMore);
            setPage(nextPage);
        } catch (error) {
            if ((error as any).name !== 'AbortError') {
                console.error("Error loading more options:", error);
            }
        } finally {
            setLoading(false);
        }
    }, [debouncedValue, page, loading, hasMore]);


    const lastOptionRef = useCallback((node: HTMLLIElement | null) => {
        if (!node || loading || !hasMore) return;

        if (observerRef.current) observerRef.current.disconnect();

        observerRef.current = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    loadMore();
                }
            },
            {
                root: listRef.current, // Observa dentro del scroll del UL
                rootMargin: '0px',
                threshold: 0.1, // Más permisivo
            }
        );

        observerRef.current.observe(node);
    }, [loadMore, hasMore, loading]);


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

        onChange(e.target.value);
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
                onClick={onClickInput}
                placeholder={placeholder}
                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-150"
            />

            {isOpen && (
                <ul
                    ref={listRef}
                    className="absolute z-50 w-full mt-1 max-h-60 overflow-y-auto bg-white dark:bg-zinc-700 border border-gray-300 dark:border-zinc-600 rounded-lg shadow-lg text-gray-900 dark:text-gray-100"
                >
                    {options.length > 0 ? (
                        <>
                            {options.map((option, index) => (
                                <li
                                    key={`${option}-${index}`}
                                    ref={
                                        hasMore && index === options.length - 1
                                            ? lastOptionRef
                                            : null
                                    }
                                    className={`px-3 py-2 cursor-pointer ${index === selectedIndex
                                        ? 'bg-blue-100 dark:bg-blue-900/30'
                                        : 'hover:bg-gray-50 dark:hover:bg-zinc-600'
                                        }`}
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