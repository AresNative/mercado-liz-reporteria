"use client";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { MainFormProps } from "@/utils/types/interfaces";

import { InputComponent as Input } from "./input";
import { NumberComponent as Number } from "./number";
import { MailComponent as Mail } from "./mail";
import { PhoneComponent as Phone } from "./phone";
import { TextAreaComponent as TextArea } from "./text-area";
import { PasswordComponent as Password } from "./password";

import { SearchComponent as Search } from "./search"
import { SelectComponent as Select } from "./select";
import { CheckboxComponent as Checkbox } from "./checkbox";
import { CheckboxGroupComponent as CheckboxGroup } from "./checkbox-group";

import { CalendarComponent as Calendar } from "./calendar";
import { DateRangeComponent as DateRange } from "./date-range";

import { FileComponent as FileInput } from "./file";
import { ImgComponent as Image } from "./img";

import { Rating } from "./rating";

import { TagInputComponent as TagInput } from "./tag-input"

import { usePostUserLoginMutation } from "@/hooks/reducers/auth";
import { Button } from "../button";
import Link from "next/link";
import { usePostLandingMutation, usePostLandingJsonMutation } from "@/hooks/reducers/api_landing";
import { useAppDispatch } from "@/hooks/selector";
import { openAlertReducer } from "@/hooks/reducers/drop-down";
import { CircleCheckBig } from "lucide-react";

export const MainForm = ({ message_button, dataForm, actionType, aditionalData, action, valueAssign, onSuccess, formName, modelName, iconButton }: MainFormProps) => {
  const dispatch = useAppDispatch()
  const [page, setPage] = useState(0);
  const [formData, setFormData] = useState<any>({}); // Estado para guardar datos
  const [loading, setLoading] = useState(false);

  const {
    handleSubmit,
    clearErrors,
    register,
    setError,
    watch,
    setValue,
    control,
    getValues,
    reset,
    formState: { errors },
  } = useForm();

  const [postUserLogin] = usePostUserLoginMutation();
  const [postLandingJson] = usePostLandingJsonMutation();
  const [postLanding] = usePostLandingMutation();

  async function getMutationFunction(actionType: string, data: FormData | any) {
    const payload = formName ? data : { [modelName ?? actionType.toLowerCase()]: modelName ? data : [data] };

    switch (actionType) {
      case "post-login":
        return await postUserLogin(data).unwrap();
      default:
        const functionFetch = formName ? postLanding : postLandingJson;
        return await functionFetch({
          url: actionType,
          data: payload,
          signal: new AbortController().signal,
        }).unwrap();
    }
  }
  // Efecto para restaurar los valores del formulario al cambiar de página
  useEffect(() => {
    const currentPageData = pages[page].reduce((acc: any, field: any) => {
      if (field.name && formData[field.name]) {
        acc[field.name] = formData[field.name];
      }
      return acc;
    }, {});

    Object.keys(currentPageData).forEach((key) => {
      setValue(key, currentPageData[key]);
    });
  }, [page, formData, setValue]);

  async function onSubmit(submitData: any) {
    setLoading(true);
    const formatData = new FormData();

    submitData.file && Array.isArray(submitData.file) ?
      submitData.file.forEach((file: any) => {
        formatData.append("File", file);
      }) :
      formatData.append("File", submitData.file);

    const { file, ...sanitizedData } = submitData;

    const combinedData: any = aditionalData
      ? { ...sanitizedData, ...aditionalData }
      : sanitizedData;

    formName && formatData.append(formName, JSON.stringify(combinedData));

    try {
      const result = await getMutationFunction(actionType, formName && formatData ? formatData : combinedData);
      if (onSuccess) onSuccess(result, combinedData);

      if (action) {
        const cleanKey = (key: string) => key.replace(/^'|'$/g, '');

        try {
          const payload = valueAssign
            ? Array.isArray(valueAssign)
              ? Object.fromEntries(
                valueAssign.map(key => [cleanKey(key), submitData[cleanKey(key)]])
              )
              : submitData[cleanKey(valueAssign)]
            : undefined;

          await (payload !== undefined ? action(payload) : action());
        } catch (error) {
          console.log('Error processing action:', error);
          // Considerar propagar el error o manejar según necesidad
        }
      }
      reset();
    } catch (error: any) {
      console.log("Error en el envío del formulario:", error)
      dispatch(openAlertReducer(error.data.message ?
        {
          title: "Error en el envío del formulario",
          message: error.data.message,
          type: "error",
          icon: "archivo",
          duration: 4000
        } : {
          title: "Error en el envío del formulario",
          message: "Revise los campos a llenar y vuelva a intentarlo",
          type: "error",
          icon: "archivo",
          duration: 4000
        }))
    } finally {
      setLoading(false);
    }
  }
  // Dividir dataForm en páginas basadas en H1
  const pages = dataForm.reduce((acc: any[], field: any) => {
    if (field.type === "H1" || acc.length === 0) {
      acc.push([]);
    }
    acc[acc.length - 1].push(field);
    return acc;
  }, []);

  const handlePageChange = (newPage: number) => {
    // Guardar los valores actuales del formulario antes de cambiar de página
    const currentValues = getValues();
    setFormData((prevData: any) => ({ ...prevData, ...currentValues }));
    setPage(newPage);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="relative w-full space-y-2 my-2 m-auto">
      {pages[page].map((field: any, key: any) => (
        <SwitchTypeInputRender
          key={key}
          cuestion={field}
          control={control}
          register={register}
          watch={watch}
          clearErrors={clearErrors}
          setError={setError}
          errors={errors}
          getValues={getValues}
          setValue={setValue}
        />
      ))}

      <div className="flex justify-between mt-4">
        {page > 0 && (
          <Button color="indigo" type="button" label="Anterior" onClick={() => handlePageChange(page - 1)} />
        )}
        {page < pages.length - 1 ? (
          <Button color="indigo" aling="ml-auto" type="button" label="Siguiente" onClick={() => handlePageChange(page + 1)} />
        ) : (
          <button
            className="float-right ml-auto cursor-pointer flex gap-2 items-center rounded-md bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700"
            type="submit"
            slot="end"
            disabled={loading}
          >{iconButton ? iconButton : <CircleCheckBig className="size-4" />}{loading ? "Loading..." : message_button}</button>
        )}
      </div>
    </form>
  );
};

