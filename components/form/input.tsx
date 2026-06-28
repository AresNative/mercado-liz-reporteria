import { useEffect } from "react";
import { InputFormProps } from "@/utils/types/interfaces";
import { User } from "lucide-react";

export function InputComponent(props: InputFormProps) {
  const { cuestion } = props;

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

  return (
    <div className="flex flex-col">
      <label className="leading-loose flex items-center gap-2 dark:text-white">
        <span className="w-4 h-4 flex items-center justify-center">
          {cuestion.icon ? cuestion.icon : <User className="w-4 h-4" />}
        </span>
        {cuestion.label}
      </label>
      <div className="relative">
        <input
          type="text"
          name={cuestion.name}
          onChange={handleInputChange}
          className="bg-white dark:bg-gray-900 dark:text-white border-gray-300 dark:border-gray-800 py-2 px-4 w-full rounded-md focus:outline-none border focus:border-green-500 focus:ring-green-500"
          placeholder={cuestion.placeholder}
          maxLength={cuestion.maxLength}
          {...props.register(cuestion.name,
            cuestion.require
              ? { required: "El campo es obligatorio." }
              : {}
          )}
        />
        {cuestion.maxLength && (<span className="absolute right-2 top-2 text-xs text-gray-400">
          {currentValue.length}/{cuestion.maxLength}
        </span>)}
      </div>
      {props.errors[cuestion.name] && props.errors[cuestion.name]?.message && (
        <span className="text-red-400 p-1">
          {props.errors[cuestion.name]?.message}
        </span>
      )}
    </div>
  );
}
