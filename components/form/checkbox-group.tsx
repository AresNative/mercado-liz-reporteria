import { ChecboxFormProps } from "@/utils/types/interfaces";
import { Check } from "lucide-react";
import { useEffect, useState } from "react";

export function CheckboxGroupComponent(props: ChecboxFormProps) {

    const { cuestion } = props;

    const [jobRequirements, setJobRequirements] = useState(cuestion.options.reduce((acc, option) => {
        acc[option] = false;
        return acc;
    }, {} as Record<string, boolean>));

    const handleJobRequirementChange = (requirement: keyof typeof jobRequirements) => {
        setJobRequirements(prev => ({
            ...prev,
            [requirement]: !prev[requirement]
        }));
    };

    useEffect(() => {
        props.setValue(cuestion.name, Object.keys(jobRequirements).filter(key => jobRequirements[key]) as unknown as boolean);
    }, [jobRequirements])

    return (
        <div>
            <p className="text-sm font-medium text-gray-700 mb-2">{cuestion.label}:</p>
            <div className="space-y-2">
                {Object.entries(jobRequirements).map(([key, value]) => (
                    <div key={key} className="flex items-center">
                        <div
                            className={`h-5 w-5 border dark:border-zinc-700 rounded flex items-center justify-center ${value ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                                }`}
                            onClick={() => handleJobRequirementChange(key as keyof typeof jobRequirements)}
                        >
                            {value && <Check className="h-4 w-4 text-white" />}
                        </div>
                        <label htmlFor={`requirement-${key}`} className="ml-2 block text-sm text-gray-900 dark:text-white">
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
    )
}