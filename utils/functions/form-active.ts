export const triggerFormSubmit = () => {
  const form = document.querySelector("form"); // Encuentra el primer formulario en el DOM
  if (form) {
    form.dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: false })
    );
  } else {
    console.log("No se encontró ningún formulario en el DOM");
  }
};
