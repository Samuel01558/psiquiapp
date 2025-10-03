// PsiquiApp - Dashboard JavaScript v4.0.0
// ✅ SIN FUNCIONES DUPLICADAS - Problema resuelto
console.log('🧠 PsiquiApp Dashboard v4.0.0 - FUNCIONES DUPLICADAS ELIMINADAS');

// ================================
// FUNCIONES GLOBALES - Definidas ANTES del DOMContentLoaded
// para que estén disponibles en los onclick del HTML
// ================================

// Funciones de modales
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
        modal.classList.add('show');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('show');
    }
}

function closeAllModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.style.display = 'none';
        modal.classList.remove('show');
    });
}

// Funciones de utilidad
function formatDate(dateString) {
    if (!dateString) return 'No especificado';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function calcularEdad(fechaNacimiento) {
    if (!fechaNacimiento) return 'N/A';
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
        edad--;
    }
    return edad;
}

function showAlert(message, type = 'info') {
    console.log(`🔔 ${message} (${type})`);
    const alertContainer = document.getElementById('alertContainer');
    if (!alertContainer) return;
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    const icons = {
        success: '<svg class="icon icon-sm" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>',
        error: '<svg class="icon icon-sm" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>',
        warning: '<svg class="icon icon-sm" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>',
        info: '<svg class="icon icon-sm" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path></svg>'
    };
    alert.innerHTML = `${icons[type] || icons.info}<span>${message}</span>`;
    alertContainer.appendChild(alert);
    setTimeout(() => alert.remove(), 5000);
}

function showCustomModal(title, content, buttons = []) {
    let modalHTML = `
        <div class="modal fade show" id="customModal" tabindex="-1" style="display: block; background: rgba(0,0,0,0.5);">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${title}</h5>
                        <button type="button" class="btn-close" onclick="closeModal('customModal')"></button>
                    </div>
                    <div class="modal-body">${content}</div>
                    <div class="modal-footer">`;
    
    buttons.forEach((btn, index) => {
        modalHTML += `<button type="button" class="btn ${btn.className}" id="customModalBtn${index}">${btn.text}</button>`;
    });
    
    modalHTML += `</div></div></div></div>`;
    
    const oldModal = document.getElementById('customModal');
    if (oldModal) oldModal.remove();
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    buttons.forEach((btn, index) => {
        const button = document.getElementById(`customModalBtn${index}`);
        if (button && btn.onClick) {
            button.addEventListener('click', btn.onClick);
        }
    });
    
    document.getElementById('customModal').addEventListener('click', function(e) {
        if (e.target.id === 'customModal') closeModal('customModal');
    });
}

function getEstadoColor(estado) {
    const colores = {
        'Pendiente': 'warning',
        'Confirmada': 'info',
        'Completada': 'success',
        'Cancelada': 'danger',
        'Activa': 'success',
        'Vencida': 'secondary'
    };
    return colores[estado] || 'secondary';
}

// ================================
// FUNCIONES DE PACIENTES
// ================================
function viewPaciente(id) {
    console.log(`👁️ Ver paciente ID: ${id}`);
    fetch(`/api/pacientes/${id}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const p = data.paciente;
                const edad = calcularEdad(p.fecha_nacimiento);
                const modalContent = `
                    <div class="patient-detail">
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
                        <div class="row">
                            <div class="col-12">
                                <h5><i class="fas fa-notes-medical text-info"></i> Notas</h5>
                                <div class="alert alert-light">${p.notas_generales || 'Sin notas'}</div>
                            </div>
                        </div>
                    </div>
                `;
                showCustomModal('Detalle del Paciente', modalContent, [
                    { text: 'Editar', className: 'btn-primary', onClick: () => { closeModal('customModal'); editPaciente(id); } },
                    { text: 'Cerrar', className: 'btn-secondary', onClick: () => closeModal('customModal') }
                ]);
            } else {
                showAlert('Error al cargar paciente', 'error');
            }
        })
        .catch(error => {
            console.error('❌ Error:', error);
            showAlert('Error al cargar información del paciente', 'error');
        });
}

function editPaciente(id) {
    console.log(`✏️ Editar paciente ID: ${id}`);
    fetch(`/api/pacientes/${id}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const p = data.paciente;
                const formContent = `
                    <form id="editPacienteForm">
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
                showCustomModal('Editar Paciente', formContent, [
                    { text: 'Guardar', className: 'btn-primary', onClick: () => savePacienteChanges(id) },
                    { text: 'Cancelar', className: 'btn-secondary', onClick: () => closeModal('customModal') }
                ]);
            } else {
                showAlert('Error al cargar paciente', 'error');
            }
        })
        .catch(error => {
            console.error('❌ Error:', error);
            showAlert('Error al cargar datos del paciente', 'error');
        });
}

function savePacienteChanges(id) {
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
        showAlert('Complete todos los campos obligatorios', 'warning');
        return;
    }
    
    fetch(`/api/pacientes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showAlert('Paciente actualizado exitosamente', 'success');
            closeModal('customModal');
            if (typeof loadPacientes === 'function') loadPacientes();
        } else {
            showAlert(data.message || 'Error al actualizar', 'error');
        }
    })
    .catch(error => {
        console.error('❌ Error:', error);
        showAlert('Error al actualizar paciente', 'error');
    });
}

function deletePaciente(id) {
    console.log(`🗑️ Eliminar paciente ID: ${id}`);
    if (confirm('¿Está seguro de eliminar este paciente?')) {
        fetch(`/api/pacientes/${id}`, { method: 'DELETE' })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showAlert('Paciente eliminado', 'success');
                if (typeof loadPacientes === 'function') loadPacientes();
            } else {
                showAlert(data.message || 'Error', 'error');
            }
        })
        .catch(error => {
            console.error('❌ Error:', error);
            showAlert('Error al eliminar', 'error');
        });
    }
}

// ================================
// FUNCIONES DE CITAS
// ================================
function viewCita(id) {
    console.log(`👁️ Ver cita ID: ${id}`);
    fetch(`/api/citas`)
        .then(response => response.json())
        .then(data => {
            const cita = data.citas.find(c => c.id == id);
            if (cita) {
                const modalContent = `
                    <div class="appointment-detail">
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <h5><i class="fas fa-user text-primary"></i> Paciente</h5>
                                <p class="mb-1"><strong>${cita.paciente_nombre} ${cita.paciente_apellido}</strong></p>
                            </div>
                            <div class="col-md-6">
                                <h5><i class="fas fa-calendar text-success"></i> Fecha y Hora</h5>
                                <p class="mb-1">${formatDate(cita.fecha_cita)} - ${cita.hora_cita}</p>
                            </div>
                        </div>
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <h5><i class="fas fa-tag text-info"></i> Tipo</h5>
                                <p class="mb-1">${cita.tipo}</p>
                            </div>
                            <div class="col-md-6">
                                <h5><i class="fas fa-info-circle text-warning"></i> Estado</h5>
                                <p class="mb-1"><span class="badge bg-${getEstadoColor(cita.estado)}">${cita.estado}</span></p>
                            </div>
                        </div>
                        ${cita.notas ? `<div class="row"><div class="col-12"><h5><i class="fas fa-sticky-note text-secondary"></i> Notas</h5><div class="alert alert-light">${cita.notas}</div></div></div>` : ''}
                    </div>
                `;
                showCustomModal('Detalle de Cita', modalContent, [
                    { text: 'Editar', className: 'btn-primary', onClick: () => { closeModal('customModal'); editCita(id); } },
                    { text: 'Cerrar', className: 'btn-secondary', onClick: () => closeModal('customModal') }
                ]);
            } else {
                showAlert('Cita no encontrada', 'error');
            }
        })
        .catch(error => {
            console.error('❌ Error:', error);
            showAlert('Error al cargar cita', 'error');
        });
}

