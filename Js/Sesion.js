// === SESIÓN AUTOMÁTICA Y RECARGA ===

// Configuración: excluye módulos donde NO se quiere recargar al volver a la pestaña
const excludedPages = ["Perfil.html", "Stock.html", "Series.html","FormularioTraspaso.html", "index.html","DetalleSolicitud.html"];
const ENABLE_AUTO_RELOAD_ON_RETURN = !excludedPages.some(page =>
  window.location.pathname.includes(page)
);

// Tiempo máximo de inactividad en minutos
const INACTIVITY_TIMEOUT_MINUTES = 30;

// Recarga al volver a la pestaña (si está habilitado)
if (ENABLE_AUTO_RELOAD_ON_RETURN) {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      location.reload();
    }
  });
}

// Control de inactividad
let lastActiveTime = Date.now();

document.addEventListener("mousemove", () => lastActiveTime = Date.now());
document.addEventListener("keydown", () => lastActiveTime = Date.now());

setInterval(() => {
  const now = Date.now();
  const minutesInactive = (now - lastActiveTime) / 60000;

  if (minutesInactive > INACTIVITY_TIMEOUT_MINUTES) {
    localStorage.clear();
    window.location.href = "index.html";
  }
}, 30000); // Verifica cada minuto

// Control de modulos visibles en la sidebar
document.addEventListener("DOMContentLoaded", () => {
  const rol = localStorage.getItem("rol");

  if (!rol) return;

  if (rol === "Contratista") {
    const ocultarRutas = [
      "Stock Claro",
      "Compras",
      "Reportes",
      "Configuración"
    ];
    
// Restriccion de paginas
    const paginasRestringidasContratista = [
  "/StockClaro.html",
  "/Compras.html",
  "/Reportes.html",
  "/Configuracion.html",
  "/StockClaro",
  "/Compras",
  "/Reportes",
  "/Configuracion"
];

if (paginasRestringidasContratista.includes(window.location.pathname)) {
  Swal.fire({
    icon: 'warning',
    title: 'Acceso restringido',
    text: 'No tienes permiso para acceder a este módulo.',
    toast: true,
    position: 'bottom-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    background: '#1e2022',
    color: '#ffffff',
    iconColor: '#f39c12'
  });

  setTimeout(() => {
    window.location.href = "/Menu"; // o tu página de inicio permitida
  }, 3100);
}


    document.querySelectorAll(".menu a").forEach(enlace => {
      const texto = enlace.textContent.trim();
      if (ocultarRutas.includes(texto)) {
        enlace.style.display = "none";
      }
    });
  }
});
