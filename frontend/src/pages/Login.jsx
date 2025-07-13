import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import styles from '../styles/Login.module.css';

// Configuración de axios para la API
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost/sigaca/backend/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const MySwal = withReactContent(Swal);

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});
  const isMountedRef = useRef(true);
  const navigate = useNavigate();

  // Limpieza al desmontar
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Validación de email
  const validateEmail = useCallback((email) => {
    const regex = /^[a-zA-Z0-9._-]+@(insucodos|comeduc)\.cl$/;
    return regex.test(email);
  }, []);

  // Validación de contraseña
  const validatePassword = useCallback((password) => {
    return password && password.length >= 6;
  }, []);

  // Validación de formulario
  const validateForm = useCallback(() => {
    const newErrors = {};
    
    if (!formData.email.trim()) {
      newErrors.email = 'El correo es requerido';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Debes usar un correo institucional (@insucodos.cl o @comeduc.cl)';
    }

    if (formData.email.endsWith('@comeduc.cl')) {
      if (!formData.password) {
        newErrors.password = 'La contraseña es requerida';
      } else if (!validatePassword(formData.password)) {
        newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, validateEmail, validatePassword]);

  // Manejo de cambios en el formulario
  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value,
    }));
    
    // Limpiar errores cuando el usuario empieza a escribir
    if (errors[id]) {
      setErrors(prev => ({
        ...prev,
        [id]: '',
      }));
    }
  };

  // Manejo de blur para validación
  const handleBlur = (e) => {
    const { id } = e.target;
    setTouchedFields(prev => ({
      ...prev,
      [id]: true,
    }));

    // Validar campo específico al perder el foco
    if (id === 'email' && formData.email && !validateEmail(formData.email)) {
      setErrors(prev => ({
        ...prev,
        email: 'Correo institucional no válido',
      }));
    } else if (id === 'password' && formData.password && !validatePassword(formData.password)) {
      setErrors(prev => ({
        ...prev,
        password: 'La contraseña debe tener al menos 6 caracteres',
      }));
    }
  };

  // Manejo del envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const payload = {
        email: formData.email.trim(),
        password: formData.email.endsWith('@insucodos.cl') ? null : formData.password
      };

      const response = await api.post('/login.php', payload);

      if (!isMountedRef.current) return;

      // Validar respuesta del servidor
      if (!response.data.token || !response.data.user) {
        throw new Error('Respuesta inválida del servidor');
      }

      // Almacenamiento seguro de token y usuario
      localStorage.setItem('sigaca_token', response.data.token);
      localStorage.setItem('sigaca_user', JSON.stringify(response.data.user));

      // Mostrar mensaje de éxito
      await MySwal.fire({
        title: '¡Bienvenido!',
        text: `Hola ${response.data.user.nombre}, accediendo al sistema...`,
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
        background: '#f8fafc',
        color: '#1e293b',
      });

      // Redirección basada en rol
      const redirectPaths = {
        estudiante: '/estudiante',
        profesor: '/profesor',
        inspector: '/inspector',
      };

      const redirectPath = redirectPaths[response.data.user.rol];
      if (!redirectPath) {
        throw new Error('Rol de usuario no válido');
      }

      navigate(redirectPath);

    } catch (error) {
      if (!isMountedRef.current) return;

      console.error('Error de login:', error);
      
      let errorMessage = 'Error al iniciar sesión';
      let errorTitle = 'Error';
      
      if (error.response) {
        switch(error.response.status) {
          case 400:
            errorMessage = error.response.data.message || 'Datos de entrada inválidos';
            errorTitle = 'Datos Incorrectos';
            break;
          case 401:
            errorMessage = 'Credenciales incorrectas. Verifica tu correo y contraseña';
            errorTitle = 'Acceso Denegado';
            break;
          case 403:
            errorMessage = 'Tu cuenta está desactivada. Contacta al administrador';
            errorTitle = 'Cuenta Desactivada';
            break;
          case 404:
            errorMessage = 'Usuario no encontrado en el sistema';
            errorTitle = 'Usuario No Encontrado';
            break;
          case 429:
            errorMessage = 'Demasiados intentos de inicio de sesión. Intenta más tarde';
            errorTitle = 'Límite Excedido';
            break;
          case 500:
            errorMessage = 'Error del servidor. Por favor intenta más tarde';
            errorTitle = 'Error del Servidor';
            break;
          default:
            errorMessage = error.response.data?.message || errorMessage;
        }
      } else if (error.request) {
        errorMessage = 'No se pudo conectar al servidor. Verifica tu conexión a internet';
        errorTitle = 'Sin Conexión';
      } else {
        errorMessage = error.message || errorMessage;
      }

      await MySwal.fire({
        title: errorTitle,
        text: errorMessage,
        icon: 'error',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#667eea',
        allowOutsideClick: false,
        background: '#f8fafc',
        color: '#1e293b',
      });

    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  // Determinar si el botón debe estar habilitado
  const isFormValid = formData.email.trim() && 
    (!formData.email.endsWith('@comeduc.cl') || formData.password) &&
    Object.keys(errors).length === 0;

  // Obtener el tipo de usuario basado en el dominio
  const getUserType = () => {
    if (formData.email.endsWith('@insucodos.cl')) {
      return 'Estudiante';
    } else if (formData.email.endsWith('@comeduc.cl')) {
      return 'Profesor/Inspector';
    }
    return '';
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <div className={styles.loginHeader}>
          <img 
            src="/assets/logo-liceo.png" 
            alt="Logo Liceo" 
            className={styles.logo}
            loading="lazy"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          <h2 className={styles.title}>Sistema SIGACA</h2>
          <p className={styles.subtitle}>Gestión de Atrasos Escolares</p>
          {getUserType() && (
            <div className={styles.userTypeIndicator}>
              <span>Acceso como: {getUserType()}</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className={styles.loginForm} noValidate>
          <div className={styles.formGroup}>
            <label htmlFor="email">
              <span className={styles.labelIcon}>📧</span>
              Correo Institucional
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="usuario@insucodos.cl o usuario@comeduc.cl"
              required
              className={errors.email ? styles.invalid : ''}
              autoComplete="username"
              disabled={loading}
              aria-describedby={errors.email ? 'email-error' : undefined}
            />
            {errors.email && (
              <span id="email-error" className={styles.errorText} role="alert">
                {errors.email}
              </span>
            )}
          </div>

          {formData.email.endsWith('@comeduc.cl') && (
            <div className={`${styles.formGroup} ${styles.passwordGroup}`}>
              <label htmlFor="password">
                <span className={styles.labelIcon}>🔒</span>
                Contraseña
              </label>
              <div className={styles.passwordInputContainer}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Ingresa tu contraseña"
                  required
                  className={errors.password ? styles.invalid : ''}
                  autoComplete="current-password"
                  disabled={loading}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                />
                <button
                  type="button"
                  className={styles.togglePassword}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  disabled={loading}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              {errors.password && (
                <span id="password-error" className={styles.errorText} role="alert">
                  {errors.password}
                </span>
              )}
            </div>
          )}

          <button 
            type="submit" 
            className={styles.loginButton} 
            disabled={loading || !isFormValid}
            aria-busy={loading}
          >
            {loading ? (
              <>
                <span className={styles.spinner} aria-hidden="true"></span> 
                <span>Iniciando sesión...</span>
              </>
            ) : (
              <>
                <span className={styles.buttonIcon}>🚀</span>
                <span>Ingresar</span>
              </>
            )}
          </button>
        </form>

        <div className={styles.loginFooter}>
          <div className={styles.helpSection}>
            <p>¿Problemas para ingresar?</p>
            <p>Contacta al administrador del sistema</p>
          </div>
          <div className={styles.infoSection}>
            <p className={styles.domainInfo}>
              <strong>Estudiantes:</strong> @insucodos.cl (sin contraseña)
            </p>
            <p className={styles.domainInfo}>
              <strong>Profesores:</strong> @comeduc.cl (con contraseña)
            </p>
          </div>
          <p className={styles.versionInfo}>
            SIGACA v2.0 - {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default React.memo(Login);