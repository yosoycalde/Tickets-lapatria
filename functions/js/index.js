document.addEventListener('DOMContentLoaded', function () {
    initializeApp();
});

const categoriaPrioridad = {
    '1': 'media',
    '2': 'media',
    '3': 'alta',
    '4': 'alta',
    '5': 'baja',
    '6': 'media',
    '7': 'baja'
};

function initializeApp() {
    const form = document.getElementById('ticketForm');
    if (form) {
        form.addEventListener('submit', handleSubmit);
    }

    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', clearMessages);
    });

    initializePriorityAutomation();
    handleImagePreview();
    initializeRealTimeValidation();
}

// ========================================
// NUEVA FUNCIÓN: VALIDACIÓN EN TIEMPO REAL
// ========================================
function initializeRealTimeValidation() {
    // Validación del nombre
    const nombreInput = document.getElementById('nombre');
    if (nombreInput) {
        addValidationFeedback(nombreInput, 'nombre');
        nombreInput.addEventListener('input', function () {
            validateField(this, 'nombre');
        });
        nombreInput.addEventListener('blur', function () {
            validateField(this, 'nombre');
        });
    }

    // Validación del email
    const emailInput = document.getElementById('email');
    if (emailInput) {
        addValidationFeedback(emailInput, 'email');
        emailInput.addEventListener('input', function () {
            validateField(this, 'email');
        });
        emailInput.addEventListener('blur', function () {
            validateField(this, 'email');
        });
    }

    // Validación del departamento
    const departamentoSelect = document.getElementById('departamento');
    if (departamentoSelect) {
        addValidationFeedback(departamentoSelect, 'departamento');
        departamentoSelect.addEventListener('change', function () {
            validateField(this, 'departamento');
        });
    }

    // Validación de categoría
    const categoriaSelect = document.getElementById('categoria');
    if (categoriaSelect) {
        addValidationFeedback(categoriaSelect, 'categoria');
        categoriaSelect.addEventListener('change', function () {
            validateField(this, 'categoria');
        });
    }

    // Validación del título
    const tituloInput = document.getElementById('titulo');
    if (tituloInput) {
        addValidationFeedback(tituloInput, 'titulo');
        tituloInput.addEventListener('input', function () {
            validateField(this, 'titulo');
            updateCharCounter(this, 200);
        });
        tituloInput.addEventListener('blur', function () {
            validateField(this, 'titulo');
        });
        addCharCounter(tituloInput, 200);
    }

    // Validación de la descripción
    const descripcionInput = document.getElementById('descripcion');
    if (descripcionInput) {
        addValidationFeedback(descripcionInput, 'descripcion');
        descripcionInput.addEventListener('input', function () {
            validateField(this, 'descripcion');
            updateCharCounter(this, 2000);
        });
        descripcionInput.addEventListener('blur', function () {
            validateField(this, 'descripcion');
        });
        addCharCounter(descripcionInput, 2000);
    }
}

function addValidationFeedback(element, fieldType) {
    const formGroup = element.closest('.form-group');
    if (!formGroup) return;

    // Crear contenedor de feedback si no existe
    let feedbackContainer = formGroup.querySelector('.validation-feedback');
    if (!feedbackContainer) {
        feedbackContainer = document.createElement('div');
        feedbackContainer.className = 'validation-feedback';
        formGroup.appendChild(feedbackContainer);
    }

    // Crear icono de validación si no existe
    let validationIcon = formGroup.querySelector('.validation-icon');
    if (!validationIcon) {
        validationIcon = document.createElement('span');
        validationIcon.className = 'validation-icon';
        element.parentNode.insertBefore(validationIcon, element.nextSibling);
    }
}

