import { API_BASE_URL } from "./utils.js";
import { mostrarAlerta } from "./utils.js";

document.addEventListener("DOMContentLoaded", async () => {
  const contenedor = document.getElementById("contenedor-contratos");

  try {
    const response = await fetch(`${API_BASE_URL}/contracts`);
    if (!response.ok) throw new Error("Error al cargar contratos");

    const contratos = await response.json();
    contenedor.innerHTML = "";

    if (!Array.isArray(contratos) || contratos.length === 0) {
      contenedor.innerHTML = "<p>No hay contratos registrados.</p>";
      return;
    }

    contratos.forEach(c => {
      const div = document.createElement("div");
      div.style = "background-color: #f2f2f2; padding: 20px; border-radius: 8px; width: 300px;";

      div.innerHTML = `
        <h3 style="margin-top: 0;">${c.title}</h3>
        <p>Inicio: ${new Date(c.startDate).toLocaleDateString()}</p>
        <p>Fin: ${new Date(c.endDate).toLocaleDateString()}</p>
        <button class="boton-registrar" style="width: 100%; margin-top: 10px;">Descargar</button>
      `;

      const boton = div.querySelector("button");
      boton.addEventListener("click", descargarContrato);

      contenedor.appendChild(div);
    });
  } catch (error) {
    console.error("[Contratos Error]", error);
    mostrarAlerta("No se pudieron cargar los contratos", "error");
  }
});

function descargarContrato() {
  const url = "assets/Contrato_Compraventa_Inmueble.pdf";
  const a = document.createElement("a");
  a.href = url;
  a.download = "Contrato_Compraventa_Inmueble.pdf";
  a.target = "_blank";
  a.click();
}