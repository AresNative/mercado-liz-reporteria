"use client";
import React, { useEffect, useImperativeHandle, useState } from "react";
import { useForm } from "react-hook-form";
import { CircleCheckBig } from "lucide-react";

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

import { Rating } from "./rating";

import { FileComponent as FileInput } from "./file";
import { ImgComponent as Image } from "./img";

import { Button } from "../button";

import { TagInputComponent as TagInput } from "./tag-input"

import { useLoginUserMutation } from "@/hooks/reducers/auth";
import { useAppDispatch } from "@/hooks/selector";
import { openAlertReducer } from "@/hooks/reducers/drop-down";
import { usePostGeneralMutation, usePostImgMutation, usePostMutation } from "@/hooks/reducers/api";

export const MainForm = React.forwardRef(({
  message_button,
  dataForm,
  actionType,
  aditionalData,
  showButton = true,
  action,
  valueAssign,
  onSuccess,
  formName,
  modelName,
  iconButton,
  table
}: MainFormProps, ref: any) => {
  const dispatch = useAppDispatch()
  const [page, setPage] = useState(0);
  const [formData, setFormData] = useState<any>({}); // Estado para guardar datos
  const [loading, setLoading] = useState(false);

  const [formValues, setFormValues] = useState<any>({});

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
    trigger,
    formState: { errors },
  } = useForm();
  // 🔄 EFECTO PARA OBSERVAR CAMBIOS EN TIEMPO REAL
  useEffect(() => {
    const subscription = watch((value) => {
      setFormValues(value);
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  useImperativeHandle(ref, () => ({
    getFormData: () => {
      try {
        return getValues(); // retorna todos los valores actuales del formulario
      } catch (e) {
        console.error("Error en getFormData:", e);
        return {};
      }
    },

    submitForm: async () => {
      try {
        const valid = await trigger(); // valida todos los campos

        if (!valid) return null;

        const values = getValues();

        // dispara el callback original
        if (onSuccess) onSuccess(values, values);

        return values;
      } catch (e) {
        console.error("Error en submitForm:", e);
        return null;
      }
    },
    // 🔥 NUEVO MÉTODO: Obtener valores en tiempo real
    getLiveValues: () => {
      return formValues;
    },

    // 🔥 NUEVO MÉTODO: Ver estado de validación
    getValidationStatus: async () => {
      return await trigger();
    }
  }));


  const [postUserLogin] = useLoginUserMutation();
  const [post] = usePostMutation();
  const [postGeneral] = usePostGeneralMutation();
  const [postImg] = usePostImgMutation(); // Hook para subir imágenes

  async function getMutationFunction(actionType: string, data: FormData | any) {
    const payload = formName ? data : { [modelName ?? actionType.toLowerCase()]: modelName ? data : [data] };

    switch (actionType) {
      case "post-login":
        return await postUserLogin(data).unwrap();
      case "post-general":
        return await postGeneral({
          table: table,
          data: data,
          signal: new AbortController().signal,
        }).unwrap();
      case "post":
        return await post({
          url: actionType,
          data: payload,
          signal: new AbortController().signal,
        }).unwrap();
      default:
        return data;
    }
  }

  // Función para subir imágenes
  async function uploadImage(file: File, additionalParams: any) {
    const { idRef, tabla, descripcion } = additionalParams;

    // Crear el FormData con los nombres exactos que el backend espera
    const formData = new FormData();
    formData.append("IdRef", idRef); // 👈 mayúscula exacta
    formData.append("Tabla", tabla);
    formData.append("Descripcion", descripcion || "");
    formData.append("File", file); // 👈 campo binario

    // Usar la mutación, enviando el FormData en el cuerpo
    return await postImg({
      // El endpoint RTK usa params, pero ignoraremos eso
      // y enviaremos formData en el body real
      idRef,
      tabla,
      descripcion,
      file: formData, // Aquí va el FormData completo
      signal: new AbortController().signal,
    }).unwrap();
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

    try {
      let result;
      let combinedData: any = {};
      // Detectar campos de archivo de manera más precisa
      const fileFields = Object.keys(submitData).filter(key => {
        const value = submitData[key];

        // Verificar si el campo comienza con "file" y tiene contenido válido
        if (!key.startsWith('file')) return false;

        // Si es un array, verificar que tenga al menos un archivo válido
        if (Array.isArray(value)) {
          return value.length > 0 && value.some(file => file instanceof File && file.size > 0);
        }

        // Si es un solo archivo, verificar que sea válido
        return value instanceof File && value.size > 0;
      });

      const hasFiles = fileFields.length > 0;

      if (hasFiles) {
        // Si hay archivos, usar el endpoint de subida de imágenes
        const uploadParams = {
          idRef: aditionalData?.idRef || submitData.idRef || "defaultId",
          tabla: aditionalData?.tabla || submitData.tabla || "defaultTable",
          descripcion: aditionalData?.descripcion || submitData.descripcion || "defaultDescription",
        };

        // Obtener todos los archivos válidos
        const filesToUpload: File[] = fileFields.flatMap((field) => {
          const value = submitData[field];
          if (Array.isArray(value)) {
            return value.filter(file => file instanceof File && file.size > 0);
          } else if (value instanceof File && value.size > 0) {
            return [value];
          }
          return [];
        });

        // Solo proceder si hay archivos válidos para subir
        if (filesToUpload.length > 0) {
          // Subir cada archivo por separado
          const uploadPromises = filesToUpload.map(file => uploadImage(file, uploadParams));

          // Combinar datos para onSuccess (excluyendo los archivos ya que se subieron por separado)
          const dataWithoutFiles = { ...submitData };
          fileFields.forEach(field => delete dataWithoutFiles[field]);

          combinedData = aditionalData
            ? { ...dataWithoutFiles, ...aditionalData }
            : dataWithoutFiles;

          result = await Promise.all(uploadPromises);
        } else {
          // Si no hay archivos válidos, proceder con el flujo normal sin archivos
          const dataWithoutFiles = { ...submitData };
          fileFields.forEach(field => delete dataWithoutFiles[field]);

          combinedData = aditionalData
            ? { ...dataWithoutFiles, ...aditionalData }
            : dataWithoutFiles;

          const formatData = new FormData();
          formName && formatData.append(formName, JSON.stringify(combinedData));

          result = await getMutationFunction(actionType, formName && formatData ? formatData : combinedData);
        }
      } else {
        // Si no hay archivos, proceder con el flujo normal
        const formatData = new FormData();

        combinedData = aditionalData
          ? { ...submitData, ...aditionalData }
          : submitData;

        formName && formatData.append(formName, JSON.stringify(combinedData));

        result = await getMutationFunction(actionType, formName && formatData ? formatData : combinedData);
      }

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
        }
      }
      reset();
    } catch (error: any) {
      console.log("Error en el envío del formulario:", error)
      dispatch(openAlertReducer(error.data?.message ?
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
    const currentValues = getValues();
    setFormData((prevData: any) => ({ ...prevData, ...currentValues }));
    setPage(newPage);
  };

  return (
    <form
      ref={ref}
      onSubmit={handleSubmit(onSubmit)} className="relative w-full space-y-2 my-2 m-auto">
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

      {showButton && (<div className="flex justify-between mt-4">
        {page > 0 && (
          <Button color="indigo" type="button" label="Anterior" onClick={() => handlePageChange(page - 1)} />
        )}
        {page < pages.length - 1 ? (
          <Button color="indigo" aling="ml-auto" type="button" label="Siguiente" onClick={() => handlePageChange(page + 1)} />
        ) : (
          <button
            className="float-right ml-auto cursor-pointer flex gap-2 items-center rounded-md bg-purple-600 px-4 py-2 text-white transition-colors hover:bg-purple-700"
            type="submit"
            slot="end"
            disabled={loading}
          >{iconButton ? iconButton : <CircleCheckBig className="size-4" />}{loading ? "Loading..." : message_button}</button>
        )}
      </div>)}
    </form>
  );
});

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