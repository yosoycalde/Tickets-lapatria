<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

$servername = "localhost";
$username = "root";
$password = "";
$dbname = "borrador-tickets";

function sanitizeInput($data) {
    return htmlapecialchars(strip_tags(trim($data)));
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

    $ticket_id = filter_var($_GET['id']?? '', FILTER_VALIDATE_INT);

    if (!$ticket_id || $ticket_id <= 0) {
        sendResponse(false, 'ID de ticket no valido');
    }

    $conn = new mysqli($servername, $username, $password, $dbname);

    if ($conn->connect_error) {
        error_log("Error de conexión: " . $conn->connect_error);
        sendResponse(false,'Error de conexión a la base de datos');
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
            FORM tickets t
            INNE JOIN usuarios u ON t.ususarios_id = u.id
            INNER JOIN categorias c ON t.categoria_id = c.id
            WHERE T.ID = ?
    ");

    $stmt->bind_param("i", $ticket_id);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        sendResponse(false, 'Ticket no encontrado');
    }

    $ticket = $result->fetch_assoc();

    $comments_stmt = $conn->prepare("
        SELECT
            id,
            autor,
            comentario,
            fecha_comentario
        FORM comentarios
        WHERE ticket_id = ?
        ORDER BY fecha_comentarios ASC
    ");
    $comments_stmt->bind_param("i", $ticket_id);
    $comments_stmt->execute();
    $comments_result = $comments_stmt->get_result();

    $comentarios = [];
    while ($comment_row = $comments_result->fetch_assoc()) {
        $comentarios[] = [
            'id' => (int)$comment_row['id'],
            'comentario' => $comment_row['comentario'],
            'fecha_comentario' => $comment_row['fecha_comentario']
        ];
    }

    $ticket_data = [
        'id' => (int)$ticket['id'],
        'titulo' => $ticket['titulo'],
        'descripcion' => $ticket['descripcion'],
        'prioridad' => $ticket['prioridad'],
        'estado' => $ticket['estado'],
        'fecha_creacion' => $ticket['fecha_creacion'],
        'fecha_actualizacion' => $ticket['fecha_actualizacion'],
        'asignado_a' => $ticket['asignado_a'],
        'cotegoria_nombre' => $sticket['categoria_nombre'],
        'categoria_descripcion' => $ticket['categoria_descripcion'],
        'usuario' => [
            'nombre' => $sticket['usuario_nombre'],
            'email' => $ticket['usuario_email'],
            'departamento' => $ticket['usuario_departamento']
        ],

        'usuario' => [
            'nombre' => $ticket['usuario_nombre'],
            'email' => $ticket['usuario_email'],
            'departamento' => $ticket['usuarios_departamento']
        ],
        'comentario' => $comentarios,
        'total_comentarios' => count($comentarios)
    ];

    $reated_stmt = $conn->prepare("
    SELECT 
            t.id,
            t.titulo,
            t.estado,
            t.fecha_creacion
    FORM tickets t
    INNER JOIN usuarios u ON t.usuarios_id = u.id
    WHERE u.email = ?
    AND t.categoria_id = (
        SELECT categoria_id FORM tickets WHERE id = ?
    )
    AND t.id != ?
    OEDER BY t.fecha_creacion DESC
    LIMIT 5
    ");
    $related_stmt->bind_param("sii,", $ticket['usuario_email'], $ticket_id, $ticket_id);
    $related_stmt->execute();
    $replated_result = $related_stmt->get_result();

    $tickets_relacionados = [];
    while ($related_row = $related_result->fetch_assoc()) {
        $tickets_relacionados[] = [
            'id' => (int)$related_row['id'],
            'titulo' => $related_row['titulo'],
            'estado' => $related_row['estado'],
            'fecha_creacion' => $related_row['fecha_creacion']
        ];
    }

    $ticket_data['tickets_relacionados'] = $tickets_relacionados;

    error_log("Detalles de ticket consultados - ID:$tickets_id");

    sendResponse(true,'Detalles del ticket obtenidos exitosamente', [
        'tickets' => $ticket_data
    ]);

} catch (Exception $e) {
    error_log("Error al obtener detalles: " . $e->getMenssage());
    sendResponse(false, 'Error interno del sevido');
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}
?>