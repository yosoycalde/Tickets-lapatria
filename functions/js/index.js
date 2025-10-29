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

// ==================== NUEVAS CARACTERÍSTICAS ====================

// Sistema de autoguardado
let autoSaveTimer = null;
const AUTOSAVE_DELAY = 2000; // 2 segundos

// Sugerencias contextuales
const sugerenciasPorCategoria = {
    '1': 'Ejemplo: "No puedo acceder al sistema de correo" o "Error al imprimir documentos"',
    '2': 'Ejemplo: "Contapyme no guarda los datos" o "Error al generar reporte"',
    '3': 'Ejemplo: "No puedo subir artículos" o "Error en la publicación"',
    '4': 'Ejemplo: "Internet muy lento" o "No hay conexión WiFi"',
    '5': 'Ejemplo: "La computadora no enciende" o "Pantalla con rayas"',
    '6': 'Ejemplo: "Error en facturación" o "No genera factura"',
    '7': 'Ejemplo: "Solicitud de nuevo equipo" o "Consulta general"'
};

// Toast notifications (más amigables que los alerts)
function showToast(message, type = 'info', duration = 5000) {
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) {
        existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <span class="toast-icon">${getToastIcon(type)}</span>
            <span class="toast-message">${message}</span>
            <button class="toast-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    
    if (duration > 0) {
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
}

function getToastIcon(type) {
    const icons = {
        'success': '✓',
        'error': '✗',
        'warning': '⚠',
        'info': 'ℹ'
    };
    return icons[type] || 'ℹ';
}

// ==================== INICIALIZACIÓN MEJORADA ====================

function initializeApp() {
    const form = document.getElementById('ticketForm');
    if (form) {
        form.addEventListener('submit', handleSubmit);
        initializeAutoSave();
        restoreAutoSavedData();
    }

    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', clearMessages);
    });

    initializePriorityAutomation();
    handleImagePreview();
    initializeRealTimeValidation();
    initializeProgressIndicator();
    initializeKeyboardShortcuts();
    addHelpTooltips();
    initializeDarkMode();
    initializeSmartSuggestions();
}

// ==================== AUTOGUARDADO ====================

function initializeAutoSave() {
    const form = document.getElementById('ticketForm');
    if (!form) return;

    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        if (input.type !== 'file' && input.name) {
            input.addEventListener('input', scheduleAutoSave);
        }
    });
}

function scheduleAutoSave() {
    clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(autoSaveFormData, AUTOSAVE_DELAY);
}

function autoSaveFormData() {
    const form = document.getElementById('ticketForm');
    if (!form) return;

    const formData = {};
    const inputs = form.querySelectorAll('input, select, textarea');
    
    inputs.forEach(input => {
        if (input.type !== 'file' && input.name && input.value) {
            formData[input.name] = input.value;
        }
    });

    if (Object.keys(formData).length > 0) {
        const dataToSave = {
            data: formData,
            timestamp: new Date().toISOString()
        };
        
        try {
            localStorage.setItem('ticket_autosave', JSON.stringify(dataToSave));
            showAutoSaveIndicator();
        } catch (e) {
            console.warn('Error al autoguardar:', e);
        }
    }
}

function restoreAutoSavedData() {
    try {
        const saved = localStorage.getItem('ticket_autosave');
        if (!saved) return;

        const { data, timestamp } = JSON.parse(saved);
        const savedDate = new Date(timestamp);
        const now = new Date();
        const hoursDiff = (now - savedDate) / (1000 * 60 * 60);

        if (hoursDiff > 24) {
            localStorage.removeItem('ticket_autosave');
            return;
        }

        const hasData = Object.values(data).some(v => v && v.trim());
        if (!hasData) return;

        showRestorePrompt(data, savedDate);
    } catch (e) {
        console.warn('Error al restaurar datos:', e);
    }
}

