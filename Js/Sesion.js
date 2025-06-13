// === SESIÓN AUTOMÁTICA Y RECARGA ===

const excludedPages = [
  "Perfil.html", "Stock.html", "Series.html",
  "FormularioTraspaso.html", "index.html", "DetalleSolicitud.html", "CentroAyuda.html", "/Perfil", "/Stock", "/Series", "/FormularioTraspaso", "/DetalleSolicitud", "/CentroAyuda"
];

const ENABLE_AUTO_RELOAD_ON_RETURN = !excludedPages.some(page =>
  window.location.pathname.includes(page)
);

const INACTIVITY_TIMEOUT_MINUTES = 30;

// Recarga si se vuelve a la pestaña
if (ENABLE_AUTO_RELOAD_ON_RETURN) {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      location.reload();
    }
  });
}

// Inactividad
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
}, 30000);

// === CONTROL DE MÓDULOS VISIBLES SEGÚN ROL ===

document.addEventListener("DOMContentLoaded", () => {
  const rol = localStorage.getItem("rol");
  if (!rol) return;

  let ocultarRutas = [];

  // Configura las rutas a ocultar según el rol
  if (rol === "Contratista") {
    ocultarRutas = ["Stock Claro", "Compras", "Reportes", "Configuración"];
  } else if (rol === "Analista" || rol === "Soporte") {
    ocultarRutas = ["Configuración", "Compras", "Reportes"];
  }

  // Oculta elementos del sidebar
  document.querySelectorAll(".menu a").forEach(enlace => {
    const texto = enlace.textContent.trim();
    if (ocultarRutas.includes(texto)) {
      enlace.style.display = "none";
    }
  });

  // Restricción de acceso a páginas específicas (para Contratista)
  if (rol === "Contratista") {
    const paginasRestringidasContratista = [
      "/StockClaro.html", "/Compras.html", "/Reportes.html", "/Configuracion.html",
      "/StockClaro", "/Compras", "/Reportes", "/Configuracion"
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
        window.location.href = "/Menu";
      }, 3100);
    }
  }
});
