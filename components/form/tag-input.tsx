import { Plus, X } from "lucide-react";
import { useEffect, useState } from "react";

interface TagInputProps {
    cuestion: {
        name: string;
        placeholder?: string;
        label?: string;
        require: boolean;
        valueDefined?: any;
        jsonString?: boolean;
    };
    watch: any;
    setValue: any;
    errors: any;
}

export const TagInputComponent = ({
    cuestion,
    watch,
    setValue,
    errors
}: TagInputProps) => {
    const [newTag, setNewTag] = useState("");
    const watchedValue = watch(cuestion.name);
    let tags: string[] = [];

    if (cuestion.jsonString) {
        try {
            tags = watchedValue ? JSON.parse(watchedValue) : [];
        } catch (error) {
            tags = [];
        }
    } else {
        tags = watchedValue || [];
    }
    useEffect(() => {
        if (cuestion.valueDefined) {
            setValue(cuestion.name, cuestion.valueDefined);
        }
    }, [cuestion.valueDefined]);
    const addTag = (e: React.FormEvent) => {
        e.preventDefault();
        if (newTag.trim() && !tags.includes(newTag.trim())) {
            const newTagsArray = [...tags, newTag.trim()];
            const newValue = cuestion.jsonString ? JSON.stringify(newTagsArray) : newTagsArray;
            setValue(cuestion.name, newValue);
            setNewTag("");
        }
    };

    const removeTag = (tagToRemove: string) => {
        const newTagsArray = tags.filter((tag: string) => tag !== tagToRemove);
        const newValue = cuestion.jsonString ? JSON.stringify(newTagsArray) : newTagsArray;
        setValue(cuestion.name, newValue);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            addTag(e);
        }
    };

    return (
        <div className="w-full">
            {cuestion.label && (
                <label className="flex gap-2 text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    {cuestion.label}
                    {cuestion.require && <span className="text-red-500">*</span>}
                </label>
            )}
            <div className="flex flex-wrap gap-1 mb-2">
                {tags.map((tag: string, index: number) => (
                    <span
                        key={index}
                        className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900 px-2 py-0.5 text-xs font-medium text-green-800 dark:text-green-200"
                    >
                        {tag}
                        <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-1 text-green-500 hover:text-green-700 dark:text-green-300 dark:hover:text-green-100"
                        >
                            <X size={15} />
                        </button>
                    </span>
                ))}
            </div>
            <div className="flex">
                <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={cuestion.placeholder || "Añadir etiqueta"}
                    className="bg-white dark:bg-zinc-800 px-4 py-2 border dark:border-zinc-700 focus:ring-green-500 focus:border-green-900 w-full sm:text-sm border-gray-300 rounded-md focus:outline-none text-gray-600 dark:text-gray-100 dark:text-white [&:-webkit-autofill]:bg-white [&:-webkit-autofill]:text-gray-600 dark:text-gray-100 [&:-webkit-autofill]:dark:bg-zinc-800 [&:-webkit-autofill]:dark:text-white [&:-webkit-autofill]:transition-colors [&:-webkit-autofill]:duration-[999999s]"
                />
                <button
                    onClick={addTag}
                    className="ml-2 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:bg-green-500 dark:hover:bg-green-600"
                >
                    <Plus />
                </button>
            </div>
            {errors[cuestion.name] && (
                <p className="mt-1 text-sm text-red-600">{errors[cuestion.name].message}</p>
            )}
        </div>
    );
};