import { useEffect } from "react";
import { InputFormProps } from "@/utils/types/interfaces";
import { AtSign } from "lucide-react";

export function MailComponent(props: InputFormProps) {
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

    return (
        <div className="flex flex-col">
            <label className="leading-loose flex items-center gap-2 dark:text-white">
                <AtSign className="w-4 h-4" />
                {cuestion.label}
            </label>
            <div className="relative">
                <input
                    type="email"
                    name="email"
                    onChange={handleInputChange}
                    className="bg-white dark:bg-zinc-800 px-4 py-2 border focus:ring-green-500 focus:border-green-900 w-full sm:text-sm border-gray-300  dark:border-zinc-700 rounded-md focus:outline-none text-gray-600 dark:text-gray-100 dark:text-white
[&:-webkit-autofill]:bg-white [&:-webkit-autofill]:text-gray-600 dark:text-gray-100 [&:-webkit-autofill]:dark:bg-zinc-800 [&:-webkit-autofill]:dark:text-white [&:-webkit-autofill]:transition-colors [&:-webkit-autofill]:duration-[999999s]"
                    placeholder="ejemplo@correo.com"
                    {...props.register(cuestion.name,
                        cuestion.require
                            ? { required: "El campo es obligatorio." }
                            : {}
                    )}
                />
                <section className="absolute right-2 top-2 flex border-separate">
                    {currentValue && !currentValue.includes('@') && (
                        <span className="p-1 border-r-[1px] border-red-500 text-xs text-red-500">
                            Falta @
                        </span>
                    )}
                    {currentValue && !currentValue.includes('.com') && (
                        <span className="p-1 text-xs text-red-500">
                            Falta .com
                        </span>
                    )}
                </section>
            </div>
            {props.errors[cuestion.name] && props.errors[cuestion.name]?.message && (
                <span className="text-red-400 p-1">
                    {props.errors[cuestion.name]?.message}
                </span>
            )}
        </div>
    );
}
