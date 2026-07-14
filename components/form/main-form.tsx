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
import { DateRangeComponent as DateRange } from "./date";

import { Rating } from "./rating";

import { FileComponent as FileInput } from "./file";
import { ImgComponent as Image } from "./img";

import { Button } from "../button";

import { TagInputComponent as TagInput } from "./tag-input"

import { useLoginUserMutation } from "@/hooks/api/auth";
import { useAppDispatch } from "@/hooks/selector";
import { openAlertReducer } from "@/hooks/reducers/drop-down";
import { usePostGeneralMutation, usePostImgMutation, usePutGeneralMutation } from "@/hooks/api/api";
import { setLocalStorageItem } from "@/utils/functions/local-storage";
import { cn } from "@/utils/functions/cn";
import { usePostIntelisisMutation, usePutIntelisisMutation } from "@/hooks/api/api_int";
import { RadioInputListComponent } from "./input-radio";

export const MainForm = React.forwardRef(({
  message_button,
  dataForm,
  flexDirection = "flex-col",
  actionType,
  aditionalData,
  showButton = true,
  action,
  valueAssign,
  onSuccess,
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
  const [postGeneral] = usePostGeneralMutation();
  const [portInt] = usePostIntelisisMutation();
  const [putGeneral] = usePutGeneralMutation();
  const [putInt] = usePutIntelisisMutation()
  const [postImg] = usePostImgMutation(); // Hook para subir imágenes

  async function getMutationFunction(actionType: string, data: FormData | any) {
    const { id, ...restData } = data;
    switch (actionType) {
      case "post-login":
        return await postUserLogin(data).unwrap().then(() => {
          setLocalStorageItem("userCredentials", data)
        });
      case "post-general":
        return await postGeneral({
          table: table,
          data: data,
          signal: new AbortController().signal,
        }).unwrap();
      case "post-intelisis":
        return await portInt({
          table: table,
          data: data,
          signal: new AbortController().signal,
        }).unwrap();
      case "put-general":
        return await putGeneral({
          table: table,
          data: {
            Data: restData,
            Filtros: [{ Key: "id", Value: aditionalData.id, Operator: "=" }]
          },
          signal: new AbortController().signal,
        }).unwrap();
      case "put-intelisis":
        return await putInt({
          table: table,
          data: {
            Data: restData,
            Filtros: [{ Key: "id", Value: aditionalData.id, Operator: "=" }]
          },
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

          result = await getMutationFunction(actionType, combinedData);
        }
      } else {
        combinedData = aditionalData
          ? { ...submitData, ...aditionalData }
          : submitData;

        result = await getMutationFunction(actionType, combinedData);
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
        }));
    } finally {
      setLoading(false);
      reset();
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
      onSubmit={handleSubmit(onSubmit)}
      method="post"
      className={cn(
        "relative flex w-full my-2 m-auto gap-2",
        flexDirection,
        // En row, necesitamos items-end para que el div del botón se alinee abajo
        flexDirection === "flex-row" && "items-end"
      )}
    >
      <div className="flex flex-col gap-4 w-full">
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
      </div>

      {showButton && (
        <div
          className={cn(
            "flex gap-2",
            flexDirection === "flex-row"
              // row: columna de botones pegada al borde inferior derecho, sin crecer
              ? "flex-col justify-end items-end shrink-0 self-end"
              // col: fila con prev/next separados
              : "flex-row justify-between w-full"
          )}
        >
          {page > 0 && (
            <Button
              color="success"
              type="button"
              size="small"
              label="Anterior"
              onClick={() => handlePageChange(page - 1)}
            />
          )}
          {page < pages.length - 1 ? (
            <Button
              color="success"
              size="small"
              type="button"
              label="Siguiente"
              onClick={() => handlePageChange(page + 1)}
            />
          ) : (
            <Button
              color="success"
              type="submit"
              disabled={loading}
            >
              {iconButton ? iconButton : <CircleCheckBig className="size-4" />}
              {loading ? "Loading..." : message_button}
            </Button>
          )}
        </div>
      )}
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
    case "RADIO":
      return <RadioInputListComponent {...props} />;
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