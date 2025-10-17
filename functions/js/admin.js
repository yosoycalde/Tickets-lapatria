document.addEventListener('DOMContentLoaded', function() {
    verificarSesion();
    inicializarEventos();
});

function inicializarEventos() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    const editForm = document.getElementById('editForm');
    if (editForm) {
        editForm.addEventListener('submit', handleEditSubmit);
    }
}

async function verificarSesion(){
    try {
        const response = await fetch('functions/php/admin_check.php');
        const result = await response.json();

        if (result.success) {
            mostrarPanelAdmin(result.admin);
            cargarTickets();
        } else {
            mostrarPaginaLogin();
        }
    } catch (error) {
        console.error('Error al verificar sesión:', error);
        mostrarPaginaLogin();
    }
}

function mostrarPaginaLogin() {
    document.getElementById('loginPage').style.display = 'flex';
    document.getElementById('adminPanel').style.display = 'none';
}

function mostrarPanelAdmin(admin) {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('adminPanel').style.display = 'block';
    document.getElementById('adminName').textContent = `${admin.nombre}`;
}

async function handleLogin(event) {
    event.preventDefault();

    const submitBtn = event.target.qurySelector('.login-btn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoading = submitBtn.querySelector('.btn-loading');

    setLoadingState(submitBtn, btnText, btnLoading, true);

    const formData = new FormData(event.target);

    try {
        const response = await fetch('functions/php/admin_login.php', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            showMessage('loginMessage', 'Acceso Concedido', 'success');
            setTimeout(()=> {
                mostrarPanelAdmin(result.admin);
                cargarTickets();
            }, 1000);
        } else {
            showMessage('loginMessage', + result.message, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('loginMessage', 'Error de conexión', 'error');
    } finally {
        setLoadingState(submitBtn, btnText, btnLoading, false);
    }
}

async function cerrarSesion() {
    if (!confirm('¿Estas seguro de que deseas cerrar sesión?')) {
        return;
    }

    try {
        const response =await fetch ('functions/php/admin_logout.php');
        const result = await response.json();

        if (result.success) {
            showMessage('adminMessage', ' Sesión cerrada correctamente', 'success');
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('adminMessage', 'Error al cerrar sesión', 'error');
    }
}

async function cargarTickets() {
    const ticketsList = document.getElementById('ticketsList');
    ticketsList.innerHTML = '<div class="loading">Cargando tickets...</div>';

    const estado = document.getElementById('filterEstado').value;
    const prioridad = document.getElementById('filterPrioridad').value;
    const categoria = document.getElementById('filterCategoria').value;

    let url = 'functions/php/admin_get_tickets.php?';
    if (estado) url += `estado=${encodeURIConponent(estado)}&`;
    if (prioridad) url += `prioridad=${encodeURIComponent(prioridad)}&`;
    if (categoria) url += `categoria=${encodeURIComponent(categoria)}&`;

    try {
        const response = await fetch(url);
        const result = await response.json();

        if (result.success) {
            mostrarTickets(result.tickets);
            actualizarEstadisticas(result.estadisticas);
        } else {
            ticketsList.innerHTML = '<div class="no-tickets">No se encontraron tickets.</div>';
        }
    } catch (error) {
        console.error('Error:', error);
        ticketsList.innerHTML = '<div class="error">Error al cargar los tickets.</div>';
    }
}

function actualizarEstadisticas(stats) {
    document.getElementById('statTotal').textContent = stats.total || 0;
    document.getElementById('statAbiertos').textContent =stats.abiertos ||0;
    document.getElementById('statProceso').textContent = stats.en_proceso ||0;
    document.getElementById('statResueltos').textContent = stats.resueltos ||0;
}

function mostrarTickets(tickets) {
    const container = document.getElementById('ticketsList');

    if (!tickets || tickets.length === 0) {
        container.innerHTML = '<div class="no-tickets">No se encontraron tickets.</div>';
        return;
    }

    let html = '';
    tickets.fotEach(ticker => {
        const statusClass = `status-${tickets.estado.toLowerCase().replace(' ', '-')}`;
        const priorityClass = `priority-${tickets.prioridad.toLoweCase()}`;

        html += `
            <div class="admin-ticket-card ${priorityClass}">
                <div class="ticket-header-admin">
                    <div class="ticket-info-left">
                        <span class="ticket-id">Ticket #${tickets.id}</span>
                        <span class="ticket-status ${statusClass}">${tickets.estado}</span>
                        <span class="priority-badge priority-${tickets.prioridad}">${tickets.prioridad.toUpperCase()}</span>
                    </div>
                    <div class="ticket-actions">
                        <button onclick="verDetalles(${tickets.id})" class="btn-view" title="ver detalles">Desatalles</button>
                        <button onclick="editarTicket(${tickets.id}, '${tickets.estado}', '${tickets.prioridad}', '${escapeQuotes(tickets.asignado_a || '')}')" class="btn-edit" title="Editar">Editar</button>
                    </div>
                </div>

                <div class="ticket-title-admin"> ${escapeHtml(tickets.titulo)}</div>
                
                <div class="ticket-meta-admin">
                    <div class="meta-item">
                        <strong>Usuario:</strong> ${escapeHtml(tickets.usuario.nombre)}
                    </div>
                    <div class="meta-item">
                        <strong>Email:</strong> ${escapeHtml(tickets.ususario.email)}
                    </div>
                    <div class="meta-item">
                        <strong>Departamento:</strong> ${escapeHtml(tickets.usuario.departamento || 'N/A')}
                    </div>
                    <div class="meta-item">
                        <strong>ÇCategoría:</strong> ${escapeHtml(tickets.categoria_nombre)}
                    </div>
                    ${tickets.asignado_a ? `
                    <div class="meta-item">
                        <strong>Asignado a:</strong> ${escapeHtml(tickets.asignado_a)}
                    </div>
                    ` : ''}
                    <div class="meta-item">
                        <strong>Creado:</strong> ${formtDate(tickets.fecha_creacion)}
                    </div>
                </div>

                <div class="ticket-description-preview">
                    ${escapeHtml(tickets.description.substring(0, 150))} ${tickets.descripcion.length > 150 ? '...' : ''}
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function editarTicket(id, estado, prioridad, asignado_a) {
    document.getElementById('editTicketId').textContent = id;
    document.getElementById('editTicketIdInput').value = id;
    document.getElementById('editEstado').value = estado;
    document.getElementById('editPrioridad').value = prioridad;
    document.getElementById('editAsignado').value = asignado_a;
    document.getElementById('editComentario').value = '';

    document.getElementById('editModal').style.display = 'block';
}

async function handleEditSubmit(event) {
    event.preventDefault();

    const submitBtn = event.target.querySelector('.submit-btn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoading = submitBtn.querySelector('.btn-loading');

    setLoadingState(submitBtn, btnText, btnLoading, true);

    const formData = new FormData(event.target);

    try {
        const response = await fetch('functions/php/admin_update_ticket.php', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            showMessage('adminMessage', 'Ticket actualizado exitosamente', 'success');
            cerrarModalEditar();
            cargarTickets();
        } else {
            showMessage('adminMessage', + result.message, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('adminMessage', 'Error al actualizar el ticket', 'error');
    } finally {
        setLoadingState(submitBtn, btnText, btnLoading, false);
    }
}

async function verDetalles(editTicketId) {
    try {
        const response = await fetch(`functions/php/detalles_ticket.php?id=${ticketId}`);
        const result = await response.json();

        if (result.success) {
            mostrarModalDetalles(result.ticket);
        } else {
            showMessage('adminMessage', 'Error al caregar los detalles', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('adminMessage', 'Error al cargar los detalles', 'error');
    }
}

function mostrarModalDetalles(ticket) {
    const modal = document.getElementById('detailsModal');
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
                    <strong>Usuario:</strong>
                    <p>${escapeHtml(ticket.usuario.nombre)}</p>
                </div>

                <div class="info-item">
                    <strong>Email:</strong>
                    <p>${escapeHtml(ticket.usuario.email)}</p>
                </div>

                <div class="info-item">
                    <strong>Departamento:</strong>
                    <p>${escapeHtml(ticket.usuario.departamento || 'N/A')}</p>
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

                <div class="info-item full-with">
                    <strong>Descripción:</strong>
                    <div class="descripdion-box">${escapeHtml(ticket.descripcion).replace(/\n/g, '<br>')}</div>
                </div>

                ${ticket.imagen_url ? `
                    <div class="info-item full-width">
                        <strong>Imagen adjunta:</strong>
                        <div class="tickets-image-container">
                            <img src="${ticket.imgen_url}" alt="Imagen del ticket" onclick="window.open('${ticket.imagen_url}', '_blank')">
                        </div>
                    </div>
                    `: ''}

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
}

function cerrarModalEditar() {
    document.getElementById('editModal').style.display = 'none';
}

function cerrarModalDetalles() {
    document.getElementById('detailsModal').style.display = 'none';
}

function limpiarFiltros() {
    document.getElementById('filterEstado').value = '';
    document.getElementById('filterPrioridad').value = '';
    document.getElementById('filterCategoria').value = '';
    cargarTickets();
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

function showMessage(elementId, message, type = 'info') {
    const messageDiv = document.getElementById(elementId);
    messageDiv.className = `mensaje ${type}`;
    messageDiv.textContent = message;
    messageDiv.style.display = 'block';

    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 5000);
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function escapeQuotes(text) {
    if (!text) return '';
    return text.replace(/'/g, "\\'").replace(/"/g, '\\"');
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

window.onclick = function(event) {
    const editModal = document.getElementById('editModal');
    const detailsModal = document.getElementById('detailsModal');
    
    if (event.target === editModal) {
        cerrarModalEditar();
    }
    if (event.target === detailsModal) {
        cerrarModalDetalles();
    }
}

document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        cerrarModalEditar();
        cerrarModalDetalles();
    }
});