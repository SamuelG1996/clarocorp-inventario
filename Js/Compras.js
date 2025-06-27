
document.addEventListener("DOMContentLoaded", async () => {
  const { createClient } = supabase;
  const supabaseUrl = "https://bsrtuievwjtzwejuxqee.supabase.co";
  const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzcnR1aWV2d2p0endlanV4cWVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1NTEyNjYsImV4cCI6MjA2NDEyNzI2Nn0.A9tCs-Zi-7jw5LUFs7ViIR2vHb9tNMj6c7YeeNOdmWI";
  const supabaseClient = createClient(supabaseUrl, supabaseKey);


  const tabla = document.getElementById("stock-body");
  const inputBuscar = document.getElementById("inputBuscar");

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
    const { data, error } = await supabaseClient
      .from("datos_compras_recurrentes")
      .select("*");

    if (error) {
      console.error("Error cargando datos:", error);
      ocultarLoader();
      return;
    }

    for (const item of data) {
      const { codigo, proveedor, precio_compra, moneda, tipo_compra, consumo_promedio_mensual, grupo_material } = item;

      // Obtener descripción desde tabla productos
      const { data: productoData } = await supabaseClient
        .from("productos")
        .select("descripcion")
        .eq("codigo", codigo)
        .maybeSingle();

      const descripcion = productoData?.descripcion || "-";

      const fila = document.createElement("tr");
      fila.innerHTML = `
        <td>${codigo}</td>
        <td>${descripcion}</td>
        <td>${grupo_material || "-"}</td>
        <td>${tipo_compra || "-"}</td>
        <td>${proveedor || "-"}</td>
        <td>${precio_compra ?? ""} ${moneda ?? ""}</td>
        <td>${consumo_promedio_mensual ?? "-"}</td>
        <td>-</td>
        <td>-</td>
        <td>-</td>
        <td>-</td>
        <td>-</td>
      `;
      tabla.appendChild(fila);
    }

    ocultarLoader();
  }

  cargarCompras();
});
