
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
  const { data: entregas, error } = await supabaseClient
    .rpc("obtener_entregas_por_codigo", { cod: codigo });

  if (error || !entregas || entregas.length === 0) {
    Swal.fire({
      icon: 'info',
      title: `Sin entregas programadas para el código ${codigo}`,
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

  let tablaHtml = `<table style="width:100%; text-align:left; border-collapse: collapse;">
    <thead>
      <tr>
        <th class="th-popup">Nro OC / SOLPED</th>
        <th class="th-popup">Cantidad</th>
        <th class="th-popup">Fecha Entrega</th>
        <th class="th-popup">Estado</th>
      </tr>
    </thead>
    <tbody>`;

  for (const e of entregas) {
    const fechaFormateada = !e.fecha_entrega
      ? "Pendiente"
        : e.fecha_entrega.split("-").reverse().join("/");
    tablaHtml += `<tr>
      <td class="td-mini">${e.nro_oc}</td>
      <td class="td-mini">${formatearNumero(e.cantidad)}</td>
      <td class="td-mini">${fechaFormateada}</td>
      <td class="td-mini">${e.estado_solped}</td>
    </tr>`;
  }

  tablaHtml += `</tbody></table>`;

  Swal.fire({
    title: `Resumen de Compras – Código ${codigo}`,
    html: tablaHtml,
    width: 650,
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

      //const valorCompra = item.precio_compra && item.moneda ? `${item.precio_compra} ${item.moneda}` : "-";
      const consumo = item.consumo_promedio_mensual ?? "-";

      fila.innerHTML = `
        <td>${item.codigo}</td>
        <td class="columna-descripcion" title="${item.descripcion}">${item.descripcion}</td>
        <td class="tipo-producto">${item.grupo_material || "-"}</td>
        <td>${item.tipo_compra || "-"}</td>
        <td>
      <a href="#" style="color: #007bff; text-decoration: none;" onclick="mostrarPrecioCompra('${item.codigo}')">
        ${item.proveedor || "-"}
      </a>
    </td>
        <td class="columna-consumo">${formatearNumero(consumo)}</td>
        <td>
    <a href="#" style="color: #007bff; text-decoration: none;" onclick="mostrarStockDetalle('${item.codigo}', 'LIMA')">
      ${formatearNumero(item.stock_lima)}
    </a>
      </td>
      <td>
        <a href="#" style="color: #007bff; text-decoration: none;" onclick="mostrarStockDetalle('${item.codigo}', 'PROVINCIA')">
          ${formatearNumero(item.stock_provincia)}
        </a>
      </td>
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


// 👉 NUEVA columna: BACKLOG
const backlogTd = document.createElement("td");
backlogTd.classList.add("backlog");
backlogTd.style.textAlign = "center";      
backlogTd.textContent = "-"; // Valor por defecto hasta que se actualice
fila.appendChild(backlogTd);


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

    const { data: backlog, error: errorBacklog } = await supabaseClient.rpc("obtener_backlog_por_codsap");

    if (errorBacklog) {
      console.error("❌ Error al obtener backlog:", errorBacklog);
    } else {
      console.log("✅ Backlog recibido:", backlog);
      backlog.forEach(item => {
        const filas = document.querySelectorAll("#tablaComprasBody tr");
        filas.forEach(fila => {
          const codigo = fila.cells[0]?.textContent.trim();
          const celdaBacklog = fila.querySelector(".backlog");
          if (codigo === item.codigo && celdaBacklog) {
            celdaBacklog.textContent = item.total_cantidad;
          }
        });
      });
    }
    
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

  async function mostrarFechaActualizacionStock() {
  const { data, error } = await supabaseClient
    .from('stock_claro')
    .select('fecha_carga_sap')
    .order('fecha_carga_sap', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Error obteniendo fecha de stock:', error);
    return;
  }

  if (data && data.length > 0) {
    const fecha = new Date(data[0].fecha_carga_sap);
    const fechaFormateada = fecha.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });

    document.getElementById('mensajeFechaStock').textContent =
      `(*) El stock ha sido actualizado el ${fechaFormateada}`;
  }
}

async function mostrarPrecioCompra(codigo) {
  const { data, error } = await supabaseClient.rpc("obtener_precio_compra_ultimo", {
    _codigo: codigo
  });

  if (error) {
    console.error("Error al consultar precio compra:", error);
    Swal.fire({
      toast: true, position: 'bottom-end', timer: 3000, showConfirmButton: false,
      title: 'No se pudo cargar el precio',
      background: '#1e2022', color: '#ffffff', timerProgressBar: true
    });
    return;
  }

  if (!data || data.length === 0) {
    Swal.fire({
      toast: true, position: 'bottom-end', timer: 3000, showConfirmButton: false,
      title: `Código ${codigo}`,
      html: 'Sin registro de compra.',
      background: '#1e2022', color: '#ffffff', timerProgressBar: true
    });
    return;
  }

  const row = data[0];
  const f     = row.fecha_compra ? new Date(row.fecha_compra).toLocaleDateString('es-PE') : '-';
  const mon   = row.moneda || '-';
  const precio = (row.precio_compra ?? 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  Swal.fire({
    title: 'Precio de compra',
    html: `
      <table style="width:100%; border-collapse:collapse; margin-top:6px;">
        <thead>
          <tr>
            <th class="th-popup">Precio de compra</th>
            <th class="th-popup">Moneda</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="td-mini" style="text-align:right;">${precio}</td>
            <td class="td-mini" style="text-align:center;">${mon}</td>
          </tr>
        </tbody>
      </table>
      <div style="margin-top:10px; font-size:12px; opacity:.85;">
        <b>Código:</b> ${codigo} &nbsp;•&nbsp; <b>Fecha:</b> ${f}
      </div>
    `,
    width: '50%',              // ocupa buen espacio; ajusta si quieres
    confirmButtonText: 'Cerrar',
    confirmButtonColor: '#f39c12',
    background: '#1e2022',
    color: '#ffffff',
    customClass: { title: 'swal-titulo-pequeno', popup: 'swal2-modal-custom' }
  });
}

window.mostrarPrecioCompra = mostrarPrecioCompra;
  
async function mostrarStockDetalle(codigo, tipoAlmacen) {
  const { data, error } = await supabaseClient.rpc("obtener_stock_claro_detalle", {
    _codigo: codigo,
    _tipo: tipoAlmacen
  });

  if (error) {
    console.error("Error al consultar stock claro:", error);
    return;
  }

  if (data.length > 0) {
    data.sort((a, b) => b.cantidad_sap - a.cantidad_sap); // Ordena de mayor a menor
   let tablaHTML = `
  <table style="width: 100%; border-collapse: collapse;">
    <thead>
      <tr>
        <th class="th-popup">Centro</th>
        <th class="th-popup">Almacén</th>
        <th class="th-popup">Lote</th>
        <th class="th-popup">Cantidad</th>
        <th class="th-popup">Tipo Almacén</th>
        <th class="th-popup">Ciudad</th>
      </tr>
    </thead>
    <tbody>
`;

data.forEach(row => {
  tablaHTML += `
    <tr>
      <td class="td-mini">${row.centro}</td>
      <td class="td-mini">${row.almacen}</td>
      <td class="td-mini">${row.lote}</td>
      <td class="td-mini td-cantidad">${row.cantidad_sap}</td>
      <td class="td-mini">${row.tipo_almacen}</td>
      <td class="td-mini">${row.ciudad ?? "-"}</td>
    </tr>
  `;
});
    tablaHTML += `</tbody></table>`;

// ➜ footer solo con el código
const footerHTML = `
  <div style="margin-top:10px; font-size:12px; opacity:.85;">
    <b>Código:</b> ${codigo}
  </div>
`;
    Swal.fire({
      title: `Detalle de Stock – ${tipoAlmacen}`,
      html: tablaHTML + footerHTML, 
      width: "50%",
      background: "#1e2022",
      color: "#ffffff",
    confirmButtonText: 'Cerrar',
    confirmButtonColor: '#f39c12',
      position: "center",
    customClass: { title: 'swal-titulo-pequeno' },
    });
  } else {
    Swal.fire({
  icon: 'info',
  title: `No se encontró stock en ${tipoAlmacen} para el código ${codigo}`,
  toast: true,
  position: "bottom-end",
  background: "#1e2022",
  color: "#ffffff",
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true
});
  }
}

   window.mostrarStockDetalle = mostrarStockDetalle;
  

  // Llamada inicial
  cargarCompras();
  mostrarFechaActualizacionStock();
});

      function irABacklog() {
  window.location.href = "/Backlog"; 
}

