document.addEventListener('DOMContentLoaded', function () {
    initializeApp();
});

function initializeApp() {
    const form = document.getElementById('ticketForm');
    if (form) {
        form.addEventListener('submit', handleSubmit);
    }

    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', clearMessages);
    });
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
        const response = await fetch('functions/php/procesar_ticket.php', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            showMessage('¡Ticket creado exitosamente! ID: ' + result.ticket_id, 'success');
            document.getElementById('ticketForm').reset();
            clearAutoSave();

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
        const response = await fetch(`functions/php/consultar_ticket.php?email=${encodeURIComponent(email)}`);
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

// Validación en tiempo real para email
document.addEventListener('DOMContentLoaded', function () {
    const emailInput = document.getElementById('email');
    if (emailInput) {
        emailInput.addEventListener('blur', function () {
            if (this.value && !isValidEmail(this.value)) {
                this.style.borderColor = '#e53e3e';
                showMessage('Formato de correo electrónico no válido', 'error');
            } else {
                this.style.borderColor = '#e2e8f0';
            }
        });
    }

    // Contador de caracteres para descripción
    const descripcionInput = document.getElementById('descripcion');
    if (descripcionInput) {
        const maxLength = 2000;
        const counter = document.createElement('div');
        counter.className = 'char-counter';
        counter.style.textAlign = 'right';
        counter.style.fontSize = '12px';
        counter.style.color = '#718096';
        counter.style.marginTop = '5px';

        descripcionInput.parentNode.appendChild(counter);

        function updateCounter() {
            const remaining = maxLength - descripcionInput.value.length;
            counter.textContent = `${remaining} caracteres restantes`;

            if (remaining < 100) {
                counter.style.color = '#e53e3e';
            } else if (remaining < 300) {
                counter.style.color = '#d69e2e';
            } else {
                counter.style.color = '#718096';
            }
        }

        descripcionInput.addEventListener('input', updateCounter);
        updateCounter();
    }

    // Auto-guardado del formulario
    const form = document.getElementById('ticketForm');
    if (form) {
        const inputs = form.querySelectorAll('input, select, textarea');

        inputs.forEach(input => {
            const savedValue = localStorage.getItem(`ticket_${input.name}`);
            if (savedValue && input.type !== 'submit') {
                input.value = savedValue;
            }

            input.addEventListener('input', function(){
                if (this.type !== 'submit') {
                    localStorage.setItem(`ticket_${this.name}`, this.value);
                }
            });
        });
    }
});

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

// Manejo global de errores
window.addEventListener('error', function(event){
    console.error('Error global:', event.error);
    showMessage('Ha ocurrido un error inesperado. Por favor, recarga la página e intenta nuevamente.', 'error');
});

// Atajos de teclado
document.addEventListener('keydown', function(event) {
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