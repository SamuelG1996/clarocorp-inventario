// Loader.js
function mostrarLoader() {
  const loader = document.createElement("div");
  loader.id = "loader";
  loader.className = "loader-overlay";
  loader.innerHTML = `
    <div>
      <div class="spinner"></div>
      <p style="color:white; text-align:center; margin-top:10px;">Cargando...</p>
    </div>
  `;
  document.body.appendChild(loader);
}

function ocultarLoader() {
  const loader = document.getElementById("loader");
  if (loader) loader.remove();
}