export function SwitchTypeInputRender(props: any) {
  const { type } = props.cuestion;
  switch (type) {
    case "INPUT":
      return <Input {...props} />;
    case "NUMBER":
      return <Number {...props} />;
    case "PASSWORD":
      return <Password {...props} />
    case "PHONE":
      return <Phone {...props} />;
    case "TEXT_AREA":
      return <TextArea {...props} />;
    case "MAIL":
      return <Mail {...props} />;
    case "SELECT":
      return <Select {...props} />;
    case "DATE":
      return <Calendar {...props} />;
    case "DATE_RANGE":
      return <DateRange {...props} />;
    case "CHECKBOX":
      return <Checkbox {...props} />;
    case "CHECKBOX_GROUP":
      return <CheckboxGroup {...props} />;
    case "FILE":
      return <FileInput {...props} />;
    case "IMG":
      return <Image {...props} />;
    case "SEARCH":
      return <Search {...props} />;
    case "TAG_INPUT":
      return <TagInput {...props} />;
    case "RATING":
      return <Rating {...props} />;
    case "Flex":
      return <FlexComponent {...props} elements={props.cuestion.elements} />;
    case "H1":
      return <h1 className="text-2xl font-bold">{props.cuestion.label}</h1>;
    case "LINK":
      return <Link href={props.cuestion.href} className="text-primary-600">
        {props.cuestion.label}
      </Link>
    default:
      return <h2>{type}</h2>;
  }
}
interface FlexProps {
  elements: any[];
  control: any;
  register: any;
  watch: any;
  clearErrors: any;
  setError: any;
  errors: any;
  getValues: any;
  setValue: any;
}

export const FlexComponent: React.FC<FlexProps> = ({
  elements,
  control,
  register,
  watch,
  clearErrors,
  setError,
  errors,
  getValues,
  setValue,
}) => {
  return (
    <div className="flex flex-wrap gap-4 justify-between min-w-full">
      {elements.map((element, index) => (
        <div key={index} className="flex-grow">
          <SwitchTypeInputRender
            cuestion={element}
            control={control}
            register={register}
            watch={watch}
            clearErrors={clearErrors}
            setError={setError}
            errors={errors}
            getValues={getValues}
            setValue={setValue}
          />
        </div>
      ))}
    </div>
  );
};
export default MainForm;