<?php
require_once '../php/config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        Utils::sendResponse(false, 'Método no permitido');
    }

    $conn = DatabaseConfig::getDirectConnection();

    $nombre = Utils::sanitizeInput($_POST['nombre'] ?? '');
    $email = Utils::sanitizeInput($_POST['email'] ?? '');
    $departamento = Utils::sanitizeInput($_POST['departamento'] ?? '');
    $categoria_id = filter_var($_POST['categoria'] ?? '', FILTER_VALIDATE_INT);
    $prioridad = Utils::sanitizeInput($_POST['prioridad'] ?? 'media');
    $titulo = Utils::sanitizeInput($_POST['titulo'] ?? '');
    $descripcion = Utils::sanitizeInput($_POST['descripcion'] ?? '');

    $errors = [];

    if (empty($nombre)) {
        $errors[] = 'El nombre es requerido';
    } elseif (strlen($nombre) > 100) {
        $errors[] = 'El nombre no puede exceder 100 caracteres';
    }

    if (empty($email)) {
        $errors[] = 'El correo electrónico es requerido';
    } elseif (!Utils::validateEmail($email)) {
        $errors[] = 'El formato del correo electrónico no es válido';
    } elseif (strlen($email) > 150) {
        $errors[] = 'El correo electrónico no puede exceder 150 caracteres';
    }

    if (!empty($departamento) && strlen($departamento) > 100) {
        $errors[] = 'El departamento no puede exceder 100 caracteres';
    }

    if (!$categoria_id || $categoria_id < 1 || $categoria_id > 6) {
        $errors[] = 'Debe seleccionar una categoría válida';
    }

    if (!in_array($prioridad, ['baja', 'media', 'alta', 'critica'])) {
        $errors[] = 'Prioridad no válida';
    }

    if (empty($titulo)) {
        $errors[] = 'El título es requerido';
    } elseif (strlen($titulo) > 200) {
        $errors[] = 'El título no puede exceder 200 caracteres';
    }

    if (empty($descripcion)) {
        $errors[] = 'La descripción es requerida';
    } elseif (strlen($descripcion) > 2000) {
        $errors[] = 'La descripción no puede exceder 2000 caracteres';
    }

    if (!empty($errors)) {
        Utils::sendResponse(false, implode(', ', $errors));
    }

    $conn->autocommit(false);

    try {
        $stmt_user_check = $conn->prepare("SELECT id FROM usuarios WHERE email = ?");
        $stmt_user_check->bind_param("s", $email);
        $stmt_user_check->execute();
        $result_user = $stmt_user_check->get_result();

        if ($result_user->num_rows > 0) {
            $user_data = $result_user->fetch_assoc();
            $usuario_id = $user_data['id'];

            $stmt_user_update = $conn->prepare("UPDATE usuarios SET nombre = ?, departamento = ? WHERE id = ?");
            $stmt_user_update->bind_param("ssi", $nombre, $departamento, $usuario_id);
            $stmt_user_update->execute();
        } else {
            $stmt_user_insert = $conn->prepare("INSERT INTO usuarios (nombre, email, departamento) VALUES (?, ?, ?)");
            $stmt_user_insert->bind_param("sss", $nombre, $email, $departamento);
            $stmt_user_insert->execute();
            $usuario_id = $conn->insert_id;
        }

        $stmt_cat_check = $conn->prepare("SELECT id FROM categorias WHERE id = ?");
        $stmt_cat_check->bind_param("i", $categoria_id);
        $stmt_cat_check->execute();
        $result_cat = $stmt_cat_check->get_result();

        if ($result_cat->num_rows === 0) {
            throw new Exception('Categoría no válida');
        }

        // Insertar el ticket
        $stmt_ticket = $conn->prepare("
            INSERT INTO tickets (usuario_id, categoria_id, titulo, descripcion, prioridad, estado)
            VALUES (?, ?, ?, ?, ?, 'Abierto')
        ");

        $stmt_ticket->bind_param("iisss", $usuario_id, $categoria_id, $titulo, $descripcion, $prioridad);
        $stmt_ticket->execute();

        $ticket_id = $conn->insert_id;

        $conn->commit();

        error_log("Ticket creado exitosamente - ID: $ticket_id, Usuario: $email");

        Utils::sendResponse(true, 'Ticket creado exitosamente', [
            'ticket_id' => $ticket_id,
            'usuario_id' => $usuario_id
        ]);

    } catch (Exception $e) {
        $conn->rollback();
        error_log("Error al crear ticket: " . $e->getMessage());
        Utils::sendResponse(false, 'Error interno del servidor');
    }
} catch (Exception $e) {
    error_log("Error general: " . $e->getMessage());
    Utils::sendResponse(false, 'Error de conexión a la base de datos: ' . $e->getMessage());
} finally {
    if (isset($conn)) {
        DatabaseConfig::getInstance()->closeConnection();
    }
}
?>