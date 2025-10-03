// PsiquiApp - Dashboard JavaScript Mejorado
document.addEventListener('DOMContentLoaded', function() {
    console.log('🧠 PsiquiApp Dashboard Iniciado');
    
    // Inicializar dashboard
    initializeDashboard();
    setupEventListeners();
    loadDashboardData();
});

// ================================
// INICIALIZACIÓN DEL DASHBOARD
// ================================
function initializeDashboard() {
    console.log('📊 Inicializando Dashboard...');
    
    // Verificar autenticación
    checkAuthentication();
    
    // Configurar sidebar
    setupSidebar();
    
    // Cargar datos iniciales
    loadInitialData();
}

// ================================
// VERIFICACIÓN DE AUTENTICACIÓN
// ================================
function checkAuthentication() {
    // Verificar si el usuario está autenticado
    fetch('/api/auth/check')
        .then(response => {
            if (!response.ok) {
                window.location.href = '/login.html';
            }
            return response.json();
        })
        .then(data => {
            if (data.user) {
                updateUserInfo(data.user);
            }
        })
        .catch(error => {
            console.error('❌ Error verificando autenticación:', error);
            window.location.href = '/login.html';
        });
}

// ================================
// CONFIGURACIÓN DE EVENT LISTENERS
// ================================
function setupEventListeners() {
    console.log('🔧 Configurando Event Listeners...');
    
    // Botón de logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Botones del sidebar
    const sidebarItems = document.querySelectorAll('.sidebar-item');
    sidebarItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');
            if (section) {
                navigateToSection(section);
            }
        });
    });
    
    // Botón hamburguesa para móvil
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', toggleSidebar);
    }
    
    // Modal event listeners
    setupModalListeners();
    
    // Form event listeners
    setupFormListeners();
}

// ================================
// CONFIGURACIÓN DEL SIDEBAR
// ================================
function setupSidebar() {
    const currentSection = localStorage.getItem('currentSection') || 'dashboard';
    navigateToSection(currentSection);
}

function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.classList.toggle('active');
    }
}

// ================================
// NAVEGACIÓN ENTRE SECCIONES
// ================================
function navigateToSection(section) {
    console.log(`🔄 Navegando a: ${section}`);
    
    // Actualizar sidebar activo
    updateActiveSidebarItem(section);
    
    // Mostrar sección correspondiente
    showSection(section);
    
    // Guardar sección actual
    localStorage.setItem('currentSection', section);
    
    // Cargar datos específicos de la sección
    loadSectionData(section);
}

function updateActiveSidebarItem(section) {
    const sidebarItems = document.querySelectorAll('.sidebar-item');
    sidebarItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-section') === section) {
            item.classList.add('active');
        }
    });
}

function showSection(section) {
    const sections = document.querySelectorAll('.dashboard-section');
    sections.forEach(sec => {
        sec.style.display = 'none';
    });
    
    const targetSection = document.getElementById(`${section}Section`);
    if (targetSection) {
        targetSection.style.display = 'block';
    } else {
        // Si no existe la sección, mostrar dashboard principal
        const dashboardSection = document.getElementById('dashboardSection');
        if (dashboardSection) {
            dashboardSection.style.display = 'block';
        }
    }
}

// ================================
// GESTIÓN DE MODALES
// ================================
function setupModalListeners() {
    // Cerrar modales al hacer click fuera
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            closeModal(e.target.id);
        }
    });
    
    // Cerrar modales con Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
        document.body.style.overflow = 'auto';
    }
}

function closeAllModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        closeModal(modal.id);
    });
}

// ================================
// GESTIÓN DE FORMULARIOS
// ================================
function setupFormListeners() {
    // Formulario de nuevo paciente
    const newPacienteForm = document.getElementById('newPacienteForm');
    if (newPacienteForm) {
        newPacienteForm.addEventListener('submit', handleNewPaciente);
    }
}

function handleNewPaciente(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const pacienteData = {};
    
    // Convertir FormData a objeto
    for (let [key, value] of formData.entries()) {
        pacienteData[key] = value;
    }
    
    console.log('👤 Creando nuevo paciente:', pacienteData);
    
    // Enviar datos al servidor
    fetch('/api/pacientes', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(pacienteData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showAlert('Paciente creado exitosamente', 'success');
            closeModal('newPacienteModal');
            e.target.reset();
            loadPacientes(); // Recargar lista de pacientes
        } else {
            showAlert(data.message || 'Error al crear paciente', 'error');
        }
    })
    .catch(error => {
        console.error('❌ Error creando paciente:', error);
        showAlert('Error al crear paciente', 'error');
    });
}