function editCita(id) {
    console.log(`✏️ Editar cita ID: ${id}`);
    fetch(`/api/citas`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const cita = data.citas.find(c => c.id === parseInt(id));
                if (!cita) {
                    showAlert('Cita no encontrada', 'error');
                    return;
                }
                
                // Obtener lista de pacientes para el select
                fetch('/api/pacientes')
                    .then(r => r.json())
                    .then(pData => {
                        if (pData.success) {
                            const pacientesOptions = pData.pacientes.map(p => 
                                `<option value="${p.id}" ${p.id === cita.paciente_id ? 'selected' : ''}>${p.nombre} ${p.apellido}</option>`
                            ).join('');
                            
                            const formContent = `
                                <form id="editCitaForm">
                                    <div class="mb-3">
                                        <label class="form-label">Paciente *</label>
                                        <select class="form-select" id="edit_cita_paciente" required>
                                            ${pacientesOptions}
                                        </select>
                                    </div>
                                    <div class="row">
                                        <div class="col-md-6 mb-3">
                                            <label class="form-label">Fecha *</label>
                                            <input type="date" class="form-control" id="edit_cita_fecha" value="${cita.fecha_cita}" required>
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label class="form-label">Hora *</label>
                                            <input type="time" class="form-control" id="edit_cita_hora" value="${cita.hora_cita}" required>
                                        </div>
                                    </div>
                                    <div class="row">
                                        <div class="col-md-6 mb-3">
                                            <label class="form-label">Tipo *</label>
                                            <select class="form-select" id="edit_cita_tipo" required>
                                                <option value="Primera Vez" ${cita.tipo === 'Primera Vez' ? 'selected' : ''}>Primera Vez</option>
                                                <option value="Seguimiento" ${cita.tipo === 'Seguimiento' ? 'selected' : ''}>Seguimiento</option>
                                                <option value="Urgencia" ${cita.tipo === 'Urgencia' ? 'selected' : ''}>Urgencia</option>
                                            </select>
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label class="form-label">Estado *</label>
                                            <select class="form-select" id="edit_cita_estado" required>
                                                <option value="Pendiente" ${cita.estado === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
                                                <option value="Confirmada" ${cita.estado === 'Confirmada' ? 'selected' : ''}>Confirmada</option>
                                                <option value="Completada" ${cita.estado === 'Completada' ? 'selected' : ''}>Completada</option>
                                                <option value="Cancelada" ${cita.estado === 'Cancelada' ? 'selected' : ''}>Cancelada</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label">Notas</label>
                                        <textarea class="form-control" id="edit_cita_notas" rows="3">${cita.notas || ''}</textarea>
                                    </div>
                                </form>
                            `;
                            showCustomModal('Editar Cita', formContent, [
                                { text: 'Guardar', className: 'btn-primary', onClick: () => saveCitaChanges(id) },
                                { text: 'Cancelar', className: 'btn-secondary', onClick: () => closeModal('customModal') }
                            ]);
                        }
                    });
            } else {
                showAlert('Error al cargar cita', 'error');
            }
        })
        .catch(error => {
            console.error('❌ Error:', error);
            showAlert('Error al cargar cita', 'error');
        });
}

function deleteCita(id) {
    console.log(`🗑️ Eliminar cita ID: ${id}`);
    if (confirm('¿Eliminar esta cita?')) {
        fetch(`/api/citas/${id}`, { method: 'DELETE' })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showAlert('Cita eliminada', 'success');
                if (typeof loadCitas === 'function') loadCitas();
            } else {
                showAlert(data.message || 'Error', 'error');
            }
        })
        .catch(error => {
            console.error('❌ Error:', error);
            showAlert('Error al eliminar', 'error');
        });
    }
}

function saveCitaChanges(id) {
    const data = {
        paciente_id: document.getElementById('edit_cita_paciente').value,
        fecha_cita: document.getElementById('edit_cita_fecha').value,
        hora_cita: document.getElementById('edit_cita_hora').value,
        tipo: document.getElementById('edit_cita_tipo').value,
        estado: document.getElementById('edit_cita_estado').value,
        notas: document.getElementById('edit_cita_notas').value.trim()
    };
    
    if (!data.paciente_id || !data.fecha_cita || !data.hora_cita || !data.tipo || !data.estado) {
        showAlert('Complete todos los campos obligatorios', 'warning');
        return;
    }
    
    fetch(`/api/citas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showAlert('Cita actualizada exitosamente', 'success');
            closeModal('customModal');
            if (typeof loadCitas === 'function') loadCitas();
        } else {
            showAlert(data.message || 'Error al actualizar', 'error');
        }
    })
    .catch(error => {
        console.error('❌ Error:', error);
        showAlert('Error al actualizar cita', 'error');
    });
}

// Funciones básicas para Consultas y Recetas
function viewConsulta(id) {
    console.log(`👁️ Ver consulta ID: ${id}`);
    fetch(`/api/consultas/${id}`)
        .then(response => response.json())
        .then(data => {
            if (data.success && data.consulta) {
                const c = data.consulta;
                const modalContent = `
                    <div class="container-fluid">
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <h5><i class="fas fa-user text-primary"></i> Paciente</h5>
                                <p class="mb-1">${c.paciente_nombre || 'No especificado'}</p>
                            </div>
                            <div class="col-md-6">
                                <h5><i class="fas fa-calendar text-success"></i> Fecha</h5>
                                <p class="mb-1">${formatDate(c.fecha_consulta)}</p>
                            </div>
                        </div>
                        <div class="row mb-3">
                            <div class="col-12">
                                <h5><i class="fas fa-stethoscope text-info"></i> Motivo de Consulta</h5>
                                <div class="alert alert-light">${c.motivo_consulta || 'No especificado'}</div>
                            </div>
                        </div>
                        <div class="row mb-3">
                            <div class="col-12">
                                <h5><i class="fas fa-file-medical text-warning"></i> Diagnóstico</h5>
                                <div class="alert alert-light">${c.diagnostico || 'No especificado'}</div>
                            </div>
                        </div>
                        ${c.tratamiento ? `<div class="row mb-3"><div class="col-12"><h5><i class="fas fa-prescription text-success"></i> Tratamiento</h5><div class="alert alert-light">${c.tratamiento}</div></div></div>` : ''}
                        ${c.observaciones ? `<div class="row"><div class="col-12"><h5><i class="fas fa-notes-medical text-secondary"></i> Observaciones</h5><div class="alert alert-light">${c.observaciones}</div></div></div>` : ''}
                    </div>
                `;
                showCustomModal('Detalle de Consulta', modalContent, [
                    { text: 'Editar', className: 'btn-primary', onClick: () => { closeModal('customModal'); editConsulta(id); } },
                    { text: 'Cerrar', className: 'btn-secondary', onClick: () => closeModal('customModal') }
                ]);
            } else {
                showAlert('Consulta no encontrada', 'error');
            }
        })
        .catch(error => {
            console.error('❌ Error:', error);
            showAlert('Error al cargar consulta', 'error');
        });
}

function editConsulta(id) {
    console.log(`✏️ Editar consulta ID: ${id}`);
    fetch(`/api/consultas/${id}`)
        .then(response => response.json())
        .then(data => {
            if (data.success && data.consulta) {
                const c = data.consulta;
                const formContent = `
                    <form id="editConsultaForm">
                        <div class="mb-3">
                            <label class="form-label">Fecha *</label>
                            <input type="date" class="form-control" id="edit_consulta_fecha" value="${c.fecha_consulta}" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Motivo de Consulta *</label>
                            <textarea class="form-control" id="edit_consulta_motivo" rows="3" required>${c.motivo_consulta || ''}</textarea>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Diagnóstico *</label>
                            <textarea class="form-control" id="edit_consulta_diagnostico" rows="3" required>${c.diagnostico || ''}</textarea>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Tratamiento</label>
                            <textarea class="form-control" id="edit_consulta_tratamiento" rows="3">${c.tratamiento || ''}</textarea>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Observaciones</label>
                            <textarea class="form-control" id="edit_consulta_observaciones" rows="3">${c.observaciones || ''}</textarea>
                        </div>
                    </form>
                `;
                showCustomModal('Editar Consulta', formContent, [
                    { text: 'Guardar', className: 'btn-primary', onClick: () => saveConsultaChanges(id) },
                    { text: 'Cancelar', className: 'btn-secondary', onClick: () => closeModal('customModal') }
                ]);
            } else {
                showAlert('Error al cargar consulta', 'error');
            }
        })
        .catch(error => {
            console.error('❌ Error:', error);
            showAlert('Error al cargar consulta', 'error');
        });
}
function saveConsultaChanges(id) {
    const data = {
        fecha_consulta: document.getElementById('edit_consulta_fecha').value,
        motivo_consulta: document.getElementById('edit_consulta_motivo').value.trim(),
        diagnostico: document.getElementById('edit_consulta_diagnostico').value.trim(),
        tratamiento: document.getElementById('edit_consulta_tratamiento').value.trim(),
        observaciones: document.getElementById('edit_consulta_observaciones').value.trim()
    };
    
    if (!data.fecha_consulta || !data.motivo_consulta || !data.diagnostico) {
        showAlert('Complete todos los campos obligatorios', 'warning');
        return;
    }
    
    fetch(`/api/consultas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showAlert('Consulta actualizada exitosamente', 'success');
            closeModal('customModal');
            if (typeof loadConsultas === 'function') loadConsultas();
        } else {
            showAlert(data.message || 'Error al actualizar', 'error');
        }
    })
    .catch(error => {
        console.error('❌ Error:', error);
        showAlert('Error al actualizar consulta', 'error');
    });
}

