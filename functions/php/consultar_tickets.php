<?php
require_once '../php/config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        Utils::sendResponse(false, 'Método no permitido');
    }

    $email = Utils::sanitizeInput($_GET['email'] ?? '');

    if (empty($email)) {
        Utils::sendResponse(false, 'Email es requerido');
    }

    if (!Utils::validateEmail($email)) {
        Utils::sendResponse(false, 'Formato de email no válido');
    }

    $conn = DatabaseConfig::getDirectConnection();

    $stmt = $conn->prepare("
        SELECT 
            t.id,
            t.titulo,
            t.descripcion,
            t.prioridad,
            t.estado,
            t.fecha_creacion,
            t.fecha_actualizacion,
            t.asignado_a,
            c.nombre as categoria_nombre,
            c.descripcion as categoria_descripcion,
            u.nombre as usuario_nombre,
            u.email as usuario_email,
            u.departamento as usuario_departamento
        FROM tickets t
        INNER JOIN usuarios u ON t.usuario_id = u.id
        INNER JOIN categorias c ON t.categoria_id = c.id
        WHERE u.email = ?
        ORDER BY t.fecha_creacion DESC
    ");

    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        Utils::sendResponse(false, 'No se encontraron tickets para este email');
    }

    $tickets = [];
    while ($row = $result->fetch_assoc()) {
        $tickets[] = [
            'id' => (int)$row['id'],
            'titulo' => $row['titulo'],
            'descripcion' => $row['descripcion'],
            'prioridad' => $row['prioridad'],
            'estado' => $row['estado'],
            'fecha_creacion' => $row['fecha_creacion'],
            'fecha_actualizacion' => $row['fecha_actualizacion'],
            'asignado_a' => $row['asignado_a'],
            'categoria_nombre' => $row['categoria_nombre'],
            'categoria_descripcion' => $row['categoria_descripcion'],
            'usuario' => [
                'nombre' => $row['usuario_nombre'],
                'email' => $row['usuario_email'],
                'departamento' => $row['usuario_departamento']
            ]
        ];
    }

    error_log("Consulta de tickets realizada - Email: $email, Tickets encontrados: " . count($tickets));

    Utils::sendResponse(true, 'Tickets obtenidos exitosamente', [
        'tickets' => $tickets,
        'total' => count($tickets)
    ]);

} catch (Exception $e) {
    error_log("Error al consultar tickets: " . $e->getMessage());
    Utils::sendResponse(false, 'Error de conexión a la base de datos: ' . $e->getMessage());
} finally {
    DatabaseConfig::getInstance()->closeConnection();
}
?>