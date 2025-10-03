const express = require('express');
const mysql = require('mysql2');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const path = require('path');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
// Puerto configurable desde variable de entorno
const PORT = process.env.PORT || 3000;

// Configuración de rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 500, // máximo 500 requests por ventana de tiempo (aumentado para desarrollo)
  message: 'Demasiadas peticiones desde esta IP, por favor intenta de nuevo más tarde.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip rate limiting for static files
  skip: (req) => {
    return req.path.startsWith('/css/') || 
           req.path.startsWith('/js/') || 
           req.path.startsWith('/images/') ||
           req.path.endsWith('.css') ||
           req.path.endsWith('.js') ||
           req.path.endsWith('.png') ||
           req.path.endsWith('.jpg') ||
           req.path.endsWith('.ico');
  }
});

// Middlewares
app.use(limiter);

// Middleware para forzar HTTPS en producción (cumplimiento HIPAA)
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && req.header('x-forwarded-proto') !== 'https') {
    return res.redirect(`https://${req.header('host')}${req.url}`);
  }
  next();
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Configuración de sesiones
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production', // seguro en producción
    httpOnly: true, // prevenir acceso desde JavaScript del cliente
    maxAge: 4 * 60 * 60 * 1000 // 4 horas (más apropiado para aplicaciones médicas)
  }
}));

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'psiquiapp_db',
  port: process.env.DB_PORT || 3306,
  connectTimeout: 10000,
  acquireTimeout: 10000,
  timeout: 10000
};

console.log('🔗 Intentando conectar con:', {
  host: dbConfig.host,
  user: dbConfig.user,
  database: dbConfig.database,
  port: dbConfig.port,
  hasPassword: !!dbConfig.password
});

const db = mysql.createConnection(dbConfig);

// Conectar a la base de datos
db.connect((err) => {
  if (err) {
    console.error('❌ Error conectando a la base de datos:', err.message);
    console.log('');
    console.log('🔧 Posibles soluciones:');
    console.log('1. Verifica que MySQL esté ejecutándose');
    console.log('2. Confirma las credenciales en el archivo .env');
    console.log('3. Asegúrate de que la base de datos "psiquiapp_db" existe');
    console.log('4. Verifica que el usuario tenga permisos');
    console.log('');
    console.log('📋 Configuración actual:');
    console.log(`   Host: ${dbConfig.host}`);
    console.log(`   Usuario: ${dbConfig.user}`);
    console.log(`   Base de datos: ${dbConfig.database}`);
    console.log(`   Puerto: ${dbConfig.port}`);
    console.log(`   Contraseña configurada: ${dbConfig.password ? 'Sí' : 'No'}`);
    console.log('');
    
    // Intentar conexión sin especificar base de datos
    console.log('🔄 Intentando conexión sin especificar base de datos...');
    const dbTestConfig = { ...dbConfig };
    delete dbTestConfig.database;
    
    const testDb = mysql.createConnection(dbTestConfig);
    testDb.connect((testErr) => {
      if (testErr) {
        console.error('❌ Error de autenticación MySQL:', testErr.message);
        console.log('💡 Sugiere revisar usuario y contraseña de MySQL');
      } else {
        console.log('✅ Autenticación MySQL exitosa, pero la base de datos no existe');
        console.log('💡 Ejecuta el script database_setup.sql para crear la base de datos');
        testDb.end();
      }
    });
    
    return;
  }
  console.log('✅ Conectado a la base de datos MySQL - psiquiapp_db');
});

// Función de auditoría HIPAA para acceso a PHI (Protected Health Information)
const auditLogger = (action, userId, patientId, details, req) => {
  const auditData = {
    timestamp: new Date().toISOString(),
    action: action,
    userId: userId,
    patientId: patientId,
    details: details,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent') || 'Unknown',
    sessionId: req.sessionID
  };
  
  // Log a archivo (en producción usar un sistema de logging más robusto)
  console.log('AUDIT:', JSON.stringify(auditData));
  
  // Opcional: guardar en tabla de auditoría en la BD
  // db.query('INSERT INTO audit_log (action, user_id, patient_id, details, ip, timestamp) VALUES (?, ?, ?, ?, ?, ?)', 
  //          [action, userId, patientId, details, req.ip, new Date()]);
};

// Middleware para verificar autenticación
const requireAuth = (req, res, next) => {
  if (req.session && req.session.doctorId) {
    return next();
  } else {
    return res.status(401).json({ error: 'No autorizado' });
  }
};

// Middleware para verificar si es administrador
const requireAdmin = (req, res, next) => {
  if (!req.session || !req.session.doctorId) {
    return res.status(401).json({ success: false, message: 'No autenticado' });
  }

  db.query('SELECT is_admin FROM doctores WHERE id = ?', [req.session.doctorId], (err, results) => {
    if (err) {
      console.error('Error al verificar permisos:', err);
      return res.status(500).json({ success: false, message: 'Error al verificar permisos' });
    }

    if (results.length === 0 || !results[0].is_admin) {
      return res.status(403).json({ success: false, message: 'Acceso denegado. Solo administradores.' });
    }

    next();
  });
};

// Middleware para verificar si el doctor puede modificar (no está suspendido)
const requireActiveDoctor = (req, res, next) => {
  if (!req.session || !req.session.doctorId) {
    return res.status(401).json({ success: false, message: 'No autenticado' });
  }

  db.query('SELECT activo, is_admin FROM doctores WHERE id = ?', [req.session.doctorId], (err, results) => {
    if (err) {
      console.error('Error al verificar estado:', err);
      return res.status(500).json({ success: false, message: 'Error al verificar permisos' });
    }

    if (results.length === 0) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    // El admin siempre puede modificar
    if (results[0].is_admin) {
      return next();
    }

    // Si el doctor está suspendido (activo = false), no puede modificar
    if (!results[0].activo) {
      return res.status(403).json({ 
        success: false, 
        message: 'Cuenta suspendida. Solo puede visualizar información, no puede realizar modificaciones.',
        suspended: true
      });
    }

    next();
  });
};

// Rutas principales
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/dashboard', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/pacientes', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pacientes.html'));
});

app.get('/consultas', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'consultas.html'));
});

app.get('/recetas', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'recetas.html'));
});

app.get('/tests', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'tests.html'));
});

app.get('/dsm5', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dsm5.html'));
});

app.get('/cie10', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'cie10.html'));
});

