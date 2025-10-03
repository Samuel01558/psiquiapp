# PsiquiApp

Sistema de gestion para profesionales de salud mental. Permite gestionar pacientes, citas, consultas, recetas medicas y aplicar tests psicologicos.

![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg) ![MySQL](https://img.shields.io/badge/mysql-8.0-orange.svg) ![Version](https://img.shields.io/badge/version-1.0.1-blue.svg)

## Caracteristicas

- Gestion de Pacientes - Expedientes digitales completos
- Agenda de Citas - Calendario con estados
- Registro de Consultas - Notas clinicas estructuradas
- Recetas Medicas - Prescripciones con validez
- Tests Psicologicos - PHQ-9, GAD-7, BDI-II, BAI
- Herramientas Clinicas - DSM-5 y CIE-10
- Administracion - Gestion de usuarios y permisos

## Tecnologias

- Backend: Node.js, Express, MySQL
- Frontend: Vanilla JavaScript, HTML5, CSS3, Bootstrap 5
- Seguridad: bcrypt, express-session, helmet

## Instalacion

### Requisitos
- Node.js v18+
- MySQL v8.0+

### Pasos

``bash
# 1. Clonar
git clone https://github.com/Samuel01558/psiquiapp.git
cd psiquiapp

# 2. Instalar dependencias
npm install

# 3. Configurar .env
cp .env.example .env
# Editar .env con credenciales MySQL

# 4. Crear base de datos
mysql -u root -p
CREATE DATABASE psiquiapp_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
exit

mysql -u root -p psiquiapp_db < database_setup.sql

# 5. Crear admin
node create-admin.js

# 6. Iniciar
npm start
``

Aplicacion disponible en: http://localhost:3000

**Credenciales por defecto:**
- Email: admin@psiquiapp.local
- Password: admin123

## Estructura

``
psiquiapp/
├── config/              # Configuracion
├── middleware/          # Validaciones
├── public/              # Frontend
│   ├── css/
│   ├── js/
│   └── *.html
├── server.js           # Servidor principal
├── database_setup.sql  # Script de BD
└── package.json        # Dependencias
``

## Configuracion

Variables de entorno (.env):

``env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=psiquiapp_db
PORT=3000
SESSION_SECRET=generar_clave_segura
``

## Seguridad

- Passwords hasheadas con bcrypt
- Sesiones seguras con httpOnly cookies
- Rate limiting (100 req/15min)
- SQL injection prevention
- XSS protection

## Uso

### Gestionar Pacientes
1. Ir a Pacientes
2. Clic en Nuevo Paciente
3. Completar formulario

### Aplicar Tests
1. Ir a Tests Psicologicos
2. Seleccionar test
3. Responder preguntas
4. Ver resultados

## Soporte

Issues: https://github.com/Samuel01558/psiquiapp/issues

## Licencia

MIT License

## Autor

Samuel Alejandro Garcia Barraza - [@Samuel01558](https://github.com/Samuel01558)

---

**Disclaimer:** Herramienta de gestion administrativa. No reemplaza el juicio clinico profesional.
