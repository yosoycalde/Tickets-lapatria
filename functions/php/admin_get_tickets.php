<?php
require_once 'config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

try {
    // Verificar que sea una solicitud GET
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        Utils::sendResponse(false, 'Método no permitido');
    }

    // Verificar que haya sesión activa
    if (!isset($_SESSION['admin_id'])) {
        Utils::sendResponse(false, 'No hay sesión activa de administrador', null, 401);
    }

    $conn = DatabaseConfig::getDirectConnection();

    // Obtener parámetros de filtro
    $estado = !empty($_GET['estado']) ? Utils::sanitizeInput($_GET['estado']) : '';
    $prioridad = !empty($_GET['prioridad']) ? Utils::sanitizeInput($_GET['prioridad']) : '';
    $categoria = !empty($_GET['categoria']) ? filter_var($_GET['categoria'], FILTER_VALIDATE_INT) : '';

    // Construir la consulta base
    $where_conditions = [];
    $params = [];
    $param_types = '';

    // Filtro de estado
    if (!empty($estado)) {
        $where_conditions[] = 't.estado = ?';
        $params[] = $estado;
        $param_types .= 's';
    }

    // Filtro de prioridad
    if (!empty($prioridad)) {
        $where_conditions[] = 't.prioridad = ?';
        $params[] = $prioridad;
        $param_types .= 's';
    }

    // Filtro de categoría
    if (!empty($categoria) && $categoria > 0) {
        $where_conditions[] = 't.categoria_id = ?';
        $params[] = $categoria;
        $param_types .= 'i';
    }

    // Construir la consulta SQL
    $where_clause = !empty($where_conditions) ? ' WHERE ' . implode(' AND ', $where_conditions) : '';

    $query = "
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
            u.nombre as usuario_nombre,
            u.email as usuario_email,
            u.departamento as usuario_departamento
        FROM tickets t
        INNER JOIN usuarios u ON t.usuario_id = u.id
        INNER JOIN categorias c ON t.categoria_id = c.id
        $where_clause
        ORDER BY t.fecha_creacion DESC
        LIMIT 100
    ";

    $stmt = $conn->prepare($query);

    // Enlazar parámetros si existen
    if (!empty($params)) {
        $stmt->bind_param($param_types, ...$params);
    }

    if (!$stmt->execute()) {
        throw new Exception('Error en la ejecución: ' . $stmt->error);
    }

    $result = $stmt->get_result();
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
            'usuario' => [
                'nombre' => $row['usuario_nombre'],
                'email' => $row['usuario_email'],
                'departamento' => $row['usuario_departamento']
            ]
        ];
    }

    // Obtener estadísticas
    $stats_query = "
        SELECT
            COUNT(*) as total,
            SUM(CASE WHEN estado = 'Abierto' THEN 1 ELSE 0 END) as abiertos,
            SUM(CASE WHEN estado = 'En Proceso' THEN 1 ELSE 0 END) as en_proceso,
            SUM(CASE WHEN estado = 'Resuelto' THEN 1 ELSE 0 END) as resueltos
        FROM tickets
    ";

    $stats_result = $conn->query($stats_query);
    $stats = $stats_result->fetch_assoc();

    $estadisticas = [
        'total' => (int)($stats['total'] ?? 0),
        'abiertos' => (int)($stats['abiertos'] ?? 0),
        'en_proceso' => (int)($stats['en_proceso'] ?? 0),
        'resueltos' => (int)($stats['resueltos'] ?? 0)
    ];

    error_log("Tickets obtenidos - Total: " . count($tickets));

    Utils::sendResponse(true, 'Tickets obtenidos exitosamente', [
        'tickets' => $tickets,
        'estadisticas' => $estadisticas,
        'total' => count($tickets)
    ]);

} catch (Exception $e) {
    error_log("Error al obtener tickets: " . $e->getMessage());
    Utils::sendResponse(false, 'Error: ' . $e->getMessage(), null, 500);
} finally {
    DatabaseConfig::getInstance()->closeConnection();
}
?>