// API de autenticación
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son requeridos' });
  }

  try {
    // Primero verificar si el email existe
    db.query('SELECT * FROM doctores WHERE email = ?', [email], async (err, results) => {
      if (err) {
        console.error('Error en consulta:', err);
        return res.status(500).json({ error: 'Error interno del servidor' });
      }

      if (results.length === 0) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      const doctor = results[0];

      // Verificar si la cuenta está suspendida (no activa)
      // Nota: Los doctores suspendidos SÍ pueden iniciar sesión pero con permisos de solo lectura
      const isSuspended = !doctor.activo && !doctor.is_admin;
      
      // Verificar contraseña
      const passwordMatch = await bcrypt.compare(password, doctor.password_hash);
      
      if (!passwordMatch) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      // Crear sesión
      req.session.doctorId = doctor.id;
      req.session.doctorName = `${doctor.nombre} ${doctor.apellido}`;
      req.session.doctorEmail = doctor.email;
      req.session.isAdmin = doctor.is_admin || false;
      req.session.isSuspended = isSuspended;

      res.json({ 
        success: true, 
        message: isSuspended ? 'Sesión iniciada. Cuenta suspendida: solo lectura.' : 'Login exitoso',
        suspended: isSuspended,
        doctor: {
          id: doctor.id,
          nombre: doctor.nombre,
          apellido: doctor.apellido,
          email: doctor.email,
          especialidad: doctor.especialidad,
          is_admin: doctor.is_admin || false,
          suspended: isSuspended
        }
      });
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Error al cerrar sesión' });
    }
    res.json({ success: true, message: 'Sesión cerrada correctamente' });
  });
});

// API para obtener información del doctor actual
app.get('/api/doctor/profile', requireAuth, (req, res) => {
  const doctorId = req.session.doctorId;
  
  db.query('SELECT id, email, nombre, apellido, especialidad, numero_licencia, telefono, direccion, biografia, avatar_url, is_admin FROM doctores WHERE id = ?', [doctorId], (err, results) => {
    if (err) {
      console.error('Error al obtener perfil:', err);
      return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ success: false, message: 'Doctor no encontrado' });
    }
    
    res.json({ success: true, doctor: results[0] });
  });
});

// API para actualizar perfil del doctor
app.put('/api/doctor/profile', requireAuth, requireActiveDoctor, (req, res) => {
  const doctorId = req.session.doctorId;
  const {
    nombre,
    apellido,
    telefono,
    especialidad,
    numero_licencia,
    direccion,
    biografia
  } = req.body;

  // Validaciones básicas
  if (!nombre || !apellido) {
    return res.status(400).json({
      success: false,
      message: 'Nombre y apellido son obligatorios'
    });
  }

  const query = `
    UPDATE doctores 
    SET nombre = ?, apellido = ?, telefono = ?, especialidad = ?, 
        numero_licencia = ?, direccion = ?, biografia = ?
    WHERE id = ?
  `;

  db.query(
    query,
    [nombre, apellido, telefono, especialidad, numero_licencia, direccion, biografia, doctorId],
    (err, result) => {
      if (err) {
        console.error('Error al actualizar perfil:', err);
        return res.status(500).json({
          success: false,
          message: 'Error al actualizar el perfil'
        });
      }

      res.json({
        success: true,
        message: 'Perfil actualizado exitosamente'
      });
    }
  );
});

// API para cambiar contraseña
app.post('/api/doctor/change-password', requireAuth, requireActiveDoctor, async (req, res) => {
  const doctorId = req.session.doctorId;
  const { currentPassword, newPassword } = req.body;

  // Validaciones
  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Debe proporcionar la contraseña actual y la nueva contraseña'
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'La nueva contraseña debe tener al menos 6 caracteres'
    });
  }

  try {
    // Obtener la contraseña actual del doctor
    db.query('SELECT password_hash FROM doctores WHERE id = ?', [doctorId], async (err, results) => {
      if (err) {
        console.error('Error al verificar contraseña:', err);
        return res.status(500).json({
          success: false,
          message: 'Error al verificar la contraseña'
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Doctor no encontrado'
        });
      }

      // Verificar contraseña actual
      const isValidPassword = await bcrypt.compare(currentPassword, results[0].password_hash);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'La contraseña actual es incorrecta'
        });
      }

      // Hash de la nueva contraseña
      const newPasswordHash = await bcrypt.hash(newPassword, 10);

      // Actualizar contraseña
      db.query('UPDATE doctores SET password_hash = ? WHERE id = ?', [newPasswordHash, doctorId], (err) => {
        if (err) {
          console.error('Error al actualizar contraseña:', err);
          return res.status(500).json({
            success: false,
            message: 'Error al actualizar la contraseña'
          });
        }

        res.json({
          success: true,
          message: 'Contraseña actualizada exitosamente'
        });
      });
    });
  } catch (error) {
    console.error('Error en cambio de contraseña:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar la contraseña'
    });
  }
});

// =====================================================
// ENDPOINTS DE ADMINISTRACIÓN
// =====================================================

