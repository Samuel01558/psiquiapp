// Recetas.js - Gestión de recetas médicas v4.1.2
let currentPrescriptions = [];
let currentPatients = [];
let currentPage = 1;
const prescriptionsPerPage = 10;
const itemsPerPage = prescriptionsPerPage; // Alias for compatibility with HTML code

// Global variables for HTML compatibility
let prescriptionsData = [];
let filteredPrescriptions = [];
let patientsData = [];
let medicationsData = [];

// Initialize when document is ready
$(document).ready(function() {
    loadPrescriptions();
    loadPatients();
    setupEventHandlers();
    setDefaultDate();
});

// Print prescription
async function printPrescription(prescriptionId) {
    try {
        const response = await fetch(`/api/recetas/${prescriptionId}`, {
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (data.success && data.receta) {
            const r = data.receta;
            
            // Create print window
            const printWindow = window.open('', '_blank', 'width=800,height=600');
            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Receta M\u00e9dica - ${r.paciente_nombre || 'Paciente'}</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 40px; }
                        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
                        .header h1 { margin: 0; color: #2c5f7c; }
                        .header p { margin: 5px 0; color: #666; }
                        .section { margin-bottom: 25px; }
                        .section h3 { color: #2c5f7c; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
                        .info-row { display: flex; margin: 10px 0; }
                        .info-label { font-weight: bold; width: 150px; }
                        .medications { background: #f9f9f9; padding: 15px; border-radius: 5px; white-space: pre-wrap; }
                        .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #999; }
                        @media print {
                            body { padding: 20px; }
                            .no-print { display: none; }
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>PsiquiApp</h1>
                        <p>Sistema de Gesti\u00f3n Psiqui\u00e1trica</p>
                        <p><strong>Receta M\u00e9dica</strong></p>
                    </div>
                    
                    <div class="section">
                        <h3>Informaci\u00f3n del Paciente</h3>
                        <div class="info-row">
                            <span class="info-label">Paciente:</span>
                            <span>${r.paciente_nombre || 'Desconocido'}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Fecha:</span>
                            <span>${formatDate(r.fecha_receta)}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Receta #:</span>
                            <span>${r.id}</span>
                        </div>
                    </div>
                    
                    <div class="section">
                        <h3>Medicamentos Prescritos</h3>
                        <div class="medications">${r.medicamentos || 'No especificado'}</div>
                    </div>
                    
                    <div class="section">
                        <h3>Instrucciones Generales</h3>
                        <div class="medications">${r.instrucciones_generales || 'No especificado'}</div>
                    </div>
                    
                    ${r.notas_doctor ? `
                    <div class="section">
                        <h3>Notas del Doctor</h3>
                        <div class="medications">${r.notas_doctor}</div>
                    </div>
                    ` : ''}
                    
                    <div class="footer">
                        <p>Documento generado por PsiquiApp - ${new Date().toLocaleDateString()}</p>
                        <p>Este documento es una receta m\u00e9dica oficial</p>
                    </div>
                    
                    <div class="no-print" style="text-align: center; margin-top: 30px;">
                        <button onclick="window.print()" style="padding: 10px 30px; background: #2c5f7c; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">Imprimir</button>
                        <button onclick="window.close()" style="padding: 10px 30px; background: #666; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; margin-left: 10px;">Cerrar</button>
                    </div>
                </body>
                </html>
            `);
            printWindow.document.close();
        } else {
            showErrorMessage('Receta no encontrada');
        }
    } catch (error) {
        console.error('Error al imprimir:', error);
        showErrorMessage('Error al cargar la receta para imprimir');
    }
}

// Setup event handlers
function setupEventHandlers() {
    // Search and filter functionality
    $('#searchPrescriptions').on('input', filterAndDisplayPrescriptions);
    $('#filterPatient').on('change', filterAndDisplayPrescriptions);
    $('#filterStatus').on('change', filterAndDisplayPrescriptions);
    $('#filterDate').on('change', filterAndDisplayPrescriptions);

    // Sidebar toggle for mobile
    $('#toggleSidebar').click(function() {
        $('#sidebar').toggleClass('show');
    });

    // Form submission
    $('#addPrescriptionForm').on('submit', function(e) {
        e.preventDefault();
        savePrescription();
    });
}

// Set default date
function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    $('#prescriptionDate').val(today);
}

// Load prescriptions from server
async function loadPrescriptions() {
    try {
        const response = await fetch('/api/recetas', {
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        // Handle different response formats
        if (Array.isArray(data)) {
            currentPrescriptions = data;
        } else if (data.recetas && Array.isArray(data.recetas)) {
            currentPrescriptions = data.recetas;
        } else if (data.data && Array.isArray(data.data)) {
            currentPrescriptions = data.data;
        } else {
            currentPrescriptions = [];
        }

        // Update global variable for HTML compatibility
        prescriptionsData = currentPrescriptions;

        filterAndDisplayPrescriptions();
        
    } catch (error) {
        console.error('Error loading prescriptions:', error);
        showErrorMessage('Error al cargar las recetas');
        currentPrescriptions = [];
        displayPrescriptions([]);
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

        // Update global variable for HTML compatibility
        patientsData = currentPatients;

        populatePatientDropdowns();
        
    } catch (error) {
        console.error('Error loading patients:', error);
        currentPatients = [];
    }
}

// Populate patient dropdowns
function populatePatientDropdowns() {
    const filterSelect = $('#filterPatient');
    const prescriptionSelect = $('#prescriptionPatient');
    
    // Clear existing options except the first one
    filterSelect.find('option:not(:first)').remove();
    prescriptionSelect.find('option:not(:first)').remove();

    currentPatients.forEach(patient => {
        const optionText = `${patient.nombre} ${patient.apellido}`;
        const option = `<option value="${patient.id}">${optionText}</option>`;
        
        filterSelect.append(option);
        prescriptionSelect.append(option);
    });
}

// Filter and display prescriptions
function filterAndDisplayPrescriptions() {
    const searchTerm = $('#searchPrescriptions').val().toLowerCase();
    const patientFilter = $('#filterPatient').val();
    const statusFilter = $('#filterStatus').val();
    const dateFilter = $('#filterDate').val();

    let filteredPrescriptions = currentPrescriptions.filter(prescription => {
        // Search in patient name, medication, or prescription details
        const patientName = getPatientName(prescription.paciente_id);
        const matchesSearch = !searchTerm || 
            patientName.toLowerCase().includes(searchTerm) ||
            (prescription.medicamento && prescription.medicamento.toLowerCase().includes(searchTerm)) ||
            (prescription.dosis && prescription.dosis.toLowerCase().includes(searchTerm)) ||
            (prescription.instrucciones && prescription.instrucciones.toLowerCase().includes(searchTerm)) ||
            (prescription.id && prescription.id.toString().includes(searchTerm));

        const matchesPatient = !patientFilter || 
            prescription.paciente_id.toString() === patientFilter;

        const matchesStatus = !statusFilter || 
            (prescription.estado && prescription.estado.toLowerCase() === statusFilter);

        const matchesDate = !dateFilter || 
            (prescription.fecha_prescripcion && prescription.fecha_prescripcion.startsWith(dateFilter));

        return matchesSearch && matchesPatient && matchesStatus && matchesDate;
    });

    // Update global variable for HTML compatibility
    window.filteredPrescriptions = filteredPrescriptions;

    displayPrescriptions(filteredPrescriptions);
    updatePagination(filteredPrescriptions.length);
}

// Get patient name by ID
function getPatientName(patientId) {
    const patient = currentPatients.find(p => p.id === patientId);
    return patient ? `${patient.nombre} ${patient.apellido}` : 'Paciente no encontrado';
}

// Display prescriptions in table
function displayPrescriptions(prescriptions) {
    const tbody = $('#prescriptionsTableBody');
    tbody.empty();

    if (prescriptions.length === 0) {
        tbody.append(`
            <tr>
                <td colspan="8" class="text-center py-4">
                    <i class="fas fa-prescription-bottle-alt fa-3x text-muted mb-3"></i>
                    <p class="text-muted mb-0">No se encontraron recetas</p>
                </td>
            </tr>
        `);
        return;
    }

    // Calculate pagination
    const startIndex = (currentPage - 1) * prescriptionsPerPage;
    const endIndex = startIndex + prescriptionsPerPage;
    const paginatedPrescriptions = prescriptions.slice(startIndex, endIndex);

    paginatedPrescriptions.forEach(prescription => {
        const statusBadge = getStatusBadge(prescription.estado);
        const patientName = prescription.paciente_nombre && prescription.paciente_apellido ? 
            `${prescription.paciente_nombre} ${prescription.paciente_apellido}` : 
            getPatientName(prescription.paciente_id);
        const date = prescription.fecha_receta ? 
            new Date(prescription.fecha_receta).toLocaleDateString('es-ES') : 
            'No especificada';
        
        // El servidor devuelve medicamentos como TEXT combinado
        const medicamento = prescription.medicamentos || 'No especificado';

        tbody.append(`
            <tr>
                <td><strong>#${prescription.id}</strong></td>
                <td>${patientName}</td>
                <td><strong>${medicamento}</strong></td>
                <td>${date}</td>
                <td>${statusBadge}</td>
                <td>
                    <div class="btn-group" role="group">
                        <button class="btn btn-sm btn-outline-primary" onclick="viewPrescription(${prescription.id})" title="Ver detalles">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-success" onclick="editPrescription(${prescription.id})" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-info" onclick="printPrescription(${prescription.id})" title="Imprimir">
                            <i class="fas fa-print"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deletePrescription(${prescription.id})" title="Eliminar">
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
    if (!status) status = 'activa';
    
    const statusClasses = {
        'activa': 'badge-success',
        'completada': 'badge-info',
        'cancelada': 'badge-danger',
        'vencida': 'badge-warning'
    };

    const statusLabels = {
        'activa': 'Activa',
        'completada': 'Completada',
        'cancelada': 'Cancelada',
        'vencida': 'Vencida'
    };

    const badgeClass = statusClasses[status.toLowerCase()] || 'badge-secondary';
    const badgeLabel = statusLabels[status.toLowerCase()] || status;

    return `<span class="badge ${badgeClass}">${badgeLabel}</span>`;
}

// Update pagination
function updatePagination(totalPrescriptions) {
    const totalPages = Math.ceil(totalPrescriptions / prescriptionsPerPage);
    const pagination = $('#prescriptionsPagination');
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
    const totalPages = Math.ceil(currentPrescriptions.length / prescriptionsPerPage);
    if (page < 1 || page > totalPages) return;
    
    currentPage = page;
    filterAndDisplayPrescriptions();
}

// Show add prescription modal
function showAddPrescriptionModal() {
    $('#addPrescriptionModal').modal('show');
    $('#addPrescriptionForm')[0].reset();
    setDefaultDate();
}

// Save prescription
async function savePrescription() {
    const formData = {
        paciente_id: parseInt($('#prescriptionPatient').val()),
        fecha_prescripcion: $('#prescriptionDate').val(),
        medicamento: $('#prescriptionMedication').val().trim(),
        dosis: $('#prescriptionDosis').val().trim(),
        frecuencia: $('#prescriptionFrecuencia').val(),
        duracion: parseInt($('#prescriptionDuracion').val()) || null,
        cantidad: $('#prescriptionCantidad').val().trim(),
        instrucciones: $('#prescriptionInstrucciones').val().trim(),
        notas: $('#prescriptionNotas').val().trim(),
        estado: $('#prescriptionStatus').val() || 'activa'
    };

    // Validation
    if (!formData.paciente_id || !formData.fecha_prescripcion || !formData.medicamento || 
        !formData.dosis || !formData.frecuencia) {
        showErrorMessage('Por favor complete todos los campos obligatorios');
        return;
    }

    try {
        const response = await fetch('/api/recetas', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success) {
            showSuccessMessage('Receta guardada exitosamente');
            $('#addPrescriptionModal').modal('hide');
            loadPrescriptions(); // Reload the list
        } else {
            showErrorMessage(result.message || 'Error al guardar la receta');
        }

    } catch (error) {
        console.error('Error saving prescription:', error);
        showErrorMessage('Error al guardar la receta');
    }
}

// View prescription details
async function viewPrescription(prescriptionId) {
    try {
        const response = await fetch(`/api/recetas/${prescriptionId}`, {
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (data.success && data.receta) {
            const r = data.receta;
            
            // Format patient name
            const pacienteNombre = r.paciente_nombre_completo || 
                                   `${r.paciente_nombre || ''} ${r.paciente_apellido || ''}`.trim() || 
                                   'Paciente desconocido';
            
            const modalContent = `
                <div class="prescription-details">
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <h5><i class="fas fa-user text-primary"></i> Paciente</h5>
                            <p class="mb-1">${pacienteNombre}</p>
                        </div>
                        <div class="col-md-6">
                            <h5><i class="fas fa-calendar text-success"></i> Fecha de Receta</h5>
                            <p class="mb-1">${formatDate(r.fecha_receta)}</p>
                        </div>
                    </div>
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <h5><i class="fas fa-info-circle text-info"></i> Estado</h5>
                            <p class="mb-1"><span class="badge bg-${r.estado === 'Activa' ? 'success' : r.estado === 'Surtida' ? 'primary' : 'secondary'}">${r.estado || 'Activa'}</span></p>
                        </div>
                    </div>
                    <div class="row mb-3">
                        <div class="col-12">
                            <h5><i class="fas fa-pills text-info"></i> Medicamentos Prescritos</h5>
                            <div class="alert alert-light" style="white-space: pre-wrap;">${r.medicamentos || 'No especificado'}</div>
                        </div>
                    </div>
                    ${r.instrucciones_generales ? `
                    <div class="row mb-3">
                        <div class="col-12">
                            <h5><i class="fas fa-file-prescription text-warning"></i> Instrucciones Generales</h5>
                            <div class="alert alert-light" style="white-space: pre-wrap;">${r.instrucciones_generales}</div>
                        </div>
                    </div>
                    ` : ''}
                    ${r.notas_doctor ? `
                    <div class="row">
                        <div class="col-12">
                            <h5><i class="fas fa-notes-medical text-secondary"></i> Notas del Doctor</h5>
                            <div class="alert alert-light" style="white-space: pre-wrap;">${r.notas_doctor}</div>
                        </div>
                    </div>
                    ` : ''}
                </div>
            `;
            
            const modal = document.createElement('div');
            modal.className = 'modal fade';
            modal.id = 'viewPrescriptionModal';
            modal.innerHTML = `
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Detalle de Receta</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            ${modalContent}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary px-4" data-bs-dismiss="modal" style="height: 38px; border-radius: 4px;">Cancelar</button>
                            <button type="button" class="btn btn-primary px-4" onclick="closeViewPrescModal(); editPrescription(${prescriptionId})" style="height: 38px; border-radius: 4px;">Editar</button>
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
            showErrorMessage('Receta no encontrada');
        }
    } catch (error) {
        console.error('Error:', error);
        showErrorMessage('Error al cargar receta');
    }
}

function closeViewPrescModal() {
    const modal = bootstrap.Modal.getInstance(document.getElementById('viewPrescriptionModal'));
    if (modal) modal.hide();
}

// Edit prescription
async function editPrescription(prescriptionId) {
    try {
        const response = await fetch(`/api/recetas/${prescriptionId}`, {
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (data.success && data.receta) {
            const r = data.receta;
            
            const formContent = `
                <form id="editPrescriptionForm">
                    <div class="mb-3">
                        <label class="form-label">Fecha de Receta *</label>
                        <input type="date" class="form-control" id="edit_receta_fecha" value="${r.fecha_receta}" required>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Medicamentos Prescritos *</label>
                        <textarea class="form-control" id="edit_receta_medicamentos" rows="4" required>${r.medicamentos || ''}</textarea>
                        <small class="form-text text-muted">Incluya: nombre del medicamento, dosis, frecuencia y duración. Ej: "Fluoxetina 20mg - 1 cápsula cada 24 horas - 30 días"</small>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Instrucciones Generales</label>
                        <textarea class="form-control" id="edit_receta_instrucciones" rows="3">${r.instrucciones_generales || ''}</textarea>
                        <small class="form-text text-muted">Instrucciones generales para el paciente (ej: tomar con alimentos, evitar alcohol, etc.)</small>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Notas del Doctor</label>
                        <textarea class="form-control" id="edit_receta_notas" rows="2">${r.notas_doctor || ''}</textarea>
                        <small class="form-text text-muted">Notas internas o recordatorios</small>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Estado</label>
                        <select class="form-select" id="edit_receta_estado">
                            <option value="Activa" ${r.estado === 'Activa' ? 'selected' : ''}>Activa</option>
                            <option value="Surtida" ${r.estado === 'Surtida' ? 'selected' : ''}>Surtida</option>
                            <option value="Vencida" ${r.estado === 'Vencida' ? 'selected' : ''}>Vencida</option>
                            <option value="Cancelada" ${r.estado === 'Cancelada' ? 'selected' : ''}>Cancelada</option>
                        </select>
                    </div>
                </form>
            `;
            
            const modal = document.createElement('div');
            modal.className = 'modal fade';
            modal.id = 'editPrescriptionModal';
            modal.innerHTML = `
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Editar Receta</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            ${formContent}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary px-4" data-bs-dismiss="modal" style="height: 38px; border-radius: 4px;">Cancelar</button>
                            <button type="button" class="btn btn-primary px-4" onclick="savePrescriptionChanges(${prescriptionId})" style="height: 38px; border-radius: 4px;">Guardar</button>
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
            showErrorMessage('Receta no encontrada');
        }
    } catch (error) {
        console.error('Error:', error);
        showErrorMessage('Error al cargar receta');
    }
}

async function savePrescriptionChanges(prescriptionId) {
    const data = {
        fecha_receta: document.getElementById('edit_receta_fecha').value,
        medicamentos: document.getElementById('edit_receta_medicamentos').value.trim(),
        instrucciones_generales: document.getElementById('edit_receta_instrucciones').value.trim(),
        notas_doctor: document.getElementById('edit_receta_notas').value.trim(),
        estado: document.getElementById('edit_receta_estado').value
    };
    
    if (!data.fecha_receta || !data.medicamentos) {
        showErrorMessage('La fecha y los medicamentos son obligatorios');
        return;
    }
    
    try {
        const response = await fetch(`/api/recetas/${prescriptionId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        if (result.success) {
            showSuccessMessage('Receta actualizada exitosamente');
            const modal = bootstrap.Modal.getInstance(document.getElementById('editPrescriptionModal'));
            if (modal) modal.hide();
            loadPrescriptions();
        } else {
            showErrorMessage(result.message || 'Error al actualizar');
        }
    } catch (error) {
        console.error('Error:', error);
        showErrorMessage('Error al actualizar receta');
    }
}

// Delete prescription
async function deletePrescription(prescriptionId) {
    if (!confirm('¿Está seguro de que desea eliminar esta receta? Esta acción no se puede deshacer.')) {
        return;
    }

    try {
        const response = await fetch(`/api/recetas/${prescriptionId}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success) {
            showSuccessMessage('Receta eliminada exitosamente');
            loadPrescriptions(); // Reload the list
        } else {
            showErrorMessage(result.message || 'Error al eliminar la receta');
        }

    } catch (error) {
        console.error('Error deleting prescription:', error);
        showErrorMessage('Error al eliminar la receta');
    }
}

// Show medications modal
function showMedicationsModal() {
    // TODO: Implement medications management
    showInfoMessage('Gestión de medicamentos - Funcionalidad próximamente');
}

// Clear filters
function clearFilters() {
    $('#searchPrescriptions').val('');
    $('#filterPatient').val('');
    $('#filterStatus').val('');
    $('#filterDate').val('');
    filterAndDisplayPrescriptions();
}

// Export prescriptions
function exportPrescriptions() {
    // TODO: Implement export functionality
    showInfoMessage('Función de exportación próximamente');
}

// Refresh prescriptions
function refreshPrescriptions() {
    currentPage = 1;
    loadPrescriptions();
    showInfoMessage('Lista de recetas actualizada');
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
