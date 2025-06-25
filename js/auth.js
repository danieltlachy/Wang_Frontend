import { API_BASE_URL } from "./utils.js";
import { mostrarAlerta } from './utils.js';

//Iniciar sesión
const formLogin = document.getElementById('form-login');
if (formLogin) {
  formLogin.addEventListener('submit', async function (e) {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!email || !password) {
      mostrarAlerta('Por favor completa todos los campos.', 'warning');
      return;
    }

    try {
      console.log(`${API_BASE_URL}/auth/login`);
      const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const loginResult = await loginResponse.json();

      if (!loginResponse.ok) {
        mostrarAlerta(loginResult.error || 'Credenciales inválidas.', 'error');
        return;
      }

      localStorage.setItem('token', loginResult.accessToken);
      localStorage.setItem('refreshToken', loginResult.refreshToken);

      const perfilResponse = await fetch(`${API_BASE_URL}/user/profile?email=${email}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${loginResult.accessToken}`
        }
      });

      const perfilResult = await perfilResponse.json();

      if (!perfilResponse.ok) {
        mostrarAlerta(perfilResult.error || 'No se pudo recuperar el perfil.', 'error');
        return;
      }

      localStorage.setItem('usuario', JSON.stringify({
        UserID: perfilResult.user.UserID,
        FullName: perfilResult.user.FullName,
        Role: perfilResult.user.Role,
        Email: perfilResult.user.Email
      }));
      localStorage.setItem('userId', perfilResult.user.UserID);

      mostrarAlerta('Inicio de sesión exitoso.', 'success');
      setTimeout(() => {
        window.location.href = 'inmuebles.html';
      }, 1000);
    } catch (error) {
      console.error('[Login Error]', error);
      mostrarAlerta('Error de conexión. Intenta más tarde.', 'error');
    }
  });
}