// Obtener todos los doctores (solo admin)
app.get('/api/admin/doctors', requireAdmin, (req, res) => {
  const query = `
    SELECT id, email, nombre, apellido, especialidad, numero_licencia, 
           telefono, direccion, activo, is_admin, created_at
    FROM doctores
    ORDER BY nombre, apellido
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error al obtener doctores:', err);
      return res.status(500).json({
        success: false,
        message: 'Error al obtener la lista de doctores'
      });
    }

    res.json({
      success: true,
      doctors: results
    });
  });
});

// Crear nuevo doctor (solo admin)
app.post('/api/admin/doctors', requireAdmin, async (req, res) => {
  const {
    nombre,
    apellido,
    email,
    password,
    especialidad,
    numero_licencia,
    telefono,
    direccion,
    activo
  } = req.body;

  // Validaciones
  if (!nombre || !apellido || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Nombre, apellido, email y contraseña son obligatorios'
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'La contraseña debe tener al menos 6 caracteres'
    });
  }

  try {
    // Verificar si el email ya existe
    db.query('SELECT id FROM doctores WHERE email = ?', [email], async (err, results) => {
      if (err) {
        console.error('Error al verificar email:', err);
        return res.status(500).json({
          success: false,
          message: 'Error al verificar disponibilidad del email'
        });
      }

      if (results.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'El email ya está registrado'
        });
      }

      // Hash de la contraseña
      const passwordHash = await bcrypt.hash(password, 10);

      // Insertar nuevo doctor
      const query = `
        INSERT INTO doctores 
        (email, password_hash, nombre, apellido, especialidad, numero_licencia, 
         telefono, direccion, activo, is_admin)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, FALSE)
      `;

      db.query(
        query,
        [email, passwordHash, nombre, apellido, especialidad, numero_licencia, 
         telefono, direccion, activo !== false],
        (err, result) => {
          if (err) {
            console.error('Error al crear doctor:', err);
            return res.status(500).json({
              success: false,
              message: 'Error al crear la cuenta del doctor'
            });
          }

          res.json({
            success: true,
            message: 'Doctor creado exitosamente',
            doctorId: result.insertId
          });
        }
      );
    });
  } catch (error) {
    console.error('Error al crear doctor:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear la cuenta'
    });
  }
});

// Cambiar estado de un doctor (solo admin)
app.put('/api/admin/doctors/:id/status', requireAdmin, (req, res) => {
  const doctorId = req.params.id;
  const { activo } = req.body;
  const adminId = req.session.doctorId;

  // No permitir que el admin se desactive a sí mismo
  if (parseInt(doctorId) === parseInt(adminId)) {
    return res.status(400).json({
      success: false,
      message: 'No puedes cambiar el estado de tu propia cuenta'
    });
  }

  // Verificar que no es otra cuenta admin
  db.query('SELECT is_admin FROM doctores WHERE id = ?', [doctorId], (err, results) => {
    if (err) {
      console.error('Error al verificar doctor:', err);
      return res.status(500).json({
        success: false,
        message: 'Error al verificar cuenta'
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Doctor no encontrado'
      });
    }

    if (results[0].is_admin) {
      return res.status(403).json({
        success: false,
        message: 'No puedes modificar cuentas de administrador'
      });
    }

    // Actualizar estado
    db.query(
      'UPDATE doctores SET activo = ? WHERE id = ?',
      [activo, doctorId],
      (err) => {
        if (err) {
          console.error('Error al actualizar estado:', err);
          return res.status(500).json({
            success: false,
            message: 'Error al actualizar estado'
          });
        }

        res.json({
          success: true,
          message: `Cuenta ${activo ? 'activada' : 'desactivada'} exitosamente`
        });
      }
    );
  });
});

// Eliminar doctor (solo admin)
app.delete('/api/admin/doctors/:id', requireAdmin, (req, res) => {
  const doctorId = req.params.id;
  const adminId = req.session.doctorId;

  // No permitir que el admin se elimine a sí mismo
  if (parseInt(doctorId) === parseInt(adminId)) {
    return res.status(400).json({
      success: false,
      message: 'No puedes eliminar tu propia cuenta'
    });
  }

  // Verificar que no es otra cuenta admin
  db.query('SELECT is_admin FROM doctores WHERE id = ?', [doctorId], (err, results) => {
    if (err) {
      console.error('Error al verificar doctor:', err);
      return res.status(500).json({
        success: false,
        message: 'Error al verificar cuenta'
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Doctor no encontrado'
      });
    }

    if (results[0].is_admin) {
      return res.status(403).json({
        success: false,
        message: 'No puedes eliminar cuentas de administrador'
      });
    }

    // Eliminar doctor (CASCADE eliminará pacientes y consultas relacionadas)
    db.query('DELETE FROM doctores WHERE id = ?', [doctorId], (err) => {
      if (err) {
        console.error('Error al eliminar doctor:', err);
        return res.status(500).json({
          success: false,
          message: 'Error al eliminar la cuenta'
        });
      }

      res.json({
        success: true,
        message: 'Doctor eliminado exitosamente'
      });
    });
  });
});

// API de pacientes
app.get('/api/pacientes', requireAuth, (req, res) => {
  const doctorId = req.session.doctorId;
  
  // Auditoría HIPAA: acceso a lista de pacientes
  auditLogger('ACCESS_PATIENT_LIST', doctorId, null, 'Doctor accessed patient list', req);
  
  db.query('SELECT * FROM pacientes WHERE doctor_id = ? ORDER BY apellido, nombre', [doctorId], (err, results) => {
    if (err) {
      console.error('Error al obtener pacientes:', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
    res.json({ pacientes: results });
  });
});

// API para pacientes recientes (DEBE IR ANTES del endpoint con :id)
app.get('/api/pacientes/recientes', requireAuth, (req, res) => {
  const doctorId = req.session.doctorId;
  
  const query = `
    SELECT id, nombre, apellido, created_at as fecha_registro
    FROM pacientes
    WHERE doctor_id = ?
    ORDER BY created_at DESC
    LIMIT 5
  `;
  
  db.query(query, [doctorId], (err, results) => {
    if (err) {
      console.error('Error al obtener pacientes recientes:', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
    
    console.log(`👥 Pacientes recientes encontrados para doctor ${doctorId}:`, results.length);
    if (results.length > 0) {
      results.forEach(p => console.log(`   - ${p.nombre} ${p.apellido} (${p.fecha_registro})`));
    }
    
    res.json({ pacientes: results });
  });
});

// Crear nuevo paciente
app.post('/api/pacientes', requireAuth, requireActiveDoctor, (req, res) => {
  const doctorId = req.session.doctorId;
  const {
    nombre,
    apellido,
    email,
    telefono,
    fecha_nacimiento,
    genero,
    direccion,
    contacto_emergencia_nombre,
    contacto_emergencia_telefono,
    informacion_seguro,
    notas_generales
  } = req.body;

  // Validaciones básicas
  if (!nombre || !apellido) {
    return res.status(400).json({ 
      success: false, 
      message: 'Nombre y apellido son obligatorios' 
    });
  }

  const insertQuery = `
    INSERT INTO pacientes (
      doctor_id, nombre, apellido, email, telefono, fecha_nacimiento, genero,
      direccion, contacto_emergencia_nombre, contacto_emergencia_telefono,
      informacion_seguro, notas_generales
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    doctorId, nombre, apellido, email || null, telefono || null,
    fecha_nacimiento || null, genero || 'M', direccion || null,
    contacto_emergencia_nombre || null, contacto_emergencia_telefono || null,
    informacion_seguro || null, notas_generales || null
  ];

  db.query(insertQuery, values, (err, result) => {
    if (err) {
      console.error('Error al crear paciente:', err);
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un paciente con ese email'
        });
      }
      return res.status(500).json({ 
        success: false, 
        message: 'Error interno del servidor' 
      });
    }

    // Auditoría HIPAA: creación de paciente
    auditLogger('CREATE_PATIENT', doctorId, result.insertId, `Patient created: ${nombre} ${apellido}`, req);

    res.status(201).json({
      success: true,
      message: 'Paciente creado exitosamente',
      pacienteId: result.insertId
    });
  });
});

// Obtener paciente específico
app.get('/api/pacientes/:id', requireAuth, (req, res) => {
  const doctorId = req.session.doctorId;
  const pacienteId = req.params.id;

  // Auditoría HIPAA: acceso a datos específicos de paciente
  auditLogger('ACCESS_PATIENT_DETAILS', doctorId, pacienteId, 'Doctor accessed patient details', req);

  const query = 'SELECT * FROM pacientes WHERE id = ? AND doctor_id = ?';
  
  db.query(query, [pacienteId, doctorId], (err, results) => {
    if (err) {
      console.error('Error al obtener paciente:', err);
      return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ success: false, message: 'Paciente no encontrado' });
    }
    
    res.json({ success: true, paciente: results[0] });
  });
});

