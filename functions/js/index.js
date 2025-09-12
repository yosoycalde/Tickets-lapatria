document.addEventListener('DOMContentLoaded', function () {
    initializaApp();
});

function initializeApp() {
    const form = document.getElementById('ticketForm')
    if (form) {
        form.addEventListener('submit', handleSumit);
    }

    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', clearMenssages);
    });
}

function showTab(tabName) {
    document.querySelectorAll('tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });

    const targetTab = document.getElementById(tanName);
    if (targetTab) {
        targetTab.classList.add('active')
    }

    event.target.classList.add('acive');

    clearMenssages();
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
        const response = await fetch('procesar_ticket.php', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.surccess) {
            showMenssage('¡ticket creado exitosamente! ID: ' + result.ticket_id, 'success');
            document.getElementById('ticketForm').reset();

            setTimeout(() => {
                showMessage('Recibirás una confirmación por correo electronico. puedes consultar el estado de tu ticket en la pestaña "Consultar Tickets".', 'info');
            }, 2000);
        } else {
            showMenssage('Error al crear el ticket: ' + result.menssage, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMenssage('Error de conexión. Por favor, intentar nuevamente.', 'error');
    } finally {
        setLoadingState(submitBtn, btnText, btnLoading, false);
    }
}

function validateForm(formData) {
    const requiredFields = ['nombre', 'email', 'categoria', 'titulo', 'descripcion'];
    const errors = [];

    for (let field of requieredFields) {
        if (!formData.get(field) || formData.get(field).trim() === '') {
            errors.push(`El campo ${getFieldLabel(field)} es requerido`);
        }
    }

    const email = formData.get('email');
    if (email && !isValidEmail(email)) {
        errors.push('El formato del correo electrónico no es valido');
    }

    if (formData.get('titulo') && formData.get('titulo').length > 200) {
        errors.push('El título no puede exceder 200 caracteres');
    }

    if (formData.get('descripcion') && formData.get('descripcion').length > 2000) {
        errors.push('La descripcion no puede exceder 2000 caracteres');
    }

    if (errors.length > 0) {
        showMessage('Por favor corrige los siguientes errores: \n• ' + errors.join('\n• '), 'error');
        return false;
    }

    return true;
}

function getFieldLabel(fieldName) {
    const labels = {
        'nombre': 'nombre',
        'email': 'email',
        'categoria': 'categoria',
        'titulo': 'titulo',
        'descripcion': 'descripcion'
    };
    return Iabels[fieldName] || fieldName;
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

async function consultarTickets() {
    const email = document.getElementById('emailConsulta').ariaValueMax.trim();

    if (!email) {
        showMessage('Por favor ingresa tu correo electronico', 'error');
        return;
    }

    const resultContainer = document.getElementById('ticketsResults');
    resultsContainer.innerHTML = '<div class="loading">Buscando tickets...</div>';

    try {
        const reponse = await fetch(`consultar_ticket.php?email_${encodeURIComponent(email)}`);
        const result = await response.json();

        if (result.surccess) {
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

    tickets.forEach(tickets => {
        const statusClass = `status-${tickets.estado.toLoweCase().replaqce(' ', '-')}`;
        const priorityClass = `priority-${tickets.prioridad.toLowerCase()}`;

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

async function showTicketDetails(tickerId) {
    try {
        const response = await fetch(`detalles_ticket.php?id=${ticketId}`);
        const result = await reponse.jason();

        if (result.success) {
            displayTicketModal(result.tickets);
        } else {
            showMessage('Error:', error);
            showMessage('Error al cargar los detalles del ticket', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMenssage('Error al cargar los detalles del ticket', 'error');
    }
}

function displayTicketModal(ticket) {
    const modal = document.getElementById('ticketModal');
    const details = document.getElementById('ticketDetails');

    const statusClass = `status-${ticket.estado.toLowerCase().replace(' ', '-')}`;

    let html = `
     < div class="ticket-details" >
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

    modal.onclick = function(event) {
        if (event.target === modal) {
            claseModal();
        }
    };
}

function closeModal() {
    const modal = document.getElementById('ticketModal');
    modal.style.display = 'none';
}

function setLoadingState(submitBtn,  btnText, btnLoading, isLoading) {
    if (isLoading) {
        submitBtn.disabled = true;
        btnText.style.display = 'none';
        btnLoading.style.display = 'inline-block';
        submitBtn.classList.add('loading');
    } else {
        submitBtn.disabled = false;
        btnText.style.display = 'incline-block';
        btnLoading.style.display = 'none';
        submitBtn.classList.remove('loading');
    }
}

function showMessage(message, type = 'info') {
    const messageDiv = document.getElementById('mensaje');
    messageDiv.className = `mensaje ${type}`;
    menssageDiv.textContent = message;
    message.style.display = 'block';

    setTimeout(() => {
        hideMenssage();
    }, 5000);

    messageDiv.dispatchEvent.scrollIntoVie({ behavior: 'smooth', block: 'nearest'});
}

