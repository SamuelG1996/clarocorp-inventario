
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

function formatearNumero(valor) {
  if (valor == null || isNaN(valor)) return "-";

  const partes = valor.toString().split(".");
  let enteroFormateado = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  if (partes[1] && parseInt(partes[1]) !== 0) {
    return `${enteroFormateado},${partes[1]}`;
  } else {
    return enteroFormateado;
  }
}

async function mostrarDetalleCompras(codigo, supabaseClient) {
  const { data: detalle, error } = await supabaseClient
    .from("ordenes_compra")
    .select("nro_oc, cantidad_por_entregar, estado_solped")
    .eq("codigo", codigo)
    .gt("cantidad_por_entregar", 0);

  if (error) {
    console.error("❌ Error al obtener detalle de compras:", error);
    return;
  }

  if (!detalle || detalle.length === 0) {
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

  let tablaHtml = `
    <table style="width:100%; text-align:left; border-collapse: collapse;">
      <thead>
        <tr style="background:#f2f2f2;">
          <th style="padding:5px; border:1px solid #ccc;">Nro OC</th>
          <th style="padding:5px; border:1px solid #ccc;">Cantidad</th>
          <th style="padding:5px; border:1px solid #ccc;">Estado</th>
        </tr>
      </thead>
      <tbody>`;

  for (const fila of detalle) {
    tablaHtml += `
      <tr>
        <td style="padding:5px; border:1px solid #ccc;">${fila.nro_oc}</td>
        <td style="padding:5px; border:1px solid #ccc;">${formatearNumero(fila.cantidad_por_entregar)}</td>
        <td style="padding:5px; border:1px solid #ccc;">${fila.estado_solped}</td>
      </tr>`;
  }

  tablaHtml += "</tbody></table>";

  Swal.fire({
    title: `Resumen de Compras en Curso – Código ${codigo}`,
    html: tablaHtml,
    width: 600,
    background: '#1e2022',
    color: '#ffffff',
    confirmButtonText: 'Cerrar',
    confirmButtonColor: '#f39c12'
  });
}


async function cargarCompras() {
  mostrarLoader();

  // 1. Obtener compras
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

    // 2.4 OBTENER DESCRIPCION
const { data: productos, error: errorProductos } = await supabaseClient
  .from("productos")
  .select("codigo, descripcion");

  const descripciones = {};
if (productos) {
  for (const prod of productos) {
    const codigoProd = String(prod.codigo).trim();
    descripciones[codigoProd] = prod.descripcion;
  }
}
  
  
  // 3. Agrupar stock por código y zona (como string)
  const stockPorCodigo = {};
  if (stockClaro) {
    for (const fila of stockClaro) {
      const codigo = String(fila.codigo).trim();
      const zona = fila.zona?.toUpperCase().trim() || "";
      const cantidad = fila.cantidad_sap || 0;

      if (!stockPorCodigo[codigo]) {
        stockPorCodigo[codigo] = { LIMA: 0, PROVINCIA: 0 };
      }

      if (zona === "LIMA" || zona === "PROVINCIA") {
        stockPorCodigo[codigo][zona] += cantidad;
      }
    }
  }
console.log("🧠 stockPorCodigo generado:", stockPorCodigo);

// 2.5 OBTENER COMPRAS EN CURSO
const { data: ordenesCompra, error: errorOrdenes } = await supabaseClient
  .from("ordenes_compra")
  .select("codigo, cantidad_por_entregar");

const comprasPendientes = {};
if (ordenesCompra) {
  for (const orden of ordenesCompra) {
    const codigoOC = String(orden.codigo).trim();
    const cantidad = Number(orden.cantidad_por_entregar) || 0;

    if (!comprasPendientes[codigoOC]) {
      comprasPendientes[codigoOC] = 0;
    }
    comprasPendientes[codigoOC] += cantidad;
  }
}


  
  // 4. Renderizar la tabla
  tabla.innerHTML = "";
  compras.forEach((item) => {
    
    // 🔒 Validación de vigencia
  if (item.vigente && item.vigente.trim().toUpperCase() !== "SI") {
    return; // Saltar si no está vigente
  }
    
const codigo = String(item.codigo).trim();
const descripcion = descripciones[codigo] || "-";
const grupo = item.grupo_material || "-";
const tipoCompra = item.tipo_compra || "-";
const proveedor = item.proveedor || "-";
const valorCompra = item.precio_compra && item.moneda ? `${item.precio_compra} ${item.moneda}` : "-";
const consumo = item.consumo_promedio_mensual ?? "-";

const stockLima = stockPorCodigo[codigo]?.LIMA ?? 0;
const stockProvincia = stockPorCodigo[codigo]?.PROVINCIA ?? 0;

const totalStock = Number(stockLima) + Number(stockProvincia);
const consumoMensual = Number(consumo);

let coberturaActual = "No se puede calcular";
if (!isNaN(totalStock) && !isNaN(consumoMensual) && consumoMensual > 0) {
  coberturaActual = (totalStock / consumoMensual).toFixed(1);
}

  const coberturaTd = document.createElement("td");
  coberturaTd.textContent = coberturaActual;

  // Aplicar color de fondo según el valor de coberturaActual
  const coberturaValor = Number(coberturaActual);
  if (!isNaN(coberturaValor)) {
    if (coberturaValor < 3) {
      coberturaTd.style.backgroundColor = "#ffcccc"; // rojo suave
    } else if (coberturaValor >= 3 && coberturaValor <= 5) {
      coberturaTd.style.backgroundColor = "#d2f8d2"; // verde suave
    } else if (coberturaValor > 5) {
      coberturaTd.style.backgroundColor = "#ffe0b3"; // naranja suave
    }
  }
const comprasEnCurso = comprasPendientes[codigo] ?? 0;

let coberturaTotal = "No se puede calcular";
if (!isNaN(totalStock) && !isNaN(comprasEnCurso) && !isNaN(consumoMensual) && consumoMensual > 0) {
  coberturaTotal = ((totalStock + comprasEnCurso) / consumoMensual).toFixed(1);
}

    
const fila = document.createElement("tr");

fila.innerHTML = `
  <td>${codigo}</td>
  <td class="columna-descripcion" data-texto="${descripcion}" title="${descripcion}">${descripcion}</td>
  <td>${grupo}</td>
  <td>${tipoCompra}</td>
  <td>${proveedor}</td>
  <td>${valorCompra}</td>
  <td class="columna-consumo">${formatearNumero(consumo)}</td>
  <td>${formatearNumero(stockLima)}</td>
  <td>${formatearNumero(stockProvincia)}</td>
`;

// Reemplaza esta celda por el td dinámico
fila.appendChild(coberturaTd);

// Agrega el resto de celdas vacías
// Compras en Curso
const comprasCursoTd = document.createElement("td");
comprasCursoTd.innerHTML = `<a href="#" style="text-decoration:none; color:#007bff;">${formatearNumero(comprasEnCurso)}</a>`;
comprasCursoTd.style.cursor = "pointer";
comprasCursoTd.addEventListener("click", () => {
  mostrarDetalleCompras(codigo, supabaseClient);
});
fila.appendChild(comprasCursoTd);

// Cobertura Total (con compras)
const coberturaTotalTd = document.createElement("td");
coberturaTotalTd.textContent = coberturaTotal;

// Color para cobertura total
const coberturaTotalValor = Number(coberturaTotal);
if (!isNaN(coberturaTotalValor)) {
  if (coberturaTotalValor < 3) {
    coberturaTotalTd.style.backgroundColor = "#ffcccc";
  } else if (coberturaTotalValor >= 3 && coberturaTotalValor <= 5) {
    coberturaTotalTd.style.backgroundColor = "#d2f8d2";
  } else if (coberturaTotalValor > 5) {
    coberturaTotalTd.style.backgroundColor = "#ffe0b3";
  }
}
fila.appendChild(coberturaTotalTd);

// Celda final vacía
const tdFinal = document.createElement("td");
tdFinal.textContent = "-";
fila.appendChild(tdFinal);

tabla.appendChild(fila);
});
  ocultarLoader();
}
  cargarCompras();
});
