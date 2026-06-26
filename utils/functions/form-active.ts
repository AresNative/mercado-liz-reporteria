export const triggerFormSubmit = () => {
  const form = document.querySelector("form");
  if (form) {
    form.dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true }), // ✅
    );
  } else {
    console.log("No se encontró ningún formulario en el DOM");
  }
};
