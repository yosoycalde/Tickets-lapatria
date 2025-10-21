<?php
require_once 'config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        Utils::sendResponse(false, 'Método no permitido', null, 405);
    }

    if (!isset($_SESSION['admin_id'])) {
        Utils::sendResponse(false, 'No hay sesión activa de administrador', null, 401);
    }

    $ticket_id = filter_var($_POST['ticket_id'] ?? '', FILTER_VALIDATE_INT);
    $estado = Utils::sanitizeInput($_POST['estado'] ?? '');
    $prioridad = Utils::sanitizeInput($_POST['prioridad'] ?? '');
    $asignado_a = Utils::sanitizeInput($_POST['asignado_a'] ?? '');
    $comentario = Utils::sanitizeInput($_POST['comentario'] ?? '');

    $errors = [];

    if (!$ticket_id || $ticket_id <= 0) {
        $errors[] = 'ID de ticket no válido';
    }

    if (!in_array($estado, ['Abierto', 'En Proceso', 'Resuelto', 'Cerrado'])) {
        $errors[] = 'Estado no válido';
    }

    if (!in_array($prioridad, ['baja', 'media', 'alta', 'critica'])) {
        $errors[] = 'Prioridad no válida';
    }

    if (!empty($errors)) {
        Utils::sendResponse(false, implode(', ', $errors));
    }

    $conn = DatabaseConfig::getDirectConnection();

    $check_stmt = $conn->prepare("SELECT id FROM tickets WHERE id = ?");
    $check_stmt->bind_param("i", $ticket_id);
    $check_stmt->execute();
    $check_result = $check_stmt->get_result();

    if ($check_result->num_rows === 0) {
        Utils::sendResponse(false, 'Ticket no encontrado');
    }

    $conn->autocommit(false);

    try {
        $update_stmt = $conn->prepare("
            UPDATE tickets
            SET estado = ?, prioridad = ?, asignado_a = ?, fecha_actualizacion = NOW()
            WHERE id = ?
        ");

        if (!$update_stmt) {
            throw new Exception('Error en la preparación: ' . $conn->error);
        }

        $update_stmt->bind_param("sssi", $estado, $prioridad, $asignado_a, $ticket_id);

        if (!$update_stmt->execute()) {
            throw new Exception('Error al actualizar ticket: ' . $update_stmt->error);
        }

        if (!empty($comentario)) {
            $admin_nombre = $_SESSION['admin_nombre'] ?? 'Administrador';
            
            $comment_stmt = $conn->prepare("
                INSERT INTO comentarios (ticket_id, autor, comentario, fecha_comentario)
                VALUES (?, ?, ?, NOW())
            ");

            if (!$comment_stmt) {
                throw new Exception('Error en comentario: ' . $conn->error);
            }

            $comment_stmt->bind_param("iss", $ticket_id, $admin_nombre, $comentario);

            if (!$comment_stmt->execute()) {
                throw new Exception('Error al agregar comentario: ' . $comment_stmt->error);
            }
        }

        $conn->commit();

        error_log("Ticket actualizado - ID: $ticket_id, Estado: $estado, Prioridad: $prioridad");

        Utils::sendResponse(true, 'Ticket actualizado exitosamente', [
            'ticket_id' => $ticket_id
        ]);

    } catch (Exception $e) {
        $conn->rollback();
        error_log("Error en transacción de actualización: " . $e->getMessage());
        Utils::sendResponse(false, 'Error: ' . $e->getMessage());
    }

} catch (Exception $e) {
    error_log("Error En admin_update_ticket: " . $e->getMessage());
    Utils::sendResponse(false, 'Error de conexión', null, 500);
} finally {
    DatabaseConfig::getInstance()->closeConnection();
}
?>