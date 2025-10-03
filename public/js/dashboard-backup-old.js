// ===== PSIQUIAPP DASHBOARD JAVASCRIPT =====

// Variables globales
let currentDoctor = null;
let currentSection = 'dashboard';

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
    initializeNavigation();
    loadDashboardData();
});

// ===== AUTENTICACIÓN =====
async function checkAuthentication() {
    console.log('🔐 Verificando autenticación...');
    try {
        const response = await fetch('/api/auth/check');
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Usuario autenticado:', data);
            currentDoctor = data.user;
            updateDoctorInfo();
        } else {
            console.log('⚠️ No autenticado, pero continuando...');
            // No redirigir automáticamente, solo mostrar información
        }
    } catch (error) {
        console.error('❌ Error verificando autenticación:', error);
        // No redirigir en caso de error de red
    }
}

function updateDoctorInfo() {
    console.log('👤 Actualizando información del doctor:', currentDoctor);
    if (currentDoctor) {
        const doctorNameElement = document.getElementById('doctorName');
        if (doctorNameElement) {
            doctorNameElement.textContent = currentDoctor.nombre || 'Usuario';
        }
        
        // También actualizar avatar si existe
        const userAvatarElement = document.getElementById('userAvatar');
        if (userAvatarElement && currentDoctor.nombre) {
            const initials = currentDoctor.nombre.split(' ').map(n => n[0]).join('').toUpperCase();
            userAvatarElement.textContent = initials;
        }
    }
}

async function logout() {
    console.log('🔒 Cerrando sesión...');
    try {
        const response = await fetch('/api/auth/logout', { method: 'POST' });
        if (response.ok) {
            showAlert('Sesión cerrada correctamente', 'success');
            setTimeout(() => {
                window.location.href = '/login';
            }, 1000);
        }
    } catch (error) {
        console.error('❌ Error cerrando sesión:', error);
        window.location.href = '/login';
    }
}

// Hacer logout disponible globalmente
window.logout = logout;

// ===== NAVEGACIÓN =====
function initializeNavigation() {
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');
            if (section) {
                switchSection(section);
            }
        });
    });
}

