import { alertClasses } from "@/utils/constants/colors";

export type FieldType =
  | "Flex"
  | "INPUT"
  | "NUMBER"
  | "PASSWORD"
  | "PHONE"
  | "TEXT_AREA"
  | "MAIL"
  | "DATE"
  | "DATE_RANGE"
  | "CHECKBOX"
  | "CHECKBOX_GROUP"
  | "SELECT"
  | "FILE"
  | "IMG"
  | "SEARCH"
  | "LINK"
  | "RATING"
  | "TAG_INPUT"
  | "H1";

export interface SelectOption {
  value: string;
  label: string;
}

export interface Field {
  id?: number;
  type: FieldType;
  name?: string;
  label?: string;
  placeholder?: string;
  require: boolean;
  jsonString?: boolean;
  stars?: number[]; // For RATING
  elements?: Field[]; // For Flex type
  options?: string[] | SelectOption[]; // For CHECKBOX_GROUP and SELECT
  enableAutocomplete?: string; // Changed to string to match "true"
  multi?: boolean; // For SELECT
  multiple?: boolean; // For SELECT
  maxLength?: number; // For TEXT_AREA and INPUT
  minLength?: number; // For TEXT_AREA and INPUT
  valueDefined?: any;
  horas?: boolean; // For DATE_RANGE
  href?: string;
  icon?: React.ReactNode;
}

export interface MainFormProps {
  message_button: React.ReactNode | string;
  actionType: string;
  dataForm: Field[];
  aditionalData?: any;
  valueAssign?: any;
  formName?: string;
  modelName?: string;
  iconButton?: React.ReactNode;
  action?: (...args: any[]) => any;
  onSuccess?: (result: any, formData: any) => void;
}

export interface ChecboxFormProps {
  cuestion: {
    name: string;
    placeholder?: string;
    label?: string;
    require: boolean;
    options: string[];
  };
  control: any;
  handleSubmit: () => void;
  setValue: (name: string, value: boolean) => Promise<void>;
  register: (name: string, options: { required?: string }) => object;
  setError: (name: string, error: object) => void;
  clearErrors: (name: string) => void;
  watch: (name: string) => string;
  errors: Record<string, { message?: string } | undefined>;
}

export interface DateRangeInputProps {
  cuestion: {
    name: string;
    placeholder?: string;
    label?: string;
    require: boolean;
  };
  control: any; // Replace with the actual type from react-hook-form
  handleSubmit: () => void;
  setValue: (name: string, value: string) => void;
  setError: (name: string, error: object) => void;
  clearErrors: (name: string) => void;
  errors: Record<string, { message?: string } | undefined>;
}

export interface InputFormProps {
  cuestion: {
    name: string;
  } & Field;
  handleSubmit: () => void;
  watch: (name: string) => string;
  getValues: (name: string) => string;
  setValue: (name: string, value: string) => void;
  setError: (name: string, error: object) => void;
  clearErrors: (name: string) => void;
  register: (name: string, options: { required?: string }) => object;
  errors: Record<string, { message?: string } | undefined>;
}

export interface InputMediaProps {
  cuestion: {
    name: string;
    placeholder?: string;
    label?: string;
    require?: boolean;
    accept?: string; // Allowed file types
    multiple?: boolean;
  };
  handleSubmit: () => void;
  setValue: (name: string, value: File | File[] | null) => void;
  register: (name: string, options: { required?: string }) => object;
  errors: Record<string, { message?: string } | undefined>;
}

export interface SearchableSelectProps {
  cuestion: {
    name: string;
    placeholder?: string;
    label?: string;
    require?: boolean;
    options: string[];
    multi?: boolean;
    valueDefined?: string;
    enableAutocomplete?: boolean;
    saveData?: boolean;
  } & Field;
  handleSubmit: () => any;
  setValue: (name: string, value: string) => void;
  setError: (name: string, error: object) => void;
  clearErrors: (name: string) => void;
  register: (
    name: string,
    options: Record<string, unknown>
  ) => Record<string, unknown>;
  errors: Record<string, { message?: string } | undefined>;
}

export interface ButtonProps {
  type?: "button" | "submit" | "reset";
  label?: string;
  size?: "small" | "medium" | "large";
  aling?: string;
  color?: keyof typeof alertClasses;
  children?: React.ReactNode;
  disabled?: boolean;
  onClick?: (...args: any[]) => any;
}

export interface UserRoleRendererProps {
  user: React.ReactNode; // Renderizado cuando el rol es "user"
  admin: React.ReactNode; // Renderizado cuando el rol es "admin"
  fallback: React.ReactNode; // Renderizado cuando el rol no es reconocido
  role: string | null; // El rol del usuario, puede ser "admin", "user", "none", o null
  loadingRole: boolean; // Indicador de si se está cargando el rol
  error: string | null; // Error al obtener el rol
}
export interface StarRatingProps {
  cuestion: {
    name: string;
    label: string;
    stars?: number[];
    activeClass: string;
    inactiveClass: string;
  } & Field;
  handleSubmit: () => void;
  watch: (name: string) => string;
  getValues: (name: string) => string;
  setValue: (name: string, value: string) => void;
  setError: (name: string, error: object) => void;
  clearErrors: (name: string) => void;
  register: (name: string, options: { required?: string }) => object;
  errors: Record<string, { message?: string } | undefined>;
}
