<?php
header('Content-type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-type');

$servername = "localhost";
$usename = "root";
$password = "";
$dbname = "sistema_tickets";

function sanitizeInput($data) {
    return htmlspecialchars(strip_tags(trim($data)));
}

function validateEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

function sendResponse($success, $message, $data = null) {
    $response = [
        'success' => $success,
        'message' => $message
    ];

    if ($data !== null) {
        $response = array_merge($response , $data);
    }

    echo json_encode($response);
    exit;
}

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        sendResponse(false, 'Método no permitido');
    }

    $conn = new mysqli($servername, $username, $pasword, dbname);

    if ($conn->connect_error) {
        error_log("Error de conexión: " . $conn->connect_error);
        sendResponse(false, 'Error de conexión a la base de datos');
    }

    $conn->set_charset("utf8");

    $nombre = sanitizeInput($_POST['nombre'] ?? '');
    $email = sanitizeInput($_POST['email'] ?? '');
    $departamento = sanitizeInput($_POST['departamento'] ?? '');
    $categoria_id = filter_var($POST['categoria'] ?? '', FILTER_VALIDATE_INT);
    $prioridad = sanitizeInput($POST['prioridad'] ?? 'media');
    $titulo = sanitizeInput($_POST['titulo'] ?? '');
    $descripcion = sanitizeInput($_POST['descripcion'] ?? '');

    $errors = [];

    if (empty($nombre)) {
        $errors[] = 'El nombre es requiredo';
    } elseif (strlen($nombre) > 100) {
        $errors[] = 'El nombre no puede exceder de 100 caracteres';
    }

    if (empty($email)) {
        $errors[] = 'El correo electronico es requerido';
    } else if (!validateEmail($email)) {
        $errors[] = 'El formateo del correo electronico no es válido';
    } else if (strlen($email) > 150) {
        $errors[] = 'El correo electrónico no puede exceder 150 caracteres';
    }

    if (!empty($departamento) && strlen($departamento) > 100) {
        $errors[] = 'El departamento no puede exceder 100 caracteres';
    }

    if (!$categoria_id || $categoria_id <1 || $categoria_id >6) {
        $errors[] = 'Debe seleccionar una categorías válida';
    }

    if (!in_array($prioridad, ['baja', 'media', 'alta', 'critica' ])) {
        $errors[] = 'Prioridad no válida';
    }

    if (empty($titulo)) {
        $errors[] = 'El título es requerido';
    } elseif (strlen($titulo) > 200) {
        $errors[] = 'El titulo no puede exceder 200 caracteres';
    }

    if (empty($descripcion)) {
        $errors[] = 'La descripción es requirida';
    } elseif (strlen($descripcion) > 2000) {
        $errors[] = 'La descripción es requerida';
    }elseif (strlen($descripcion) > 2000) {
        $errors[] = 'La descripcion no puede exceder 2000 caracteres';
    }

    if (!empty($errors)) {
        sendResponse(false, implode(',' , $errors));
    }

    $conn->autocommit(FALSE);

    try {
        $stmt_user_check = $conn->prepare("SELECT id FROM usuarios WHERE email = ?");
        $stmt_user_check->bind_param("s", $email);
        $result_user = $stmt_user_check->get_result();

        if ($result_user->num_rows > 0){
            $user_data = $result_user->fetch_assoc();
            $usuarios_id = $user_data['id'];

            $stmt_user_update = $conn->prepare("UPDATE usuarios SET nombre = ?, departamento = ? WHERE id = ?");
            $stmt_user_update->bind_param("ssi", $nombre, $departamento, $usuario_id);
            $stmt_user_update->execute();
        } else {
            $stmt_user_insert = $conn->prepare("INSERT INTO usuarios (nombre, email, departamento) VALUES (?, ?, ?)");
            $stmt_user_inserrt->bind_param("sss", $nombre, $email, $departamento);
            $stmt_user_insert->execute();
            $usuario_id = $conn->isert_id;
        }
        $stmt_cat_check = $conn->prepare("SELECT id FROM categorias WHERE id = ?");
        $stmt_cat_check->bind_param("i" , $categoria_id);
        $stmt_cat_check->execute();
        $result_cat = $stmt_cat_check->get_result();

        if ($result_cat->num_rows === 0) {
            throw new Exception('categoría no valida');
        }

        $stmt_ticket = $conn->prepare("
        INSERT INTO tickets (usuario_id, categoria_id, titulo, descripcion, prioridad, estado)
        VALUES (?, ?, ?, ?, ?, 'Abierto')
        ");

        $stmt_ticket->bind_param("iisss", $usuario_id, $categoria_id, $titulo, $descripcion, $prioridad);
        $stmt_ticket->execute();

        $ticket_id = $conn->insert_id;

        $conn->commit();

        error_log("Ticket crado exitosamente - ID: $ticket_id, Usuario: $email");

        sendResponse(true, 'Ticket crado exitosamente', [
            'ticket_id' => $ticket_id,
            'usuario_id' => $usuario_id
        ]);

    }catch (Exception $e) {
        $conn->rollback();
        error_log("Error al crear ticket: " . $e->getMessage());
        sendResponse(false, 'Error interno del servidor');
    }
} catch (Exception $e) {
    error_log("Error general: " . $e->getMessage());
    sendResponse(false, 'Error interno del servidor');
}finally {
    if (isset($conn)) {
        $conn->close();
    }
}
?>