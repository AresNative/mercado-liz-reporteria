import { InputMediaProps } from "@/utils/types/interfaces";
import { Files, FileStack, Trash } from "lucide-react";
import { useCallback, useState } from "react";

export function FileComponent(props: InputMediaProps) {
    const { cuestion } = props;

    const [documents, setDocuments] = useState<File[]>([]);

    const handleFileDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        const files = Array.from(event.dataTransfer.files);
        setDocuments((prev) => [...prev, ...files]);
        props.setValue(cuestion.name, files);
    }, []);

    const preventDefault = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
    }, []);

    const handleFileInput = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);
        setDocuments((prev) => [...prev, ...files]);
        props.setValue(cuestion.name, files);
    }, []);

    const removeFile = (index: number) => {
        setDocuments((prev) => prev.filter((_, i) => i !== index));
    };

    const clearAllFiles = () => {
        setDocuments([]);
    };

    return (
        <div className="flex flex-col">
            <label className="leading-loose flex gap-2 items-center">
                <Files className="w-4 h-4" />
                {cuestion.label}
            </label>
            <div
                className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300  dark:border-zinc-700 border-dashed rounded-md"
                onDragOver={preventDefault}
                onDrop={handleFileDrop}
            >
                <div className="space-y-1 text-center">
                    {documents.length === 0 ? (
                        <FileStack className="mx-auto h-12 w-12 text-gray-400" />
                    ) : (
                        <div className="text-sm text-gray-600 dark:text-gray-100 dark:text-white">
                            {documents.map((file, index) => (
                                <div key={index} className="flex justify-between items-center">
                                    <p className="truncate">{file.name}</p>
                                    <button
                                        type="button"
                                        className="text-red-500 hover:text-red-700"
                                        onClick={() => removeFile(index)}
                                    >
                                        <Trash className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="flex text-sm text-gray-600 dark:text-gray-100 dark:text-white">
                        <label
                            htmlFor="file-upload-docs"
                            className="relative cursor-pointer bg-white dark:bg-zinc-800 rounded-md font-medium text-green-600 hover:text-green-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-green-500"
                        >
                            <span>
                                {documents.length === 0 ? "Subir archivos" : "Cambiar archivos"}
                            </span>
                            <input
                                id="file-upload-docs"
                                name="file-upload-docs"
                                type="file"
                                className="sr-only"
                                onChange={handleFileInput}
                                accept={cuestion.accept ?? "image/*"}
                                multiple={cuestion.multiple ?? true}
                            />
                        </label>
                        <p className="pl-1">o arrastrar y soltar</p>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-200">PNG, JPG, PDF hasta 10MB</p>
                </div>
            </div>
            {documents.length > 0 && (
                <div className="mt-4 flex justify-end space-x-2">
                    <button
                        type="button"
                        className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                        onClick={clearAllFiles}
                    >
                        Limpiar todo
                    </button>
                </div>
            )}
            {props.errors[cuestion.name] && props.errors[cuestion.name]?.message && (
                <span className="text-red-400 p-1">
                    {props.errors[cuestion.name]?.message}
                </span>
            )}
        </div>
    );
}
