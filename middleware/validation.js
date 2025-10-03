/**
 * Middleware de Validación para PsiquiApp
 * Utiliza express-validator para validar datos de entrada
 */

const { body, param, query, validationResult } = require('express-validator');

/**
 * Middleware para manejar errores de validación
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Errores de validación',
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

/**
 * Validaciones para PACIENTES
 */
const validatePaciente = [
  body('nombre')
    .trim()
    .notEmpty().withMessage('El nombre es requerido')
    .isLength({ min: 2, max: 100 }).withMessage('Nombre debe tener entre 2 y 100 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/).withMessage('Nombre solo puede contener letras'),
  
  body('apellido')
    .trim()
    .notEmpty().withMessage('El apellido es requerido')
    .isLength({ min: 2, max: 100 }).withMessage('Apellido debe tener entre 2 y 100 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/).withMessage('Apellido solo puede contener letras'),
  
  body('email')
    .optional({ checkFalsy: true })
    .isEmail().withMessage('Email inválido')
    .normalizeEmail(),
  
  body('fecha_nacimiento')
    .optional({ checkFalsy: true })
    .isDate().withMessage('Fecha de nacimiento inválida')
    .custom((value) => {
      const birthDate = new Date(value);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 0 || age > 120) {
        throw new Error('Fecha de nacimiento no válida');
      }
      if (birthDate > today) {
        throw new Error('La fecha de nacimiento no puede ser futura');
      }
      return true;
    }),
  
  body('telefono')
    .optional({ checkFalsy: true })
    .matches(/^[0-9\-\+\(\)\s]+$/).withMessage('Teléfono inválido'),
  
  body('genero')
    .optional()
    .isIn(['M', 'F', 'Otro']).withMessage('Género inválido'),
  
  handleValidationErrors
];

/**
 * Validaciones para CITAS
 */
const validateCita = [
  body('paciente_id')
    .isInt({ min: 1 }).withMessage('ID de paciente inválido'),
  
  body('fecha_cita')
    .isDate().withMessage('Fecha de cita inválida')
    .custom((value) => {
      const date = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date < today) {
        throw new Error('La fecha de cita no puede ser en el pasado');
      }
      // No permitir citas con más de 1 año de anticipación
      const oneYearLater = new Date();
      oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
      if (date > oneYearLater) {
        throw new Error('La fecha de cita no puede ser mayor a 1 año');
      }
      return true;
    }),
  
  body('hora_cita')
    .matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/).withMessage('Hora inválida (formato HH:mm o HH:mm:ss)'),
  
  body('duracion_minutos')
    .optional()
    .isInt({ min: 15, max: 240 }).withMessage('Duración debe estar entre 15 y 240 minutos'),
  
  body('tipo')
    .isIn(['Primera vez', 'Seguimiento', 'Terapia', 'Evaluacion', 'Urgencia'])
    .withMessage('Tipo de cita inválido'),
  
  body('estado')
    .optional()
    .isIn(['Programada', 'Confirmada', 'En curso', 'Completada', 'Cancelada', 'No asistio'])
    .withMessage('Estado de cita inválido'),
  
  handleValidationErrors
];

/**
 * Validaciones para CONSULTAS
 */
const validateConsulta = [
  body('paciente_id')
    .isInt({ min: 1 }).withMessage('ID de paciente inválido'),
  
  body('cita_id')
    .optional({ nullable: true })
    .isInt({ min: 1 }).withMessage('ID de cita inválido'),
  
  body('motivo_consulta')
    .trim()
    .notEmpty().withMessage('El motivo de consulta es requerido')
    .isLength({ min: 10, max: 5000 }).withMessage('Motivo debe tener entre 10 y 5000 caracteres'),
  
  body('diagnostico')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 5000 }).withMessage('Diagnóstico muy largo'),
  
  body('tratamiento')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 5000 }).withMessage('Tratamiento muy largo'),
  
  body('tipo')
    .isIn(['Primera vez', 'Seguimiento', 'Crisis', 'Alta'])
    .withMessage('Tipo de consulta inválido'),
  
  body('nivel_riesgo')
    .optional()
    .isIn(['Bajo', 'Medio', 'Alto'])
    .withMessage('Nivel de riesgo inválido'),
  
  handleValidationErrors
];

/**
 * Validaciones para RECETAS
 */
const validateReceta = [
  body('paciente_id')
    .isInt({ min: 1 }).withMessage('ID de paciente inválido'),
  
  body('consulta_id')
    .optional({ nullable: true })
    .isInt({ min: 1 }).withMessage('ID de consulta inválido'),
  
  body('medicamentos')
    .notEmpty().withMessage('Debe especificar al menos un medicamento')
    .custom((value) => {
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          if (!Array.isArray(parsed) || parsed.length === 0) {
            throw new Error('Medicamentos debe ser un array no vacío');
          }
        } catch (e) {
          throw new Error('Formato de medicamentos inválido');
        }
      } else if (!Array.isArray(value) || value.length === 0) {
        throw new Error('Debe incluir al menos un medicamento');
      }
      return true;
    }),
  
  body('indicaciones_generales')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 5000 }).withMessage('Indicaciones muy largas'),
  
  handleValidationErrors
];

/**
 * Validaciones para TESTS PSICOLÓGICOS
 */
const validateTest = [
  body('paciente_id')
    .isInt({ min: 1 }).withMessage('ID de paciente inválido'),
  
  body('test_type')
    .isIn(['PHQ-9', 'GAD-7', 'BDI-II', 'BAI', 'AUDIT', 'CAGE', 'MINI'])
    .withMessage('Tipo de test inválido'),
  
  body('responses')
    .notEmpty().withMessage('Las respuestas son requeridas')
    .custom((value) => {
      if (typeof value === 'string') {
        try {
          JSON.parse(value);
        } catch (e) {
          throw new Error('Formato de respuestas inválido');
        }
      } else if (typeof value !== 'object') {
        throw new Error('Las respuestas deben ser un objeto');
      }
      return true;
    }),
  
  body('score')
    .isInt({ min: 0 }).withMessage('Puntaje inválido'),
  
  body('interpretation')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 1000 }).withMessage('Interpretación muy larga'),
  
  handleValidationErrors
];

/**
 * Validación de parámetros ID
 */
const validateId = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID inválido'),
  
  handleValidationErrors
];

/**
 * Validación para login
 */
const validateLogin = [
  body('email')
    .isEmail().withMessage('Email inválido')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('La contraseña es requerida')
    .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  
  handleValidationErrors
];

/**
 * Validación para búsqueda
 */
const validateSearch = [
  query('search')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Búsqueda debe tener entre 2 y 100 caracteres'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Límite debe estar entre 1 y 100'),
  
  handleValidationErrors
];

module.exports = {
  validatePaciente,
  validateCita,
  validateConsulta,
  validateReceta,
  validateTest,
  validateId,
  validateLogin,
  validateSearch,
  handleValidationErrors
};
