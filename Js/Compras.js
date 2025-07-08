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
  const { data: entregas, error } = await supabaseClient.rpc("obtener_entregas_por_codigo", { cod: codigo });

  if (error || !entregas || entregas.length === 0) {
    Swal.fire({
      icon: "info",
      title: `Sin entregas programadas para el código ${codigo}`,
      toast: true,
      position: "bottom-end",
      timer: 3000,
      timerProgressBar: true,
      showConfirmButton: false,
      background: "#1e2022",
      color: "#ffffff",
    });
    return;
  }

  let tablaHtml = `<table style="width:100%; text-align:left; border-collapse: collapse;">
    <thead>
      <tr>
        <th>Nro OC / SOLPED</th>
        <th>Cantidad</th>
        <th>Fecha Entrega</th>
        <th>Estado</th>
      </tr>
    </thead>
    <tbody>`;

  entregas.forEach((e, idx) => {
    if (e.estado_solped?.toLowerCase() === "entregado") return;

    const fechaFormateada = e.fecha_entrega || "";
    tablaHtml += `<tr data-row="${idx}" data-nro="${e.nro_oc}">
      <td>${e.nro_oc}</td>
      <td>${e.cantidad}</td>
      <td>${fechaFormateada || "Pendiente"}</td>
      <td>${e.estado_solped}</td>
    </tr>`;
  });

  tablaHtml += `</tbody></table>`;

  Swal.fire({
    title: `Editar Detalle – ${codigo}`,
    html: `
      <div>${tablaHtml}</div>
      <div style="text-align:right; margin-top:15px">
        <button id="guardarCambios" class="swal2-confirm swal2-styled" style="margin-right:10px;background:#f39c12">Guardar Cambios</button>
        <button class="swal2-cancel swal2-styled">Cerrar</button>
      </div>
    `,
    showConfirmButton: false,
    showCancelButton: false,
    background: '#1e2022',
    color: '#ffffff',
    width: 750,
    customClass: {
      popup: 'swal2-modal-custom'
    },
    didOpen: () => {
      // ✅ Botón guardar
      document.getElementById("guardarCambios").addEventListener("click", async () => {
        const filas = document.querySelectorAll("tbody tr");

        for (const fila of filas) {
          const nro_oc = fila.querySelector("td:nth-child(1)").innerText.trim();
          const cantidad = fila.querySelector("td:nth-child(2)").innerText.trim();
          const fecha = fila.querySelector("td:nth-child(3)").innerText.trim();
          const estado = fila.querySelector("td:nth-child(4)").innerText.trim();

          if (estado.toLowerCase() === "entregado") continue;

          const fechaFormateada = fecha.includes("/") ? fecha.split("/").reverse().join("-") : fecha;

          await supabaseClient
            .from("ordenes_compra")
            .update({
              nro_oc: nro_oc,
              cantidad_por_entregar: cantidad,
              estado_solped: estado,
              fecha_entrega_1: fechaFormateada || null
            })
            .eq("codigo", codigo)
            .or(`nro_oc.eq.${nro_oc},solped.eq.${nro_oc}`);
        }

        location.reload();
      });

      // ✅ Botón cerrar (cierre inmediato)
      document.querySelector(".swal2-cancel").addEventListener("click", () => {
        Swal.close();
      });
    }
  });
}
function activarEdicion(entregas, codigo) {
  const tbody = document.querySelector(".swal2-container table tbody");
  tbody.innerHTML = "";

  entregas.forEach((e, idx) => {
    if (e.estado_solped?.toLowerCase() === "entregado") return;

    tbody.innerHTML += `
      <tr>
        <td><input type="text" class="input-edit" value="${e.nro_oc}" data-idx="${idx}" data-col="nro_oc"></td>
        <td><input type="number" class="input-edit" value="${e.cantidad}" data-idx="${idx}" data-col="cantidad"></td>
        <td><input type="date" class="input-edit" value="${e.fecha_entrega || ""}" data-idx="${idx}" data-col="fecha_entrega"></td>
        <td><input type="text" class="input-edit" value="${e.estado_solped}" data-idx="${idx}" data-col="estado_solped"></td>
      </tr>
    `;
  });

  const contenedor = document.getElementById("contenedor-edicion");
  contenedor.querySelector("#btnEditar").outerHTML = `<button id="btnGuardar" class="swal2-confirm swal2-styled" style="margin-right:10px;background:#f39c12">Guardar Cambios</button>`;

  document.getElementById("btnGuardar").addEventListener("click", async () => {
    const inputs = document.querySelectorAll(".input-edit");
    const cambios = {};

    inputs.forEach(input => {
      const row = input.dataset.idx;
      const col = input.dataset.col;
      cambios[row] = cambios[row] || {};
      cambios[row][col] = input.value;
    });

    for (const fila of Object.values(cambios)) {
      if (!fila.nro_oc || !fila.cantidad || !fila.estado_solped) continue;

      await supabaseClient.from("ordenes_compra").update({
        nro_oc: fila.nro_oc,
        cantidad_por_entregar: fila.cantidad,
        estado_solped: fila.estado_solped,
        fecha_entrega_1: fila.fecha_entrega || null,
      }).eq("codigo", codigo).eq("nro_oc", fila.nro_oc);
    }

    location.reload();
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
        const coberturaValor = item.cobertura_actual;
if (typeof coberturaValor === "number" && !isNaN(coberturaValor)) {
        if (coberturaValor < 3) coberturaTd.style.backgroundColor = "#ffcccc";
        else if (coberturaValor <= 5) coberturaTd.style.backgroundColor = "#d2f8d2";
        else coberturaTd.style.backgroundColor = "#ffe0b3";
      }
      fila.appendChild(coberturaTd);

      const comprasCursoTd = document.createElement("td");
      comprasCursoTd.innerHTML = `<a href="#" style="text-decoration:none; color:#007bff;">${formatearNumero(item.compras_en_curso)}</a>`;
      comprasCursoTd.style.cursor = "pointer";
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
    if (typeof coberturaValor === "number" && !isNaN(coberturaValor)) {
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
  }

  // ✅ Búsqueda con normalización sin tildes
  inputBuscar.addEventListener("input", () => {
    const filtro = inputBuscar.value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const filas = tabla.getElementsByTagName("tr");

    for (let i = 0; i < filas.length; i++) {
      const celdas = filas[i].getElementsByTagName("td");
      let coincide = false;

      for (let j = 0; j < celdas.length; j++) {
        const texto = (celdas[j].textContent || celdas[j].innerText)
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");

        if (texto.includes(filtro)) {
          coincide = true;
          break;
        }
      }
      filas[i].style.display = coincide ? "" : "none";
    }
  });

  document.addEventListener("click", function (e) {
  const celda = e.target.closest("td");
  if (!celda) return;

  const fila = celda.closest("tr");
  if (!fila) return;

  const tabla = celda.closest("table");
  if (!tabla) return;

  const encabezado = tabla.querySelectorAll("thead th")[celda.cellIndex];
  const nombreColumna = encabezado?.innerText.trim().toLowerCase();

  if (nombreColumna === "compras en curso") {
    const codigo = fila.querySelector("td")?.innerText.trim();

    Swal.fire({
      title: `Acción para: ${codigo}`,
      html: `
        <p>¿Deseas editar el detalle de las entregas para este material?</p>
        <button id="btnEditarDetalle" class="swal2-confirm swal2-styled" style="background:#f39c12">Editar Detalle</button>
        <button class="swal2-cancel swal2-styled">Cerrar</button>
      `,
      showConfirmButton: false,
      background: '#1e2022',
      color: '#ffffff',
      customClass: {
        popup: 'swal2-modal-custom'
      },
      didOpen: () => {
        document.getElementById("btnEditarDetalle").addEventListener("click", () => {
          Swal.close();
          mostrarDetalleCompras(codigo);
        });

        document.querySelector(".swal2-cancel").addEventListener("click", () => {
          Swal.close();
        });
      }
    });
  }
});

  // Llamada inicial
  cargarCompras();
});