function deleteConsulta(id) {
    if (confirm('¿Eliminar esta consulta?')) {
        fetch(`/api/consultas/${id}`, { method: 'DELETE' })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showAlert('Consulta eliminada exitosamente', 'success');
                if (typeof loadConsultas === 'function') loadConsultas();
            } else {
                showAlert(data.message || 'Error al eliminar', 'error');
            }
        })
        .catch(error => {
            console.error('❌ Error:', error);
            showAlert('Error al eliminar consulta', 'error');
        });
    }
}

function viewReceta(id) {
    console.log(`👁️ Ver receta ID: ${id}`);
    fetch(`/api/recetas/${id}`)
        .then(response => response.json())
        .then(data => {
            if (data.success && data.receta) {
                const r = data.receta;
                const modalContent = `
                    <div class="container-fluid">
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <h5><i class="fas fa-user text-primary"></i> Paciente</h5>
                                <p class="mb-1">${r.paciente_nombre || 'No especificado'}</p>
                            </div>
                            <div class="col-md-6">
                                <h5><i class="fas fa-calendar text-success"></i> Fecha</h5>
                                <p class="mb-1">${formatDate(r.fecha_prescripcion)}</p>
                            </div>
                        </div>
                        <div class="row mb-3">
                            <div class="col-12">
                                <h5><i class="fas fa-pills text-info"></i> Medicamentos</h5>
                                <div class="alert alert-light">${r.medicamentos || 'No especificado'}</div>
                            </div>
                        </div>
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <h5><i class="fas fa-clock text-warning"></i> Dosis</h5>
                                <p class="mb-1">${r.dosis || 'No especificada'}</p>
                            </div>
                            <div class="col-md-6">
                                <h5><i class="fas fa-calendar-alt text-danger"></i> Duración</h5>
                                <p class="mb-1">${r.duracion || 'No especificada'}</p>
                            </div>
                        </div>
                        ${r.indicaciones ? `<div class="row"><div class="col-12"><h5><i class="fas fa-file-prescription text-secondary"></i> Indicaciones</h5><div class="alert alert-light">${r.indicaciones}</div></div></div>` : ''}
                    </div>
                `;
                showCustomModal('Detalle de Receta', modalContent, [
                    { text: 'Editar', className: 'btn-primary', onClick: () => { closeModal('customModal'); editReceta(id); } },
                    { text: 'Cerrar', className: 'btn-secondary', onClick: () => closeModal('customModal') }
                ]);
            } else {
                showAlert('Receta no encontrada', 'error');
            }
        })
        .catch(error => {
            console.error('❌ Error:', error);
            showAlert('Error al cargar receta', 'error');
        });
}