// Actualizar paciente
app.put('/api/pacientes/:id', requireAuth, requireActiveDoctor, (req, res) => {
  const doctorId = req.session.doctorId;
  const pacienteId = req.params.id;
  const {
    nombre,
    apellido,
    email,
    telefono,
    fecha_nacimiento,
    genero,
    direccion,
    contacto_emergencia_nombre,
    contacto_emergencia_telefono,
    informacion_seguro,
    notas_generales
  } = req.body;

  // Validaciones básicas
  if (!nombre || !apellido) {
    return res.status(400).json({ 
      success: false, 
      message: 'Nombre y apellido son obligatorios' 
    });
  }

  const updateQuery = `
    UPDATE pacientes SET 
      nombre = ?, apellido = ?, email = ?, telefono = ?, fecha_nacimiento = ?,
      genero = ?, direccion = ?, contacto_emergencia_nombre = ?, 
      contacto_emergencia_telefono = ?, informacion_seguro = ?, notas_generales = ?
    WHERE id = ? AND doctor_id = ?
  `;

  const values = [
    nombre, apellido, email || null, telefono || null, fecha_nacimiento || null,
    genero || 'M', direccion || null, contacto_emergencia_nombre || null,
    contacto_emergencia_telefono || null, informacion_seguro || null,
    notas_generales || null, pacienteId, doctorId
  ];

  db.query(updateQuery, values, (err, result) => {
    if (err) {
      console.error('Error al actualizar paciente:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Error interno del servidor' 
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Paciente no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Paciente actualizado exitosamente'
    });
  });
});

// Eliminar paciente
app.delete('/api/pacientes/:id', requireAuth, requireActiveDoctor, (req, res) => {
  const doctorId = req.session.doctorId;
  const pacienteId = req.params.id;

  // Verificar que el paciente pertenece al doctor
  const checkQuery = 'SELECT id FROM pacientes WHERE id = ? AND doctor_id = ?';
  
  db.query(checkQuery, [pacienteId, doctorId], (err, results) => {
    if (err) {
      console.error('Error al verificar paciente:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Error interno del servidor' 
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Paciente no encontrado'
      });
    }

    // Eliminar paciente (las claves foráneas deberían manejar las dependencias)
    const deleteQuery = 'DELETE FROM pacientes WHERE id = ? AND doctor_id = ?';
    
    db.query(deleteQuery, [pacienteId, doctorId], (err, result) => {
      if (err) {
        console.error('Error al eliminar paciente:', err);
        return res.status(500).json({ 
          success: false, 
          message: 'Error al eliminar paciente. Verifique que no tenga citas o consultas activas.' 
        });
      }

      res.json({
        success: true,
        message: 'Paciente eliminado exitosamente'
      });
    });
  });
});

// API para estadísticas del dashboard
app.get('/api/stats', requireAuth, (req, res) => {
  const doctorId = req.session.doctorId;
  
  Promise.all([
    // Contar pacientes
    new Promise((resolve, reject) => {
      db.query('SELECT COUNT(*) as count FROM pacientes WHERE doctor_id = ?', [doctorId], (err, results) => {
        if (err) reject(err);
        else resolve(results[0].count);
      });
    }),
    
    // Contar citas de hoy
    new Promise((resolve, reject) => {
      db.query('SELECT COUNT(*) as count FROM citas WHERE doctor_id = ? AND DATE(fecha_cita) = CURDATE()', [doctorId], (err, results) => {
        if (err) reject(err);
        else resolve(results[0].count);
      });
    }),
    
    // Contar consultas del mes
    new Promise((resolve, reject) => {
      db.query('SELECT COUNT(*) as count FROM consultas WHERE doctor_id = ? AND MONTH(fecha_consulta) = MONTH(CURDATE()) AND YEAR(fecha_consulta) = YEAR(CURDATE())', [doctorId], (err, results) => {
        if (err) reject(err);
        else resolve(results[0].count);
      });
    }),
    
    // Contar recetas activas
    new Promise((resolve, reject) => {
      db.query('SELECT COUNT(*) as count FROM recetas WHERE doctor_id = ? AND estado = "Activa"', [doctorId], (err, results) => {
        if (err) reject(err);
        else resolve(results[0].count);
      });
    })
  ])
  .then(([pacientes, citasHoy, consultasMes, recetasActivas]) => {
    res.json({
      pacientes,
      citas_hoy: citasHoy,
      consultas_mes: consultasMes,
      recetas_activas: recetasActivas
    });
  })
  .catch(error => {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  });
});

// API para citas próximas
app.get('/api/citas/proximas', requireAuth, (req, res) => {
  const doctorId = req.session.doctorId;
  
  const query = `
    SELECT 
      c.*, 
      p.nombre as paciente_nombre, 
      p.apellido as paciente_apellido
    FROM citas c
    JOIN pacientes p ON c.paciente_id = p.id
    WHERE c.doctor_id = ? 
    AND c.fecha_cita >= CURDATE()
    ORDER BY c.fecha_cita ASC, c.hora_cita ASC
    LIMIT 5
  `;
  
  db.query(query, [doctorId], (err, results) => {
    if (err) {
      console.error('Error al obtener citas próximas:', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
    
    console.log(`📅 Citas próximas encontradas para doctor ${doctorId}:`, results.length);
    
    // Combinar fecha y hora para crear fecha_hora
    const citas = results.map(cita => {
      const fecha_hora = new Date(`${cita.fecha_cita.toISOString().split('T')[0]}T${cita.hora_cita}`);
      console.log(`📅 Cita: ${cita.paciente_nombre} ${cita.paciente_apellido} - ${fecha_hora}`);
      return {
        ...cita,
        fecha_hora: fecha_hora
      };
    });
    
    res.json({ citas });
  });
});

// API para verificar autenticación
app.get('/api/auth/check', requireAuth, (req, res) => {
  res.json({
    authenticated: true,
    user: {
      id: req.session.doctorId,
      nombre: req.session.doctorName,
      email: req.session.doctorEmail
    }
  });
});

// API para logout
app.post('/api/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Error al cerrar sesión' });
    }
    res.json({ success: true, message: 'Sesión cerrada correctamente' });
  });
});

