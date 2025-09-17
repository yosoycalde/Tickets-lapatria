<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

$servername = "localhost";
$username = "root";
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
        $response = array_merge($response, $data);
    }

    echo json_encode($response, JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        sendResponse(false, 'Método no permitido');
    }

    $email = sanitizeInput($_GET['email'] ?? '');

    if (empty($email)) {
        sendResponse(false, 'Email es requerido');
    }

    if (!validateEmail($email)) {
        sendResponse(false, 'Formato de email no válido');
    }

    $conn = new mysqli($servername, $username, $password, $dbname);

    if ($conn->connect_error) {
        error_log("Error de conexión: " . $conn->connect_error);
        sendResponse(false, 'Error de conexión a la base de datos');
    }

    $conn->set_charset("utf8");

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
        sendResponse(false, 'No se encontraron tickets para este email');
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

    sendResponse(true, 'Tickets obtenidos exitosamente', [
        'tickets' => $tickets,
        'total' => count($tickets)
    ]);

} catch (Exception $e) {
    error_log("Error al consultar tickets: " . $e->getMessage());
    sendResponse(false, 'Error interno del servidor');
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}
?>