function editReceta(id) {
    console.log(`✏️ Editar receta ID: ${id}`);
    fetch(`/api/recetas/${id}`)
        .then(response => response.json())
        .then(data => {
            if (data.success && data.receta) {
                const r = data.receta;
                const formContent = `
                    <form id="editRecetaForm">
                        <div class="mb-3">
                            <label class="form-label">Fecha de Prescripción *</label>
                            <input type="date" class="form-control" id="edit_receta_fecha" value="${r.fecha_prescripcion}" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Medicamentos *</label>
                            <textarea class="form-control" id="edit_receta_medicamentos" rows="3" required>${r.medicamentos || ''}</textarea>
                            <small class="form-text text-muted">Liste los medicamentos separados por coma</small>
                        </div>
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label class="form-label">Dosis *</label>
                                <input type="text" class="form-control" id="edit_receta_dosis" value="${r.dosis || ''}" required>
                                <small class="form-text text-muted">Ej: 50mg cada 12 horas</small>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label class="form-label">Duración *</label>
                                <input type="text" class="form-control" id="edit_receta_duracion" value="${r.duracion || ''}" required>
                                <small class="form-text text-muted">Ej: 30 días</small>
                            </div>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Indicaciones</label>
                            <textarea class="form-control" id="edit_receta_indicaciones" rows="3">${r.indicaciones || ''}</textarea>
                        </div>
                    </form>
                `;
                showCustomModal('Editar Receta', formContent, [
                    { text: 'Guardar', className: 'btn-primary', onClick: () => saveRecetaChanges(id) },
                    { text: 'Cancelar', className: 'btn-secondary', onClick: () => closeModal('customModal') }
                ]);
            } else {
                showAlert('Error al cargar receta', 'error');
            }
        })
        .catch(error => {
            console.error('❌ Error:', error);
            showAlert('Error al cargar receta', 'error');
        });
}
function saveRecetaChanges(id) {
    const data = {
        fecha_prescripcion: document.getElementById('edit_receta_fecha').value,
        medicamentos: document.getElementById('edit_receta_medicamentos').value.trim(),
        dosis: document.getElementById('edit_receta_dosis').value.trim(),
        duracion: document.getElementById('edit_receta_duracion').value.trim(),
        indicaciones: document.getElementById('edit_receta_indicaciones').value.trim()
    };
    
    if (!data.fecha_prescripcion || !data.medicamentos || !data.dosis || !data.duracion) {
        showAlert('Complete todos los campos obligatorios', 'warning');
        return;
    }
    
    fetch(`/api/recetas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showAlert('Receta actualizada exitosamente', 'success');
            closeModal('customModal');
            if (typeof loadRecetas === 'function') loadRecetas();
        } else {
            showAlert(data.message || 'Error al actualizar', 'error');
        }
    })
    .catch(error => {
        console.error('❌ Error:', error);
        showAlert('Error al actualizar receta', 'error');
    });
}

function deleteReceta(id) {
    if (confirm('¿Eliminar esta receta?')) {
        fetch(`/api/recetas/${id}`, { method: 'DELETE' })
        .then(response => response.json())
        .then(data => {
            if (data.success) showAlert('Receta eliminada exitosamente', 'success');
            else showAlert('Error', 'error');
        });
    }
}

function handleLogout() {
    fetch('/api/auth/logout', { method: 'POST' })
    .then(() => {
        localStorage.clear();
        window.location.href = '/login.html';
    });
}

function refreshDashboard() {
    console.log('🔄 Refrescando dashboard...');
    if (typeof loadDashboardData === 'function') loadDashboardData();
}

function crearDatosPrueba() {
    console.log('🌱 Crear datos de prueba...');
    showAlert('Función no disponible en esta vista', 'info');
}

// ================================
// EXPORTAR FUNCIONES A WINDOW (disponibles para onclick)
// ================================
window.openModal = openModal;
window.closeModal = closeModal;
window.viewPaciente = viewPaciente;
window.editPaciente = editPaciente;
window.deletePaciente = deletePaciente;
window.savePacienteChanges = savePacienteChanges;
window.viewCita = viewCita;
window.editCita = editCita;
window.deleteCita = deleteCita;
window.saveCitaChanges = saveCitaChanges;
window.viewConsulta = viewConsulta;
window.editConsulta = editConsulta;
window.deleteConsulta = deleteConsulta;
window.saveConsultaChanges = saveConsultaChanges;
window.viewReceta = viewReceta;
window.editReceta = editReceta;
window.deleteReceta = deleteReceta;
window.saveRecetaChanges = saveRecetaChanges;
window.logout = handleLogout;
window.refreshDashboard = refreshDashboard;
window.crearDatosPrueba = crearDatosPrueba;

console.log('✅ Funciones globales exportadas y listas para usar');

// ================================
// INICIO DEL CÓDIGO DOM-DEPENDENT
// ================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM Cargado - Inicializando dashboard...');
    
    // Inicializar dashboard
    initializeDashboard();
});

// ================================
// INICIALIZACIÓN DEL DASHBOARD
// ================================
function initializeDashboard() {
    console.log('📊 Inicializando Dashboard...');
    
    // Configurar event listeners inmediatamente
    setupEventListeners();
    
    // Cargar datos del dashboard
    loadDashboardData();
    
    // Verificar autenticación (sin redireccionar automáticamente)
    checkAuthentication();
}

// ================================
// CONFIGURACIÓN DE EVENT LISTENERS
// ================================
function setupEventListeners() {
    console.log('🔧 Configurando Event Listeners...');
    
    // Botones del sidebar - Solo interceptar enlaces con data-section
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    console.log(`Encontrados ${sidebarLinks.length} enlaces del sidebar`);
    
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const section = this.getAttribute('data-section');
            
            // Solo interceptar clics si el enlace tiene data-section (navegación interna)
            if (section) {
                e.preventDefault();
                console.log(`📍 Click en sidebar interno: ${section}`);
                navigateToSection(section);
            } else {
                // Para enlaces externos (href a otras páginas), permitir navegación normal
                console.log(`📍 Navegando a: ${this.getAttribute('href')}`);
                // No hacer preventDefault(), dejar que el navegador maneje la navegación
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
    
    // Función de logout global
    window.logout = function() {
        console.log('🔒 Ejecutando logout...');
        handleLogout();
    };
    
    console.log('✅ Event listeners configurados');
}

// ================================
// NAVEGACIÓN ENTRE SECCIONES
// ================================
function navigateToSection(section) {
    console.log(`🔄 Navegando a sección: ${section}`);
    
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
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    sidebarLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-section') === section) {
            link.classList.add('active');
        }
    });
}

function showSection(section) {
    // Ocultar todas las secciones
    const sections = document.querySelectorAll('.dashboard-section');
    sections.forEach(sec => {
        sec.style.display = 'none';
    });
    
    // Mostrar sección específica
    const targetSection = document.getElementById(`${section}Section`);
    if (targetSection) {
        targetSection.style.display = 'block';
        console.log(`✅ Mostrando sección: ${section}`);
    } else {
        console.log(`⚠️ Sección ${section} no encontrada, mostrando dashboard`);
        // Si no existe la sección, mostrar dashboard principal
        const dashboardSection = document.getElementById('dashboardSection');
        if (dashboardSection) {
            dashboardSection.style.display = 'block';
        }
    }
}

function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.classList.toggle('active');
    }
}

// ================================
// GESTIÓN DE MODALES
// ================================
function setupModalListeners() {
    console.log('🔧 Configurando modal listeners...');
    
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
    console.log(`📋 Abriendo modal: ${modalId}`);
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        console.log(`✅ Modal ${modalId} abierto`);
    } else {
        console.error(`❌ Modal ${modalId} no encontrado`);
    }
}

function closeModal(modalId) {
    console.log(`📋 Cerrando modal: ${modalId}`);
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
    console.log('📝 Configurando form listeners...');
    
    // Formulario de nuevo paciente
    const newPacienteForm = document.getElementById('newPacienteForm');
    if (newPacienteForm) {
        newPacienteForm.addEventListener('submit', handleNewPaciente);
        console.log('✅ Listener del formulario de pacientes configurado');
    } else {
        console.log('⚠️ Formulario de pacientes no encontrado');
    }
}

function handleNewPaciente(e) {
    e.preventDefault();
    console.log('📝 Enviando formulario de nuevo paciente...');
    
    const formData = new FormData(e.target);
    const pacienteData = {};
    
    // Convertir FormData a objeto
    for (let [key, value] of formData.entries()) {
        pacienteData[key] = value;
    }
    
    console.log('👤 Datos del paciente:', pacienteData);
    
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
        console.log('📤 Respuesta del servidor:', data);
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
// VERIFICACIÓN DE AUTENTICACIÓN
// ================================
function checkAuthentication() {
    console.log('🔐 Verificando autenticación...');
    
    fetch('/api/auth/check')
        .then(response => {
            if (!response.ok) {
                console.log('❌ Usuario no autenticado, redirigiendo a login...');
                window.location.href = '/login.html';
                return null;
            }
            return response.json();
        })
        .then(data => {
            if (data && data.user) {
                console.log('✅ Usuario autenticado:', data.user);
                updateUserInfo(data.user);
            }
        })
        .catch(error => {
            console.error('❌ Error verificando autenticación:', error);
            console.log('🔄 Redirigiendo a login por error...');
            window.location.href = '/login.html';
        });
}

function updateUserInfo(user) {
    console.log('👤 Actualizando info del usuario:', user);
    
    // Actualizar nombre del doctor
    const doctorNameElement = document.getElementById('doctorName');
    if (doctorNameElement && user.nombre) {
        const nombreCompleto = user.apellido ? `Dr. ${user.nombre} ${user.apellido}` : `Dr. ${user.nombre}`;
        doctorNameElement.textContent = nombreCompleto;
    }
    
    // Cargar perfil completo (incluyendo avatar)
    loadDoctorProfile();
}

function loadDoctorProfile() {
    console.log('👨‍⚕️ Cargando perfil del doctor...');
    
    fetch('/api/doctor/profile')
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al cargar perfil');
            }
            return response.json();
        })
        .then(data => {
            console.log('✅ Perfil del doctor cargado:', data);
            const doctor = data.doctor || data;
            updateDoctorAvatar(doctor);
            updateDoctorName(doctor);
            
            // Verificar si está suspendido
            if (doctor.suspended || (doctor.activo === false && !doctor.is_admin)) {
                showSuspendedWarning();
                disableModificationButtons();
            }
        })
        .catch(error => {
            console.error('❌ Error cargando perfil del doctor:', error);
            // Usar valores por defecto si hay error
            updateDoctorAvatar(null);
        });
}

function updateDoctorAvatar(doctor) {
    const avatarImg = document.querySelector('.navbar-nav img.rounded-circle');
    if (!avatarImg) return;
    
    if (doctor && doctor.avatar_url) {
        // Usar avatar del doctor si existe
        avatarImg.src = doctor.avatar_url;
        avatarImg.alt = `${doctor.nombre} ${doctor.apellido}`;
    } else {
        // Generar iniciales para el placeholder
        let iniciales = 'DR';
        if (doctor && doctor.nombre && doctor.apellido) {
            iniciales = (doctor.nombre.charAt(0) + doctor.apellido.charAt(0)).toUpperCase();
        }
        
        // Usar un SVG generado en lugar de placeholder externo
        const svg = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32'%3E%3Crect width='32' height='32' fill='%234A7C59'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial, sans-serif' font-size='14' fill='%23ffffff'%3E${iniciales}%3C/text%3E%3C/svg%3E`;
        avatarImg.src = svg;
        avatarImg.alt = doctor ? `${doctor.nombre} ${doctor.apellido}` : 'Doctor';
    }
    
    // Agregar manejo de error de carga de imagen
    avatarImg.onerror = function() {
        console.warn('⚠️ Error cargando avatar, usando placeholder');
        const iniciales = 'DR';
        const svg = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32'%3E%3Crect width='32' height='32' fill='%234A7C59'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial, sans-serif' font-size='14' fill='%23ffffff'%3E${iniciales}%3C/text%3E%3C/svg%3E`;
        this.src = svg;
        this.onerror = null; // Evitar loop infinito
    };
}

function updateDoctorName(doctor) {
    const doctorNameElement = document.getElementById('doctorName');
    if (doctorNameElement && doctor) {
        const nombreCompleto = `Dr. ${doctor.nombre} ${doctor.apellido}`;
        doctorNameElement.textContent = nombreCompleto;
    }

    // Mostrar menú de administración si es admin
    if (doctor && doctor.is_admin) {
        const adminMenuItem = document.getElementById('adminMenuItem');
        const adminDivider = document.getElementById('adminDivider');
        if (adminMenuItem) adminMenuItem.style.display = 'block';
        if (adminDivider) adminDivider.style.display = 'block';
    }
}

// Mostrar advertencia de cuenta suspendida
function showSuspendedWarning() {
    const warning = document.getElementById('suspendedWarning');
    if (warning) {
        warning.style.display = 'block';
    }
}

// Deshabilitar botones de modificación para usuarios suspendidos
function disableModificationButtons() {
    // Deshabilitar botón de crear datos de prueba
    const createTestDataBtn = document.getElementById('createTestDataBtn');
    if (createTestDataBtn) {
        createTestDataBtn.disabled = true;
        createTestDataBtn.title = 'Función deshabilitada - Cuenta suspendida';
        createTestDataBtn.classList.add('disabled');
    }
    
    // Nota: Los botones en otras páginas (Pacientes, Consultas, etc.) 
    // también deben ser deshabilitados en sus respectivos archivos JS
}

// ================================
// CARGA DE DATOS
// ================================
function loadDashboardData() {
    console.log('📈 Cargando datos del dashboard...');
    
    // Cargar estadísticas principales
    loadStats();
    
    // Cargar citas próximas
    loadCitas();
    
    // Cargar pacientes recientes
    loadPacientesRecientes();
}

function loadSectionData(section) {
    console.log(`📊 Cargando datos para sección: ${section}`);
    
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

function loadStats() {
    fetch('/api/stats')
        .then(response => {
            if (!response.ok) {
                if (response.status === 401) {
                    console.log('❌ No autorizado - redirigiendo a login');
                    window.location.href = '/login.html';
                    return;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('📊 Estadísticas cargadas:', data);
            updateStatsCards(data);
        })
        .catch(error => {
            console.error('❌ Error cargando estadísticas:', error);
            // Usar datos vacíos si hay error
            updateStatsCards({
                pacientes: 0,
                citas_hoy: 0,
                consultas_mes: 0,
                recetas_activas: 0
            });
        });
}

function loadPacientes() {
    console.log('👥 Cargando pacientes...');
    
    fetch('/api/pacientes')
        .then(response => response.json())
        .then(data => {
            console.log('👥 Pacientes cargados:', data);
            updatePacientesTable(data.pacientes || []);
        })
        .catch(error => {
            console.error('❌ Error cargando pacientes:', error);
            showAlert('Error cargando pacientes', 'error');
        });
}

function loadCitas() {
    console.log('📅 Cargando citas...');
    
    fetch('/api/citas/proximas')
        .then(response => {
            if (!response.ok) {
                if (response.status === 401) {
                    console.log('❌ No autorizado - redirigiendo a login');
                    window.location.href = '/login.html';
                    return null; // Importante: retornar null
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (!data) return; // Si es null (401), no continuar
            console.log('📅 Citas cargadas:', data);
            console.log('📅 Número de citas:', data.citas ? data.citas.length : 0);
            updateProximasCitas(data.citas || []);
        })
        .catch(error => {
            console.error('❌ Error cargando citas:', error);
            // Mostrar mensaje de no hay citas
            updateProximasCitas([]);
        });
}

function loadPacientesRecientes() {
    console.log('👥 Cargando pacientes recientes...');
    
    fetch('/api/pacientes/recientes')
        .then(response => {
            if (!response.ok) {
                if (response.status === 401) {
                    console.log('❌ No autorizado - redirigiendo a login');
                    window.location.href = '/login.html';
                    return null; // Importante: retornar null
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (!data) return; // Si es null (401), no continuar
            console.log('👥 Pacientes recientes cargados:', data);
            console.log('👥 Número de pacientes:', data.pacientes ? data.pacientes.length : 0);
            updatePacientesRecientes(data.pacientes || []);
        })
        .catch(error => {
            console.error('❌ Error cargando pacientes recientes:', error);
            // Mostrar mensaje de no hay pacientes
            updatePacientesRecientes([]);
        });
}

function loadConsultas() {
    console.log('🩺 Cargando consultas...');
    // Implementar carga de consultas
}

function loadRecetas() {
    console.log('💊 Cargando recetas...');
    // Implementar carga de recetas
}

function loadTests() {
    console.log('📋 Cargando tests...');
    // Implementar carga de tests
}

// ================================
// ACTUALIZACIÓN DE UI
// ================================
function updateStatsCards(stats) {
    console.log('📊 Actualizando tarjetas de estadísticas:', stats);
    
    const statElements = {
        'totalPacientes': stats.pacientes || 0,
        'citasHoy': stats.citas_hoy || 0,
        'consultasMes': stats.consultas_mes || 0,
        'recetasActivas': stats.recetas_activas || 0
    };
    
    Object.entries(statElements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    });
}

function updatePacientesTable(pacientes) {
    console.log('👥 Actualizando tabla de pacientes:', pacientes);
    
    const tableBody = document.querySelector('#pacientesTable tbody');
    if (!tableBody) {
        console.log('⚠️ Tabla de pacientes no encontrada');
        return;
    }
    
    tableBody.innerHTML = '';
    
    pacientes.forEach(paciente => {
        const row = createPacienteRow(paciente);
        tableBody.appendChild(row);
    });
}

function updateProximasCitas(citas) {
    console.log('📅 Actualizando próximas citas:', citas);
    console.log('📅 Tipo de datos:', typeof citas, 'Es array:', Array.isArray(citas));
    
    const container = document.getElementById('proximasCitas');
    if (!container) {
        console.error('❌ Contenedor proximasCitas no encontrado');
        return;
    }
    
    if (!citas || citas.length === 0) {
        console.log('ℹ️ No hay citas para mostrar');
        container.innerHTML = `
            <div class="text-center py-5 text-muted">
                <i class="bi bi-calendar-x fs-1 mb-3 d-block"></i>
                <p class="mb-0 fw-medium">No hay citas programadas</p>
            </div>
        `;
        return;
    }
    
    console.log(`✅ Mostrando ${citas.length} cita(s)`);
    
    const citasHtml = citas.map((cita, index) => {
        console.log(`📅 Procesando cita ${index + 1}:`, cita);
        
        // Manejar fecha_hora que puede venir en diferentes formatos
        let fecha;
        if (cita.fecha_hora) {
            fecha = new Date(cita.fecha_hora);
        } else if (cita.fecha_cita && cita.hora_cita) {
            // Combinar fecha y hora si vienen separadas
            const fechaStr = cita.fecha_cita.toString().split('T')[0];
            fecha = new Date(`${fechaStr}T${cita.hora_cita}`);
        } else {
            console.error('❌ Cita sin fecha válida:', cita);
            return '';
        }
        
        const fechaTexto = formatearFechaCita(fecha);
        const badgeClass = obtenerBadgeClaseFecha(fecha);
        const horaFormateada = formatTime(fecha);
        
        return `
            <div class="list-group-item list-group-item-action py-3">
                <div class="d-flex w-100 justify-content-between align-items-start">
                    <div class="flex-grow-1">
                        <div class="d-flex align-items-center mb-2">
                            <i class="bi bi-person-circle text-primary me-2"></i>
                            <h6 class="mb-0 fw-semibold">${cita.paciente_nombre} ${cita.paciente_apellido}</h6>
                        </div>
                        <div class="d-flex align-items-center text-muted small">
                            <i class="bi bi-clock me-1"></i>
                            <span class="me-3">${horaFormateada}</span>
                            <i class="bi bi-card-text me-1"></i>
                            <span>${cita.motivo || 'Consulta general'}</span>
                        </div>
                    </div>
                    <span class="badge ${badgeClass} rounded-pill px-3 py-2">${fechaTexto}</span>
                </div>
            </div>
        `;
    }).filter(html => html !== '').join('');
    
    if (citasHtml) {
        container.innerHTML = `<div class="list-group list-group-flush">${citasHtml}</div>`;
    } else {
        container.innerHTML = `
            <div class="text-center py-5 text-muted">
                <i class="bi bi-calendar-x fs-1 mb-3 d-block"></i>
                <p class="mb-0 fw-medium">No hay citas programadas</p>
            </div>
        `;
    }
}

function updatePacientesRecientes(pacientes) {
    console.log('👥 Actualizando pacientes recientes:', pacientes);
    
    const container = document.getElementById('pacientesRecientes');
    if (!container) return;
    
    if (pacientes.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5 text-muted">
                <i class="bi bi-person-x fs-1 mb-3 d-block"></i>
                <p class="mb-0 fw-medium">No hay pacientes registrados</p>
            </div>
        `;
        return;
    }
    
    const pacientesHtml = pacientes.map((paciente, index) => {
        const bgColors = ['primary', 'info', 'success', 'warning', 'secondary'];
        const bgColor = bgColors[index % bgColors.length];
        const fechaRegistro = new Date(paciente.fecha_registro);
        const diasDesdeRegistro = Math.floor((Date.now() - fechaRegistro.getTime()) / (1000 * 60 * 60 * 24));
        const fechaFormateada = fechaRegistro.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
        
        return `
            <div class="list-group-item list-group-item-action py-3">
                <div class="d-flex w-100 justify-content-between align-items-center">
                    <div class="d-flex align-items-center flex-grow-1">
                        <div class="rounded-circle bg-${bgColor}-subtle text-${bgColor} d-flex align-items-center justify-content-center me-3" style="width: 45px; height: 45px; font-size: 1.1rem;">
                            <i class="bi bi-person-fill"></i>
                        </div>
                        <div>
                            <h6 class="mb-1 fw-semibold">${paciente.nombre} ${paciente.apellido}</h6>
                            <div class="text-muted small">
                                <i class="bi bi-calendar-plus me-1"></i>
                                ${fechaFormateada} <span class="text-muted">· hace ${diasDesdeRegistro} día${diasDesdeRegistro !== 1 ? 's' : ''}</span>
                            </div>
                        </div>
                    </div>
                    <span class="badge ${diasDesdeRegistro <= 7 ? 'bg-success-subtle text-success' : 'bg-info-subtle text-info'} px-3 py-2">
                        ${diasDesdeRegistro <= 7 ? '<i class="bi bi-star-fill me-1"></i>Nuevo' : '<i class="bi bi-check-circle me-1"></i>Activo'}
                    </span>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = `<div class="list-group list-group-flush">${pacientesHtml}</div>`;
}

// Funciones auxiliares para formato de fechas
function formatearFechaCita(fecha) {
    const hoy = new Date();
    const manana = new Date(hoy);
    manana.setDate(hoy.getDate() + 1);
    
    if (fecha.toDateString() === hoy.toDateString()) {
        return 'Hoy';
    } else if (fecha.toDateString() === manana.toDateString()) {
        return 'Mañana';
    } else {
        return fecha.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
    }
}

function obtenerBadgeClaseFecha(fecha) {
    const hoy = new Date();
    const manana = new Date(hoy);
    manana.setDate(hoy.getDate() + 1);
    
    if (fecha.toDateString() === hoy.toDateString()) {
        return 'bg-primary-subtle text-primary';
    } else if (fecha.toDateString() === manana.toDateString()) {
        return 'bg-success-subtle text-success';
    } else {
        return 'bg-warning-subtle text-warning';
    }
}

function formatTime(fecha) {
    return fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
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

function calcularEdad(fechaNacimiento) {
    if (!fechaNacimiento) return 'N/A';
    
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
        edad--;
    }
    
    return edad;
}

function showCustomModal(title, content, buttons = []) {
    // Crear modal dinámico
    let modalHTML = `
        <div class="modal fade show" id="customModal" tabindex="-1" style="display: block; background: rgba(0,0,0,0.5);">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${title}</h5>
                        <button type="button" class="btn-close" onclick="closeModal('customModal')"></button>
                    </div>
                    <div class="modal-body">
                        ${content}
                    </div>
                    <div class="modal-footer">
    `;
    
    // Agregar botones personalizados
    buttons.forEach((btn, index) => {
        modalHTML += `<button type="button" class="btn ${btn.className}" id="customModalBtn${index}">${btn.text}</button>`;
    });
    
    modalHTML += `
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Eliminar modal anterior si existe
    const oldModal = document.getElementById('customModal');
    if (oldModal) {
        oldModal.remove();
    }
    
    // Agregar modal al body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Agregar event listeners a los botones
    buttons.forEach((btn, index) => {
        const button = document.getElementById(`customModalBtn${index}`);
        if (button && btn.onClick) {
            button.addEventListener('click', btn.onClick);
        }
    });
    
    // Cerrar con click fuera del modal
    document.getElementById('customModal').addEventListener('click', function(e) {
        if (e.target.id === 'customModal') {
            closeModal('customModal');
        }
    });
}

function showAlert(message, type = 'info') {
    console.log(`🔔 Mostrando alerta: ${message} (${type})`);
    
    const alertContainer = document.getElementById('alertContainer');
    if (!alertContainer) {
        console.error('❌ Container de alertas no encontrado');
        return;
    }
    
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
    
    // Obtener datos del paciente
    fetch(`/api/pacientes/${id}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const paciente = data.paciente;
                
                // Calcular edad
                const edad = calcularEdad(paciente.fecha_nacimiento);
                
                // Crear modal con información completa
                const modalContent = `
                    <div class="patient-detail">
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <h5><i class="fas fa-user text-primary"></i> Información Personal</h5>
                                <table class="table table-sm">
                                    <tr><td><strong>Nombre:</strong></td><td>${paciente.nombre} ${paciente.apellido}</td></tr>
                                    <tr><td><strong>Edad:</strong></td><td>${edad} años</td></tr>
                                    <tr><td><strong>Género:</strong></td><td>${paciente.genero === 'M' ? 'Masculino' : 'Femenino'}</td></tr>
                                    <tr><td><strong>Fecha Nac.:</strong></td><td>${formatDate(paciente.fecha_nacimiento)}</td></tr>
                                </table>
                            </div>
                            <div class="col-md-6">
                                <h5><i class="fas fa-address-book text-success"></i> Contacto</h5>
                                <table class="table table-sm">
                                    <tr><td><strong>Email:</strong></td><td>${paciente.email}</td></tr>
                                    <tr><td><strong>Teléfono:</strong></td><td>${paciente.telefono || 'No registrado'}</td></tr>
                                    <tr><td><strong>Dirección:</strong></td><td>${paciente.direccion || 'No registrada'}</td></tr>
                                </table>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-12">
                                <h5><i class="fas fa-notes-medical text-info"></i> Notas Generales</h5>
                                <div class="alert alert-light">
                                    ${paciente.notas_generales || 'Sin notas adicionales'}
                                </div>
                            </div>
                        </div>
                        <div class="row mt-3">
                            <div class="col-12 text-muted small">
                                <i class="fas fa-calendar"></i> Registrado: ${formatDate(paciente.fecha_registro)}
                            </div>
                        </div>
                    </div>
                `;
                
                // Mostrar en modal
                showCustomModal('Detalle del Paciente', modalContent, [
                    {
                        text: 'Editar',
                        className: 'btn-primary',
                        onClick: () => {
                            closeModal('customModal');
                            editPaciente(id);
                        }
                    },
                    {
                        text: 'Cerrar',
                        className: 'btn-secondary',
                        onClick: () => closeModal('customModal')
                    }
                ]);
            } else {
                showAlert('Error al cargar información del paciente', 'error');
            }
        })
        .catch(error => {
            console.error('❌ Error obteniendo paciente:', error);
            showAlert('Error al cargar información del paciente', 'error');
        });
}

function editPaciente(id) {
    console.log(`✏️ Editar paciente ID: ${id}`);
    
    // Obtener datos actuales del paciente
    fetch(`/api/pacientes/${id}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const paciente = data.paciente;
                
                // Crear formulario de edición
                const formContent = `
                    <form id="editPacienteForm" class="needs-validation" novalidate>
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label class="form-label">Nombre *</label>
                                <input type="text" class="form-control" id="edit_nombre" value="${paciente.nombre}" required>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label class="form-label">Apellido *</label>
                                <input type="text" class="form-control" id="edit_apellido" value="${paciente.apellido}" required>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label class="form-label">Email *</label>
                                <input type="email" class="form-control" id="edit_email" value="${paciente.email}" required>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label class="form-label">Teléfono</label>
                                <input type="tel" class="form-control" id="edit_telefono" value="${paciente.telefono || ''}">
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label class="form-label">Fecha Nacimiento *</label>
                                <input type="date" class="form-control" id="edit_fecha_nacimiento" value="${paciente.fecha_nacimiento}" required>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label class="form-label">Género *</label>
                                <select class="form-select" id="edit_genero" required>
                                    <option value="M" ${paciente.genero === 'M' ? 'selected' : ''}>Masculino</option>
                                    <option value="F" ${paciente.genero === 'F' ? 'selected' : ''}>Femenino</option>
                                </select>
                            </div>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Dirección</label>
                            <input type="text" class="form-control" id="edit_direccion" value="${paciente.direccion || ''}">
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Notas Generales</label>
                            <textarea class="form-control" id="edit_notas" rows="3">${paciente.notas_generales || ''}</textarea>
                        </div>
                    </form>
                `;
                
                showCustomModal('Editar Paciente', formContent, [
                    {
                        text: 'Guardar Cambios',
                        className: 'btn-primary',
                        onClick: () => savePacienteChanges(id)
                    },
                    {
                        text: 'Cancelar',
                        className: 'btn-secondary',
                        onClick: () => closeModal('customModal')
                    }
                ]);
            } else {
                showAlert('Error al cargar datos del paciente', 'error');
            }
        })
        .catch(error => {
            console.error('❌ Error obteniendo paciente:', error);
            showAlert('Error al cargar datos del paciente', 'error');
        });
}