function switchSection(sectionName) {
    console.log(`🔄 Cambiando a sección: ${sectionName}`);
    
    // Ocultar todas las secciones
    document.querySelectorAll('.content-section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Remover clase active de todos los links
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Mostrar sección seleccionada (usando formato con guiones)
    const targetSection = document.getElementById(`${sectionName}-section`);
    if (targetSection) {
        targetSection.style.display = 'block';
        targetSection.classList.add('fade-in');
        console.log(`✅ Sección ${sectionName} mostrada`);
    } else {
        console.log(`⚠️ Sección ${sectionName} no encontrada`);
        // Mostrar dashboard por defecto
        const dashboardSection = document.getElementById('dashboard-section');
        if (dashboardSection) {
            dashboardSection.style.display = 'block';
        }
    }
    
    // Activar link correspondiente
    const activeLink = document.querySelector(`[data-section="${sectionName}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
    
    currentSection = sectionName;
    
    // Cargar datos específicos de la sección
    loadSectionData(sectionName);
}

async function loadSectionData(sectionName) {
    switch (sectionName) {
        case 'dashboard':
            await loadDashboardData();
            break;
        case 'consultas':
            await loadConsultas();
            break;
        case 'recetas':
            await loadRecetas();
            break;
        case 'tests':
            await loadTests();
            break;
    }
}

// ===== DASHBOARD =====
async function loadDashboardData() {
    try {
        // Cargar estadísticas
        await Promise.all([
            loadPacientesStats(),
            loadCitasStats(),
            loadConsultasStats(),
            loadRecetasStats(),
            loadProximasCitas(),
            loadPacientesRecientes()
        ]);
    } catch (error) {
        console.error('Error cargando dashboard:', error);
        showAlert('Error cargando datos del dashboard', 'error');
    }
}

async function loadPacientesStats() {
    try {
        const response = await fetch('/api/pacientes');
        if (response.ok) {
            const data = await response.json();
            const pacientes = data.pacientes || [];
            const activos = pacientes.filter(p => p.estado === 'Activo').length;
            document.getElementById('totalPacientes').textContent = activos;
        }
    } catch (error) {
        console.error('Error cargando pacientes:', error);
    }
}

async function loadCitasStats() {
    try {
        const response = await fetch('/api/citas');
        if (response.ok) {
            const data = await response.json();
            const citas = data.citas || [];
            const hoy = new Date().toISOString().split('T')[0];
            const citasHoy = citas.filter(c => c.fecha_cita === hoy).length;
            document.getElementById('citasHoy').textContent = citasHoy;
        }
    } catch (error) {
        console.error('Error cargando citas:', error);
    }
}

async function loadConsultasStats() {
    try {
        const response = await fetch('/api/consultas');
        if (response.ok) {
            const data = await response.json();
            const consultas = Array.isArray(data) ? data : (data.consultas || []);
            const fechaActual = new Date();
            const primerDiaMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1);
            const consultasMes = consultas.filter(c => {
                const fechaConsulta = new Date(c.fecha_consulta);
                return fechaConsulta >= primerDiaMes;
            }).length;
            document.getElementById('consultasMes').textContent = consultasMes;
        }
    } catch (error) {
        console.error('Error cargando consultas:', error);
    }
}

async function loadRecetasStats() {
    try {
        const response = await fetch('/api/recetas');
        if (response.ok) {
            const data = await response.json();
            const recetas = Array.isArray(data) ? data : (data.recetas || []);
            const activas = recetas.filter(r => r.estado === 'Activa').length;
            document.getElementById('recetasActivas').textContent = activas;
        }
    } catch (error) {
        console.error('Error cargando recetas:', error);
    }
}

async function loadProximasCitas() {
    try {
        const response = await fetch('/api/citas');
        if (response.ok) {
            const data = await response.json();
            const citas = Array.isArray(data) ? data : (data.citas || []);
            const hoy = new Date();
            const proximasCitas = citas
                .filter(c => new Date(c.fecha_cita) >= hoy && c.estado !== 'Cancelada')
                .sort((a, b) => new Date(a.fecha_cita) - new Date(b.fecha_cita))
                .slice(0, 5);
            
            const container = document.getElementById('proximasCitas');
            if (proximasCitas.length === 0) {
                container.innerHTML = '<p class="text-muted">No hay citas programadas</p>';
            } else {
                container.innerHTML = proximasCitas.map(cita => `
                    <div class="d-flex justify-content-between align-items-center mb-2 p-2" style="border-left: 4px solid var(--primary-color); background-color: var(--gray-100);">
                        <div>
                            <strong>${cita.paciente_nombre} ${cita.paciente_apellido}</strong><br>
                            <small class="text-muted">${formatDate(cita.fecha_cita)} - ${cita.hora_cita}</small>
                        </div>
                        <span class="badge badge-${getEstadoBadgeClass(cita.estado)}">${cita.estado}</span>
                    </div>
                `).join('');
            }
        }
    } catch (error) {
        console.error('Error cargando próximas citas:', error);
        document.getElementById('proximasCitas').innerHTML = '<p class="text-error">Error cargando citas</p>';
    }
}

async function loadPacientesRecientes() {
    try {
        const response = await fetch('/api/pacientes');
        if (response.ok) {
            const data = await response.json();
            const pacientes = data.pacientes || [];
            const recientes = pacientes
                .sort((a, b) => new Date(b.created_at || b.fecha_registro) - new Date(a.created_at || a.fecha_registro))
                .slice(0, 5);
            
            const container = document.getElementById('pacientesRecientes');
            if (recientes.length === 0) {
                container.innerHTML = '<p class="text-muted">No hay pacientes registrados</p>';
            } else {
                container.innerHTML = recientes.map(paciente => `
                    <div class="d-flex justify-content-between align-items-center mb-2 p-2" style="border-left: 4px solid var(--secondary-color); background-color: var(--gray-100);">
                        <div>
                            <strong>${paciente.nombre} ${paciente.apellido}</strong><br>
                            <small class="text-muted">Edad: ${calculateAge(paciente.fecha_nacimiento)} años</small>
                        </div>
                        <span class="badge badge-${getEstadoBadgeClass(paciente.estado)}">${paciente.estado || 'Activo'}</span>
                    </div>
                `).join('');
            }
        }
    } catch (error) {
        console.error('Error cargando pacientes recientes:', error);
        document.getElementById('pacientesRecientes').innerHTML = '<p class="text-error">Error cargando pacientes</p>';
    }
}

// ===== CONSULTAS =====
async function loadConsultas() {
    try {
        const response = await fetch('/api/consultas');
        if (response.ok) {
            const data = await response.json();
            const consultas = Array.isArray(data) ? data : (data.consultas || []);
            renderConsultasTable(consultas);
        }
    } catch (error) {
        console.error('Error cargando consultas:', error);
        showAlert('Error cargando consultas', 'error');
    }
}

function renderConsultasTable(consultas) {
    const container = document.getElementById('consultasTable');
    
    if (consultas.length === 0) {
        container.innerHTML = '<p class="text-muted text-center">No hay consultas registradas</p>';
        return;
    }
    
    const tableHTML = `
        <table class="table">
            <thead>
                <tr>
                    <th>Paciente</th>
                    <th>Fecha</th>
                    <th>Tipo</th>
                    <th>Diagnóstico</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                ${consultas.map(consulta => `
                    <tr>
                        <td>${consulta.paciente_nombre} ${consulta.paciente_apellido}</td>
                        <td>${formatDate(consulta.fecha_consulta)}</td>
                        <td><span class="badge badge-primary">${consulta.tipo}</span></td>
                        <td>${consulta.diagnostico_principal || 'Sin diagnóstico'}</td>
                        <td>
                            <button class="btn btn-sm btn-outline" onclick="viewConsulta(${consulta.id})">Ver</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    container.innerHTML = tableHTML;
}

// ===== RECETAS =====
async function loadRecetas() {
    try {
        const response = await fetch('/api/recetas');
        if (response.ok) {
            const data = await response.json();
            const recetas = Array.isArray(data) ? data : (data.recetas || []);
            renderRecetasTable(recetas);
        }
    } catch (error) {
        console.error('Error cargando recetas:', error);
        showAlert('Error cargando recetas', 'error');
    }
}

function renderRecetasTable(recetas) {
    const container = document.getElementById('recetasTable');
    
    if (recetas.length === 0) {
        container.innerHTML = '<p class="text-muted text-center">No hay recetas registradas</p>';
        return;
    }
    
    const tableHTML = `
        <table class="table">
            <thead>
                <tr>
                    <th>Paciente</th>
                    <th>Fecha</th>
                    <th>Estado</th>
                    <th>Medicamentos</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                ${recetas.map(receta => `
                    <tr>
                        <td>${receta.paciente_nombre} ${receta.paciente_apellido}</td>
                        <td>${formatDate(receta.fecha_receta)}</td>
                        <td><span class="badge badge-${getEstadoBadgeClass(receta.estado)}">${receta.estado}</span></td>
                        <td>${truncateText(receta.medicamentos, 50)}</td>
                        <td>
                            <button class="btn btn-sm btn-outline" onclick="viewReceta(${receta.id})">Ver</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    container.innerHTML = tableHTML;
}

// ===== TESTS =====
async function loadTests() {
    try {
        const response = await fetch('/api/tests');
        if (response.ok) {
            const data = await response.json();
            const tests = Array.isArray(data) ? data : (data.tests || []);
            renderTestsTable(tests);
        }
    } catch (error) {
        console.error('Error cargando tests:', error);
        showAlert('Error cargando tests', 'error');
    }
}

function renderTestsTable(tests) {
    const container = document.getElementById('testsTable');
    
    if (tests.length === 0) {
        container.innerHTML = '<p class="text-muted text-center">No hay tests realizados</p>';
        return;
    }
    
    const tableHTML = `
        <table class="table">
            <thead>
                <tr>
                    <th>Paciente</th>
                    <th>Test</th>
                    <th>Fecha</th>
                    <th>Resultado</th>
                    <th>Puntaje</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                ${tests.map(test => `
                    <tr>
                        <td>${test.paciente_nombre} ${test.paciente_apellido}</td>
                        <td>${test.nombre_test}</td>
                        <td>${formatDate(test.fecha_aplicacion)}</td>
                        <td><span class="badge badge-info">${test.resultado}</span></td>
                        <td>${test.puntaje_obtenido}/${test.puntaje_maximo}</td>
                        <td>
                            <button class="btn btn-sm btn-outline" onclick="viewTest(${test.id})">Ver</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    container.innerHTML = tableHTML;
}

// ===== FUNCIONES DE UTILIDAD =====
function showAlert(message, type = 'error') {
    const alertContainer = document.getElementById('alertContainer');
    const alertElement = document.createElement('div');
    alertElement.className = `alert alert-${type} slide-up`;
    alertElement.innerHTML = `
        <svg class="icon icon-sm" fill="currentColor" viewBox="0 0 20 20">
            ${type === 'success' 
                ? '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>'
                : '<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>'
            }
        </svg>
        ${message}
    `;
    
    alertContainer.appendChild(alertElement);
    
    setTimeout(() => {
        alertElement.remove();
    }, 5000);
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function calculateAge(birthDate) {
    if (!birthDate) return 'N/A';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    
    return age;
}

function getEstadoBadgeClass(estado) {
    const estadoClasses = {
        'Activo': 'success',
        'Activa': 'success',
        'Programada': 'primary',
        'Confirmada': 'success',
        'Completada': 'success',
        'Cancelada': 'error',
        'Inactivo': 'warning',
        'Surtida': 'success',
        'Vencida': 'error'
    };
    
    return estadoClasses[estado] || 'secondary';
}

function truncateText(text, maxLength) {
    if (!text) return 'N/A';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

// ===== FUNCIONES DE MODAL (PLACEHOLDER) =====
function showNewConsultaModal() {
    showAlert('Función en desarrollo: Nueva Consulta', 'info');
}

function showNewPacienteModal() {
    console.log('📋 Abriendo modal de nuevo paciente');
    openModal('newPacienteModal');
}

function showNewConsultaModal() {
    showAlert('Función en desarrollo: Nueva Consulta', 'info');
}

function showNewRecetaModal() {
    showAlert('Función en desarrollo: Nueva Receta', 'info');
}

function showNewTestModal() {
    showAlert('Función en desarrollo: Nuevo Test', 'info');
}

function refreshDashboard() {
    console.log('🔄 Refrescando dashboard');
    loadDashboardData();
    showAlert('Dashboard actualizado', 'success');
}

function refreshPacientes() {
    console.log('🔄 Refrescando pacientes');
    loadPacientes();
    showAlert('Lista de pacientes actualizada', 'success');
}

function refreshConsultas() {
    console.log('🔄 Refrescando consultas');
    loadConsultas();
    showAlert('Lista de consultas actualizada', 'success');
}

function viewConsulta(id) {
    showAlert(`Función en desarrollo: Ver Consulta #${id}`, 'info');
}

function viewReceta(id) {
    showAlert(`Función en desarrollo: Ver Receta #${id}`, 'info');
}

function viewTest(id) {
    showAlert(`Función en desarrollo: Ver Test #${id}`, 'info');
}
