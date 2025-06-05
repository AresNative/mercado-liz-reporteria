import { InputFormProps } from "@/utils/types/interfaces";

export function CheckboxComponent(props: InputFormProps) {
    const { cuestion } = props;
    return (
        <div className="flex items-center">
            <input
                type="checkbox"
                id="terms"
                {
                ...props.register(cuestion.name,
                    cuestion.require
                        ? { required: "El campo es obligatorio." }
                        : {}
                )
                }
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300  dark:border-zinc-700 rounded"
            />
            <label htmlFor="terms" className="ml-2 block text-sm text-gray-900 dark:text-white">
                {cuestion.label}
            </label>
            {props.errors[cuestion.name] && props.errors[cuestion.name]?.message && (
                <span className="text-red-400 p-1">
                    {props.errors[cuestion.name]?.message}
                </span>
            )}
        </div>
    )
}