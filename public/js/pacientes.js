// Pacientes.js - Gestión de pacientes
let currentPatients = [];
let currentPage = 1;
const patientsPerPage = 10;
let isSuspended = false;

// Initialize when document is ready
$(document).ready(function() {
    checkSuspendedStatus();
    loadPatients();
    setupEventHandlers();
});

// Setup event handlers
function setupEventHandlers() {
    // Search functionality
    $('#searchPatients').on('input', function() {
        filterAndDisplayPatients();
    });

    // Status filter
    $('#filterStatus').on('change', function() {
        filterAndDisplayPatients();
    });

    // Sidebar toggle for mobile
    $('#toggleSidebar').click(function() {
        $('#sidebar').toggleClass('show');
    });

    // Form submission
    $('#addPatientForm').on('submit', function(e) {
        e.preventDefault();
        savePatient();
    });
}

// Load patients from server
async function loadPatients() {
    try {
        const response = await fetch('/api/pacientes', {
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        // Handle different response formats
        if (Array.isArray(data)) {
            currentPatients = data;
        } else if (data.pacientes && Array.isArray(data.pacientes)) {
            currentPatients = data.pacientes;
        } else if (data.data && Array.isArray(data.data)) {
            currentPatients = data.data;
        } else {
            currentPatients = [];
        }

        filterAndDisplayPatients();
        
    } catch (error) {
        console.error('Error loading patients:', error);
        showErrorMessage('Error al cargar los pacientes');
        currentPatients = [];
        displayPatients([]);
    }
}

// Filter and display patients
function filterAndDisplayPatients() {
    const searchTerm = $('#searchPatients').val().toLowerCase();
    const statusFilter = $('#filterStatus').val();

    let filteredPatients = currentPatients.filter(patient => {
        const matchesSearch = !searchTerm || 
            (patient.nombre && patient.nombre.toLowerCase().includes(searchTerm)) ||
            (patient.apellido && patient.apellido.toLowerCase().includes(searchTerm)) ||
            (patient.email && patient.email.toLowerCase().includes(searchTerm)) ||
            (patient.id && patient.id.toString().includes(searchTerm));

        const matchesStatus = !statusFilter || 
            (patient.estado && patient.estado.toLowerCase() === statusFilter);

        return matchesSearch && matchesStatus;
    });

    displayPatients(filteredPatients);
    updatePagination(filteredPatients.length);
}

// Display patients in table
function displayPatients(patients) {
    const tbody = $('#patientsTableBody');
    tbody.empty();

    if (patients.length === 0) {
        tbody.append(`
            <tr>
                <td colspan="8" class="text-center py-4">
                    <i class="fas fa-users fa-3x text-muted mb-3"></i>
                    <p class="text-muted mb-0">No se encontraron pacientes</p>
                </td>
            </tr>
        `);
        return;
    }

    // Calculate pagination
    const startIndex = (currentPage - 1) * patientsPerPage;
    const endIndex = startIndex + patientsPerPage;
    const paginatedPatients = patients.slice(startIndex, endIndex);

    paginatedPatients.forEach(patient => {
        const statusBadge = getStatusBadge(patient.estado);
        const birthDate = patient.fecha_nacimiento ? 
            new Date(patient.fecha_nacimiento).toLocaleDateString('es-ES') : 
            'No especificada';

        // Disable edit/delete buttons if suspended
        const editDisabled = isSuspended ? 'disabled' : '';
        const deleteDisabled = isSuspended ? 'disabled' : '';
        const editTitle = isSuspended ? 'Función deshabilitada - Cuenta suspendida' : 'Editar';
        const deleteTitle = isSuspended ? 'Función deshabilitada - Cuenta suspendida' : 'Eliminar';

        tbody.append(`
            <tr>
                <td><strong>#${patient.id}</strong></td>
                <td>${patient.nombre || ''}</td>
                <td>${patient.apellido || ''}</td>
                <td>${patient.email || '-'}</td>
                <td>${patient.telefono || '-'}</td>
                <td>${birthDate}</td>
                <td>${statusBadge}</td>
                <td>
                    <div class="btn-group" role="group">
                        <button class="btn btn-sm btn-outline-primary" onclick="viewPatient(${patient.id})" title="Ver detalles">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-success" onclick="editPatient(${patient.id})" title="${editTitle}" ${editDisabled}>
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deletePatient(${patient.id})" title="${deleteTitle}" ${deleteDisabled}>
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `);
    });
}

// Get status badge HTML
function getStatusBadge(status) {
    if (!status) status = 'activo';
    
    const statusClasses = {
        'activo': 'badge-success',
        'inactivo': 'badge-secondary',
        'pendiente': 'badge-warning'
    };

    const statusLabels = {
        'activo': 'Activo',
        'inactivo': 'Inactivo', 
        'pendiente': 'Pendiente'
    };

    const badgeClass = statusClasses[status.toLowerCase()] || 'badge-secondary';
    const badgeLabel = statusLabels[status.toLowerCase()] || status;

    return `<span class="badge ${badgeClass}">${badgeLabel}</span>`;
}

// Update pagination
function updatePagination(totalPatients) {
    const totalPages = Math.ceil(totalPatients / patientsPerPage);
    const pagination = $('#patientsPagination');
    pagination.empty();

    if (totalPages <= 1) return;

    // Previous button
    pagination.append(`
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage - 1})">
                <i class="fas fa-chevron-left"></i>
            </a>
        </li>
    `);

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            pagination.append(`
                <li class="page-item ${i === currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="changePage(${i})">${i}</a>
                </li>
            `);
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            pagination.append(`<li class="page-item disabled"><span class="page-link">...</span></li>`);
        }
    }

    // Next button
    pagination.append(`
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage + 1})">
                <i class="fas fa-chevron-right"></i>
            </a>
        </li>
    `);
}

