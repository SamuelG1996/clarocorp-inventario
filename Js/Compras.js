
document.addEventListener("DOMContentLoaded", async () => {
  console.log("DOM cargado");

  const { createClient } = supabase;
  const supabaseUrl = "https://bsrtuievwjtzwejuxqee.supabase.co";
  const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzcnR1aWV2d2p0endlanV4cWVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1NTEyNjYsImV4cCI6MjA2NDEyNzI2Nn0.A9tCs-Zi-7jw5LUFs7ViIR2vHb9tNMj6c7YeeNOdmWI";
  const supabaseClient = createClient(supabaseUrl, supabaseKey);


  const tabla = document.getElementById("tablaComprasBody"); //Antes el ID era stock-body
  console.log("tabla encontrada:", tabla);

  if (!tabla) {
    console.error("❌ El elemento con id 'tablaComprasBody' no se encontró en el DOM.");
  }
  const inputBuscar = document.getElementById("inputBuscar"); //Antes el ID era searchInput

  function filtrarTabla() {
    const filtro = inputBuscar.value.toLowerCase();
    const filas = tabla.getElementsByTagName("tr");

    for (let i = 0; i < filas.length; i++) {
      const celdas = filas[i].getElementsByTagName("td");
      let coincide = false;

      for (let j = 0; j < celdas.length; j++) {
        const texto = celdas[j].textContent || celdas[j].innerText;
        if (texto.toLowerCase().includes(filtro)) {
          coincide = true;
          break;
        }
      }
      filas[i].style.display = coincide ? "" : "none";
    }
  }

  inputBuscar.addEventListener("input", filtrarTabla);

async function cargarCompras() {
  mostrarLoader();

  // 1. Obtener tabla de compras
  const { data: compras, error } = await supabaseClient
    .from("datos_compras_recurrentes")
    .select("*");

  if (error) {
    console.error("❌ Error al cargar compras:", error);
    ocultarLoader();
    return;
  }

  // 2. Obtener stock por zona
  const { data: stockClaro, error: errorStock } = await supabaseClient
    .from("stock_claro")
    .select("codigo, zona, cantidad_sap");

  if (errorStock) {
    console.error("❌ Error al cargar stock_claro:", errorStock);
  }

  // 3. Agrupar stock por código y zona
  const stockPorCodigo = {};

  if (stockClaro) {
    for (const fila of stockClaro) {
      const codigo = fila.codigo;
      const zona = fila.zona?.toUpperCase() || "";
      const cantidad = fila.cantidad_sap || 0;

      if (!stockPorCodigo[codigo]) {
        stockPorCodigo[codigo] = { LIMA: 0, PROVINCIA: 0 };
      }

      if (zona === "LIMA" || zona === "PROVINCIA") {
        stockPorCodigo[codigo][zona] += cantidad;
      }
    }
  }

  // 4. Renderizar filas en orden exacto de tu tabla
  tabla.innerHTML = "";
  compras.forEach((item) => {
    const codigo = item.codigo || "-";
    const descripcion = item.descripcion || "-";
    const grupo = item.grupo || "-"; // Tipo Producto
    const tipoCompra = item.tipo_compra || "-";
    const proveedor = item.proveedor_ultima_compra || "-";
    const valorCompra = item.valor_ultima_compra || "-";
    const consumo = item.consumo_mensual || "-";

    const stockLima = stockPorCodigo[codigo]?.LIMA || "-";
    const stockProvincia = stockPorCodigo[codigo]?.PROVINCIA || "-";

    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td>${codigo}</td>
      <td>${descripcion}</td>
      <td>${grupo}</td>
      <td>${tipoCompra}</td>
      <td>${proveedor}</td>
      <td>${valorCompra}</td>
      <td>${consumo}</td>
      <td>${stockLima}</td>
      <td>${stockProvincia}</td>
      <td>-</td> <!-- Cobertura actual -->
      <td>-</td> <!-- Compras en curso -->
      <td>-</td> <!-- Cobertura total -->
      <td>-</td> <!-- Estado -->
    `;
    tabla.appendChild(fila);
  });

  ocultarLoader();
}
  cargarCompras();
});
