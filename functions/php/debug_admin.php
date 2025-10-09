<?php
require_once 'functions/php/config.php';

header('Content-Type: application/json');

echo "<h2>🔍 DEBUG - Sistema de Administración</h2><hr>";

try {
    $conn = DatabaseConfig::getDirectConnection();
    
    echo "<h3>1. Verificar tabla administradores</h3>";
    $result = $conn->query("SHOW COLUMNS FROM administradores");
    echo "<pre>";
    while ($row = $result->fetch_assoc()) {
        echo print_r($row, true);
    }
    echo "</pre>";
    
    echo "<h3>2. Administradores en la BD</h3>";
    $result = $conn->query("SELECT id, usuario, nombre, email, activo, nivel_acceso FROM administradores");
    echo "<p>Total: " . $result->num_rows . " registros</p>";
    echo "<pre>";
    while ($row = $result->fetch_assoc()) {
        echo print_r($row, true);
    }
    echo "</pre>";
    
    if ($result->num_rows === 0) {
        echo "<p style='color:red;'><strong>⚠️ No hay administradores en la BD</strong></p>";
        echo "<p>Ejecuta este SQL:</p>";
        echo "<pre style='background:#f0f0f0; padding:10px;'>";
        echo "INSERT INTO administradores (usuario, password, nombre, email, nivel_acceso, activo) 
VALUES ('admin', '\$2y\$10\$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrador', 'admin@lapatria.com', 'super_admin', 1);";
        echo "</pre>";
    }
    
    echo "<h3>3. Verificar tabla tickets</h3>";
    $result = $conn->query("SELECT COUNT(*) as total FROM tickets");
    $row = $result->fetch_assoc();
    echo "<p>Total de tickets: " . $row['total'] . "</p>";
    
    echo "<h3>4. Verificar tabla usuarios</h3>";
    $result = $conn->query("SELECT COUNT(*) as total FROM usuarios");
    $row = $result->fetch_assoc();
    echo "<p>Total de usuarios: " . $row['total'] . "</p>";
    
    echo "<h3>5. Verificar tabla categorias</h3>";
    $result = $conn->query("SELECT COUNT(*) as total FROM categorias");
    $row = $result->fetch_assoc();
    echo "<p>Total de categorías: " . $row['total'] . "</p>";
    
    echo "<h3>6. Test de login</h3>";
    $password_test = 'admin123';
    $hash = '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';
    if (password_verify($password_test, $hash)) {
        echo "<p style='color:green;'><strong>✓ Verificación de contraseña: OK</strong></p>";
    } else {
        echo "<p style='color:red;'><strong>✗ Verificación de contraseña: FALLO</strong></p>";
    }
    
    echo "<h3>7. Prueba de estadísticas</h3>";
    $query = "
        SELECT
            COUNT(*) as total,
            SUM(CASE WHEN estado = 'Abierto' THEN 1 ELSE 0 END) as abiertos,
            SUM(CASE WHEN estado = 'En Proceso' THEN 1 ELSE 0 END) as en_proceso,
            SUM(CASE WHEN estado = 'Resuelto' THEN 1 ELSE 0 END) as resueltos
        FROM tickets
    ";
    $result = $conn->query($query);
    $stats = $result->fetch_assoc();
    echo "<pre>";
    echo "Total: " . $stats['total'] . "\n";
    echo "Abiertos: " . $stats['abiertos'] . "\n";
    echo "En Proceso: " . $stats['en_proceso'] . "\n";
    echo "Resueltos: " . $stats['resueltos'] . "\n";
    echo "</pre>";
    
    echo "<hr><h3>✓ Todo parece estar bien</h3>";
    
} catch (Exception $e) {
    echo "<p style='color:red;'><strong>✗ Error:</strong> " . $e->getMessage() . "</p>";
}

DatabaseConfig::getInstance()->closeConnection();
?>
<style>
body { font-family: Arial; margin: 20px; background: #f5f5f5; }
h2, h3 { color: #333; }
pre { background: white; padding: 10px; border-radius: 5px; overflow-x: auto; }
</style>