// Change page
function changePage(page) {
    const totalPages = Math.ceil(currentPatients.length / patientsPerPage);
    if (page < 1 || page > totalPages) return;
    
    currentPage = page;
    filterAndDisplayPatients();
}

// Show add patient modal
function showAddPatientModal() {
    $('#addPatientModal').modal('show');
    $('#addPatientForm')[0].reset();
}

// Save patient
async function savePatient() {
    const formData = {
        nombre: $('#patientName').val().trim(),
        apellido: $('#patientLastName').val().trim(), // Cambiado de 'apellidos' a 'apellido'
        email: $('#patientEmail').val().trim(),
        telefono: $('#patientPhone').val().trim(),
        fecha_nacimiento: $('#patientBirthDate').val(),
        genero: $('#patientGender').val(),
        direccion: $('#patientAddress').val().trim(),
        notas_generales: $('#patientNotes').val().trim(), // Cambiado de 'notas' a 'notas_generales'
        estado: 'activo'
    };

    // Validation
    if (!formData.nombre || !formData.apellido || !formData.fecha_nacimiento) {
        showErrorMessage('Por favor complete todos los campos obligatorios');
        return;
    }

    try {
        const response = await fetch('/api/pacientes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(formData)
        });

        // Obtener el texto de respuesta para mejor debugging
        const responseText = await response.text();
        
        if (!response.ok) {
            let errorMessage = 'Error en el servidor';
            try {
                const errorData = JSON.parse(responseText);
                
                // Handle suspended account error
                if (response.status === 403 && errorData.suspended) {
                    showErrorMessage('Cuenta suspendida: No puede realizar modificaciones. Contacte al administrador.');
                    return;
                }
                
                errorMessage = errorData.message || `HTTP error! status: ${response.status}`;
            } catch (e) {
                errorMessage = `HTTP error! status: ${response.status} - ${responseText}`;
            }
            throw new Error(errorMessage);
        }

        const result = JSON.parse(responseText);
        
        if (result.success) {
            showSuccessMessage('Paciente guardado exitosamente');
            $('#addPatientModal').modal('hide');
            loadPatients(); // Reload the list
        } else {
            showErrorMessage(result.message || 'Error al guardar el paciente');
        }

    } catch (error) {
        console.error('Error saving patient:', error);
        showErrorMessage(`Error al guardar el paciente: ${error.message}`);
    }
}