function validateField(element, fieldType) {
    const value = element.value.trim();
    const formGroup = element.closest('.form-group');
    const feedbackContainer = formGroup.querySelector('.validation-feedback');
    const validationIcon = formGroup.querySelector('.validation-icon');

    let isValid = true;
    let message = '';

    // Limpiar estados anteriores
    element.classList.remove('is-valid', 'is-invalid', 'is-warning');
    feedbackContainer.className = 'validation-feedback';
    validationIcon.className = 'validation-icon';

    switch (fieldType) {
        case 'nombre':
            if (value === '') {
                isValid = false;
                message = 'El nombre es requerido';
            } else if (value.length < 3) {
                isValid = false;
                message = 'El nombre debe tener al menos 3 caracteres';
            } else if (value.length > 100) {
                isValid = false;
                message = 'El nombre no puede exceder 100 caracteres';
            } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value)) {
                isValid = false;
                message = 'El nombre solo puede contener letras';
            } else {
                message = '✓ Nombre válido';
            }
            break;

        case 'email':
            if (value === '') {
                isValid = false;
                message = 'El correo electrónico es requerido';
            } else if (!isValidEmail(value)) {
                isValid = false;
                message = 'Formato de correo electrónico no válido';
            } else if (value.length > 150) {
                isValid = false;
                message = 'El correo no puede exceder 150 caracteres';
            } else {
                message = '✓ Correo válido';
            }
            break;

        case 'departamento':
            if (value === '') {
                isValid = false;
                message = 'Debes seleccionar un departamento';
            } else {
                message = '✓ Departamento seleccionado';
            }
            break;

        case 'categoria':
            if (value === '') {
                isValid = false;
                message = 'Debes seleccionar una categoría';
            } else {
                message = '✓ Categoría seleccionada';
            }
            break;

        case 'titulo':
            if (value === '') {
                isValid = false;
                message = 'El título es requerido';
            } else if (value.length < 5) {
                isValid = false;
                message = 'El título debe tener al menos 5 caracteres';
            } else if (value.length > 200) {
                isValid = false;
                message = 'El título no puede exceder 200 caracteres';
            } else if (value.length < 10) {
                element.classList.add('is-warning');
                message = '⚠ El título es muy corto, considera ser más descriptivo';
                feedbackContainer.classList.add('warning');
                validationIcon.innerHTML = '⚠';
                validationIcon.classList.add('warning');
                feedbackContainer.textContent = message;
                return;
            } else {
                message = '✓ Título válido';
            }
            break;

        case 'descripcion':
            if (value === '') {
                isValid = false;
                message = 'La descripción es requerida';
            } else if (value.length < 10) {
                isValid = false;
                message = 'La descripción debe tener al menos 10 caracteres';
            } else if (value.length > 2000) {
                isValid = false;
                message = 'La descripción no puede exceder 2000 caracteres';
            } else if (value.length < 30) {
                element.classList.add('is-warning');
                message = '⚠ La descripción es muy corta, agrega más detalles';
                feedbackContainer.classList.add('warning');
                validationIcon.innerHTML = '⚠';
                validationIcon.classList.add('warning');
                feedbackContainer.textContent = message;
                return;
            } else {
                message = '✓ Descripción válida';
            }
            break;
    }

    // Aplicar estilos según validación
    if (isValid) {
        element.classList.add('is-valid');
        feedbackContainer.classList.add('success');
        validationIcon.innerHTML = '✓';
        validationIcon.classList.add('success');
    } else {
        element.classList.add('is-invalid');
        feedbackContainer.classList.add('error');
        validationIcon.innerHTML = '✗';
        validationIcon.classList.add('error');
    }

    feedbackContainer.textContent = message;

    // Animación suave
    feedbackContainer.style.opacity = '0';
    setTimeout(() => {
        feedbackContainer.style.opacity = '1';
    }, 10);
}

function addCharCounter(element, maxLength) {
    const formGroup = element.closest('.form-group');
    let counter = formGroup.querySelector('.char-counter');

    if (!counter) {
        counter = document.createElement('div');
        counter.className = 'char-counter';
        formGroup.appendChild(counter);
    }

    updateCharCounter(element, maxLength);
}

function updateCharCounter(element, maxLength) {
    const formGroup = element.closest('.form-group');
    const counter = formGroup.querySelector('.char-counter');

    if (!counter) return;

    const currentLength = element.value.length;
    const remaining = maxLength - currentLength;
    const percentage = (currentLength / maxLength) * 100;

    counter.textContent = `${currentLength} / ${maxLength} caracteres`;

    // Cambiar color según el porcentaje usado
    counter.classList.remove('warning', 'danger', 'normal');

    if (percentage >= 90) {
        counter.classList.add('danger');
    } else if (percentage >= 70) {
        counter.classList.add('warning');
    } else {
        counter.classList.add('normal');
    }
}


function initializePriorityAutomation() {
    const categoriaSelect = document.getElementById('categoria');
    const prioridadSelect = document.getElementById('prioridad');

    if (categoriaSelect && prioridadSelect) {
        prioridadSelect.disabled = true;
        prioridadSelect.style.opacity = '0.7';
        prioridadSelect.style.cursor = 'not-allowed';

        prioridadSelect.title = 'La prioridad se asigna automáticamente según la categoría seleccionada';

        categoriaSelect.addEventListener('change', function () {
            const categoriaSeleccionada = this.value;

            if (categoriaSeleccionada) {
                setPrioridadAutomatica(categoriaSeleccionada);
            } else {
                prioridadSelect.value = 'media';
            }
        });
    }
}

