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

    $usuario = Utils::sanitizeInput($_POST['usuario'] ?? '');
    $password = $_POST['password'] ?? '';

    if (empty($usuario) || empty($password)) {
        Utils::sendResponse(false, 'Usuario y contraseña son requeridos');
    }

    $conn = DatabaseConfig::getDirectConnection();

    $stmt = $conn->prepare("
        SELECT id, usuario, nombre, email, nivel_acceso, password
        FROM administradores
        WHERE usuario = ? AND activo = 1
    ");

    if (!$stmt) {
        throw new Exception('Error en la consulta: ' . $conn->error);
    }

    $stmt->bind_param("s", $usuario);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        error_log("Intento de login fallido - Usuario no encontrado: $usuario");
        Utils::sendResponse(false, 'Usuario o contraseña incorrectos');
    }

    $admin = $result->fetch_assoc();

    if (!password_verify($password, $admin['password'])) {
        error_log("Intento de login fallido - Contraseña incorrecta para usuario: $usuario");
        Utils::sendResponse(false, 'Usuario o contraseña incorrectos');
    }

    $_SESSION['admin_id'] = $admin['id'];
    $_SESSION['admin_usuario'] = $admin['usuario'];
    $_SESSION['admin_nombre'] = $admin['nombre'];
    $_SESSION['admin_nivel'] = $admin['nivel_acceso'];

    $update_stmt = $conn->prepare("UPDATE administradores SET ultima_conexion = NOW() WHERE id = ?");
    $update_stmt->bind_param("i", $admin['id']);
    $update_stmt->execute();

    error_log("Login exitoso - Usuario: $usuario");

    Utils::sendResponse(true, 'Acceso concedido', [
        'admin' => [
            'id' => (int)$admin['id'],
            'usuario' => $admin['usuario'],
            'nombre' => $admin['nombre'],
            'email' => $admin['email'],
            'nivel_acceso' => $admin['nivel_acceso']
        ]
    ]);

} catch (Exception $e) {
    error_log("Error en admin_login: " . $e->getMessage());
    Utils::sendResponse(false, 'Error de conexión', null, 500);
} finally {
    DatabaseConfig::getInstance()->closeConnection();
}
?>