// ================================
// CARGA DE DATOS
// ================================
function loadDashboardData() {
    console.log('📈 Cargando datos del dashboard...');
    
    Promise.all([
        loadStats(),
        loadRecentActivity(),
        loadUpcomingAppointments()
    ]).then(() => {
        console.log('✅ Datos del dashboard cargados');
    }).catch(error => {
        console.error('❌ Error cargando datos del dashboard:', error);
        showAlert('Error cargando datos del dashboard', 'error');
    });
}

function loadInitialData() {
    // Cargar datos comunes necesarios para el dashboard
    loadUserProfile();
}

function loadSectionData(section) {
    switch(section) {
        case 'pacientes':
            loadPacientes();
            break;
        case 'citas':
            loadCitas();
            break;
        case 'consultas':
            loadConsultas();
            break;
        case 'recetas':
            loadRecetas();
            break;
        case 'tests':
            loadTests();
            break;
        default:
            loadDashboardData();
    }
}

// ================================
// CARGA DE DATOS ESPECÍFICOS
// ================================
function loadStats() {
    return fetch('/api/stats')
        .then(response => response.json())
        .then(data => {
            updateStatsCards(data);
        })
        .catch(error => {
            console.error('❌ Error cargando estadísticas:', error);
            // Usar datos mock si hay error
            updateStatsCards({
                pacientes: 45,
                citas_hoy: 8,
                consultas_mes: 124,
                recetas_activas: 23
            });
        });
}

function loadPacientes() {
    return fetch('/api/pacientes')
        .then(response => response.json())
        .then(data => {
            updatePacientesTable(data.pacientes || []);
        })
        .catch(error => {
            console.error('❌ Error cargando pacientes:', error);
            showAlert('Error cargando pacientes', 'error');
        });
}

function loadCitas() {
    return fetch('/api/citas')
        .then(response => response.json())
        .then(data => {
            updateCitasTable(data.citas || []);
        })
        .catch(error => {
            console.error('❌ Error cargando citas:', error);
            showAlert('Error cargando citas', 'error');
        });
}

function loadConsultas() {
    return fetch('/api/consultas')
        .then(response => response.json())
        .then(data => {
            updateConsultasTable(data.consultas || []);
        })
        .catch(error => {
            console.error('❌ Error cargando consultas:', error);
            showAlert('Error cargando consultas', 'error');
        });
}

function loadRecetas() {
    return fetch('/api/recetas')
        .then(response => response.json())
        .then(data => {
            updateRecetasTable(data.recetas || []);
        })
        .catch(error => {
            console.error('❌ Error cargando recetas:', error);
            showAlert('Error cargando recetas', 'error');
        });
}

function loadTests() {
    return fetch('/api/tests')
        .then(response => response.json())
        .then(data => {
            updateTestsTable(data.tests || []);
        })
        .catch(error => {
            console.error('❌ Error cargando tests:', error);
            showAlert('Error cargando tests', 'error');
        });
}

function loadUserProfile() {
    return fetch('/api/user/profile')
        .then(response => response.json())
        .then(data => {
            updateUserInfo(data.user);
        })
        .catch(error => {
            console.error('❌ Error cargando perfil:', error);
        });
}

function loadRecentActivity() {
    return fetch('/api/activity/recent')
        .then(response => response.json())
        .then(data => {
            updateRecentActivity(data.activities || []);
        })
        .catch(error => {
            console.error('❌ Error cargando actividad reciente:', error);
        });
}

function loadUpcomingAppointments() {
    return fetch('/api/citas/upcoming')
        .then(response => response.json())
        .then(data => {
            updateUpcomingAppointments(data.citas || []);
        })
        .catch(error => {
            console.error('❌ Error cargando próximas citas:', error);
        });
}

// ================================
// ACTUALIZACIÓN DE UI
// ================================
function updateStatsCards(stats) {
    const statElements = {
        'pacientes-count': stats.pacientes || 0,
        'citas-count': stats.citas_hoy || 0,
        'consultas-count': stats.consultas_mes || 0,
        'recetas-count': stats.recetas_activas || 0
    };
    
    Object.entries(statElements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    });
}