// API de citas
app.get('/api/citas', requireAuth, (req, res) => {
  const doctorId = req.session.doctorId;
  
  const query = `
    SELECT c.*, p.nombre as paciente_nombre, p.apellido as paciente_apellido 
    FROM citas c 
    JOIN pacientes p ON c.paciente_id = p.id 
    WHERE c.doctor_id = ? 
    ORDER BY c.fecha_cita DESC, c.hora_cita DESC
  `;
  
  db.query(query, [doctorId], (err, results) => {
    if (err) {
      console.error('Error al obtener citas:', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
    res.json({ citas: results });
  });
});

// Crear nueva cita
app.post('/api/citas', requireAuth, requireActiveDoctor, (req, res) => {
  const doctorId = req.session.doctorId;
  const {
    paciente_id,
    fecha_cita,
    hora_cita,
    tipo,
    estado,
    notas
  } = req.body;

  if (!paciente_id || !fecha_cita || !hora_cita) {
    return res.status(400).json({ 
      success: false, 
      message: 'Paciente, fecha y hora son obligatorios' 
    });
  }

  const insertQuery = `
    INSERT INTO citas (
      doctor_id, paciente_id, fecha_cita, hora_cita, tipo, estado, notas
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    doctorId, paciente_id, fecha_cita, hora_cita,
    tipo || 'Primera vez', estado || 'Pendiente', notas || ''
  ];

  db.query(insertQuery, values, (err, result) => {
    if (err) {
      console.error('Error al crear cita:', err);
      return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }

    auditLogger('CREATE_APPOINTMENT', doctorId, result.insertId, `Cita creada para paciente ${paciente_id}`, req);
    res.status(201).json({ success: true, message: 'Cita creada exitosamente', citaId: result.insertId });
  });
});

// Actualizar cita
app.put('/api/citas/:id', requireAuth, requireActiveDoctor, (req, res) => {
  const doctorId = req.session.doctorId;
  const { id } = req.params;
  const { paciente_id, fecha_cita, hora_cita, tipo, estado, notas } = req.body;

  const updateQuery = `
    UPDATE citas 
    SET paciente_id = ?, fecha_cita = ?, hora_cita = ?, tipo = ?, estado = ?, notas = ?
    WHERE id = ? AND doctor_id = ?
  `;

  db.query(updateQuery, [paciente_id, fecha_cita, hora_cita, tipo, estado, notas || '', id, doctorId], (err, result) => {
    if (err) {
      console.error('Error al actualizar cita:', err);
      return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Cita no encontrada' });
    }

    auditLogger('UPDATE_APPOINTMENT', doctorId, id, 'Cita actualizada', req);
    res.json({ success: true, message: 'Cita actualizada exitosamente' });
  });
});

// Eliminar cita
app.delete('/api/citas/:id', requireAuth, requireActiveDoctor, (req, res) => {
  const doctorId = req.session.doctorId;
  const { id } = req.params;

  db.query('DELETE FROM citas WHERE id = ? AND doctor_id = ?', [id, doctorId], (err, result) => {
    if (err) {
      console.error('Error al eliminar cita:', err);
      return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Cita no encontrada' });
    }

    auditLogger('DELETE_APPOINTMENT', doctorId, id, 'Cita eliminada', req);
    res.json({ success: true, message: 'Cita eliminada exitosamente' });
  });
});

// API de consultas
app.get('/api/consultas', requireAuth, (req, res) => {
  const doctorId = req.session.doctorId;
  
  const query = `
    SELECT c.*, p.nombre as paciente_nombre, p.apellido as paciente_apellido 
    FROM consultas c 
    JOIN pacientes p ON c.paciente_id = p.id 
    WHERE c.doctor_id = ? 
    ORDER BY c.fecha_consulta DESC, c.hora_consulta DESC
  `;
  
  db.query(query, [doctorId], (err, results) => {
    if (err) {
      console.error('Error al obtener consultas:', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
    res.json({ consultas: results });
  });
});

// Crear nueva consulta
app.post('/api/consultas', requireAuth, requireActiveDoctor, (req, res) => {
  const doctorId = req.session.doctorId;
  const {
    paciente_id,
    fecha_hora,
    tipo,
    duracion,
    estado,
    motivo,
    notas
  } = req.body;

  // Validaciones básicas
  if (!paciente_id || !fecha_hora) {
    return res.status(400).json({ 
      success: false, 
      message: 'Paciente y fecha/hora son obligatorios' 
    });
  }

  // Separar fecha y hora del datetime
  const fechaHora = new Date(fecha_hora);
  const fecha_consulta = fechaHora.toISOString().split('T')[0];
  const hora_consulta = fechaHora.toTimeString().split(' ')[0];

  const insertQuery = `
    INSERT INTO consultas (
      cita_id, doctor_id, paciente_id, fecha_consulta, hora_consulta, duracion_minutos,
      tipo, motivo_consulta, observaciones
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    null, // cita_id es NULL para consultas directas
    doctorId, 
    paciente_id, 
    fecha_consulta, 
    hora_consulta, 
    duracion || 60,
    tipo || 'Seguimiento', 
    motivo || '', 
    notas || ''
  ];

  db.query(insertQuery, values, (err, result) => {
    if (err) {
      console.error('Error al crear consulta:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Error interno del servidor' 
      });
    }

    // Auditoría HIPAA: creación de consulta
    auditLogger('CREATE_CONSULTATION', doctorId, result.insertId, `Consultation created for patient ${paciente_id}`, req);

    res.status(201).json({
      success: true,
      message: 'Consulta creada exitosamente',
      consultaId: result.insertId
    });
  });
});

// Obtener una consulta específica por ID
app.get('/api/consultas/:id', requireAuth, (req, res) => {
  const doctorId = req.session.doctorId;
  const { id } = req.params;

  const query = `
    SELECT c.*, 
           p.nombre as paciente_nombre, 
           p.apellido as paciente_apellido,
           CONCAT(p.nombre, ' ', p.apellido) as paciente_nombre_completo
    FROM consultas c
    LEFT JOIN pacientes p ON c.paciente_id = p.id
    WHERE c.id = ? AND c.doctor_id = ?
  `;

  db.query(query, [id, doctorId], (err, results) => {
    if (err) {
      console.error('Error al obtener consulta:', err);
      return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }

    if (results.length === 0) {
      return res.status(404).json({ success: false, message: 'Consulta no encontrada' });
    }

    res.json({ success: true, consulta: results[0] });
  });
});

// Actualizar consulta
app.put('/api/consultas/:id', requireAuth, requireActiveDoctor, (req, res) => {
  const doctorId = req.session.doctorId;
  const { id } = req.params;
  const {
    fecha_consulta, hora_consulta, duracion_minutos, tipo,
    motivo_consulta, observaciones
  } = req.body;

  // Validación básica
  if (!fecha_consulta || !hora_consulta) {
    return res.status(400).json({ 
      success: false, 
      message: 'Fecha y hora son obligatorios' 
    });
  }

  const updateQuery = `
    UPDATE consultas 
    SET fecha_consulta = ?, hora_consulta = ?, duracion_minutos = ?, tipo = ?, 
        motivo_consulta = ?, observaciones = ?
    WHERE id = ? AND doctor_id = ?
  `;

  const values = [
    fecha_consulta,
    hora_consulta,
    duracion_minutos || 60,
    tipo || 'Seguimiento',
    motivo_consulta || '',
    observaciones || '',
    id,
    doctorId
  ];

  db.query(updateQuery, values, (err, result) => {
    if (err) {
      console.error('Error al actualizar consulta:', err);
      return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Consulta no encontrada' });
    }

    auditLogger('UPDATE_CONSULTATION', doctorId, id, 'Consulta actualizada', req);
    res.json({ success: true, message: 'Consulta actualizada exitosamente' });
  });
});

// Eliminar consulta
app.delete('/api/consultas/:id', requireAuth, requireActiveDoctor, (req, res) => {
  const doctorId = req.session.doctorId;
  const { id } = req.params;

  db.query('DELETE FROM consultas WHERE id = ? AND doctor_id = ?', [id, doctorId], (err, result) => {
    if (err) {
      console.error('Error al eliminar consulta:', err);
      return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Consulta no encontrada' });
    }

    auditLogger('DELETE_CONSULTATION', doctorId, id, 'Consulta eliminada', req);
    res.json({ success: true, message: 'Consulta eliminada exitosamente' });
  });
});

// API de recetas
app.get('/api/recetas', requireAuth, (req, res) => {
  const doctorId = req.session.doctorId;
  
  const query = `
    SELECT r.*, p.nombre as paciente_nombre, p.apellido as paciente_apellido 
    FROM recetas r 
    JOIN pacientes p ON r.paciente_id = p.id 
    WHERE r.doctor_id = ? 
    ORDER BY r.fecha_receta DESC
  `;
  
  db.query(query, [doctorId], (err, results) => {
    if (err) {
      console.error('Error al obtener recetas:', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
    res.json({ recetas: results });
  });
});

// Crear nueva receta
app.post('/api/recetas', requireAuth, requireActiveDoctor, (req, res) => {
  const doctorId = req.session.doctorId;
  const {
    paciente_id,
    fecha_prescripcion,
    medicamento,
    dosis,
    frecuencia,
    duracion,
    cantidad,
    instrucciones,
    notas,
    estado
  } = req.body;

  // Validaciones básicas
  if (!paciente_id || !fecha_prescripcion || !medicamento || !dosis || !frecuencia) {
    return res.status(400).json({ 
      success: false, 
      message: 'Paciente, fecha, medicamento, dosis y frecuencia son obligatorios' 
    });
  }

  // Combinar información del medicamento en un solo campo TEXT
  const medicamentos = `${medicamento} - ${dosis} - ${frecuencia}` + 
                       (duracion ? ` - Duración: ${duracion} días` : '') +
                       (cantidad ? ` - Cantidad: ${cantidad}` : '');

  const insertQuery = `
    INSERT INTO recetas (
      doctor_id, paciente_id, consulta_id, fecha_receta, medicamentos,
      instrucciones_generales, notas_doctor, estado
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    doctorId,
    paciente_id,
    null, // consulta_id es NULL para recetas directas
    fecha_prescripcion,
    medicamentos,
    instrucciones || null,
    notas || null,
    estado || 'Activa'
  ];

  db.query(insertQuery, values, (err, result) => {
    if (err) {
      console.error('Error al crear receta:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Error interno del servidor' 
      });
    }

    // Auditoría HIPAA: creación de receta
    auditLogger('CREATE_PRESCRIPTION', doctorId, result.insertId, `Prescription created for patient ${paciente_id}`, req);

    res.status(201).json({
      success: true,
      message: 'Receta creada exitosamente',
      recetaId: result.insertId
    });
  });
});

// Obtener una receta específica por ID
app.get('/api/recetas/:id', requireAuth, (req, res) => {
  const doctorId = req.session.doctorId;
  const { id } = req.params;

  const query = `
    SELECT r.*, 
           p.nombre as paciente_nombre, 
           p.apellido as paciente_apellido,
           CONCAT(p.nombre, ' ', p.apellido) as paciente_nombre_completo
    FROM recetas r
    LEFT JOIN pacientes p ON r.paciente_id = p.id
    WHERE r.id = ? AND r.doctor_id = ?
  `;

  db.query(query, [id, doctorId], (err, results) => {
    if (err) {
      console.error('Error al obtener receta:', err);
      return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }

    if (results.length === 0) {
      return res.status(404).json({ success: false, message: 'Receta no encontrada' });
    }

    res.json({ success: true, receta: results[0] });
  });
});

// Actualizar receta
app.put('/api/recetas/:id', requireAuth, requireActiveDoctor, (req, res) => {
  const doctorId = req.session.doctorId;
  const { id } = req.params;
  const {
    fecha_receta, medicamentos, instrucciones_generales, notas_doctor, estado
  } = req.body;

  // Validación básica
  if (!fecha_receta || !medicamentos) {
    return res.status(400).json({ 
      success: false, 
      message: 'Fecha y medicamentos son obligatorios' 
    });
  }

  const updateQuery = `
    UPDATE recetas 
    SET fecha_receta = ?, medicamentos = ?, 
        instrucciones_generales = ?, notas_doctor = ?, estado = ?
    WHERE id = ? AND doctor_id = ?
  `;

  const values = [
    fecha_receta,
    medicamentos,
    instrucciones_generales || null,
    notas_doctor || null,
    estado || 'Activa',
    id,
    doctorId
  ];

  db.query(updateQuery, values, (err, result) => {
    if (err) {
      console.error('Error al actualizar receta:', err);
      return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Receta no encontrada' });
    }

    auditLogger('UPDATE_PRESCRIPTION', doctorId, id, 'Receta actualizada', req);
    res.json({ success: true, message: 'Receta actualizada exitosamente' });
  });
});

// Eliminar receta
app.delete('/api/recetas/:id', requireAuth, requireActiveDoctor, (req, res) => {
  const doctorId = req.session.doctorId;
  const { id } = req.params;

  db.query('DELETE FROM recetas WHERE id = ? AND doctor_id = ?', [id, doctorId], (err, result) => {
    if (err) {
      console.error('Error al eliminar receta:', err);
      return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Receta no encontrada' });
    }

    auditLogger('DELETE_PRESCRIPTION', doctorId, id, 'Receta eliminada', req);
    res.json({ success: true, message: 'Receta eliminada exitosamente' });
  });
});


// ==============================================
// API de tests psicológicos
// ==============================================

// Obtener todos los tests
app.get('/api/tests', requireAuth, (req, res) => {
  const doctorId = req.session.doctorId;
  
  const query = `
    SELECT t.*, p.nombre as paciente_nombre, p.apellido as paciente_apellido 
    FROM tests_psicologicos t 
    JOIN pacientes p ON t.paciente_id = p.id 
    WHERE t.doctor_id = ? 
    ORDER BY t.fecha_aplicacion DESC
  `;
  
  db.query(query, [doctorId], (err, results) => {
    if (err) {
      console.error('Error al obtener tests:', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
    res.json({ tests: results });
  });
});

// Guardar resultado de test psicológico
app.post('/api/tests/submit', requireAuth, requireActiveDoctor, (req, res) => {
  const doctorId = req.session.doctorId;
  const { paciente_id, test_type, responses, score, interpretation, consulta_id } = req.body;

  // Validar datos requeridos
  if (!paciente_id || !test_type || !responses || score === undefined) {
    return res.status(400).json({
      success: false,
      message: 'Datos incompletos. Se requiere: paciente_id, test_type, responses y score'
    });
  }

  const query = `
    INSERT INTO tests_psicologicos (
      doctor_id, paciente_id, consulta_id, nombre_test, 
      fecha_aplicacion, puntaje_obtenido, resultado, interpretacion
    ) VALUES (?, ?, ?, ?, CURDATE(), ?, ?, ?)
  `;

  const responsesStr = typeof responses === 'string' ? responses : JSON.stringify(responses);
  const values = [
    doctorId, 
    paciente_id, 
    consulta_id || null, 
    test_type, 
    score, 
    responsesStr, 
    interpretation || ''
  ];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error('Error guardando test:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Error al guardar el test',
        error: err.message 
      });
    }
    
    console.log(`✅ Test ${test_type} guardado para paciente ${paciente_id}, ID: ${result.insertId}`);
    
    res.json({ 
      success: true, 
      message: 'Test guardado exitosamente', 
      testId: result.insertId 
    });
  });
});

// Obtener tests de un paciente específico
app.get('/api/tests/results/:pacienteId', requireAuth, (req, res) => {
  const doctorId = req.session.doctorId;
  const { pacienteId } = req.params;

  const query = `
    SELECT 
      tp.*,
      CONCAT(p.nombre, ' ', p.apellido) as paciente_nombre
    FROM tests_psicologicos tp
    INNER JOIN pacientes p ON tp.paciente_id = p.id
    WHERE tp.paciente_id = ? AND tp.doctor_id = ?
    ORDER BY tp.fecha_aplicacion DESC
  `;

  db.query(query, [pacienteId, doctorId], (err, results) => {
    if (err) {
      console.error('Error obteniendo tests del paciente:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Error al obtener los tests',
        error: err.message 
      });
    }

    // Parsear las respuestas JSON
    const testsWithParsedResponses = results.map(test => ({
      ...test,
      responses: test.resultado ? JSON.parse(test.resultado) : null
    }));

    res.json({ 
      success: true, 
      data: testsWithParsedResponses, 
      count: results.length 
    });
  });
});

// Obtener historial de un tipo específico de test
app.get('/api/tests/history/:pacienteId/:testType', requireAuth, (req, res) => {
  const doctorId = req.session.doctorId;
  const { pacienteId, testType } = req.params;

  const query = `
    SELECT tp.*
    FROM tests_psicologicos tp
    WHERE tp.paciente_id = ? AND tp.doctor_id = ? AND tp.nombre_test = ?
    ORDER BY tp.fecha_aplicacion ASC
  `;

  db.query(query, [pacienteId, doctorId, testType], (err, results) => {
    if (err) {
      console.error('Error obteniendo historial de tests:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Error al obtener el historial',
        error: err.message 
      });
    }

    const history = results.map(test => ({
      ...test,
      responses: test.resultado ? JSON.parse(test.resultado) : null
    }));

    // Preparar datos para gráfica de evolución
    const chartData = {
      labels: history.map(t => {
        const fecha = new Date(t.fecha_aplicacion);
        return fecha.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
      }),
      scores: history.map(t => t.puntaje_obtenido)
    };

    res.json({ 
      success: true, 
      data: history, 
      count: results.length,
      chartData 
    });
  });
});

// Obtener un test específico por ID
app.get('/api/tests/:testId', requireAuth, (req, res) => {
  const doctorId = req.session.doctorId;
  const { testId } = req.params;

  const query = `
    SELECT 
      tp.*,
      CONCAT(p.nombre, ' ', p.apellido) as paciente_nombre,
      p.id as paciente_id
    FROM tests_psicologicos tp
    INNER JOIN pacientes p ON tp.paciente_id = p.id
    WHERE tp.id = ? AND tp.doctor_id = ?
  `;

  db.query(query, [testId, doctorId], (err, results) => {
    if (err) {
      console.error('Error obteniendo test:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Error al obtener el test',
        error: err.message 
      });
    }

    if (results.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Test no encontrado' 
      });
    }

    const test = results[0];
    test.responses = test.resultado ? JSON.parse(test.resultado) : null;

    res.json({ success: true, data: test });
  });
});

// Eliminar un test psicológico
app.delete('/api/tests/:testId', requireAuth, requireActiveDoctor, (req, res) => {
  const doctorId = req.session.doctorId;
  const { testId } = req.params;

  const query = 'DELETE FROM tests_psicologicos WHERE id = ? AND doctor_id = ?';
  
  db.query(query, [testId, doctorId], (err, result) => {
    if (err) {
      console.error('Error eliminando test:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Error al eliminar el test',
        error: err.message 
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Test no encontrado o no autorizado' 
      });
    }

    console.log(`🗑️ Test ${testId} eliminado exitosamente`);
    
    res.json({ 
      success: true, 
      message: 'Test eliminado exitosamente' 
    });
  });
});

// Obtener estadísticas de tests por tipo
app.get('/api/tests/stats/:testType', requireAuth, (req, res) => {
  const doctorId = req.session.doctorId;
  const { testType } = req.params;

  const query = `
    SELECT 
      COUNT(*) as total_aplicados,
      AVG(puntaje_obtenido) as promedio_puntaje,
      MIN(puntaje_obtenido) as puntaje_minimo,
      MAX(puntaje_obtenido) as puntaje_maximo
    FROM tests_psicologicos
    WHERE doctor_id = ? AND nombre_test = ?
  `;

  db.query(query, [doctorId, testType], (err, results) => {
    if (err) {
      console.error('Error obteniendo estadísticas:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Error al obtener estadísticas',
        error: err.message 
      });
    }

    res.json({ 
      success: true, 
      data: results[0] 
    });
  });
});

// ==============================================
// Endpoint temporal para crear datos de prueba
// ==============================================
app.post('/api/seed-data', requireAuth, requireActiveDoctor, (req, res) => {
  const doctorId = req.session.doctorId;
  
  console.log(`🌱 Creando datos de prueba para doctor ${doctorId}...`);
  
  // Verificar si ya existen datos de prueba
  const checkQuery = 'SELECT COUNT(*) as count FROM pacientes WHERE doctor_id = ? AND email LIKE "%@test.com"';
  
  db.query(checkQuery, [doctorId], (err, results) => {
    if (err) {
      console.error('Error verificando datos existentes:', err);
      return res.status(500).json({ success: false, message: 'Error verificando datos' });
    }
    
    const existingCount = results[0].count;
    
    // Si ya existen datos de prueba, informar al usuario
    if (existingCount > 0) {
      console.log(`⚠️ Ya existen ${existingCount} pacientes de prueba para este doctor`);
      return res.json({
        success: false,
        message: `Ya existen ${existingCount} pacientes de prueba. Para evitar duplicados, elimínalos manualmente antes de crear nuevos datos.`,
        existingCount: existingCount,
        alreadyExists: true
      });
    }
    
    // Si no existen, proceder a crear datos de prueba
    console.log('✅ No hay datos de prueba existentes. Procediendo a crearlos...');
    crearDatosPrueba();
  });
  
  function crearDatosPrueba() {
    // Datos de pacientes de prueba
    const pacientes = [
      {
        nombre: 'Juan Carlos',
        apellido: 'Pérez García',
        email: 'juan.perez@test.com',
        telefono: '555-1234',
        fecha_nacimiento: '1985-04-15',
        genero: 'M',
        direccion: 'Av. Reforma 123, Col. Centro',
        notas_generales: 'Paciente cooperativo, primera vez en tratamiento'
      },
      {
        nombre: 'María Elena',
        apellido: 'González Ruiz',
        email: 'maria.gonzalez@test.com',
        telefono: '555-2345',
        fecha_nacimiento: '1990-08-22',
        genero: 'F',
        direccion: 'Calle Insurgentes 456, Col. Roma',
        notas_generales: 'Historial de ansiedad, responde bien a terapia'
      },
      {
        nombre: 'Carlos Alberto',
        apellido: 'Martínez Silva',
        email: 'carlos.martinez@test.com',
        telefono: '555-3456',
        fecha_nacimiento: '1978-12-03',
        genero: 'M',
        direccion: 'Av. Universidad 789, Col. Doctores',
        notas_generales: 'Derivado por médico familiar'
      },
      {
        nombre: 'Ana Sofía',
        apellido: 'López Torres',
        email: 'ana.lopez@test.com',
        telefono: '555-4567',
        fecha_nacimiento: '1995-06-18',
        genero: 'F',
        direccion: 'Calle Morelos 321, Col. Centro',
        notas_generales: 'Paciente nueva, primera consulta'
      }
    ];
    
    // Insertar pacientes (verificando duplicados)
    const insertPromises = pacientes.map((paciente, index) => {
      return new Promise((resolve, reject) => {
        // Primero verificar si existe
        const checkQuery = 'SELECT id FROM pacientes WHERE doctor_id = ? AND email = ?';
        db.query(checkQuery, [doctorId, paciente.email], (checkErr, checkResults) => {
          if (checkErr) {
            console.error(`Error verificando paciente ${paciente.nombre}:`, checkErr);
            reject(checkErr);
            return;
          }
          
          if (checkResults.length > 0) {
            console.log(`⚠️ Paciente ${paciente.nombre} ya existe (ID: ${checkResults[0].id})`);
            resolve(checkResults[0].id);
            return;
          }
          
          // Si no existe, crear
          const query = `
            INSERT INTO pacientes (
              doctor_id, nombre, apellido, email, telefono, fecha_nacimiento, genero,
              direccion, notas_generales
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;
          
          const values = [
            doctorId, paciente.nombre, paciente.apellido, paciente.email,
            paciente.telefono, paciente.fecha_nacimiento, paciente.genero,
            paciente.direccion, paciente.notas_generales
          ];
          
          db.query(query, values, (err, result) => {
            if (err) {
              console.error(`Error creando paciente ${paciente.nombre}:`, err);
              reject(err);
            } else {
              console.log(`✅ Paciente creado: ${paciente.nombre} ${paciente.apellido} (ID: ${result.insertId})`);
              resolve(result.insertId);
            }
          });
        });
      });
    });
  
    Promise.all(insertPromises)
      .then(pacienteIds => {
        console.log(`✅ ${pacienteIds.length} pacientes procesados exitosamente`);
        
        // Crear citas para los pacientes
        const citasPromises = [];
        
        // Cita para hoy
        citasPromises.push(new Promise((resolve, reject) => {
          const query = `
            INSERT INTO citas (doctor_id, paciente_id, fecha_cita, hora_cita, duracion_minutos, tipo, estado, notas)
            VALUES (?, ?, CURDATE(), '10:00:00', 60, 'Primera vez', 'Programada', 'Evaluación inicial')
          `;
          db.query(query, [doctorId, pacienteIds[0]], (err) => {
            if (err) reject(err);
            else {
              console.log('✅ Cita creada para hoy');
              resolve();
            }
          });
        }));
        
        // Cita para mañana
        citasPromises.push(new Promise((resolve, reject) => {
          const query = `
            INSERT INTO citas (doctor_id, paciente_id, fecha_cita, hora_cita, duracion_minutos, tipo, estado, notas)
            VALUES (?, ?, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '11:30:00', 45, 'Seguimiento', 'Programada', 'Control mensual')
          `;
          db.query(query, [doctorId, pacienteIds[1]], (err) => {
            if (err) reject(err);
            else {
              console.log('✅ Cita creada para mañana');
              resolve();
            }
          });
        }));
        
        // Cita para la próxima semana
        citasPromises.push(new Promise((resolve, reject) => {
          const query = `
            INSERT INTO citas (doctor_id, paciente_id, fecha_cita, hora_cita, duracion_minutos, tipo, estado, notas)
            VALUES (?, ?, DATE_ADD(CURDATE(), INTERVAL 7 DAY), '09:00:00', 45, 'Seguimiento', 'Programada', 'Revisión de tratamiento')
          `;
          db.query(query, [doctorId, pacienteIds[2]], (err) => {
            if (err) reject(err);
            else {
              console.log('✅ Cita creada para próxima semana');
              resolve();
            }
          });
        }));
        
        return Promise.all(citasPromises);
      })
      .then(() => {
        console.log('🎉 Datos de prueba creados exitosamente');
        res.json({
          success: true,
          message: 'Datos de prueba creados exitosamente',
          detalles: {
            pacientes: 4,
            citas: 3
          }
        });
      })
      .catch(error => {
        console.error('❌ Error creando datos de prueba:', error);
        res.status(500).json({
          success: false,
          message: 'Error al crear datos de prueba',
          error: error.message
        });
      });
  }
});

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor PsiquiApp ejecutándose en http://localhost:${PORT}`);
  console.log(`📊 Dashboard disponible en http://localhost:${PORT}/dashboard`);
  console.log(`🔐 Login disponible en http://localhost:${PORT}/login`);
});

module.exports = app;
