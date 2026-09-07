import { useEffect, useState } from "react";
import { ChecboxFormProps } from "@/utils/types/interfaces";
import { Check } from "lucide-react";

export function CheckboxGroupComponent(props: ChecboxFormProps) {
    const { cuestion } = props;

    // Inicializar el estado desde valueDefined
    const getInitialState = () => {
        const initial = cuestion.options.reduce((acc, option) => {
            acc[option] = false;
            return acc;
        }, {} as Record<string, boolean>);

        const valueDefined = (cuestion as { valueDefined?: string | string[] }).valueDefined;

        if (valueDefined) {
            let selected: string[] = [];
            if (Array.isArray(valueDefined)) {
                selected = valueDefined;
            } else if (typeof valueDefined === "string") {
                selected = valueDefined.split(",").map((s: string) => s.trim()).filter(Boolean);
            }
            selected.forEach((opt: string) => {
                if (Object.prototype.hasOwnProperty.call(initial, opt)) {
                    initial[opt] = true;
                }
            });
        }
        return initial;
    };

    const [jobRequirements, setJobRequirements] = useState<Record<string, boolean>>(getInitialState);

    const handleJobRequirementChange = (requirement: keyof typeof jobRequirements) => {
        setJobRequirements(prev => ({
            ...prev,
            [requirement]: !prev[requirement]
        }));
    };

    return (
        <div>
            <p className="text-sm font-medium text-gray-700 mb-2">{cuestion.label}:</p>
            <div className="space-y-2">
                {Object.entries(jobRequirements).map(([key, value]) => (
                    <div key={key} className="flex items-center">
                        <div
                            className={`h-5 w-5 border dark:border-zinc-700 rounded flex items-center justify-center ${value ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}
                            onClick={() => handleJobRequirementChange(key as keyof typeof jobRequirements)}
                        >
                            {value && <Check className="h-4 w-4 text-white" />}
                        </div>
                        <label className="ml-2 block text-sm text-gray-900 dark:text-white">
                            {key.charAt(0).toUpperCase() + key.slice(1)}
                        </label>
                    </div>
                ))}
            </div>
            {props.errors[cuestion.name] && props.errors[cuestion.name]?.message && (
                <span className="text-red-400 p-1">
                    {props.errors[cuestion.name]?.message}
                </span>
            )}
        </div>
    );
}