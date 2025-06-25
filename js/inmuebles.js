import { API_BASE_URL } from "./utils.js";
import { mostrarAlerta } from "./utils.js";
const backendBase = "http://localhost:8085";

//Obtiene dos inmuebles específicos o todos si se indica
export async function obtenerInmuebles(mostrarTodos = false) {
  try {
    const response = await fetch(`${API_BASE_URL}/property/getProperties`);
    if (!response.ok) throw new Error("Error al obtener inmuebles");
    const todos = await response.json();

    if (mostrarTodos) return todos;

    const inmueblesDeseados = [
      "3DD34141-D414-4B4C-A477-23E6F4635D40",
      "ABAEB973-48A0-4C00-9FF3-2D1036B38F31",
    ];

    return todos.filter((i) => inmueblesDeseados.includes(i.PropertyID));
  } catch (error) {
    console.error(error);
    return [];
  }
}

// Renderiza los inmuebles en las tarjetas
export function renderInmuebles(lista, contenedor) {
  contenedor.innerHTML = "";
  lista.forEach((inmueble) => {
    const imageUrl = inmueble.ImageURL ? backendBase + inmueble.ImageURL : 'assets/stockhouse.png';

    const card = document.createElement("div");
    card.classList.add("tarjeta-inmueble");

    card.innerHTML = `
      <img src="${imageUrl}" alt="Imagen inmueble">
      <div class="contenido">
        <h3>${inmueble.Title}</h3>
        <p class="precio">$${parseFloat(inmueble.Price).toLocaleString("es-MX")} MXN</p>
        <p class="direccion">${inmueble.Address || ''}</p>
        <p class="estado">${inmueble.CurrentStatus || ''}</p>
        <a href="${inmueble.enlace || '#'}" class="boton-detalles">Ver Detalles</a>
      </div>
    `;

    contenedor.appendChild(card);
  });
}

// Carga los detalles del inmueble desde la URL y renderiza la información
export async function cargarDetallesInmueble() {
  const params = new URLSearchParams(window.location.search);
  const propertyId = params.get("propertyId");
  console.log('Vamos a cargar los detalles'); // Depuración
  console.log('PropertyId from URL:', propertyId); // Depuración
  if (!propertyId) return null;

  try {
    const response = await fetch(
      `${API_BASE_URL}/property/propertyDetails?propertyId=${encodeURIComponent(
        propertyId
      )}`
    );
    console.log('Fetch response status:', response.status); // Depuración
    console.log('Fetch response URL:', response.url); // Depuración
    if (!response.ok) throw new Error("No se pudo cargar el inmueble");
    const inmueble = await response.json();
    console.log('Fetched inmueble data:', inmueble);

    renderGaleria(inmueble.images || []);
    renderDetalles({
      titulo: inmueble.title,
      precio: inmueble.price,
      direccion: inmueble.address || "Dirección no disponible",
      descripcion: inmueble.description,
    });
    renderResenas(inmueble.reviews || [], inmueble.propertyId);
    renderPreguntas(inmueble.faqs || [], inmueble.propertyId);

    return {
      latitud: inmueble.latitude || 19.543,
      longitud: inmueble.longitude || -96.931,
      id: inmueble.propertyId,
    };
  } catch (error) {
    mostrarAlerta(
      "Error de conexión",
      "No se pudo cargar la información del inmueble."
    );
    return null;
  }
}

//Cargar los datos basicos de un inmueble
export async function obtenerDetallesBasicosInmueble(propertyId) {
  try {
     console.error('Recibimos el propertyId:', propertyId);
    const response = await fetch(`${API_BASE_URL}/property/getBasicPropertyDetails?propertyId=${encodeURIComponent(propertyId)}`);
    if (!response.ok) throw new Error("No se pudo cargar el inmueble");
    const inmueble = await response.json();
    return inmueble;
  } catch (error) {
    console.error('Error en obtenerDetallesBasicosInmueble:', error);
    throw error; 
  }
}

