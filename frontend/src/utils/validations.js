// Expresiones regulares para validaciones
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^[0-9+\-\s()]{8,15}$/;
const usernameRegex = /^[a-zA-Z0-9_]+$/;

// Validaciones para el formulario de registro
export const validateRegisterForm = (formData, confirmPassword) => {
  const errors = {};
  
  // Validación de nombre de usuario
  if (!formData.username || formData.username.trim() === '') {
    errors.username = "El nombre de usuario es requerido";
  } else if (formData.username.length < 3) {
    errors.username = "El nombre de usuario debe tener al menos 3 caracteres";
  } else if (formData.username.length > 20) {
    errors.username = "El nombre de usuario no puede tener más de 20 caracteres";
  } else if (!usernameRegex.test(formData.username)) {
    errors.username = "Solo se permiten letras, números y guión bajo (_)";
  }

  // Validación de correo electrónico
  if (!formData.email) {
    errors.email = "El correo electrónico es requerido";
  } else if (!emailRegex.test(formData.email)) {
    errors.email = "Por favor ingresa un correo electrónico válido";
  } else if (formData.email.length > 100) {
    errors.email = "El correo electrónico no puede tener más de 100 caracteres";
  }

  // Validación de contraseña
  if (!formData.password) {
    errors.password = "La contraseña es requerida";
  } else if (formData.password.length < 8) {
    errors.password = "La contraseña debe tener al menos 8 caracteres";
  } else if (formData.password.length > 50) {
    errors.password = "La contraseña no puede tener más de 50 caracteres";
  } else if (!/[A-Z]/.test(formData.password)) {
    errors.password = "La contraseña debe contener al menos una letra mayúscula";
  } else if (!/[0-9]/.test(formData.password)) {
    errors.password = "La contraseña debe contener al menos un número";
  }

  // Validación de confirmación de contraseña
  if (!confirmPassword) {
    errors.confirmPassword = "Por favor confirma tu contraseña";
  } else if (formData.password !== confirmPassword) {
    errors.confirmPassword = "Las contraseñas no coinciden";
  }

  // Validación de nombre completo
  if (!formData.nombre_completo || formData.nombre_completo.trim() === '') {
    errors.nombre_completo = "El nombre completo es requerido";
  } else if (formData.nombre_completo.trim().length < 3) {
    errors.nombre_completo = "El nombre debe tener al menos 3 caracteres";
  } else if (formData.nombre_completo.length > 100) {
    errors.nombre_completo = "El nombre no puede tener más de 100 caracteres";
  }

  // Validación de teléfono (opcional)
  if (formData.telefono && formData.telefono.trim() !== '') {
    if (!phoneRegex.test(formData.telefono)) {
      errors.telefono = "Por favor ingresa un número de teléfono válido";
    } else if (formData.telefono.length > 20) {
      errors.telefono = "El teléfono no puede tener más de 20 caracteres";
    }
  }

  // Validación de dirección (opcional)
  if (formData.direccion && formData.direccion.length > 200) {
    errors.direccion = "La dirección no puede tener más de 200 caracteres";
  }

  return errors;
};

// Función para validación en tiempo real de campos individuales
export const validateField = (name, value, formData = {}) => {
  switch (name) {
    case 'username':
      if (!value || value.trim() === '') return 'El nombre de usuario es requerido';
      if (value.length < 3) return 'El nombre de usuario debe tener al menos 3 caracteres';
      if (value.length > 20) return 'El nombre de usuario no puede tener más de 20 caracteres';
      if (!usernameRegex.test(value)) return 'Solo se permiten letras, números y guión bajo (_)';
      return '';
      
    case 'email':
      if (!value) return 'El correo electrónico es requerido';
      if (!emailRegex.test(value)) return 'Por favor ingresa un correo electrónico válido';
      if (value.length > 100) return 'El correo no puede tener más de 100 caracteres';
      return '';
      
    case 'password':
      if (!value) return 'La contraseña es requerida';
      if (value.length < 8) return 'La contraseña debe tener al menos 8 caracteres';
      if (value.length > 50) return 'La contraseña no puede tener más de 50 caracteres';
      if (!/[A-Z]/.test(value)) return 'La contraseña debe contener al menos una letra mayúscula';
      if (!/[0-9]/.test(value)) return 'La contraseña debe contener al menos un número';
      return '';
      
    case 'confirmPassword':
      if (!value) return 'Por favor confirma tu contraseña';
      if (value !== formData.password) return 'Las contraseñas no coinciden';
      return '';
      
    case 'nombre_completo':
      if (!value || value.trim() === '') return 'El nombre completo es requerido';
      if (value.trim().length < 3) return 'El nombre debe tener al menos 3 caracteres';
      if (value.length > 100) return 'El nombre no puede tener más de 100 caracteres';
      return '';
      
    case 'telefono':
      if (value && value.trim() !== '') {
        if (!phoneRegex.test(value)) return 'Por favor ingresa un número de teléfono válido';
        if (value.length > 20) return 'El teléfono no puede tener más de 20 caracteres';
      }
      return '';
      
    case 'direccion':
      if (value && value.length > 200) return 'La dirección no puede tener más de 200 caracteres';
      return '';
      
    default:
      return '';
  }
};

// Validaciones para el formulario de inicio de sesión
export const validateLoginForm = (formData) => {
  const errors = {};

  if (!formData.username || formData.username.trim() === '') {
    errors.username = 'El nombre de usuario es requerido';
  }

  if (!formData.password) {
    errors.password = 'La contraseña es requerida';
  }

  return errors;
};

// Validaciones para el formulario del carrito
export const validateCartForm = (formData) => {
  const errors = {};

  if (!formData.direccion_entrega || formData.direccion_entrega.trim() === '') {
    errors.direccion_entrega = 'La dirección de entrega es requerida';
  }

  if (!formData.metodo_pago) {
    errors.metodo_pago = 'Por favor selecciona un método de pago';
  }

  return errors;
};
