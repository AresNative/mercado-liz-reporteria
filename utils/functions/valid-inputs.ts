export const validateName = (value: string) => {
  return /^[A-Za-zÀ-ÿ\s]{0,50}$/.test(value);
};

export const validatePhone = (value: string) => {
  return /^[0-9+\s-]{0,15}$/.test(value);
};

export const validateEmail = (value: string) => {
  return /^[^\s@]*$/.test(value) || value === "";
};

export const formatPhoneNumber = (value: string) => {
  if (!value) return "";
  const cleaned = value.replace(/\D/g, "");
  const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
  if (match) {
    return (
      match[1] +
      (match[1] && match[2] ? "-" : "") +
      match[2] +
      (match[2] && match[3] ? "-" : "") +
      match[3]
    );
  }
  return value;
};