// Paga el inmueble y genera un contrato
export async function pagarInmuebleYGenerarContrato(idInmueble) {
  try {
    const usuario = JSON.parse(localStorage.getItem("usuario"));
    const response = await fetch(`${API_BASE_URL}/contratos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idInmueble, idComprador: usuario.id }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "No se pudo generar el contrato");
    }

    mostrarAlerta("Contrato generado exitosamente", "success");
    window.location.href = "contratos.html";
  } catch (error) {
    console.error(error);
    mostrarAlerta(error.message || "Error al procesar el pago", "error");
  }
}

// Registra un nuevo inmueble con imágenes
export async function registrarInmuebleConImagenes(formElement) {
  try {
    const usuario = JSON.parse(localStorage.getItem("usuario"));
    if (!usuario || !usuario.UserID) {
      mostrarAlerta("Debe iniciar sesión", "error");
      return;
    }

    const formData = new FormData();
    formData.append("title", formElement.querySelector("#titulo").value.trim());
    formData.append("categoryId", parseInt(formElement.querySelector("#tipo").value === "Casa" ? 1 : 2));
    formData.append("address", formElement.querySelector("#direccion").value.trim());
    formData.append("latitude", parseFloat(formElement.querySelector("#latitud").value.trim()));
    formData.append("longitude", parseFloat(formElement.querySelector("#longitud").value.trim()));
    formData.append("price", parseFloat(formElement.querySelector("#precio").value.trim()));
    formData.append("description", formElement.querySelector("#descripcion").value.trim());
    formData.append("ownerId", usuario.UserID);

    const files = formElement.querySelector("#input-fotos").files;
    for (let i = 0; i < files.length && i < 10; i++) {
      formData.append("images", files[i]);
    }

    const response = await fetch(`${API_BASE_URL}/property/createProperty`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const err = await response.json();
        throw new Error(err.error || "No se pudo registrar el inmueble");
      } else {
        const text = await response.text();
        throw new Error("Respuesta inesperada del servidor: " + text);
      }
    }

    mostrarAlerta("Inmueble publicado correctamente", "success");
    setTimeout(() => {
      window.location.href = "cuenta.html";
    }, 1500);
  } catch (error) {
    console.error("[Registro inmueble]", error);
    mostrarAlerta(error.message || "Error al registrar inmueble", "error");
  }
}

export async function actualizarInmueble(id, data) {
  try {
    const response = await fetch(`${API_BASE_URL}/property/updateProperty`, {
      method: "PUT",
      body: data // Usar directamente el FormData
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || "No se pudo actualizar el inmueble");
    }

    return await response.json(); // Devuelve el mensaje del backend
  } catch (error) {
    console.error("[Actualizar inmueble]", error);
    mostrarAlerta(error.message, "error");
    return null;
  }
}

function renderGaleria(imagenes) {
  const galeria = document.getElementById("galeria");
  galeria.innerHTML = "";
  imagenes.forEach((img) => {
    const image = document.createElement("img");
    image.src = img ? backendBase + img : "assets/stockhouse.png";
    image.alt = "Imagen inmueble";
    galeria.appendChild(image);
  });
}

export function renderPreview(imagenes) {
  const preview = document.getElementById("preview");
  if (!preview) {
    console.warn("Contenedor con id 'preview' no encontrado");
    return;
  }
  preview.innerHTML = "";
  imagenes.forEach((img) => {
    const image = document.createElement("img");
    if (typeof img === "string") {
      image.src = img ? `${backendBase}${img}` : "assets/stockhouse.png";
      image.alt = "Imagen inmueble";
    } else {
      image.src = "assets/stockhouse.png";
      image.alt = "Imagen no disponible";
    }
    image.style.maxWidth = "150px";
    image.style.margin = "10px";
    preview.appendChild(image);
  });
}

function renderDetalles(inmueble) {
  const detalles = document.getElementById("detalles-inmueble");
  detalles.innerHTML = `
    <h2>${inmueble.titulo}</h2>
    <p><strong>Precio:</strong> $${inmueble.precio.toLocaleString(
      "es-MX"
    )} MXN</p>
    <p><strong>Dirección:</strong> ${inmueble.direccion}</p>
    <p>${inmueble.descripcion}</p>
  `;
}

export function renderPreguntas(preguntas, inmuebleId) {
  const seccion = document.getElementById("seccion-preguntas");
  seccion.innerHTML = `
    <h3>Preguntas y respuestas</h3>
    <div class="pregunta-form">
      <input type="text" id="input-pregunta" placeholder="e.j. ¿Cuántas habitaciones tiene?" aria-label="Escribe tu pregunta sobre el inmueble"/>
      <button id="btn-preguntar" class="boton-registrar" aria-label="Enviar pregunta">Enviar</button>
    </div>
    <ul class="lista-preguntas">
      ${preguntas.map(p => {
        const tieneRespuesta = p.answer && p.answer.trim() !== '';
        return `
          <li>
            <strong>${p.dateAsked}:</strong> ${p.question}<br>
            ${tieneRespuesta ? `<em>Respuesta:</em> ${p.answer} (${p.dateAnswered || 'Sin fecha'})` : `
              <textarea id="respuesta-${p.faqId}" placeholder="Escribe tu respuesta aquí..." rows="3" style="width: 100%; margin: 10px 0;"></textarea>
              <button class="boton-responder" data-faqid="${p.faqId}">Responder</button>
            `}
          </li>
        `;
      }).join("")}
    </ul>
  `;

  // Evento para enviar nuevas preguntas
  document.getElementById("btn-preguntar")?.addEventListener("click", async () => {
    const pregunta = document.getElementById("input-pregunta").value.trim();
    if (!pregunta) {
      mostrarAlerta("Escribe una pregunta válida", "warning");
      return;
    }

    try {
      const usuario = JSON.parse(localStorage.getItem("usuario"));
      const res = await fetch(`${API_BASE_URL}/property/faq`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: usuario.UserID,
          propertyId: inmuebleId,
          question: pregunta,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al registrar pregunta");
      }

      mostrarAlerta("Pregunta enviada", "success");
      location.reload();
    } catch (e) {
      mostrarAlerta("No se pudo registrar la pregunta", "error");
    }
  });

  // Evento para responder preguntas
  document.querySelectorAll('.boton-responder').forEach(button => {
    button.addEventListener('click', async () => {
      const faqId = button.getAttribute('data-faqid');
      const textarea = document.getElementById(`respuesta-${faqId}`);
      const answer = textarea.value.trim();

      if (!answer) {
        alert('Por favor, escribe una respuesta.');
        return;
      }

      try {
        const usuario = JSON.parse(localStorage.getItem("usuario"));
        if (!usuario) {
          alert('Debes iniciar sesión para responder.');
          return;
        }

        const response = await fetch(`${API_BASE_URL}/property/answer`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ faqId, answer })
        });

        if (!response.ok) throw new Error('Error al guardar la respuesta');

        alert('Respuesta guardada exitosamente.');
        // Actualizar la interfaz
        textarea.parentElement.innerHTML = `<em>Respuesta:</em> ${answer} (Guardada el ${new Date().toLocaleString()})`;
      } catch (error) {
        alert('Error al guardar la respuesta');
        console.error(error);
      }
    });
  });
}

function renderResenas(resenas, inmuebleId) {
  const seccion = document.getElementById("seccion-resenas");
  seccion.innerHTML = `
    <h3>Reseñas del Inmueble y/o Arrendador</h3>
    <div class="review-form">
      <input type="text" id="input-resena" placeholder="e.j. ¡Muy buen lugar para vivir con las 3B!" aria-label="Comentario de reseña"/>
      <input type="number" id="input-calificacion" placeholder="e.j. 5" min="1" max="5" aria-label="Calificación del 1 al 5"/>
      <button id="btn-resena" class="boton-registrar" aria-label="Enviar reseña">Dar reseña</button>
    </div>
    ${resenas.map(r => `
      <div class="tarjeta-inmueble" role="region" aria-label="Reseña de usuario">
        <p class="resena-usuario"><strong>Usuario:</strong> ${r.userName || "Anónimo"}</p>
        <p><strong>Comentario:</strong> ${r.comment}</p>
        <p><strong>Calificación:</strong> ${r.rating} ⭐</p>
      </div>`).join("")}
  `;

  document.getElementById("btn-resena")?.addEventListener("click", async () => {
    const comentario = document.getElementById("input-resena").value.trim();
    const calificacion = parseInt(document.getElementById("input-calificacion").value);
    if (!comentario || isNaN(calificacion)) {
      mostrarAlerta("Debes completar ambos campos", "warning");
      return;
    }

    try {
      const usuario = JSON.parse(localStorage.getItem("usuario"));
      const res = await fetch(`${API_BASE_URL}/property/createReview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: inmuebleId,
          comment: comentario,
          rating: calificacion,
          tenantId: usuario.UserID,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al registrar reseña");
      }

      mostrarAlerta("Reseña enviada", "success");
      location.reload();
    } catch {
      mostrarAlerta("No se pudo registrar la reseña", "error");
    }
  });
}

