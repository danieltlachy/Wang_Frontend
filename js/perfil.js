import { API_BASE_URL } from "./utils.js";
import { mostrarAlerta } from "./utils.js";
const backendBase = "http://localhost:8085";

// Registro de nuevo usuario
const formRegistro = document.getElementById("form-registro");
formRegistro?.addEventListener("submit", async function (e) {
  e.preventDefault();

  const nombreCompleto = document.getElementById("nombre").value.trim();
  const telefono = document.getElementById("telefono").value.trim();
  const direccion = document.getElementById("direccion").value.trim();
  const rol = document.getElementById("rol").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (
    !nombreCompleto ||
    !telefono ||
    !direccion ||
    !rol ||
    !email ||
    !password
  ) {
    mostrarAlerta("Todos los campos son obligatorios", "warning");
    return;
  }

  const partesNombre = nombreCompleto.split(" ");
  const name = partesNombre[0];
  const lastname = partesNombre.slice(1).join(" ") || "Apellido";

  const userName = email.split("@")[0];

  const formData = new FormData();
  formData.append("name", name);
  formData.append("lastname", lastname);
  formData.append("userName", userName);
  formData.append("phone", telefono);
  formData.append("address", direccion);
  formData.append("role", rol);
  formData.append("email", email);
  formData.append("password", password);

  try {
    const response = await fetch(`${API_BASE_URL}/user/register`, {
      method: "POST",
      body: formData,
    });

    const result = await response.json();
    if (!response.ok) {
      mostrarAlerta(result.error || "Error en el registro", "error");
      return;
    }

    mostrarAlerta("Usuario registrado exitosamente", "success");
    setTimeout(() => {
      window.location.href = "index.html";
    }, 1500);
  } catch (error) {
    console.error(error);
    mostrarAlerta("Error de conexión con el servidor", "error");
  }
});

// Cambio de contraseña
const formReset = document.getElementById("form-password-reset");
formReset?.addEventListener("submit", async function (e) {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const newPassword = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirm-password").value;

  if (!email || !newPassword || !confirmPassword) {
    mostrarAlerta("Todos los campos son obligatorios", "warning");
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/user/changePassword`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, newPassword, confirmPassword }),
    });

    const result = await response.json();

    if (!response.ok) {
      mostrarAlerta(result.error || "Error al cambiar la contraseña", "error");
      return;
    }

    mostrarAlerta(
      result.message || "Contraseña actualizada exitosamente",
      "success"
    );
    setTimeout(() => {
      window.location.href = "index.html";
    }, 1500);
  } catch (error) {
    console.error(error);
    mostrarAlerta("Error de conexión con el servidor", "error");
  }
});

// Cargar inmuebles del usuario
document.addEventListener("DOMContentLoaded", async () => {
  const contenedor = document.getElementById("contenedor-inmuebles");
  if (!contenedor) return;

  const usuario = JSON.parse(localStorage.getItem("usuario"));
  if (!usuario?.UserID || !usuario?.Role) {
    mostrarAlerta("No se pudo obtener la información del usuario.", "error");
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/property/getProperties`);
    if (!response.ok) throw new Error("Error al obtener inmuebles");

    const inmuebles = await response.json();

    // ✅ Filtrar los inmuebles cuyo OwnerID coincida con el usuario actual
    const propios = inmuebles.filter(i => i.OwnerID === usuario.UserID);
    contenedor.innerHTML = "";

    propios.forEach((inmueble) => {
      const tarjeta = document.createElement("div");
      tarjeta.className = "tarjeta-inmueble";

      const imageUrl = inmueble.ImageURL
        ? "http://localhost:8085" + inmueble.ImageURL
        : "assets/stockhouse.png";

      tarjeta.innerHTML = `
        <img src="${imageUrl}" alt="Imagen del inmueble" />
        <div class="contenido">
          <h3>${inmueble.Title}</h3>
          <p class="precio">$${parseFloat(inmueble.Price).toLocaleString("es-MX")} MXN</p>
          <p class="direccion">${inmueble.Address}</p>
          <button class="boton-registrar" onclick="redirigir('${inmueble.PropertyID}')">
            Modificar
          </button>
        </div>
      `;
      contenedor.appendChild(tarjeta);
    });
  } catch (error) {
    console.error(error);
    mostrarAlerta("No se pudieron cargar los inmuebles", "error");
  }
});

