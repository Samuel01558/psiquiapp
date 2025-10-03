/**
 * Script de inicialización de datos para PsiquiApp
 * Inserta datos de prueba en la base de datos
 */

const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const connection = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'psiquiapp_db',
  port: process.env.DB_PORT || 3306
});

const seedData = async () => {
  console.log('🌱 Iniciando seed de datos de prueba para PsiquiApp...');
  console.log('📊 Base de datos:', process.env.DB_NAME || 'psiquiapp_db');
  
  try {
    // Verificar conexión
    await connection.promise().execute('SELECT 1');
    console.log('✅ Conexión a base de datos establecida');

    // 1. Insertar doctores/usuarios administrativos
    console.log('\n👨‍⚕️ Insertando usuarios médicos...');
    
    const adminPassword = await bcrypt.hash('admin123', 12);
    const doctorPassword = await bcrypt.hash('doctor123', 12);
    
    const usuarios = [
      ['admin', 'admin@psiquiapp.local', adminPassword, 'Dr. Administrador', 'Sistema', 'admin'],
      ['doctor1', 'dr.garcia@psiquiapp.local', doctorPassword, 'Dr. Juan Carlos', 'García López', 'doctor'],
      ['doctor2', 'dra.martinez@psiquiapp.local', doctorPassword, 'Dra. Ana María', 'Martínez Silva', 'doctor']
    ];
    
    for (const [username, email, password, nombre, apellido, role] of usuarios) {
      try {
        await connection.promise().execute(
          `INSERT IGNORE INTO usuarios (username, email, password, nombre, apellido, role, activo, fecha_registro) 
           VALUES (?, ?, ?, ?, ?, ?, 1, NOW())`,
          [username, email, password, nombre, apellido, role]
        );
        console.log(`   ✅ Usuario creado: ${email}`);
      } catch (err) {
        console.log(`   ⚠️  Usuario ya existe: ${email}`);
      }
    }

    // 2. Insertar pacientes de prueba
    console.log('\n👥 Insertando pacientes de prueba...');
    
    const pacientes = [
      ['Juan Carlos', 'Pérez García', 'juan.perez@email.com', '555-0123', '1985-03-15', 'Masculino', 'Calle Real 123, Ciudad', 'María Pérez', '555-0124'],
      ['María Elena', 'González Ruiz', 'maria.gonzalez@email.com', '555-0125', '1990-07-22', 'Femenino', 'Av. Central 456, Ciudad', 'Pedro González', '555-0126'],
      ['Luis Antonio', 'Rodríguez López', 'luis.rodriguez@email.com', '555-0127', '1978-11-08', 'Masculino', 'Plaza Mayor 789, Ciudad', 'Carmen López', '555-0128'],
      ['Ana Isabel', 'Fernández Morales', 'ana.fernandez@email.com', '555-0129', '1992-05-14', 'Femenino', 'Calle Nueva 321, Ciudad', 'José Fernández', '555-0130'],
      ['Carlos Eduardo', 'Sánchez Vargas', 'carlos.sanchez@email.com', '555-0131', '1987-09-30', 'Masculino', 'Av. Libertad 654, Ciudad', 'Rosa Vargas', '555-0132']
    ];
    
    for (const paciente of pacientes) {
      try {
        await connection.promise().execute(
          `INSERT IGNORE INTO pacientes 
           (nombre, apellido, email, telefono, fecha_nacimiento, genero, direccion, contacto_emergencia, telefono_emergencia, doctor_id, activo, fecha_registro) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, NOW())`,
          paciente
        );
        console.log(`   ✅ Paciente creado: ${paciente[0]} ${paciente[1]}`);
      } catch (err) {
        console.log(`   ⚠️  Paciente ya existe: ${paciente[0]} ${paciente[1]}`);
      }
    }

    // 3. Insertar algunas consultas de ejemplo
    console.log('\n📋 Insertando consultas de ejemplo...');
    
    const consultas = [
      [1, 'Consulta inicial - Evaluación psiquiátrica', 'Primera consulta para evaluación general', 'Completada', '2024-01-15 10:00:00'],
      [2, 'Seguimiento - Control de medicación', 'Revisión de tratamiento antidepresivo', 'Completada', '2024-01-20 14:30:00'],
      [3, 'Terapia cognitiva conductual', 'Sesión de TCC para trastorno de ansiedad', 'Programada', '2024-02-05 11:00:00'],
      [1, 'Control mensual', 'Evaluación de progreso del paciente', 'Programada', '2024-02-10 09:00:00']
    ];
    
    for (const [paciente_id, tipo, motivo, estado, fecha] of consultas) {
      try {
        await connection.promise().execute(
          `INSERT IGNORE INTO consultas 
           (paciente_id, doctor_id, tipo_consulta, motivo, estado, fecha_hora, fecha_registro) 
           VALUES (?, 1, ?, ?, ?, ?, NOW())`,
          [paciente_id, tipo, motivo, estado, fecha]
        );
        console.log(`   ✅ Consulta creada: ${tipo} para paciente ${paciente_id}`);
      } catch (err) {
        console.log(`   ⚠️  Error creando consulta: ${err.message}`);
      }
    }

    // 4. Insertar algunas recetas de ejemplo
    console.log('\n💊 Insertando recetas de ejemplo...');
    
    const recetas = [
      [1, 'Sertraline 50mg', '1 comprimido cada 24 horas', '30 días', 'Tomar con alimentos', 'Activa'],
      [2, 'Lorazepam 1mg', '1 comprimido según necesidad', '15 días', 'Máximo 3 por día', 'Activa'],
      [3, 'Quetiapine 25mg', '1 comprimido antes de dormir', '30 días', 'Tomar 2 horas después de comer', 'Activa']
    ];
    
    for (const [paciente_id, medicamento, dosis, duracion, instrucciones, estado] of recetas) {
      try {
        await connection.promise().execute(
          `INSERT IGNORE INTO recetas 
           (paciente_id, doctor_id, medicamento, dosis, duracion, instrucciones, estado, fecha_prescripcion) 
           VALUES (?, 1, ?, ?, ?, ?, ?, NOW())`,
          [paciente_id, medicamento, dosis, duracion, instrucciones, estado]
        );
        console.log(`   ✅ Receta creada: ${medicamento} para paciente ${paciente_id}`);
      } catch (err) {
        console.log(`   ⚠️  Error creando receta: ${err.message}`);
      }
    }

    console.log('\n🎉 ¡Seed completado exitosamente!');
    console.log('\n📋 RESUMEN DE DATOS CREADOS:');
    console.log('   👨‍⚕️ Usuarios: 3 (1 admin, 2 doctores)');
    console.log('   👥 Pacientes: 5');
    console.log('   📋 Consultas: 4');
    console.log('   💊 Recetas: 3');
    
    console.log('\n🔑 CREDENCIALES DE ACCESO:');
    console.log('   📧 Admin: admin@psiquiapp.local');
    console.log('   🔒 Password: admin123');
    console.log('   📧 Doctor: dr.garcia@psiquiapp.local');
    console.log('   🔒 Password: doctor123');

  } catch (error) {
    console.error('❌ Error durante el seed:', error.message);
    console.error('🔧 Verifica:');
    console.error('   - Que MySQL esté ejecutándose');
    console.error('   - Que la base de datos exista');
    console.error('   - Que las credenciales en .env sean correctas');
    console.error('   - Que las tablas estén creadas (ejecuta database_setup.sql)');
  } finally {
    connection.end();
    console.log('\n🔌 Conexión a base de datos cerrada');
  }
};

// Ejecutar el seed
if (require.main === module) {
  seedData().catch(console.error);
}

module.exports = { seedData };