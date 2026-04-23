import { SearchableSelectProps } from "@/utils/types/interfaces";
import { Search, Star, X } from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";
import Badge from "../badge";
import { searchData } from "@/hooks/reducers/filter";
import { useAppDispatch } from "@/hooks/selector";
import { triggerFormSubmit } from "@/utils/functions/form-active";

export function SearchComponent(props: SearchableSelectProps) {
    const { cuestion } = props;

    const dispatch = useAppDispatch();
    const skillsRef = useRef<HTMLDivElement>(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [showSkillsDropdown, setShowSkillsDropdown] = useState(false);
    const [formData, setFormData] = useState<{
        skills: string[]
    }>({
        skills: []
    });

    // Función para guardar datos optimizada con useCallback
    const saveData = useCallback(() => {
        if (cuestion.saveData && formData.skills.length) {
            props.setValue(cuestion.name, formData.skills.join(', '));
        } else {
            props.setValue(cuestion.name, searchTerm);
        }
    }, [cuestion.saveData, formData.skills, cuestion.name, props.setValue, searchTerm]);

    // Ajuste en la función para simular "Enter" al seleccionar un elemento
    const handleSkillToggle = useCallback(async (skill: string) => {
        if (cuestion.saveData) {
            if (skill.trim() !== "") {
                setFormData(prev => ({
                    ...prev,
                    skills: [...prev.skills, skill.trim()]
                }));
                setSearchTerm('');
            }
        } else {
            setSearchTerm(skill);
        };
        setShowSkillsDropdown(false);
        triggerFormSubmit();
    }, [cuestion.saveData]);

    const handleRemoveSkill = useCallback((skill: string) => {
        setFormData(prev => ({
            ...prev,
            skills: prev.skills.filter(s => s !== skill)
        }));
    }, []);

    const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Enter") {
            event.preventDefault();
            if (cuestion.saveData && searchTerm.trim() !== "") {
                setFormData(prev => ({
                    ...prev,
                    skills: [...prev.skills, searchTerm.trim()]
                }));
                setSearchTerm("");
            }
            setShowSkillsDropdown(false);
            triggerFormSubmit();
        }
    }, [cuestion.saveData, searchTerm]);

    // Efecto para cerrar dropdown al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (skillsRef.current && !skillsRef.current.contains(e.target as Node)) {
                setShowSkillsDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Efecto para sincronizar datos con react-hook-form
    useEffect(() => {
        saveData();
    }, [saveData]); // Solo depende de saveData que está memoizado

    // Efecto para inicializar skills si hay un valor por defecto
    useEffect(() => {
        if (cuestion.valueDefined && cuestion.saveData) {
            try {
                const skillsArray = typeof cuestion.valueDefined === 'string'
                    ? cuestion.valueDefined.split(',').map(s => s.trim()).filter(Boolean)
                    : Array.isArray(cuestion.valueDefined)
                        ? cuestion.valueDefined
                        : [];

                if (skillsArray.length > 0) {
                    setFormData(prev => ({
                        ...prev,
                        skills: [...prev.skills, ...skillsArray.filter(s => !prev.skills.includes(s))]
                    }));
                }
            } catch (error) {
                console.error('Error parsing valueDefined for skills:', error);
            }
        }
    }, [cuestion.valueDefined, cuestion.saveData]);

    // Función para filtrar opciones
    const filteredOptions = cuestion.options?.filter((skill: any) => {
        if (!searchTerm) return true;

        const searchText = typeof skill === 'object' && skill !== null
            ? skill.label
            : skill.toString();
        return searchText.toLowerCase().includes(searchTerm.toLowerCase());
    }) || [];

    return (
        <div className="flex flex-col relative dark:text-white" ref={skillsRef}>
            <label className="leading-loose flex items-center gap-2 dark:text-white">
                <span className="w-4 h-4 flex items-center justify-center">
                    {cuestion.icon ? cuestion.icon : <Star className="w-4 h-4" />}
                </span>
                {cuestion.label}
            </label>
            <div className="relative flex-1">
                <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                    type="text"
                    placeholder={cuestion.placeholder}
                    value={searchTerm}
                    className="bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-700 py-2 pl-10 w-full rounded-md focus:outline-none border focus:border-green-500 focus:ring-green-500"
                    onClick={() => setShowSkillsDropdown(true)}
                    onChange={(e) => {
                        if (cuestion.options) dispatch(searchData(e.target.value));
                        setSearchTerm(e.target.value);
                        setShowSkillsDropdown(true);
                    }}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setShowSkillsDropdown(true)}
                />
            </div>

            {cuestion.options && showSkillsDropdown && filteredOptions.length > 0 && (
                <div className="absolute z-30 top-[4.6rem] w-full bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 mt-1 rounded-md shadow-lg">
                    <div className="p-2">
                        <ul className="max-h-60 overflow-y-auto">
                            {filteredOptions.map((skill: any, key: number) => {
                                const isObject = typeof skill === 'object' && skill !== null;
                                const value = isObject ? skill.value.toString() : skill.toString();
                                const label = isObject ? skill.label : skill.toString();

                                return (
                                    <li
                                        key={key}
                                        className={`px-4 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer`}
                                        onClick={() => handleSkillToggle(value)}
                                    >
                                        {label}
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </div>
            )}

            {cuestion.saveData && formData.skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                    {formData.skills.map(skill => (
                        <div key={skill} className="flex items-center gap-1">
                            <Badge text={skill} color="green" />
                            <button
                                type="button"
                                onClick={() => handleRemoveSkill(skill)}
                                className="text-red-600 hover:text-red-800 transition-colors"
                                aria-label={`Remove ${skill}`}
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}