function setPrioridadAutomatica(categoriaId) {
    const prioridadSelect = document.getElementById('prioridad');
    const nuevaPrioridad = categoriaPrioridad[categoriaId];

    if (nuevaPrioridad && prioridadSelect) {
        prioridadSelect.value = nuevaPrioridad;

        const prioridadGroup = prioridadSelect.closest('.form-group');
        if (prioridadGroup) {
            prioridadGroup.style.transform = 'scale(1.02)';
            prioridadGroup.style.transition = 'transform 0.2s ease';

            setTimeout(() => {
                prioridadGroup.style.transform = 'scale(1)';
            }, 200);
        }

        const categoriaName = getCategoryName(categoriaId);
        showMessage(`Prioridad establecida como "${nuevaPrioridad.toUpperCase()}"para problemas de ${categoriaName}.`, 'info');
        setTimeout(() => {
            hideMessage();
        }, 3000);
    }
}

function getCategoryName(categoriaId) {
    const categorias = {
        '1': 'Soporte Técnico',
        '2': 'Contapyme',
        '3': 'Ineditto',
        '4': 'Red e Internet',
        '5': 'Computador',
        '6': 'Otros'
    };
    return categorias[categoriaId] || 'Desconocida';
}

function handleImagePreview() {
    const imageInput = document.getElementById('imagen');
    if (imageInput) {
        imageInput.addEventListener('change', function (e) {
            const file = e.target.files[0];
            const fileNameSpan = document.querySelector('.file-name');
            const filePreview = document.querySelector('.file-preview');
            const imagePreview = document.getElementById('imagePreview');
            const wrapper = document.querySelector('.file-input-wrapper');

            if (file) {
                const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
                if (!validTypes.includes(file.type)) {
                    showMessage('Por favor selecciona una imagen válida (JPG, PNG o GIF)', 'error');
                    imageInput.value = '';
                    return;
                }

                const maxSize = 5 * 1024 * 1024;
                if (file.size > maxSize) {
                    showMessage('La imagen no puede superar los 5MB', 'error');
                    imageInput.value = '';
                    return;
                }

                fileNameSpan.textContent = file.name;
                wrapper.classList.add('has-file');

                const reader = new FileReader();
                reader.onload = function (e) {
                    imagePreview.src = e.target.result;
                    filePreview.style.display = 'block';
                };
                reader.readAsDataURL(file);

                showMessage('Imagen cargada correctamente', 'success');
            }
        });
    }
}

function removeImage() {
    const imageInput = document.getElementById('imagen');
    const fileNameSpan = document.querySelector('.file-name');
    const filePreview = document.querySelector('.file-preview');
    const imagePreview = document.getElementById('imagePreview');
    const wrapper = document.querySelector('.file-input-wrapper');

    if (imageInput) {
        imageInput.value = '';
        fileNameSpan.textContent = '';
        imagePreview.src = '';
        filePreview.style.display = 'none';
        wrapper.classList.remove('has-file');

        showMessage('Imagen eliminada', 'info');
    }
}

function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });

    const targetTab = document.getElementById(tabName);
    if (targetTab) {
        targetTab.classList.add('active');
    }

    event.target.classList.add('active');
    clearMessages();
}

