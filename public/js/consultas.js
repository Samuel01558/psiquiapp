// Consultas.js - Gestión de consultas médicas
let currentConsultations = [];
let currentPatients = [];
let currentPage = 1;
const consultationsPerPage = 10;
let isSuspended = false;

// Initialize when document is ready
$(document).ready(function() {
    checkSuspendedStatus();
    loadConsultations();
    loadPatients();
    setupEventHandlers();
    setDefaultDateTime();
});

// Setup event handlers
function setupEventHandlers() {
    // Search and filter functionality
    $('#searchConsultations').on('input', filterAndDisplayConsultations);
    $('#filterPatient').on('change', filterAndDisplayConsultations);
    $('#filterStatus').on('change', filterAndDisplayConsultations);
    $('#filterDate').on('change', filterAndDisplayConsultations);

    // Sidebar toggle for mobile
    $('#toggleSidebar').click(function() {
        $('#sidebar').toggleClass('show');
    });

    // Form submission
    $('#addConsultationForm').on('submit', function(e) {
        e.preventDefault();
        saveConsultation();
    });
}

// Set default date and time
function setDefaultDateTime() {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().slice(0, 5);
    
    $('#consultationDate').val(today);
    $('#consultationTime').val(currentTime);
}

// Load consultations from server
async function loadConsultations() {
    try {
        const response = await fetch('/api/consultas', {
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        // Handle different response formats
        if (Array.isArray(data)) {
            currentConsultations = data;
        } else if (data.consultas && Array.isArray(data.consultas)) {
            currentConsultations = data.consultas;
        } else if (data.data && Array.isArray(data.data)) {
            currentConsultations = data.data;
        } else {
            currentConsultations = [];
        }

        filterAndDisplayConsultations();
        
    } catch (error) {
        console.error('Error loading consultations:', error);
        showErrorMessage('Error al cargar las consultas');
        currentConsultations = [];
        displayConsultations([]);
    }
}

// Load patients for dropdowns
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

        populatePatientDropdowns();
        
    } catch (error) {
        console.error('Error loading patients:', error);
        currentPatients = [];
    }
}

// Populate patient dropdowns
function populatePatientDropdowns() {
    const filterSelect = $('#filterPatient');
    const consultationSelect = $('#consultationPatient');
    
    // Clear existing options except the first one
    filterSelect.find('option:not(:first)').remove();
    consultationSelect.find('option:not(:first)').remove();

    currentPatients.forEach(patient => {
        const optionText = `${patient.nombre} ${patient.apellido}`;
        const option = `<option value="${patient.id}">${optionText}</option>`;
        
        filterSelect.append(option);
        consultationSelect.append(option);
    });
}

// Filter and display consultations
function filterAndDisplayConsultations() {
    const searchTerm = $('#searchConsultations').val().toLowerCase();
    const patientFilter = $('#filterPatient').val();
    const statusFilter = $('#filterStatus').val();
    const dateFilter = $('#filterDate').val();

    let filteredConsultations = currentConsultations.filter(consultation => {
        // Search in patient name or consultation details
        const patientName = getPatientName(consultation.paciente_id);
        const matchesSearch = !searchTerm || 
            patientName.toLowerCase().includes(searchTerm) ||
            (consultation.motivo && consultation.motivo.toLowerCase().includes(searchTerm)) ||
            (consultation.notas && consultation.notas.toLowerCase().includes(searchTerm)) ||
            (consultation.id && consultation.id.toString().includes(searchTerm));

        const matchesPatient = !patientFilter || 
            consultation.paciente_id.toString() === patientFilter;

        const matchesStatus = !statusFilter || 
            (consultation.estado && consultation.estado.toLowerCase() === statusFilter);

        const matchesDate = !dateFilter || 
            (consultation.fecha_hora && consultation.fecha_hora.startsWith(dateFilter));

        return matchesSearch && matchesPatient && matchesStatus && matchesDate;
    });

    displayConsultations(filteredConsultations);
    updatePagination(filteredConsultations.length);
}