// View patient details
async function viewPatient(patientId) {
    try {
        const response = await fetch(`/api/pacientes/${patientId}`, {
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (data.success && data.paciente) {
            const p = data.paciente;
            const edad = calcularEdad(p.fecha_nacimiento);
            
            const modalContent = `
                <div class="patient-details">
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <h5><i class="fas fa-user text-primary"></i> Información Personal</h5>
                            <table class="table table-sm">
                                <tr><td><strong>Nombre:</strong></td><td>${p.nombre} ${p.apellido}</td></tr>
                                <tr><td><strong>Edad:</strong></td><td>${edad} años</td></tr>
                                <tr><td><strong>Género:</strong></td><td>${p.genero === 'M' ? 'Masculino' : 'Femenino'}</td></tr>
                                <tr><td><strong>Fecha Nac.:</strong></td><td>${formatDate(p.fecha_nacimiento)}</td></tr>
                            </table>
                        </div>
                        <div class="col-md-6">
                            <h5><i class="fas fa-address-book text-success"></i> Contacto</h5>
                            <table class="table table-sm">
                                <tr><td><strong>Email:</strong></td><td>${p.email}</td></tr>
                                <tr><td><strong>Teléfono:</strong></td><td>${p.telefono || 'No registrado'}</td></tr>
                                <tr><td><strong>Dirección:</strong></td><td>${p.direccion || 'No registrada'}</td></tr>
                            </table>
                        </div>
                    </div>
                    ${p.notas_generales ? `
                    <div class="row">
                        <div class="col-12">
                            <h5><i class="fas fa-notes-medical text-info"></i> Notas</h5>
                            <div class="alert alert-light">${p.notas_generales}</div>
                        </div>
                    </div>
                    ` : ''}
                </div>
            `;
            
            // Crear modal
            const modal = document.createElement('div');
            modal.className = 'modal fade';
            modal.id = 'viewPatientModal';
            modal.innerHTML = `
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Detalle del Paciente</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            ${modalContent}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary px-4" data-bs-dismiss="modal" style="height: 38px; border-radius: 4px;">Cancelar</button>
                            <button type="button" class="btn btn-primary px-4" onclick="closeViewModal(); editPatient(${patientId});" style="height: 38px; border-radius: 4px;">Editar</button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            const bsModal = new bootstrap.Modal(modal);
            bsModal.show();
            
            modal.addEventListener('hidden.bs.modal', () => {
                modal.remove();
            });
        } else {
            showErrorMessage('Paciente no encontrado');
        }
    } catch (error) {
        console.error('Error al cargar paciente:', error);
        showErrorMessage('Error al cargar información del paciente');
    }
}

function closeViewModal() {
    const modal = bootstrap.Modal.getInstance(document.getElementById('viewPatientModal'));
    if (modal) modal.hide();
}

// Edit patient
async function editPatient(patientId) {
    try {
        const response = await fetch(`/api/pacientes/${patientId}`, {
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (data.success && data.paciente) {
            const p = data.paciente;
            
            const formContent = `
                <form id="editPatientForm">
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label class="form-label">Nombre *</label>
                            <input type="text" class="form-control" id="edit_nombre" value="${p.nombre}" required>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label class="form-label">Apellido *</label>
                            <input type="text" class="form-control" id="edit_apellido" value="${p.apellido}" required>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label class="form-label">Email *</label>
                            <input type="email" class="form-control" id="edit_email" value="${p.email}" required>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label class="form-label">Teléfono</label>
                            <input type="tel" class="form-control" id="edit_telefono" value="${p.telefono || ''}">
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label class="form-label">Fecha Nacimiento *</label>
                            <input type="date" class="form-control" id="edit_fecha_nacimiento" value="${p.fecha_nacimiento}" required>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label class="form-label">Género *</label>
                            <select class="form-select" id="edit_genero" required>
                                <option value="M" ${p.genero === 'M' ? 'selected' : ''}>Masculino</option>
                                <option value="F" ${p.genero === 'F' ? 'selected' : ''}>Femenino</option>
                            </select>
                        </div>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Dirección</label>
                        <input type="text" class="form-control" id="edit_direccion" value="${p.direccion || ''}">
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Notas</label>
                        <textarea class="form-control" id="edit_notas" rows="3">${p.notas_generales || ''}</textarea>
                    </div>
                </form>
            `;
            
            const modal = document.createElement('div');
            modal.className = 'modal fade';
            modal.id = 'editPatientModal';
            modal.innerHTML = `
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Editar Paciente</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            ${formContent}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary px-4" data-bs-dismiss="modal" style="height: 38px; border-radius: 4px;">Cancelar</button>
                            <button type="button" class="btn btn-primary px-4" onclick="savePatientChanges(${patientId})" style="height: 38px; border-radius: 4px;">Guardar</button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            const bsModal = new bootstrap.Modal(modal);
            bsModal.show();
            
            modal.addEventListener('hidden.bs.modal', () => {
                modal.remove();
            });
        } else {
            showErrorMessage('Paciente no encontrado');
        }
    } catch (error) {
        console.error('Error al cargar paciente:', error);
        showErrorMessage('Error al cargar datos del paciente');
    }
}

async function savePatientChanges(patientId) {
    const data = {
        nombre: document.getElementById('edit_nombre').value.trim(),
        apellido: document.getElementById('edit_apellido').value.trim(),
        email: document.getElementById('edit_email').value.trim(),
        telefono: document.getElementById('edit_telefono').value.trim(),
        fecha_nacimiento: document.getElementById('edit_fecha_nacimiento').value,
        genero: document.getElementById('edit_genero').value,
        direccion: document.getElementById('edit_direccion').value.trim(),
        notas_generales: document.getElementById('edit_notas').value.trim()
    };
    
    if (!data.nombre || !data.apellido || !data.email || !data.fecha_nacimiento || !data.genero) {
        showErrorMessage('Complete todos los campos obligatorios');
        return;
    }
    
    try {
        const response = await fetch(`/api/pacientes/${patientId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        // Handle suspended account error
        if (response.status === 403 && result.suspended) {
            showErrorMessage('Cuenta suspendida: No puede realizar modificaciones. Contacte al administrador.');
            return;
        }
        
        if (result.success) {
            showSuccessMessage('Paciente actualizado exitosamente');
            const modal = bootstrap.Modal.getInstance(document.getElementById('editPatientModal'));
            if (modal) modal.hide();
            loadPatients();
        } else {
            showErrorMessage(result.message || 'Error al actualizar');
        }
    } catch (error) {
        console.error('Error:', error);
        showErrorMessage('Error al actualizar paciente');
    }
}

// Delete patient
async function deletePatient(patientId) {
    if (!confirm('¿Está seguro de que desea eliminar este paciente? Esta acción no se puede deshacer.')) {
        return;
    }

    try {
        const response = await fetch(`/api/pacientes/${patientId}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        // Handle suspended account error
        if (response.status === 403) {
            const result = await response.json();
            if (result.suspended) {
                showErrorMessage('Cuenta suspendida: No puede realizar modificaciones. Contacte al administrador.');
                return;
            }
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success) {
            showSuccessMessage('Paciente eliminado exitosamente');
            loadPatients(); // Reload the list
        } else {
            showErrorMessage(result.message || 'Error al eliminar el paciente');
        }

    } catch (error) {
        console.error('Error deleting patient:', error);
        showErrorMessage('Error al eliminar el paciente');
    }
}

// Export patients
function exportPatients() {
    // TODO: Implement export functionality
    showInfoMessage('Función de exportación próximamente');
}

// Refresh patients
function refreshPatients() {
    currentPage = 1;
    loadPatients();
    showInfoMessage('Lista de pacientes actualizada');
}

// Logout function
function logout() {
    if (confirm('¿Está seguro de que desea cerrar sesión?')) {
        fetch('/logout', {
            method: 'POST',
            credentials: 'include'
        }).then(() => {
            window.location.href = '/login.html';
        }).catch(() => {
            window.location.href = '/login.html';
        });
    }
}

// Utility functions for showing messages
function showSuccessMessage(message) {
    showToast(message, 'success');
}

function showErrorMessage(message) {
    showToast(message, 'error');
}

function showInfoMessage(message) {
    showToast(message, 'info');
}

function showToast(message, type = 'info') {
    // Remove existing toasts
    $('.custom-toast').remove();
    
    const bgClass = type === 'success' ? 'bg-success' : 
                   type === 'error' ? 'bg-danger' : 'bg-info';
    
    const toast = $(`
        <div class="custom-toast position-fixed" style="top: 20px; right: 20px; z-index: 9999;">
            <div class="alert ${bgClass} text-white alert-dismissible fade show" role="alert">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'} mr-2"></i>
                ${message}
                <button type="button" class="close text-white" data-dismiss="alert" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
        </div>
    `);
    
    $('body').append(toast);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        toast.fadeOut(() => toast.remove());
    }, 5000);
}

// Función auxiliar para calcular edad
function calcularEdad(fechaNacimiento) {
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
        edad--;
    }
    return edad;
}

