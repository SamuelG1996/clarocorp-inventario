// === SESIÓN AUTOMÁTICA Y RECARGA ===

// Configuración: excluye módulos donde NO se quiere recargar al volver a la pestaña
const excludedPages = ["Perfil.html", "Stock.html", "Series.html","FormularioTraspaso.html", "Traspaso.html"];
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