async function handleSubmit(event) {
    event.preventDefault();

    const submitBtn = document.querySelector('.submit-btn');
    const btnText = document.querySelector('.btn-text');
    const btnLoading = document.querySelector('.btn-loading');

    setLoadingState(submitBtn, btnText, btnLoading, true);
    const formData = new FormData(event.target);

    if (!validateForm(formData)) {
        setLoadingState(submitBtn, btnText, btnLoading, false);
        return;
    }

    try {
        const response = await fetch('functions/php/procesar_tickets.php', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            showMessage('¡Ticket creado exitosamente! ID: ' + result.ticket_id, 'success');
            document.getElementById('ticketForm').reset();
            removeImage();
            clearAutoSave();

            const prioridadSelect = document.getElementById('prioridad');
            if (prioridadSelect) {
                prioridadSelect.value = 'media';
            }

            document.querySelectorAll('.is-valid, .is-invalid, .is-warning').forEach(el => {
                el.classList.remove('is-valid', 'is-invalid', 'is-warning');
            });
            document.querySelectorAll('.validation-feedback').forEach(el => {
                el.textContent = '';
                el.className = 'validation-feedback';
            });
            document.querySelectorAll('.validation-icon').forEach(el => {
                el.innerHTML = '';
                el.className = 'validation-icon';
            });

            setTimeout(() => {
                showMessage('Recibirás una confirmación por correo electrónico. Puedes consultar el estado de tu ticket en la pestaña "Consultar Tickets".', 'info');
            }, 2000);
        } else {
            showMessage('Error al crear el ticket: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Error de conexión. Por favor, intenta nuevamente.', 'error');
    } finally {
        setLoadingState(submitBtn, btnText, btnLoading, false);
    }
}

function validateForm(formData) {
    const requiredFields = ['nombre', 'email', 'categoria', 'titulo', 'descripcion'];
    const errors = [];

    for (let field of requiredFields) {
        if (!formData.get(field) || formData.get(field).trim() === '') {
            errors.push(`El campo ${getFieldLabel(field)} es requerido`);
        }
    }

    const email = formData.get('email');
    if (email && !isValidEmail(email)) {
        errors.push('El formato del correo electrónico no es válido');
    }

    if (formData.get('titulo') && formData.get('titulo').length > 200) {
        errors.push('El título no puede exceder 200 caracteres');
    }

    if (formData.get('descripcion') && formData.get('descripcion').length > 2000) {
        errors.push('La descripción no puede exceder 2000 caracteres');
    }

    const imagen = formData.get('imagen');
    if (imagen && imagen.size > 0) {
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        if (!validTypes.includes(imagen.type)) {
            errors.push('El archivo debe ser una imagen válida (JPG, PNG o GIF)');
        }

        const maxSize = 5 * 1024 * 1024;
        if (imagen.size > maxSize) {
            errors.push('La imagen no puede superar los 5MB');
        }
    }

    if (errors.length > 0) {
        showMessage('Por favor corrige los siguientes errores: \n• ' + errors.join('\n• '), 'error');
        return false;
    }

    return true;
}

function getFieldLabel(fieldName) {
    const labels = {
        'nombre': 'Nombre',
        'email': 'Email',
        'categoria': 'Categoría',
        'titulo': 'Título',
        'descripcion': 'Descripción'
    };
    return labels[fieldName] || fieldName;
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

async function consultarTickets() {
    const email = document.getElementById('emailConsulta').value.trim();

    if (!email) {
        showMessage('Por favor ingresa tu correo electrónico', 'error');
        return;
    }

    const resultContainer = document.getElementById('ticketsResults');
    resultContainer.innerHTML = '<div class="loading">Buscando tickets...</div>';

    try {
        const response = await fetch(`functions/php/consultar_tickets.php?email=${encodeURIComponent(email)}`);
        const result = await response.json();

        if (result.success) {
            displayTickets(result.tickets);
        } else {
            resultContainer.innerHTML = '<div class="no-tickets">No se encontraron tickets para este correo electrónico.</div>';
        }

    } catch (error) {
        console.error('Error:', error);
        resultContainer.innerHTML = '<div class="error">Error al consultar los tickets. Por favor, intenta nuevamente.</div>';
    }
}

function displayTickets(tickets) {
    const container = document.getElementById('ticketsResults');

    if (!tickets || tickets.length === 0) {
        container.innerHTML = '<div class="no-tickets">No tienes tickets registrados.</div>';
        return;
    }

    let html = '<h3>Tus Tickets:</h3>';

    tickets.forEach(ticket => {
        const statusClass = `status-${ticket.estado.toLowerCase().replace(' ', '-')}`;
        const priorityClass = `priority-${ticket.prioridad.toLowerCase()}`;

        html += `
            <div class="ticket-card ${priorityClass}" onclick="showTicketDetails(${ticket.id})">
                <div class="ticket-header">
                    <div class="ticket-id">Ticket #${ticket.id}</div>
                    <span class="ticket-status ${statusClass}">${ticket.estado}</span>
                </div>
                <div class="ticket-title">${escapeHtml(ticket.titulo)}</div>
                <div class="ticket-meta">
                    <span>Prioridad: ${ticket.prioridad}</span>
                    <span>Categoría: ${ticket.categoria_nombre}</span>
                    <span>Fecha: ${formatDate(ticket.fecha_creacion)}</span>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

async function showTicketDetails(ticketId) {
    try {
        const response = await fetch(`functions/php/detalles_ticket.php?id=${ticketId}`);
        const result = await response.json();

        if (result.success) {
            displayTicketModal(result.ticket);
        } else {
            showMessage('Error al cargar los detalles del ticket', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Error al cargar los detalles del ticket', 'error');
    }
}

function displayTicketModal(ticket) {
    const modal = document.getElementById('ticketModal');
    const details = document.getElementById('ticketDetails');

    const statusClass = `status-${ticket.estado.toLowerCase().replace(' ', '-')}`;

    let html = `
        <div class="ticket-details">
            <div class="ticket-header-modal">
                <h2>Ticket #${ticket.id}</h2>
                <span class="ticket-status ${statusClass}">${ticket.estado}</span>
            </div>
            
            <div class="ticket-info-grid">
                <div class="info-item">
                    <strong>Título:</strong>
                    <p>${escapeHtml(ticket.titulo)}</p>
                </div>
                
                <div class="info-item">
                    <strong>Categoría:</strong>
                    <p>${ticket.categoria_nombre}</p>
                </div>
                
                <div class="info-item">
                    <strong>Prioridad:</strong>
                    <span class="priority-badge priority-${ticket.prioridad.toLowerCase()}">${ticket.prioridad}</span>
                </div>
                
                <div class="info-item">
                    <strong>Fecha de Creación:</strong>
                    <p>${formatDate(ticket.fecha_creacion)}</p>
                </div>
                
                <div class="info-item">
                    <strong>Última Actualización:</strong>
                    <p>${formatDate(ticket.fecha_actualizacion)}</p>
                </div>
                
                ${ticket.asignado_a ? `
                <div class="info-item">
                    <strong>Asignado a:</strong>
                    <p>${escapeHtml(ticket.asignado_a)}</p>
                </div>
                ` : ''}
            </div>
            
            <div class="info-item full-width">
                <strong>Descripción:</strong>
                <div class="description-box">${escapeHtml(ticket.descripcion).replace(/\n/g, '<br>')}</div>
            </div>
            
            ${ticket.imagen_url ? `
            <div class="info-item full-width">
                <strong>Imagen adjunta:</strong>
                <div class="ticket-image-container">
                    <img src="${ticket.imagen_url}" alt="Imagen del ticket" class="ticket-image" onclick="window.open('${ticket.imagen_url}', '_blank')">
                </div>
            </div>
            ` : ''}
            
            ${ticket.comentarios && ticket.comentarios.length > 0 ? `
            <div class="comentarios-section">
                <h3>Comentarios y Respuestas:</h3>
                <div class="comentarios-list">
                    ${ticket.comentarios.map(comentario => `
                        <div class="comentario">
                            <div class="comentario-header">
                                <strong>${escapeHtml(comentario.autor)}</strong>
                                <span class="comentario-fecha">${formatDate(comentario.fecha_comentario)}</span>
                            </div>
                            <div class="comentario-texto">${escapeHtml(comentario.comentario).replace(/\n/g, '<br>')}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}
        </div>
    `;

    details.innerHTML = html;
    modal.style.display = 'block';

    modal.onclick = function (event) {
        if (event.target === modal) {
            closeModal();
        }
    };
}

function closeModal() {
    const modal = document.getElementById('ticketModal');
    modal.style.display = 'none';
}

function setLoadingState(submitBtn, btnText, btnLoading, isLoading) {
    if (isLoading) {
        submitBtn.disabled = true;
        btnText.style.display = 'none';
        btnLoading.style.display = 'inline-block';
        submitBtn.classList.add('loading');
    } else {
        submitBtn.disabled = false;
        btnText.style.display = 'inline-block';
        btnLoading.style.display = 'none';
        submitBtn.classList.remove('loading');
    }
}

function showMessage(message, type = 'info') {
    const messageDiv = document.getElementById('mensaje');
    messageDiv.className = `mensaje ${type}`;
    messageDiv.textContent = message;
    messageDiv.style.display = 'block';

    setTimeout(() => {
        hideMessage();
    }, 5000);

    messageDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideMessage() {
    const messageDiv = document.getElementById('mensaje');
    messageDiv.style.display = 'none';
}

function clearMessages() {
    hideMessage();
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';

    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
        return 'Hoy ' + date.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        });
    } else if (days === 1) {
        return 'Ayer ' + date.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        });
    } else if (days < 7) {
        return `Hace ${days} días`;
    } else {
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

function clearAutoSave() {
    const form = document.getElementById('ticketForm');
    if (form) {
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            if (input.name) {
                localStorage.removeItem(`ticket_${input.name}`);
            }
        });
    }
}

window.addEventListener('error', function (event) {
    console.error('Error global:', event.error);
    showMessage('Ha ocurrido un error inesperado. Por favor, recarga la página e intenta nuevamente.', 'error');
});

document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
        closeModal();
    }

    if (event.ctrlKey && event.key === 'Enter') {
        const activeTab = document.querySelector('.tab-content.active');
        if (activeTab && activeTab.id === 'crear') {
            const form = document.getElementById('ticketForm');
            if (form) {
                const submitEvent = new Event('submit');
                form.dispatchEvent(submitEvent);
            }
        }
    }
});