// Función auxiliar para formatear fechas
function formatDate(dateString) {
    if (!dateString) return 'No especificada';
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('es-ES', options);
}

// Check if user is suspended
async function checkSuspendedStatus() {
    try {
        const response = await fetch('/api/doctor/profile', {
            credentials: 'include'
        });

        if (response.ok) {
            const data = await response.json();
            const doctor = data.doctor || data;
            
            // Check if suspended
            isSuspended = doctor.suspended || (doctor.activo === false && !doctor.is_admin);
            
            if (isSuspended) {
                showSuspendedWarning();
                disableModificationButtons();
            }
        }
    } catch (error) {
        console.error('Error checking suspended status:', error);
    }
}

// Show suspended warning banner
function showSuspendedWarning() {
    const warning = document.getElementById('suspendedWarning');
    if (warning) {
        warning.style.display = 'block';
    }
}

// Disable modification buttons for suspended users
function disableModificationButtons() {
    // Disable new patient button
    const newPatientBtn = document.getElementById('newPatientBtn');
    if (newPatientBtn) {
        newPatientBtn.disabled = true;
        newPatientBtn.title = 'Función deshabilitada - Cuenta suspendida';
        newPatientBtn.classList.add('disabled');
    }

    // Disable export button
    const exportBtn = document.getElementById('exportPatientsBtn');
    if (exportBtn) {
        exportBtn.disabled = true;
        exportBtn.title = 'Función deshabilitada - Cuenta suspendida';
        exportBtn.classList.add('disabled');
    }

    // Disable edit and delete buttons in table (will be handled in displayPatients)
}

