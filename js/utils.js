export const API_BASE_URL = "http://localhost:8085/api";

export function mostrarAlerta(mensaje, tipo = 'info') {
  const div = document.createElement('div');
  div.classList.add('alerta', tipo);
  div.textContent = mensaje;

  document.body.appendChild(div);

  setTimeout(() => {
    div.remove();
  }, 3000);
}

export function verificarAutenticacion() {
  const token = localStorage.getItem('token');
  if (!token) {
    mostrarAlerta('Debes iniciar sesión para continuar.', 'warning');
    setTimeout(() => window.location.href = 'index.html', 1500);
  }
}