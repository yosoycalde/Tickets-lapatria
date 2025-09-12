document.addEventListener('DOMContentLoaded', function() {
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

    try{
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
            }, 2000 );
        } else {
            showMenssage('Error al crear el ticket: ' + result.menssage, 'error');
        }
    } catch (error) {
        console.error('Error:' , error);
        showMenssage('Error de conexión. Por favor, intentar nuevamente.', 'error');
    } finally {
        setLoadingState(submitBtn, btnText, btnLoading, false);
    }
}

