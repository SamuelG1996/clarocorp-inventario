// Versión optimizada usando la función RPC obtener_compras_optimizadas()
document.addEventListener("DOMContentLoaded", async () => {
  console.log("DOM cargado");

  const { createClient } = supabase;
  const supabaseUrl = "https://bsrtuievwjtzwejuxqee.supabase.co";
  const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzcnR1aWV2d2p0endlanV4cWVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1NTEyNjYsImV4cCI6MjA2NDEyNzI2Nn0.A9tCs-Zi-7jw5LUFs7ViIR2vHb9tNMj6c7YeeNOdmWI";
  const supabaseClient = createClient(supabaseUrl, supabaseKey);

  const tabla = document.getElementById("tablaComprasBody");
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


  function formatearNumero(valor) {
    if (valor == null || isNaN(valor)) return "-";
    const partes = valor.toString().split(".");
    let enteroFormateado = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return partes[1] && parseInt(partes[1]) !== 0
      ? `${enteroFormateado},${partes[1]}`
      : enteroFormateado;
  }

  async function mostrarDetalleCompras(codigo) {
    const { data: detalle, error } = await supabaseClient
      .from("ordenes_compra")
      .select("nro_oc, cantidad_por_entregar, estado_solped, solped")
      .eq("codigo", codigo)
      .gt("cantidad_por_entregar", 0);

    if (error || !detalle || detalle.length === 0) {
      Swal.fire({
        icon: 'info',
        title: `Sin compras pendientes para el código ${codigo}`,
        toast: true,
        position: 'bottom-end',
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        background: '#1e2022',
        color: '#ffffff'
      });
      return;
    }

    let tablaHtml = `<table style="width:100%; text-align:left; border-collapse: collapse;"><thead><tr>
      <th class="th-popup">Nro OC / SOLPED</th><th class="th-popup">Cantidad</th><th class="th-popup">Estado</th>
    </tr></thead><tbody>`;

    for (const fila of detalle) {
      tablaHtml += `<tr><td class="td-mini">${fila.nro_oc.toUpperCase() === "PENDIENTE" ? fila.solped : fila.nro_oc}</td>
                    <td class="td-mini">${formatearNumero(fila.cantidad_por_entregar)}</td>
                    <td class="td-mini">${fila.estado_solped}</td></tr>`;
    }

    tablaHtml += "</tbody></table>";

    Swal.fire({
      title: `Resumen de Compras – Código ${codigo}`,
      html: tablaHtml,
      width: 600,
      background: '#1e2022',
      color: '#ffffff',
      confirmButtonText: 'Cerrar',
      confirmButtonColor: '#f39c12',
      customClass: { title: 'swal-titulo-pequeno' }
    });
  }

  async function cargarCompras() {
    mostrarLoader();

    const { data: compras, error } = await supabaseClient.rpc("obtener_compras_optimizadas");

    if (error) {
      console.error("❌ Error al obtener compras:", error);
      ocultarLoader();
      return;
    }

    tabla.innerHTML = "";
    const fragment = document.createDocumentFragment();

    compras.forEach((item) => {
      const fila = document.createElement("tr");

      const valorCompra = item.precio_compra && item.moneda ? `${item.precio_compra} ${item.moneda}` : "-";
      const consumo = item.consumo_promedio_mensual ?? "-";

      fila.innerHTML = `
        <td>${item.codigo}</td>
        <td class="columna-descripcion" title="${item.descripcion}">${item.descripcion}</td>
        <td>${item.grupo_material || "-"}</td>
        <td>${item.tipo_compra || "-"}</td>
        <td>${item.proveedor || "-"}</td>
        <td>${valorCompra}</td>
        <td class="columna-consumo">${formatearNumero(consumo)}</td>
        <td>${formatearNumero(item.stock_lima)}</td>
        <td>${formatearNumero(item.stock_provincia)}</td>
      `;

      const coberturaTd = document.createElement("td");
      coberturaTd.textContent = item.cobertura_actual?.toFixed(1) ?? "-";
      const coberturaValor = Number(item.cobertura_actual);
      if (!isNaN(coberturaValor)) {
        if (coberturaValor < 3) coberturaTd.style.backgroundColor = "#ffcccc";
        else if (coberturaValor <= 5) coberturaTd.style.backgroundColor = "#d2f8d2";
        else coberturaTd.style.backgroundColor = "#ffe0b3";
      }
      fila.appendChild(coberturaTd);

      const comprasCursoTd = document.createElement("td");
      comprasCursoTd.innerHTML = `<a href="#" style="text-decoration:none; color:#007bff;">${formatearNumero(item.compras_en_curso)}</a>`;
      comprasCursoTd.style.cursor = "pointer";
      comprasCursoTd.addEventListener("click", () => mostrarDetalleCompras(item.codigo));
      fila.appendChild(comprasCursoTd);

      const coberturaTotalTd = document.createElement("td");
      coberturaTotalTd.textContent = item.cobertura_total?.toFixed(1) ?? "-";
      const coberturaTotalValor = Number(item.cobertura_total);
      if (!isNaN(coberturaTotalValor)) {
        if (coberturaTotalValor < 3) coberturaTotalTd.style.backgroundColor = "#ffcccc";
        else if (coberturaTotalValor <= 5) coberturaTotalTd.style.backgroundColor = "#d2f8d2";
        else coberturaTotalTd.style.backgroundColor = "#ffe0b3";
      }
      fila.appendChild(coberturaTotalTd);

      // Columna ESTADO (posición final)
      const estadoTd = document.createElement("td");
      if (!isNaN(coberturaValor)) {
        if (coberturaValor < 3) {
          estadoTd.textContent = "Crítico";
        } else if (coberturaValor > 9) {
          estadoTd.textContent = "No requiere compra";
        } else {
          estadoTd.textContent = "-";
        }
      } else {
        estadoTd.textContent = "-";
      }
      fila.appendChild(estadoTd);

      fragment.appendChild(fila);
    });

    tabla.appendChild(fragment);
     ocultarLoader();

    // Activar búsqueda después de cargar datos
    inputBuscar.addEventListener("input", () => {
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
    });
  } // <-- fin de la función cargarCompras


  cargarCompras();
});