function showRestorePrompt(data, savedDate) {
    const timeAgo = getTimeAgo(savedDate);
    const message = `Se encontró un borrador guardado hace ${timeAgo}. ¿Deseas restaurarlo?`;
    
    const prompt = document.createElement('div');
    prompt.className = 'restore-prompt';
    prompt.innerHTML = `
        <div class="restore-content">
            <h3>Borrador Encontrado</h3>
            <p>${message}</p>
            <div class="restore-actions">
                <button class="btn-restore" onclick="restoreData()">Restaurar</button>
                <button class="btn-discard" onclick="discardAutoSave()">Descartar</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(prompt);
    setTimeout(() => prompt.classList.add('show'), 10);
}

function restoreData() {
    try {
        const saved = localStorage.getItem('ticket_autosave');
        if (!saved) return;

        const { data } = JSON.parse(saved);
        
        Object.keys(data).forEach(name => {
            const input = document.querySelector(`[name="${name}"]`);
            if (input && input.type !== 'file') {
                input.value = data[name];
                validateField(input, name);
            }
        });

        document.querySelector('.restore-prompt').remove();
        showToast('Borrador restaurado correctamente', 'success');
    } catch (e) {
        console.warn('Error al restaurar:', e);
        showToast('Error al restaurar el borrador', 'error');
    }
}

function discardAutoSave() {
    localStorage.removeItem('ticket_autosave');
    document.querySelector('.restore-prompt')?.remove();
    showToast('Borrador descartado', 'info');
}

function showAutoSaveIndicator() {
    let indicator = document.querySelector('.autosave-indicator');
    
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.className = 'autosave-indicator';
        indicator.textContent = '💾 Guardado';
        document.body.appendChild(indicator);
    }
    
    indicator.classList.add('show');
    
    setTimeout(() => {
        indicator.classList.remove('show');
    }, 2000);
}

function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    if (seconds < 60) return 'menos de un minuto';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutos`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} horas`;
    return `${Math.floor(seconds / 86400)} días`;
}

function initializeSmartSuggestions() {
    const categoriaSelect = document.getElementById('categoria');
    const tituloInput = document.getElementById('titulo');
    const descripcionInput = document.getElementById('descripcion');

    if (categoriaSelect && tituloInput) {
        categoriaSelect.addEventListener('change', function() {
            const suggestion = sugerenciasPorCategoria[this.value];
            if (suggestion) {
                showSuggestion(tituloInput, suggestion);
            }
        });
    }

    if (descripcionInput) {
        descripcionInput.addEventListener('focus', function() {
            if (!this.value) {
                showDescriptionTips();
            }
        });
    }
}

function showSuggestion(input, text) {
    let suggestion = input.parentElement.querySelector('.smart-suggestion');
    
    if (!suggestion) {
        suggestion = document.createElement('div');
        suggestion.className = 'smart-suggestion';
        input.parentElement.appendChild(suggestion);
    }
    
    suggestion.innerHTML = `<span class="suggestion-icon">💡</span> ${text}`;
    suggestion.classList.add('show');
    
    setTimeout(() => {
        suggestion.classList.remove('show');
    }, 8000);
}

function showDescriptionTips() {
    const tips = [
        '¿Cuándo ocurrió el problema?',
        '¿Qué estabas haciendo cuando sucedió?',
        '¿Ya intentaste alguna solución?',
        '¿El problema es recurrente o único?'
    ];
    
    const descripcionInput = document.getElementById('descripcion');
    let tipElement = descripcionInput.parentElement.querySelector('.description-tips');
    
    if (!tipElement) {
        tipElement = document.createElement('div');
        tipElement.className = 'description-tips';
        tipElement.innerHTML = `
            <div class="tips-header">Tips para una mejor descripción:</div>
            <ul>
                ${tips.map(tip => `<li>${tip}</li>`).join('')}
            </ul>
        `;
        descripcionInput.parentElement.appendChild(tipElement);
    }
    
    tipElement.classList.add('show');
}

// ==================== INDICADOR DE PROGRESO ====================

function initializeProgressIndicator() {
    const form = document.getElementById('ticketForm');
    if (!form) return;

    const progressBar = document.createElement('div');
    progressBar.className = 'form-progress';
    progressBar.innerHTML = `
        <div class="progress-bar">
            <div class="progress-fill"></div>
        </div>
        <div class="progress-text">Completado: <span>0%</span></div>
    `;
    
    form.insertBefore(progressBar, form.firstChild);

    const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
    inputs.forEach(input => {
        input.addEventListener('input', updateProgress);
        input.addEventListener('change', updateProgress);
    });
}

function updateProgress() {
    const form = document.getElementById('ticketForm');
    const requiredFields = form.querySelectorAll('input[required], select[required], textarea[required]');
    
    let completed = 0;
    requiredFields.forEach(field => {
        if (field.value && field.value.trim() !== '') {
            completed++;
        }
    });
    
    const percentage = Math.round((completed / requiredFields.length) * 100);
    
    const progressFill = document.querySelector('.progress-fill');
    const progressText = document.querySelector('.progress-text span');
    
    if (progressFill) {
        progressFill.style.width = percentage + '%';
        progressFill.style.backgroundColor = getProgressColor(percentage);
    }
    
    if (progressText) {
        progressText.textContent = percentage + '%';
    }
}

function getProgressColor(percentage) {
    if (percentage < 33) return '#f56565';
    if (percentage < 66) return '#ed8936';
    return '#48bb78';
}


function initializeKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            autoSaveFormData();
            showToast('Borrador guardado manualmente', 'success', 2000);
        }
        
        // Ctrl/Cmd + Enter = Enviar formulario
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            const activeTab = document.querySelector('.tab-content.active');
            if (activeTab && activeTab.id === 'crear') {
                e.preventDefault();
                const form = document.getElementById('ticketForm');
                if (form) {
                    form.dispatchEvent(new Event('submit'));
                }
            }
        }
        
        // Esc = Cerrar modal
        if (e.key === 'Escape') {
            closeModal();
            const restorePrompt = document.querySelector('.restore-prompt');
            if (restorePrompt) restorePrompt.remove();
        }
        
        // Ctrl/Cmd + K = Buscar tickets
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            showTab('consultar');
            setTimeout(() => {
                document.getElementById('emailConsulta')?.focus();
            }, 100);
        }
    });
    
    // Mostrar atajos disponibles
    addKeyboardShortcutsHelp();
}

function addKeyboardShortcutsHelp() {
    const helpButton = document.createElement('button');
    helpButton.className = 'shortcuts-help-btn';
    helpButton.innerHTML = '⌨️';
    helpButton.title = 'Ver atajos de teclado';
    helpButton.onclick = showShortcutsModal;
    document.body.appendChild(helpButton);
}

function showShortcutsModal() {
    const modal = document.createElement('div');
    modal.className = 'shortcuts-modal';
    modal.innerHTML = `
        <div class="shortcuts-content">
            <h3>⌨Atajos de Teclado</h3>
            <div class="shortcut-list">
                <div class="shortcut-item">
                    <kbd>Ctrl/Cmd</kbd> + <kbd>S</kbd>
                    <span>Guardar borrador</span>
                </div>
                <div class="shortcut-item">
                    <kbd>Ctrl/Cmd</kbd> + <kbd>Enter</kbd>
                    <span>Enviar formulario</span>
                </div>
                <div class="shortcut-item">
                    <kbd>Ctrl/Cmd</kbd> + <kbd>K</kbd>
                    <span>Buscar tickets</span>
                </div>
                <div class="shortcut-item">
                    <kbd>Esc</kbd>
                    <span>Cerrar modal</span>
                </div>
            </div>
            <button class="btn-close-shortcuts" onclick="this.closest('.shortcuts-modal').remove()">Cerrar</button>
        </div>
    `;
    
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('show'), 10);
    
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

function addHelpTooltips() {
    const fieldsWithHelp = {
        'titulo': 'Un título claro ayuda a priorizar tu ticket. Ejemplo: "Error al imprimir" es mejor que "Ayuda"',
        'descripcion': 'Mientras más detalles proporciones, más rápido podremos ayudarte',
        'categoria': 'Selecciona la categoría que mejor describa tu problema',
        'departamento': 'Esto nos ayuda a dirigir tu ticket al área correcta'
    };
    
    Object.keys(fieldsWithHelp).forEach(fieldName => {
        const field = document.getElementById(fieldName);
        if (field) {
            const label = field.previousElementSibling;
            if (label && label.tagName === 'LABEL') {
                const tooltip = document.createElement('span');
                tooltip.className = 'help-tooltip';
                tooltip.innerHTML = '?';
                tooltip.title = fieldsWithHelp[fieldName];
                label.appendChild(tooltip);
            }
        }
    });
}

function initializeRealTimeValidation() {
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

    const departamentoSelect = document.getElementById('departamento');
    if (departamentoSelect) {
        addValidationFeedback(departamentoSelect, 'departamento');
        departamentoSelect.addEventListener('change', function () {
            validateField(this, 'departamento');
        });
    }

    const categoriaSelect = document.getElementById('categoria');
    if (categoriaSelect) {
        addValidationFeedback(categoriaSelect, 'categoria');
        categoriaSelect.addEventListener('change', function () {
            validateField(this, 'categoria');
        });
    }

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

    let feedbackContainer = formGroup.querySelector('.validation-feedback');
    if (!feedbackContainer) {
        feedbackContainer = document.createElement('div');
        feedbackContainer.className = 'validation-feedback';
        formGroup.appendChild(feedbackContainer);
    }

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

    feedbackContainer.style.opacity = '0';
    setTimeout(() => {
        feedbackContainer.style.opacity = '1';
    }, 10);
    
    updateProgress();
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
        showToast(`Prioridad establecida como "${nuevaPrioridad.toUpperCase()}" para problemas de ${categoriaName}.`, 'info', 3000);
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
                    showToast('Por favor selecciona una imagen válida (JPG, PNG o GIF)', 'error');
                    imageInput.value = '';
                    return;
                }

                const maxSize = 5 * 1024 * 1024;
                if (file.size > maxSize) {
                    showToast('La imagen no puede superar los 5MB', 'error');
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

                showToast('Imagen cargada correctamente', 'success', 2000);
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
        showToast('Imagen eliminada', 'info', 2000);
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
            showToast('¡Ticket creado exitosamente! ID: ' + result.ticket_id, 'success', 5000);
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
            
            updateProgress();

            setTimeout(() => {
                showToast('Recibirás una confirmación por correo electrónico. Puedes consultar el estado de tu ticket en la pestaña "Consultar Tickets".', 'info', 6000);
            }, 2000);
        } else {
            showToast('Error al crear el ticket: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error de conexión. Por favor, intenta nuevamente.', 'error');
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
        showToast('Por favor corrige los siguientes errores:\n• ' + errors.join('\n• '), 'error', 8000);
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
        showToast('Por favor ingresa tu correo electrónico', 'error');
        return;
    }

    const resultContainer = document.getElementById('ticketsResults');
    resultContainer.innerHTML = '<div class="loading">Buscando tickets...</div>';

    try {
        const response = await fetch(`functions/php/consultar_tickets.php?email=${encodeURIComponent(email)}`);
        const result = await response.json();

        if (result.success) {
            displayTickets(result.tickets);
            showToast(`Se encontraron ${result.tickets.length} ticket(s)`, 'success', 3000);
        } else {
            resultContainer.innerHTML = '<div class="no-tickets">No se encontraron tickets para este correo electrónico.</div>';
            showToast('No se encontraron tickets', 'info');
        }

    } catch (error) {
        console.error('Error:', error);
        resultContainer.innerHTML = '<div class="error">Error al consultar los tickets. Por favor, intenta nuevamente.</div>';
        showToast('Error al consultar tickets', 'error');
    }
}

function displayTickets(tickets) {
    const container = document.getElementById('ticketsResults');

    if (!tickets || tickets.length === 0) {
        container.innerHTML = '<div class="no-tickets">📭 No tienes tickets registrados.</div>';
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
            showToast('Error al cargar los detalles del ticket', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error al cargar los detalles del ticket', 'error');
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
                <h3>Comentarios y Respuestas (${ticket.comentarios.length}):</h3>
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
    showToast(message, type);
}

function hideMessage() {
    const messageDiv = document.getElementById('mensaje');
    if (messageDiv) {
        messageDiv.style.display = 'none';
    }
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
    localStorage.removeItem('ticket_autosave');
}

window.addEventListener('error', function (event) {
    console.error('Error global:', event.error);
    showToast('Ha ocurrido un error inesperado. Por favor, recarga la página e intenta nuevamente.', 'error', 8000);
});

window.restoreData = restoreData;
window.discardAutoSave = discardAutoSave;
window.removeImage = removeImage;
window.showTab = showTab;
window.consultarTickets = consultarTickets;
window.showTicketDetails = showTicketDetails;
window.closeModal = closeModal;