// Check if user is suspended
async function checkSuspendedStatus() {
    try {
        const response = await fetch('/api/doctor/profile', {
            credentials: 'include'
        });

        if (response.ok) {
            const data = await response.json();
            const doctor = data.doctor || data;
            
            // Check if suspended
            isSuspended = doctor.suspended || (doctor.activo === false && !doctor.is_admin);
            
            if (isSuspended) {
                showSuspendedWarning();
                disableModificationButtons();
            }
        }
    } catch (error) {
        console.error('Error checking suspended status:', error);
    }
}

// Show suspended warning banner
function showSuspendedWarning() {
    const warning = document.getElementById('suspendedWarning');
    if (warning) {
        warning.style.display = 'block';
    }
}

// Disable modification buttons for suspended users
function disableModificationButtons() {
    // Disable new patient button
    const newPatientBtn = document.getElementById('newPatientBtn');
    if (newPatientBtn) {
        newPatientBtn.disabled = true;
        newPatientBtn.title = 'Función deshabilitada - Cuenta suspendida';
        newPatientBtn.classList.add('disabled');
    }

    // Disable export button
    const exportBtn = document.getElementById('exportPatientsBtn');
    if (exportBtn) {
        exportBtn.disabled = true;
        exportBtn.title = 'Función deshabilitada - Cuenta suspendida';
        exportBtn.classList.add('disabled');
    }

    // Disable edit and delete buttons in table (will be handled in displayPatients)
}