// Get patient name by ID
function getPatientName(patientId) {
    const patient = currentPatients.find(p => p.id === patientId);
    return patient ? `${patient.nombre} ${patient.apellido}` : 'Paciente no encontrado';
}

// Display consultations in table
function displayConsultations(consultations) {
    const tbody = $('#consultationsTableBody');
    tbody.empty();

    if (consultations.length === 0) {
        tbody.append(`
            <tr>
                <td colspan="7" class="text-center py-4">
                    <i class="fas fa-notes-medical fa-3x text-muted mb-3"></i>
                    <p class="text-muted mb-0">No se encontraron consultas</p>
                </td>
            </tr>
        `);
        return;
    }

    // Calculate pagination
    const startIndex = (currentPage - 1) * consultationsPerPage;
    const endIndex = startIndex + consultationsPerPage;
    const paginatedConsultations = consultations.slice(startIndex, endIndex);

    paginatedConsultations.forEach(consultation => {
        const statusBadge = getStatusBadge(consultation.estado);
        // Usar datos del JOIN del servidor si están disponibles
        const patientName = consultation.paciente_nombre && consultation.paciente_apellido ? 
            `${consultation.paciente_nombre} ${consultation.paciente_apellido}` : 
            getPatientName(consultation.paciente_id);
        
        // Construir fecha/hora desde fecha_consulta y hora_consulta
        let dateTime = 'No especificada';
        if (consultation.fecha_consulta && consultation.hora_consulta) {
            const fecha = new Date(consultation.fecha_consulta);
            dateTime = `${fecha.toLocaleDateString('es-ES')} ${consultation.hora_consulta}`;
        } else if (consultation.fecha_hora) {
            dateTime = new Date(consultation.fecha_hora).toLocaleString('es-ES');
        }
        
        const duration = consultation.duracion_minutos ? `${consultation.duracion_minutos} min` : '-';
        const type = getConsultationType(consultation.tipo);

        // Disable edit/delete buttons if suspended
        const editDisabled = isSuspended ? 'disabled' : '';
        const deleteDisabled = isSuspended ? 'disabled' : '';
        const editTitle = isSuspended ? 'Función deshabilitada - Cuenta suspendida' : 'Editar';
        const deleteTitle = isSuspended ? 'Función deshabilitada - Cuenta suspendida' : 'Eliminar';

        tbody.append(`
            <tr>
                <td><strong>#${consultation.id}</strong></td>
                <td>${patientName}</td>
                <td>${dateTime}</td>
                <td>${type}</td>
                <td>${statusBadge}</td>
                <td>${duration}</td>
                <td>
                    <div class="btn-group" role="group">
                        <button class="btn btn-sm btn-outline-primary" onclick="viewConsultation(${consultation.id})" title="Ver detalles">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-success" onclick="editConsultation(${consultation.id})" title="${editTitle}" ${editDisabled}>
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteConsultation(${consultation.id})" title="${deleteTitle}" ${deleteDisabled}>
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `);
    });
}

// Get consultation type label
function getConsultationType(type) {
    const types = {
        'consulta_inicial': 'Consulta Inicial',
        'seguimiento': 'Seguimiento',
        'urgencia': 'Urgencia',
        'terapia': 'Terapia'
    };
    return types[type] || type || 'No especificado';
}

// Get status badge HTML
function getStatusBadge(status) {
    if (!status) status = 'programada';
    
    const statusClasses = {
        'programada': 'badge-warning',
        'completada': 'badge-success',
        'cancelada': 'badge-danger'
    };

    const statusLabels = {
        'programada': 'Programada',
        'completada': 'Completada',
        'cancelada': 'Cancelada'
    };

    const badgeClass = statusClasses[status.toLowerCase()] || 'badge-secondary';
    const badgeLabel = statusLabels[status.toLowerCase()] || status;

    return `<span class="badge ${badgeClass}">${badgeLabel}</span>`;
}