// función para redirigir
window.redirigir = function (propertyId) {
  localStorage.setItem("inmuebleEditar", propertyId);
  window.location.href = "publicar.html";
};

// Modificar cuenta
document.addEventListener("DOMContentLoaded", async () => {
  const formModificar = document.getElementById("form-modificar");
  if (!formModificar) return;

  const usuario = JSON.parse(localStorage.getItem("usuario"));
  const token = localStorage.getItem("token");

  if (!usuario || !usuario.Email || !token) {
    mostrarAlerta("Debe iniciar sesión para modificar su cuenta", "error");
    window.location.href = "index.html";
    return;
  }

  try {
    const perfilResponse = await fetch(
      `${API_BASE_URL}/user/profile?email=${usuario.Email}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const result = await perfilResponse.json();

    if (!perfilResponse.ok) {
      mostrarAlerta(result.error || "No se pudo cargar el perfil", "error");
      return;
    }

    const user = result.user;
    document.getElementById("nombre").value = user.FullName || "";
    document.getElementById("telefono").value = user.Phone || "";
    document.getElementById("direccion").value = user.Address || "";
    document.getElementById("rol").value =
      user.Role?.toLowerCase() === "landlord" ? "arrendador" : "arrendatario";
    document.getElementById("email").value = user.Email || "";
    document.getElementById("password").value = "********"; // solo visual

    if (user.ProfileImageUrl) {
      const preview = document.getElementById("preview-imagen");
      const img = document.createElement("img");
      img.src = user.ProfileImageUrl ? `${backendBase}${user.ProfileImageUrl}` : "assets/stockhouse.png";
      img.classList.add("preview-image");
      preview.appendChild(img);
    }

    document.getElementById("imagen")?.addEventListener("change", function () {
      const preview = document.getElementById("preview-imagen");
      preview.innerHTML = "";
      const file = this.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = document.createElement("img");
          img.src = e.target.result;
          img.classList.add("preview-image");
          preview.appendChild(img);
        };
        reader.readAsDataURL(file);
      }
    });
  } catch (error) {
    console.error(error);
    mostrarAlerta("Error al cargar datos del perfil", "error");
  }

  formModificar.addEventListener("submit", async function (e) {
    e.preventDefault();

    const fullName = document.getElementById("nombre").value.trim();
    const phone = document.getElementById("telefono").value.trim();
    const address = document.getElementById("direccion").value.trim();

    if (!fullName || !phone || !address) {
      mostrarAlerta(
        "¡Hay campos vacíos! Complételos para continuar",
        "warning"
      );
      return;
    }

    const email = document.getElementById("email").value.trim();
    const imagen = document.getElementById("imagen").files[0];

    try {
      const formData = new FormData();
      formData.append("fullName", fullName);
      formData.append("phone", phone);
      formData.append("address", address);
      formData.append("email", email);
      if (imagen) formData.append("imagen", imagen);

      const response = await fetch(`${API_BASE_URL}/user/updateProfile`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          // No pongas Content-Type con FormData
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        mostrarAlerta(
          result.error || "No se pudo actualizar la cuenta",
          "error"
        );
        return;
      }

      mostrarAlerta(
        result.message || "Cuenta actualizada correctamente",
        "success"
      );

      // Actualizar localStorage
      const updatedUser = {
        ...usuario,
        FullName: fullName,
        Phone: phone,
        Address: address,
      };
      localStorage.setItem("usuario", JSON.stringify(updatedUser));

      setTimeout(() => (window.location.href = "cuenta.html"), 1500);
    } catch (error) {
      console.error(error);
      mostrarAlerta("Error de conexión", "error");
    }
  });
});