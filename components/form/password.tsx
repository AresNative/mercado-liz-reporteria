import { useEffect, useState } from "react";
import { InputFormProps } from "@/utils/types/interfaces";
import { LockKeyhole, Eye, EyeOff } from "lucide-react";

export function PasswordComponent(props: InputFormProps) {
    const { cuestion } = props;
    const [showPassword, setShowPassword] = useState(false);

    // Obtén el valor actual del input desde react-hook-form usando `watch`
    const currentValue = props.watch(cuestion.name) || "";

    useEffect(() => {
        if (cuestion.valueDefined) {
            props.setValue(cuestion.name, cuestion.valueDefined);
        }
    }, [cuestion.valueDefined]);

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = event.target;
        props.setError(cuestion.name, {});
        props.setValue(cuestion.name, value);
    };

    const togglePasswordVisibility = () => {
        setShowPassword((prev) => !prev);
    };

    return (
        <div className="flex flex-col">
            <label className="leading-loose flex items-center gap-2 dark:text-white">
                <LockKeyhole className="w-4 h-4" />
                {cuestion.label}
            </label>
            <div className="relative">
                <input
                    type={showPassword ? "text" : "password"}
                    name={cuestion.name}
                    onChange={handleInputChange}
                    className="bg-white dark:bg-zinc-800 px-4 py-2 border focus:ring-green-500 focus:border-green-900 w-full sm:text-sm border-gray-300  dark:border-zinc-700 rounded-md focus:outline-none text-gray-600 dark:text-gray-100 dark:text-white
[&:-webkit-autofill]:bg-white [&:-webkit-autofill]:text-gray-600 dark:text-gray-100 [&:-webkit-autofill]:dark:bg-zinc-800 [&:-webkit-autofill]:dark:text-white [&:-webkit-autofill]:transition-colors [&:-webkit-autofill]:duration-[999999s]"
                    placeholder={cuestion.placeholder}
                    maxLength={cuestion.maxLength}
                    {...props.register(cuestion.name,
                        cuestion.require
                            ? { required: "El campo es obligatorio." }
                            : {}
                    )}
                />
                <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute inset-y-0 right-2 flex items-center text-gray-500 dark:text-gray-200 hover:text-gray-700 focus:outline-none"
                >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                {cuestion.maxLength && (
                    <span className="absolute right-10 top-2 text-xs text-gray-400">
                        {currentValue.length}/{cuestion.maxLength}
                    </span>
                )}
            </div>
            {props.errors[cuestion.name] && props.errors[cuestion.name]?.message && (
                <span className="text-red-400 p-1">
                    {props.errors[cuestion.name]?.message}
                </span>
            )}
        </div>
    );
}