// Update pagination
function updatePagination(totalConsultations) {
    const totalPages = Math.ceil(totalConsultations / consultationsPerPage);
    const pagination = $('#consultationsPagination');
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
    const totalPages = Math.ceil(currentConsultations.length / consultationsPerPage);
    if (page < 1 || page > totalPages) return;
    
    currentPage = page;
    filterAndDisplayConsultations();
}

// Show add consultation modal
function showAddConsultationModal() {
    $('#addConsultationModal').modal('show');
    $('#addConsultationForm')[0].reset();
    setDefaultDateTime();
}

// Show schedule modal (alias for add consultation)
function showScheduleModal() {
    showAddConsultationModal();
}

// Save consultation
async function saveConsultation() {
    const date = $('#consultationDate').val();
    const time = $('#consultationTime').val();
    const dateTime = date && time ? `${date} ${time}:00` : null;

    const formData = {
        paciente_id: parseInt($('#consultationPatient').val()),
        fecha_hora: dateTime,
        tipo: $('#consultationType').val(),
        duracion: parseInt($('#consultationDuration').val()) || 60,
        estado: $('#consultationStatus').val(),
        motivo: $('#consultationMotivo').val().trim(),
        notas: $('#consultationNotas').val().trim()
    };

    // Validation
    if (!formData.paciente_id || !formData.fecha_hora) {
        showErrorMessage('Por favor complete todos los campos obligatorios');
        return;
    }

    try {
        const response = await fetch('/api/consultas', {
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
            showSuccessMessage('Consulta guardada exitosamente');
            $('#addConsultationModal').modal('hide');
            loadConsultations(); // Reload the list
        } else {
            showErrorMessage(result.message || 'Error al guardar la consulta');
        }

    } catch (error) {
        console.error('Error saving consultation:', error);
        showErrorMessage(`Error al guardar la consulta: ${error.message}`);
    }
}

// View consultation details
async function viewConsultation(consultationId) {
    try {
        const response = await fetch(`/api/consultas/${consultationId}`, {
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (data.success && data.consulta) {
            const c = data.consulta;
            
            const modalContent = `
                <div class="consultation-details">
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <h5><i class="fas fa-user text-primary"></i> Paciente</h5>
                            <p class="mb-1">${c.paciente_nombre_completo || `${c.paciente_nombre || ''} ${c.paciente_apellido || ''}`.trim() || 'No especificado'}</p>
                        </div>
                        <div class="col-md-6">
                            <h5><i class="fas fa-calendar text-success"></i> Fecha</h5>
                            <p class="mb-1">${formatDate(c.fecha_consulta)}</p>
                        </div>
                    </div>
                    <div class="row mb-3">
                        <div class="col-12">
                            <h5><i class="fas fa-stethoscope text-info"></i> Motivo de Consulta</h5>
                            <div class="alert alert-light" style="white-space: pre-wrap;">${c.motivo_consulta || 'No especificado'}</div>
                        </div>
                    </div>
                    <div class="row mb-3">
                        <div class="col-12">
                            <h5><i class="fas fa-file-medical text-warning"></i> Diagnóstico Principal</h5>
                            <div class="alert alert-light" style="white-space: pre-wrap;">${c.diagnostico_principal || 'No especificado'}</div>
                        </div>
                    </div>
                    ${c.diagnostico_secundario ? `
                    <div class="row mb-3">
                        <div class="col-12">
                            <h5><i class="fas fa-file-medical-alt text-info"></i> Diagnóstico Secundario</h5>
                            <div class="alert alert-light" style="white-space: pre-wrap;">${c.diagnostico_secundario}</div>
                        </div>
                    </div>
                    ` : ''}
                    ${c.plan_tratamiento ? `
                    <div class="row mb-3">
                        <div class="col-12">
                            <h5><i class="fas fa-prescription text-success"></i> Plan de Tratamiento</h5>
                            <div class="alert alert-light" style="white-space: pre-wrap;">${c.plan_tratamiento}</div>
                        </div>
                    </div>
                    ` : ''}}
                    ${c.observaciones ? `
                    <div class="row">
                        <div class="col-12">
                            <h5><i class="fas fa-notes-medical text-secondary"></i> Observaciones</h5>
                            <div class="alert alert-light">${c.observaciones}</div>
                        </div>
                    </div>
                    ` : ''}
                </div>
            `;
            
            const modal = document.createElement('div');
            modal.className = 'modal fade';
            modal.id = 'viewConsultationModal';
            modal.innerHTML = `
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Detalle de Consulta</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            ${modalContent}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary px-4" data-bs-dismiss="modal" style="height: 38px; border-radius: 4px;">Cancelar</button>
                            <button type="button" class="btn btn-primary px-4" onclick="closeViewConsultModal(); editConsultation(${consultationId})" style="height: 38px; border-radius: 4px;">Editar</button>
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
            showErrorMessage('Consulta no encontrada');
        }
    } catch (error) {
        console.error('Error:', error);
        showErrorMessage('Error al cargar consulta');
    }
}

function closeViewConsultModal() {
    const modal = bootstrap.Modal.getInstance(document.getElementById('viewConsultationModal'));
    if (modal) modal.hide();
}

// Edit consultation
async function editConsultation(consultationId) {
    try {
        const response = await fetch(`/api/consultas/${consultationId}`, {
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (data.success && data.consulta) {
            const c = data.consulta;
            
            const formContent = `
                <form id="editConsultationForm">
                    <div class="row">
                        <div class="col-md-6">
                            <div class="form-group mb-3">
                                <label class="form-label">Paciente *</label>
                                <input type="text" class="form-control" value="${c.paciente_nombre_completo || c.paciente_nombre || 'Desconocido'}" disabled>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="form-group mb-3">
                                <label class="form-label">Fecha *</label>
                                <input type="date" class="form-control" id="edit_consulta_fecha" value="${c.fecha_consulta}" required>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="form-group mb-3">
                                <label class="form-label">Hora *</label>
                                <input type="time" class="form-control" id="edit_consulta_hora" value="${c.hora_consulta || ''}" required>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-6">
                            <div class="form-group mb-3">
                                <label class="form-label">Tipo de Consulta</label>
                                <select class="form-control" id="edit_consulta_tipo">
                                    <option value="Primera vez" ${c.tipo === 'Primera vez' ? 'selected' : ''}>Primera vez</option>
                                    <option value="Seguimiento" ${c.tipo === 'Seguimiento' ? 'selected' : ''}>Seguimiento</option>
                                    <option value="Crisis" ${c.tipo === 'Crisis' ? 'selected' : ''}>Crisis</option>
                                    <option value="Alta" ${c.tipo === 'Alta' ? 'selected' : ''}>Alta</option>
                                </select>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="form-group mb-3">
                                <label class="form-label">Duración (minutos)</label>
                                <input type="number" class="form-control" id="edit_consulta_duracion" value="${c.duracion_minutos || 60}" min="15" max="240">
                            </div>
                        </div>
                    </div>
                    <div class="form-group mb-3">
                        <label class="form-label">Motivo de Consulta</label>
                        <textarea class="form-control" id="edit_consulta_motivo" rows="3" placeholder="Describe el motivo de la consulta...">${c.motivo_consulta || ''}</textarea>
                    </div>
                    <div class="form-group mb-3">
                        <label class="form-label">Notas Adicionales</label>
                        <textarea class="form-control" id="edit_consulta_notas" rows="4" placeholder="Observaciones, diagnósticos, tratamientos, etc...">${c.observaciones || ''}</textarea>
                    </div>
                </form>
            `;
            
            const modal = document.createElement('div');
            modal.className = 'modal fade';
            modal.id = 'editConsultationModal';
            modal.innerHTML = `
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Editar Consulta</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            ${formContent}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary px-4" data-bs-dismiss="modal" style="height: 38px; border-radius: 4px;">Cancelar</button>
                            <button type="button" class="btn btn-primary px-4" onclick="saveConsultationChanges(${consultationId})" style="height: 38px; border-radius: 4px;">Guardar</button>
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
            showErrorMessage('Consulta no encontrada');
        }
    } catch (error) {
        console.error('Error:', error);
        showErrorMessage('Error al cargar consulta');
    }
}

async function saveConsultationChanges(consultationId) {
    const data = {
        fecha_consulta: document.getElementById('edit_consulta_fecha').value,
        hora_consulta: document.getElementById('edit_consulta_hora').value,
        duracion_minutos: parseInt(document.getElementById('edit_consulta_duracion').value) || 60,
        tipo: document.getElementById('edit_consulta_tipo').value,
        motivo_consulta: document.getElementById('edit_consulta_motivo').value.trim() || '',
        observaciones: document.getElementById('edit_consulta_notas').value.trim() || ''
    };
    
    if (!data.fecha_consulta || !data.hora_consulta) {
        showErrorMessage('Complete los campos obligatorios (Fecha y Hora)');
        return;
    }
    
    try {
        const response = await fetch(`/api/consultas/${consultationId}`, {
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
            showSuccessMessage('Consulta actualizada exitosamente');
            const modal = bootstrap.Modal.getInstance(document.getElementById('editConsultationModal'));
            if (modal) modal.hide();
            loadConsultations();
        } else {
            showErrorMessage(result.message || 'Error al actualizar');
        }
    } catch (error) {
        console.error('Error:', error);
        showErrorMessage('Error al actualizar consulta');
    }
}

// Delete consultation
async function deleteConsultation(consultationId) {
    if (!confirm('¿Está seguro de que desea eliminar esta consulta? Esta acción no se puede deshacer.')) {
        return;
    }

    try {
        const response = await fetch(`/api/consultas/${consultationId}`, {
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
            showSuccessMessage('Consulta eliminada exitosamente');
            loadConsultations(); // Reload the list
        } else {
            showErrorMessage(result.message || 'Error al eliminar la consulta');
        }

    } catch (error) {
        console.error('Error deleting consultation:', error);
        showErrorMessage('Error al eliminar la consulta');
    }
}

// Clear filters
function clearFilters() {
    $('#searchConsultations').val('');
    $('#filterPatient').val('');
    $('#filterStatus').val('');
    $('#filterDate').val('');
    filterAndDisplayConsultations();
}

// Export consultations
function exportConsultations() {
    // TODO: Implement export functionality
    showInfoMessage('Función de exportación próximamente');
}

// Refresh consultations
function refreshConsultations() {
    currentPage = 1;
    loadConsultations();
    showInfoMessage('Lista de consultas actualizada');
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
    // Disable new consultation button
    const newConsultationBtn = document.getElementById('newConsultationBtn');
    if (newConsultationBtn) {
        newConsultationBtn.disabled = true;
        newConsultationBtn.title = 'Función deshabilitada - Cuenta suspendida';
        newConsultationBtn.classList.add('disabled');
    }

    // Disable schedule appointment button
    const scheduleBtn = document.getElementById('scheduleAppointmentBtn');
    if (scheduleBtn) {
        scheduleBtn.disabled = true;
        scheduleBtn.title = 'Función deshabilitada - Cuenta suspendida';
        scheduleBtn.classList.add('disabled');
    }

    // Disable export button
    const exportBtn = document.getElementById('exportConsultationsBtn');
    if (exportBtn) {
        exportBtn.disabled = true;
        exportBtn.title = 'Función deshabilitada - Cuenta suspendida';
        exportBtn.classList.add('disabled');
    }
}