export function initMapaDesdeAPI(lat, lng) {
  const mapa = new google.maps.Map(document.getElementById("map"), {
    zoom: 15,
    center: { lat, lng },
  });
  new google.maps.Marker({ position: { lat, lng }, map: mapa });
}


// Función para obtener citas desde el backend
async function obtenerCitas() {
  try {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No hay token disponible");

    const response = await fetch(`${API_BASE_URL}/property/getAppointments`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) throw new Error("Error al obtener citas");

    return await response.json();
  } catch (error) {
    console.error("[Citas] Error al obtener citas:", error);
    return [];
  }
}

// Función para responder (aceptar/rechazar) cita
export async function responderCita(appointmentId, status) {
  try {
    const response = await fetch(`${API_BASE_URL}/property/updateAppointment`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ appointmentId, status })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("[Respuesta cita]", result.error);
      return;
    }

    console.log("✅ Respuesta enviada:", result.message);
    mostrarAlerta("Estado actualizado correctamente", "success");

    // Recargar citas
    const citas = await obtenerCitas();
    renderCitas(citas, document.getElementById("contenedor-citas"));
  } catch (error) {
    console.error("[Actualizar cita]", error);
    mostrarAlerta("Error al actualizar la cita", "error");
  }
}

// Función para renderizar las citas en el contenedor
function renderCitas(lista, contenedor) {
  contenedor.innerHTML = "";

  if (!lista.length) {
    contenedor.innerHTML = "<p role='status' aria-live='polite'>No hay citas registradas.</p>";
    return;
  }

  lista.forEach((cita) => {
    const card = document.createElement("article");
    card.classList.add("tarjeta-inmueble");
    card.setAttribute("role", "group");
    card.setAttribute("aria-label", `Cita con ${cita.fullName}`);

    const estadoColor = cita.status === "Accepted" ? "#2e7d32"
                        : cita.status === "Rejected" ? "#d32f2f"
                        : "#8e24aa";

    let botones = "";
    if (cita.status === "Pending") {
      botones = `
        <div style="margin-top: 10px; display: flex; flex-direction: column; gap: 10px;">
          <button 
            onclick="responderCita('${cita.appointmentId}', 'Accepted')" 
            style="background-color: #2e7d32; color: white; font-weight: bold; border: none; padding: 12px; width: 100%; border-radius: 4px; font-size: 16px; cursor: pointer;"
            aria-label="Aceptar cita con ${cita.fullName}">
            Aceptar
          </button>
          <button 
            onclick="responderCita('${cita.appointmentId}', 'Rejected')" 
            style="background-color: #d32f2f; color: white; font-weight: bold; border: none; padding: 12px; width: 100%; border-radius: 4px; font-size: 16px; cursor: pointer;"
            aria-label="Rechazar cita con ${cita.fullName}">
            Rechazar
          </button>
        </div>
      `;
    }

    card.innerHTML = `
      <div class="contenido">
        <h3 id="cita-${cita.appointmentId}">${cita.fullName}</h3>
        <p><strong>Correo:</strong> <a href="mailto:${cita.email}" aria-describedby="cita-${cita.appointmentId}">${cita.email}</a></p>
        <p><strong>Teléfono:</strong> <a href="tel:${cita.phone}">${cita.phone}</a></p>
        <p><strong>Estado:</strong> 
          <span style="color:${estadoColor}; font-weight:bold;" aria-live="polite">${cita.status}</span>
        </p>
        ${cita.responseDate ? `<p><strong>Fecha de respuesta:</strong> ${cita.responseDate.split("T")[0]}</p>` : ""}
        ${cita.visitDate ? `<p><strong>Fecha de visita:</strong> ${cita.visitDate.split("T")[0]}</p>` : ""}
        ${botones}
      </div>
    `;

    contenedor.appendChild(card);
  });
}

window.responderCita = responderCita;

document.addEventListener("DOMContentLoaded", async () => {
  const contenedor = document.getElementById("contenedor-citas");
  if (contenedor) {
    const citas = await obtenerCitas();
    renderCitas(citas, contenedor);
  }
});

document.addEventListener("DOMContentLoaded", async () => {
  const inmueble = await cargarDetallesInmueble();
  if (inmueble?.latitud && inmueble?.longitud) {
    initMapaDesdeAPI(inmueble.latitud, inmueble.longitud);
  }

  document.querySelector(".boton-registrar")?.addEventListener("click", async () => {
    const usuario = JSON.parse(localStorage.getItem("usuario"));
    if (!usuario) return alert("Debes iniciar sesión");

    try {
      const response = await fetch("http://localhost:8085/api/property/createAppointment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: usuario.UserID,
          propertyId: inmueble.id,
          visitDateTime: new Date().toISOString()
        })
      });


      mostrarAlerta("Cita agendada correctamente", "success");
    } catch (error) {
      mostrarAlerta("Error al agendar la cita", "error");
      console.error(error);
    }
  });
});