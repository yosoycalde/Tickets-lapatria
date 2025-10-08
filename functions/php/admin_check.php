<?php
require_once 'config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

try {
    // Verificar si hay una sesión activa
    if (!isset($_SESSION['admin_id'])) {
        Utils::sendResponse(false, 'No hay sesión activa');
    }

    $admin_id = $_SESSION['admin_id'];
    $conn = DatabaseConfig::getDirectConnection();

    $stmt = $conn->prepare("
        SELECT id, usuario, nombre, email, nivel_acceso
        FROM administradores
        WHERE id = ? AND activo = 1
    ");
    
    $stmt->bind_param("i", $admin_id);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        session_destroy();
        Utils::sendResponse(false, 'Sesión inválida');
    }

    $admin = $result->fetch_assoc();

    $update_stmt = $conn->prepare("UPDATE administradores SET ultima_conexion = NOW() WHERE id = ?");
    $update_stmt->bind_param("i", $admin_id);
    $update_stmt->execute();

    Utils::sendResponse(true, 'Sesión válida', [
        'admin' => [
            'id' => (int)$admin['id'],
            'usuario' => $admin['usuario'],
            'nombre' => $admin['nombre'],
            'email' => $admin['email'],
            'nivel_acceso' => $admin['nivel_acceso']
        ]
    ]);

} catch (Exception $e) {
    error_log("Error en admin_check: " . $e->getMessage());
    Utils::sendResponse(false, 'Error al verificar sesión');
} finally {
    DatabaseConfig::getInstance()->closeConnection();
}
?>