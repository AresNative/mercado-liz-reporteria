import { InputFormProps } from "@/utils/types/interfaces";
import { Briefcase } from "lucide-react";
import { useEffect } from "react";

export function TextAreaComponent(props: InputFormProps) {
    const { cuestion } = props;
    const currentValue = props.watch(cuestion.name) || "";
    useEffect(() => {
        if (cuestion.valueDefined) {
            props.setValue(cuestion.name, cuestion.valueDefined);
        }
    }, [cuestion.valueDefined]);
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { value } = e.target;

        props.setValue(cuestion.name, value);
    };
    return (
        <div className="flex flex-col">
            <label className="leading-loose flex items-center gap-2 dark:text-white">
                <span className="w-4 h-4 flex items-center justify-center">
                    {cuestion.icon ? cuestion.icon : <Briefcase className="w-4 h-4" />}
                </span>
                {cuestion.label}
            </label>
            <div className="relative">
                <textarea
                    name="experience"
                    onChange={handleInputChange}
                    className="bg-white field-sizing-content dark:bg-zinc-800 px-4 py-2 border focus:ring-green-500 focus:border-green-900 w-full sm:text-sm border-gray-300  dark:border-zinc-700 rounded-md focus:outline-none text-gray-600 dark:text-gray-100 dark:text-white
[&:-webkit-autofill]:bg-white [&:-webkit-autofill]:text-gray-600 dark:text-gray-100 [&:-webkit-autofill]:dark:bg-zinc-800 [&:-webkit-autofill]:dark:text-white [&:-webkit-autofill]:transition-colors [&:-webkit-autofill]:duration-[999999s]"
                    placeholder={cuestion.placeholder}
                    rows={3}
                    maxLength={cuestion.maxLength}
                    {...props.register(cuestion.name,
                        cuestion.require
                            ? { required: "El campo es obligatorio." }
                            : {}
                    )}
                />
                {cuestion.maxLength && (<span className="absolute right-2 bottom-2 text-xs text-gray-400">
                    {currentValue.length}/{cuestion.maxLength}
                </span>)}
            </div>
            {props.errors[cuestion.name] && props.errors[cuestion.name]?.message && (
                <span className="text-red-400 p-1">
                    {props.errors[cuestion.name]?.message}
                </span>
            )}
        </div>
    )
}