function updateUserInfo(user) {
    const userNameElement = document.getElementById('userName');
    const userEmailElement = document.getElementById('userEmail');
    
    if (userNameElement && user.nombre) {
        userNameElement.textContent = user.nombre;
    }
    
    if (userEmailElement && user.email) {
        userEmailElement.textContent = user.email;
    }
}

function updatePacientesTable(pacientes) {
    const tableBody = document.querySelector('#pacientesTable tbody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    pacientes.forEach(paciente => {
        const row = createPacienteRow(paciente);
        tableBody.appendChild(row);
    });
}

function createPacienteRow(paciente) {
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${paciente.id}</td>
        <td>${paciente.nombre} ${paciente.apellido}</td>
        <td>${paciente.email || 'No especificado'}</td>
        <td>${paciente.telefono || 'No especificado'}</td>
        <td>${formatDate(paciente.fecha_registro)}</td>
        <td>
            <div class="action-buttons">
                <button class="btn btn-sm btn-primary" onclick="viewPaciente(${paciente.id})">
                    <svg class="icon icon-sm" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"></path>
                        <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"></path>
                    </svg>
                    Ver
                </button>
                <button class="btn btn-sm btn-warning" onclick="editPaciente(${paciente.id})">
                    <svg class="icon icon-sm" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"></path>
                    </svg>
                    Editar
                </button>
                <button class="btn btn-sm btn-danger" onclick="deletePaciente(${paciente.id})">
                    <svg class="icon icon-sm" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9zM4 5a2 2 0 012-2h8a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 102 0v3a1 1 0 11-2 0V9zm4 0a1 1 0 10-2 0v3a1 1 0 102 0V9z" clip-rule="evenodd"></path>
                    </svg>
                    Eliminar
                </button>
            </div>
        </td>
    `;
    return row;
}

// ================================
// FUNCIONES DE UTILIDAD
// ================================
function formatDate(dateString) {
    if (!dateString) return 'No especificado';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alertContainer');
    if (!alertContainer) return;
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    
    const icon = getAlertIcon(type);
    alert.innerHTML = `
        ${icon}
        <span>${message}</span>
    `;
    
    alertContainer.appendChild(alert);
    
    // Auto-remove alert after 5 seconds
    setTimeout(() => {
        if (alert.parentNode) {
            alert.parentNode.removeChild(alert);
        }
    }, 5000);
}

function getAlertIcon(type) {
    const icons = {
        success: '<svg class="icon icon-sm" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>',
        error: '<svg class="icon icon-sm" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>',
        warning: '<svg class="icon icon-sm" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>',
        info: '<svg class="icon icon-sm" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path></svg>'
    };
    return icons[type] || icons.info;
}

// ================================
// ACCIONES DE PACIENTES
// ================================
function viewPaciente(id) {
    console.log(`👁️ Ver paciente ID: ${id}`);
    // Implementar vista de paciente
    showAlert('Función de vista en desarrollo', 'info');
}

function editPaciente(id) {
    console.log(`✏️ Editar paciente ID: ${id}`);
    // Implementar edición de paciente
    showAlert('Función de edición en desarrollo', 'info');
}

function deletePaciente(id) {
    console.log(`🗑️ Eliminar paciente ID: ${id}`);
    
    if (confirm('¿Está seguro de que desea eliminar este paciente?')) {
        fetch(`/api/pacientes/${id}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showAlert('Paciente eliminado exitosamente', 'success');
                loadPacientes(); // Recargar lista
            } else {
                showAlert(data.message || 'Error al eliminar paciente', 'error');
            }
        })
        .catch(error => {
            console.error('❌ Error eliminando paciente:', error);
            showAlert('Error al eliminar paciente', 'error');
        });
    }
}

// ================================
// LOGOUT
// ================================
function handleLogout() {
    console.log('🔒 Cerrando sesión...');
    
    fetch('/api/auth/logout', {
        method: 'POST'
    })
    .then(() => {
        localStorage.clear();
        window.location.href = '/login.html';
    })
    .catch(error => {
        console.error('❌ Error durante logout:', error);
        window.location.href = '/login.html';
    });
}

// ================================
// FUNCIONES GLOBALES PARA HTML
// ================================
window.openModal = openModal;
window.closeModal = closeModal;
window.viewPaciente = viewPaciente;
window.editPaciente = editPaciente;
window.deletePaciente = deletePaciente;