function savePacienteChanges(id) {
    // Obtener valores del formulario
    const nombre = document.getElementById('edit_nombre').value.trim();
    const apellido = document.getElementById('edit_apellido').value.trim();
    const email = document.getElementById('edit_email').value.trim();
    const telefono = document.getElementById('edit_telefono').value.trim();
    const fecha_nacimiento = document.getElementById('edit_fecha_nacimiento').value;
    const genero = document.getElementById('edit_genero').value;
    const direccion = document.getElementById('edit_direccion').value.trim();
    const notas = document.getElementById('edit_notas').value.trim();
    
    // Validar campos requeridos
    if (!nombre || !apellido || !email || !fecha_nacimiento || !genero) {
        showAlert('Por favor complete todos los campos obligatorios', 'warning');
        return;
    }
    
    // Enviar actualización al servidor
    fetch(`/api/pacientes/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            nombre,
            apellido,
            email,
            telefono,
            fecha_nacimiento,
            genero,
            direccion,
            notas_generales: notas
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showAlert('Paciente actualizado exitosamente', 'success');
            closeModal('customModal');
            loadPacientes(); // Recargar lista
        } else {
            showAlert(data.message || 'Error al actualizar paciente', 'error');
        }
    })
    .catch(error => {
        console.error('❌ Error actualizando paciente:', error);
        showAlert('Error al actualizar paciente', 'error');
    });
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

/*
// ================================
// SECCIÓN DUPLICADA - COMENTADA PARA EVITAR CONFLICTOS
// ================================
// Las funciones de Citas, Consultas y Recetas ya están definidas arriba
// Esta sección duplicada estaba sobreescribiendo las funciones buenas
/*
function viewCita(id) {
    console.log(`👁️ Ver cita ID: ${id}`);
    
    fetch(`/api/citas`)
        .then(response => response.json())
        .then(data => {
            const cita = data.citas.find(c => c.id == id);
            
            if (cita) {
                const modalContent = `
                    <div class="appointment-detail">
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <h5><i class="fas fa-user text-primary"></i> Paciente</h5>
                                <p class="mb-1"><strong>${cita.paciente_nombre} ${cita.paciente_apellido}</strong></p>
                            </div>
                            <div class="col-md-6">
                                <h5><i class="fas fa-calendar text-success"></i> Fecha y Hora</h5>
                                <p class="mb-1">${formatDate(cita.fecha_cita)} - ${cita.hora_cita}</p>
                            </div>
                        </div>
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <h5><i class="fas fa-tag text-info"></i> Tipo</h5>
                                <p class="mb-1">${cita.tipo}</p>
                            </div>
                            <div class="col-md-6">
                                <h5><i class="fas fa-info-circle text-warning"></i> Estado</h5>
                                <p class="mb-1"><span class="badge bg-${getEstadoColor(cita.estado)}">${cita.estado}</span></p>
                            </div>
                        </div>
                        ${cita.notas ? `
                        <div class="row">
                            <div class="col-12">
                                <h5><i class="fas fa-sticky-note text-secondary"></i> Notas</h5>
                                <div class="alert alert-light">${cita.notas}</div>
                            </div>
                        </div>
                        ` : ''}
                    </div>
                `;
                
                showCustomModal('Detalle de Cita', modalContent, [
                    {
                        text: 'Editar',
                        className: 'btn-primary',
                        onClick: () => {
                            closeModal('customModal');
                            editCita(id);
                        }
                    },
                    {
                        text: 'Cerrar',
                        className: 'btn-secondary',
                        onClick: () => closeModal('customModal')
                    }
                ]);
            } else {
                showAlert('Cita no encontrada', 'error');
            }
        })
        .catch(error => {
            console.error('❌ Error obteniendo cita:', error);
            showAlert('Error al cargar información de la cita', 'error');
        });
}

function editCita(id) {
    console.log(`✏️ Editar cita ID: ${id}`);
    
    fetch(`/api/citas`)
        .then(response => response.json())
        .then(data => {
            const cita = data.citas.find(c => c.id == id);
            
            if (cita) {
                fetch('/api/pacientes')
                    .then(res => res.json())
                    .then(pacientesData => {
                        const pacientesOptions = pacientesData.pacientes.map(p => 
                            `<option value="${p.id}" ${p.id == cita.paciente_id ? 'selected' : ''}>${p.nombre} ${p.apellido}</option>`
                        ).join('');
                        
                        const formContent = `
                            <form id="editCitaForm">
                                <div class="mb-3">
                                    <label class="form-label">Paciente *</label>
                                    <select class="form-select" id="edit_cita_paciente" required>
                                        ${pacientesOptions}
                                    </select>
                                </div>
                                <div class="row">
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label">Fecha *</label>
                                        <input type="date" class="form-control" id="edit_cita_fecha" value="${cita.fecha_cita}" required>
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label">Hora *</label>
                                        <input type="time" class="form-control" id="edit_cita_hora" value="${cita.hora_cita}" required>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label">Tipo *</label>
                                        <select class="form-select" id="edit_cita_tipo" required>
                                            <option value="Primera vez" ${cita.tipo === 'Primera vez' ? 'selected' : ''}>Primera vez</option>
                                            <option value="Seguimiento" ${cita.tipo === 'Seguimiento' ? 'selected' : ''}>Seguimiento</option>
                                            <option value="Control" ${cita.tipo === 'Control' ? 'selected' : ''}>Control</option>
                                        </select>
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label">Estado *</label>
                                        <select class="form-select" id="edit_cita_estado" required>
                                            <option value="Pendiente" ${cita.estado === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
                                            <option value="Confirmada" ${cita.estado === 'Confirmada' ? 'selected' : ''}>Confirmada</option>
                                            <option value="Completada" ${cita.estado === 'Completada' ? 'selected' : ''}>Completada</option>
                                            <option value="Cancelada" ${cita.estado === 'Cancelada' ? 'selected' : ''}>Cancelada</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Notas</label>
                                    <textarea class="form-control" id="edit_cita_notas" rows="2">${cita.notas || ''}</textarea>
                                </div>
                            </form>
                        `;
                        
                        showCustomModal('Editar Cita', formContent, [
                            {
                                text: 'Guardar',
                                className: 'btn-primary',
                                onClick: () => saveCitaChanges(id)
                            },
                            {
                                text: 'Cancelar',
                                className: 'btn-secondary',
                                onClick: () => closeModal('customModal')
                            }
                        ]);
                    });
            } else {
                showAlert('Cita no encontrada', 'error');
            }
        })
        .catch(error => {
            console.error('❌ Error:', error);
            showAlert('Error al cargar cita', 'error');
        });
}

function saveCitaChanges(id) {
    const paciente_id = document.getElementById('edit_cita_paciente').value;
    const fecha_cita = document.getElementById('edit_cita_fecha').value;
    const hora_cita = document.getElementById('edit_cita_hora').value;
    const tipo = document.getElementById('edit_cita_tipo').value;
    const estado = document.getElementById('edit_cita_estado').value;
    const notas = document.getElementById('edit_cita_notas').value.trim();
    
    if (!paciente_id || !fecha_cita || !hora_cita) {
        showAlert('Complete los campos obligatorios', 'warning');
        return;
    }
    
    fetch(`/api/citas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paciente_id, fecha_cita, hora_cita, tipo, estado, notas })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showAlert('Cita actualizada exitosamente', 'success');
            closeModal('customModal');
            loadCitas();
        } else {
            showAlert(data.message || 'Error al actualizar', 'error');
        }
    })
    .catch(error => {
        console.error('❌ Error:', error);
        showAlert('Error al actualizar cita', 'error');
    });
}

