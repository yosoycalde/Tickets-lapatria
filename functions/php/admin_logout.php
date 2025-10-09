<?php
require_once 'config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

try {
    if (session_status() === PHP_SESSION_ACTIVE) {
        $usuario = $_SESSION['admin_usuario'] ?? 'desconocido';
        error_log("Logout realizado - Usuario: $usuario");
        
        session_destroy();
    }

    Utils::sendResponse(true, 'Sesión cerrada correctamente');

} catch (Exception $e) {
    error_log("Error en admin_logout: " . $e->getMessage());
    Utils::sendResponse(false, 'Error al cerrar sesión', null, 500);
}
?>