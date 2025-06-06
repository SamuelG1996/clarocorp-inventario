window.mostrarLoader = function () {
  const loader = document.getElementById("loader");
  if (loader) loader.style.display = "flex";
};

window.ocultarLoader = function () {
  const loader = document.getElementById("loader");
  if (loader) loader.style.display = "none";
};
