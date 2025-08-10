import { useEffect } from "react";
import { InputFormProps } from "@/utils/types/interfaces";
import { Phone } from "lucide-react";

export function PhoneComponent(props: InputFormProps) {
    const { cuestion } = props;

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

    const formatPhoneNumber = (value: string) => {
        if (!value) return '';
        const cleaned = value.replace(/\D/g, '');
        const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
        if (match) {
            return match[1] + (match[1] && match[2] ? '-' : '') + match[2] + (match[2] && match[3] ? '-' : '') + match[3];
        }
        return value;
    };

    return (
        <div className="flex flex-col">
            <label className="leading-loose flex items-center gap-2 dark:text-white">
                <Phone className="w-4 h-4" />
                {cuestion.label}
            </label>
            <div className="relative flex gap-2">
                <select
                    name="countryCode"
                    className="bg-white dark:bg-zinc-800 px-2 py-2 border focus:ring-green-500 focus:border-green-900 sm:text-sm border-gray-300  dark:border-zinc-700 rounded-md focus:outline-none text-gray-600 dark:text-gray-100 dark:text-white [&:-webkit-autofill]:bg-white [&:-webkit-autofill]:text-gray-600 dark:text-gray-100 [&:-webkit-autofill]:dark:bg-zinc-800 [&:-webkit-autofill]:dark:text-white [&:-webkit-autofill]:transition-colors [&:-webkit-autofill]:duration-[999999s]"
                    defaultValue="+52"
                >
                    <option value="+1">+1</option>
                    <option value="+44">+44</option>
                    <option value="+34">+34</option>
                    <option value="+52">+52</option>
                    <option value="+81">+81</option>
                </select>
                <input
                    type="tel"
                    name="phone"
                    value={formatPhoneNumber(currentValue)}
                    onChange={handleInputChange}
                    className="bg-white dark:bg-zinc-800 px-4 py-2 border focus:ring-green-500 focus:border-green-900 w-full sm:text-sm border-gray-300  dark:border-zinc-700 rounded-md focus:outline-none text-gray-600 dark:text-gray-100 dark:text-white
[&:-webkit-autofill]:bg-white [&:-webkit-autofill]:text-gray-600 dark:text-gray-100 [&:-webkit-autofill]:dark:bg-zinc-800 [&:-webkit-autofill]:dark:text-white [&:-webkit-autofill]:transition-colors [&:-webkit-autofill]:duration-[999999s]"
                    placeholder="123-456-7890"
                    maxLength={12}
                    {...props.register(cuestion.name,
                        cuestion.require
                            ? { required: "El campo es obligatorio." }
                            : {}
                    )}
                />
            </div>
            {props.errors[cuestion.name] && props.errors[cuestion.name]?.message && (
                <span className="text-red-400 p-1">
                    {props.errors[cuestion.name]?.message}
                </span>
            )}
        </div>
    );
}