function deleteCita(id) {
    console.log(`🗑️ Eliminar cita ID: ${id}`);
    
    if (confirm('¿Eliminar esta cita?')) {
        fetch(`/api/citas/${id}`, { method: 'DELETE' })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showAlert('Cita eliminada', 'success');
                loadCitas();
            } else {
                showAlert(data.message || 'Error al eliminar', 'error');
            }
        })
        .catch(error => {
            console.error('❌ Error:', error);
            showAlert('Error al eliminar cita', 'error');
        });
    }
}
*/
// FIN DE SECCIÓN DUPLICADA COMENTADA

// ================================
// FUNCIONES AUXILIARES
// ================================
function getEstadoColor(estado) {
    const colores = {
        'Pendiente': 'warning',
        'Confirmada': 'info',
        'Completada': 'success',
        'Cancelada': 'danger',
        'Activa': 'success',
        'Vencida': 'secondary'
    };
    return colores[estado] || 'secondary';
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
console.log('🌐 Configurando funciones globales...');

// Función para actualizar el dashboard
function refreshDashboard() {
    console.log('🔄 Actualizando dashboard...');
    
    // Mostrar animación en el botón
    const refreshButton = document.querySelector('[onclick="refreshDashboard()"]');
    if (refreshButton) {
        const originalContent = refreshButton.innerHTML;
        refreshButton.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Actualizando...';
        refreshButton.disabled = true;
        
        // Simular actualización
        setTimeout(() => {
            loadDashboardData();
            refreshButton.innerHTML = originalContent;
            refreshButton.disabled = false;
            
            // Mostrar mensaje de éxito
            console.log('✅ Dashboard actualizado');
        }, 1000);
    }
}

// Función para crear datos de prueba
function crearDatosPrueba() {
    console.log('🌱 Creando datos de prueba...');
    
    const button = document.getElementById('btnCrearDatos');
    if (!button) return;
    
    // Confirmar acción
    if (!confirm('¿Deseas crear datos de prueba?\n\nEsto agregará 4 pacientes y 3 citas de ejemplo.\n\nNOTA: Si ya existen datos de prueba, no se crearán duplicados.')) {
        return;
    }
    
    const originalContent = button.innerHTML;
    button.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Creando...';
    button.disabled = true;
    
    fetch('/api/seed-data', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        console.log('✅ Respuesta:', data);
        
        if (data.success) {
            // Mostrar alerta de éxito
            alert(`¡Datos creados exitosamente!\n\n✅ ${data.detalles.pacientes} pacientes\n✅ ${data.detalles.citas} citas programadas`);
            
            // Actualizar dashboard
            loadDashboardData();
            
            // Ocultar el botón después de crear datos
            button.style.display = 'none';
        } else if (data.alreadyExists) {
            // Informar que ya existen datos sin duplicar
            alert(`ℹ️ Datos de Prueba Ya Existen\n\n${data.message}\n\nPacientes de prueba encontrados: ${data.existingCount}\n\nPara crear nuevos datos, elimina primero los pacientes con email @test.com desde la sección de Pacientes.`);
            button.innerHTML = originalContent;
            button.disabled = false;
            
            // Actualizar dashboard para mostrar datos existentes
            loadDashboardData();
        } else {
            alert('Error al crear datos: ' + data.message);
            button.innerHTML = originalContent;
            button.disabled = false;
        }
    })
    .catch(error => {
        console.error('❌ Error:', error);
        alert('Error al crear datos de prueba. Verifica la consola para más detalles.');
        button.innerHTML = originalContent;
        button.disabled = false;
    });
}

window.openModal = openModal;
window.closeModal = closeModal;
window.viewPaciente = viewPaciente;
window.editPaciente = editPaciente;
window.deletePaciente = deletePaciente;
window.viewCita = viewCita;
window.editCita = editCita;
window.deleteCita = deleteCita;
window.viewConsulta = viewConsulta;
window.editConsulta = editConsulta;
window.deleteConsulta = deleteConsulta;
window.viewReceta = viewReceta;
window.editReceta = editReceta;
window.deleteReceta = deleteReceta;
window.logout = handleLogout;
window.refreshDashboard = refreshDashboard;
window.crearDatosPrueba = crearDatosPrueba;

console.log('✅ PsiquiApp Dashboard JavaScript cargado completamente');
