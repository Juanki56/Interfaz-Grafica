// Utilidad para decodificar JWT tokens y ver su contenido
export const decodeJWT = (token: string): any => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decodificando token:', error);
    return null;
  }
};

// Función para mostrar el contenido del token en consola
export const debugToken = (): void => {
  const token = localStorage.getItem('token');
  if (!token) {
    console.warn('⚠️ No hay token en localStorage');
    return;
  }

  const payload = decodeJWT(token);
  console.log('🔍 Contenido del token JWT:', payload);
  console.log('👤 Usuario ID:', payload?.id || payload?.usuario_id);
  console.log('🎭 Rol en el token:', payload?.rol);
  console.log('📧 Email:', payload?.correo || payload?.email);
  console.log('⏰ Expira:', payload?.exp ? new Date(payload.exp * 1000).toLocaleString() : 'N/A');
};
