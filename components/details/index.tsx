import { ChevronDown, Plus } from "lucide-react";

interface DetailsProps {
    title: string;
    description?: string;
    type?: string;
    children?: React.ReactNode;
}
export default function Details({ title, description, type, children }: DetailsProps) {

    if (type === 'form') {
        return (
            <details className="mt-4 mb-4 border dark:border-zinc-700 rounded-lg overflow-auto group pb-4-">
                <summary className="w-full text-left p-4 flex justify-between items-center bg-blue-50 hover:bg-blue-100 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors cursor-pointer">
                    <span className="text-sm font-medium text-blue-700 dark:text-white">{title}</span>
                    <Plus className="h-5 w-5 text-blue-500 dark:text-white transition-transform group-open:rotate-45" />
                </summary>
                <div className="p-4 bg-white dark:bg-zinc-800">
                    {children}
                </div>
            </details>
        )
    }

    return (
        <details className="mb-2 mt-2 border dark:border-zinc-700 rounded-lg overflow-hidden group">
            <summary className="w-full text-left p-4 flex justify-between items-center bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-300 transition-colors cursor-pointer">
                <span className="text-sm font-medium text-gray-700">{title}</span>
                <ChevronDown className="h-5 w-5 text-gray-500 dark:text-white transition-transform group-open:rotate-180" />
            </summary>
            <div className="p-4 bg-white dark:bg-zinc-800">
                <p className="text-sm text-gray-600 dark:text-gray-100 dark:text-white">{description}</p>
            </div>
        </details>
    );
}