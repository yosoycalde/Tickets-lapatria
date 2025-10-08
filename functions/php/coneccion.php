<?php

error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h2>Verificador de Conexión - Sistema de Tickets</h2>";
echo "<hr>";

echo "<h3>Test 1: PHP está funcionando</h3>";
echo "Versión de PHP: " . phpversion() . "<br>";
echo "<hr>";

echo "<h3>Test 2: Verificar archivos</h3>";
if (file_exists('functions/php/config.php')) {
    echo "config.php existe<br>";
    require_once 'functions/php/config.php';
} else {
    echo "config.php NO existe<br>";
    echo "Ruta buscada: " . __DIR__ . "/functions/php/config.php<br>";
    die("Por favor verifica la ruta del archivo config.php");
}
echo "<hr>";

echo "<h3>Test 3: Conexión a la Base de Datos</h3>";
try {
    $conn = new mysqli('localhost', 'root', '', 'sistema_tickets');
    
    if ($conn->connect_error) {
        echo "Error de conexión: " . $conn->connect_error . "<br>";
        echo "<br><strong>Posibles soluciones:</strong><br>";
        echo "1. Verifica que MySQL/MariaDB esté ejecutándose<br>";
        echo "2. Verifica el nombre de usuario (por defecto: root)<br>";
        echo "3. Verifica la contraseña (por defecto: vacía)<br>";
        echo "4. Verifica que la base de datos 'sistema_tickets' exista<br>";
    } else {
        echo "Conexión exitosa a la base de datos<br>";
        echo "Base de datos: sistema_tickets<br>";
        echo "Charset: " . $conn->character_set_name() . "<br>";
    }
    echo "<hr>";

    if (!$conn->connect_error) {
        echo "<h3>Test 4: Verificar Tablas</h3>";
        
        $tablas_requeridas = ['usuarios', 'categorias', 'tickets', 'comentarios', 'administradores'];
        
        foreach ($tablas_requeridas as $tabla) {
            $result = $conn->query("SHOW TABLES LIKE '$tabla'");
            if ($result && $result->num_rows > 0) {
                echo "Tabla '$tabla' existe<br>";
                
                $count = $conn->query("SELECT COUNT(*) as total FROM $tabla");
                $row = $count->fetch_assoc();
                echo "&nbsp;&nbsp;&nbsp;→ Registros: " . $row['total'] . "<br>";
            } else {
                echo "Tabla '$tabla' NO existe<br>";
            }
        }
        echo "<hr>";

        echo "<h3>Test 5: Verificar Administradores</h3>";
        $result = $conn->query("SELECT * FROM administradores WHERE activo = 1");
        
        if ($result) {
            if ($result->num_rows > 0) {
                echo "Se encontraron " . $result->num_rows . " administrador(es) activo(s)<br><br>";
                echo "<table border='1' cellpadding='5' cellspacing='0'>";
                echo "<tr><th>ID</th><th>Usuario</th><th>Nombre</th><th>Email</th><th>Nivel</th></tr>";
                while ($admin = $result->fetch_assoc()) {
                    echo "<tr>";
                    echo "<td>" . $admin['id'] . "</td>";
                    echo "<td>" . $admin['usuario'] . "</td>";
                    echo "<td>" . $admin['nombre'] . "</td>";
                    echo "<td>" . $admin['email'] . "</td>";
                    echo "<td>" . $admin['nivel_acceso'] . "</td>";
                    echo "</tr>";
                }
                echo "</table>";
            } else {
                echo "No hay administradores en la base de datos<br>";
                echo "<br><strong>Ejecuta este SQL para crear un administrador:</strong><br>";
                echo "<pre style='background:#f4f4f4; padding:10px; border:1px solid #ccc;'>";
                echo "INSERT INTO administradores (usuario, password, nombre, email, nivel_acceso) \n";
                echo "VALUES ('admin', '\$2y\$10\$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrador Principal', 'admin@lapatria.com', 'super_admin');";
                echo "</pre>";
                echo "Usuario: admin<br>";
                echo "Contraseña: admin123<br>";
            }
        } else {
            echo "Error al consultar administradores: " . $conn->error . "<br>";
        }
        echo "<hr>";
        
        echo "<h3>Test 6: Verificar Sesiones PHP</h3>";
        session_start();
        if (session_status() === PHP_SESSION_ACTIVE) {
            echo "Las sesiones PHP están funcionando<br>";
            echo "Session ID: " . session_id() . "<br>";
        } else {
            echo "Las sesiones PHP NO están funcionando<br>";
        }
        echo "<hr>";
        
        echo "<h3>Test 7: Verificar Permisos de Archivos</h3>";
        
        $directorios_importantes = [
            'uploads/tickets/',
            'functions/php/',
            'functions/js/',
            'style/'
        ];
        
        foreach ($directorios_importantes as $dir) {
            if (is_dir($dir)) {
                if (is_writable($dir)) {
                    echo "'$dir' existe y es escribible<br>";
                } else {
                    echo "'$dir' existe pero NO es escribible<br>";
                }
            } else {
                echo "'$dir' NO existe<br>";
            }
        }
        
        $conn->close();
    }
    
} catch (Exception $e) {
    echo "❌ Error general: " . $e->getMessage() . "<br>";
}

echo "<hr>";
echo "<h3>📋 Resumen</h3>";
echo "<p>Si todos los tests muestran ✅, tu sistema está correctamente configurado.</p>";
echo "<p>Si hay errores ❌, revisa las soluciones sugeridas arriba.</p>";
echo "<br>";
echo "<a href='admin.html' style='padding:10px 20px; background:#667eea; color:white; text-decoration:none; border-radius:5px;'>Ir al Panel de Administración</a>";
echo "&nbsp;&nbsp;";
echo "<a href='index.html' style='padding:10px 20px; background:#48bb78; color:white; text-decoration:none; border-radius:5px;'>Ir al Sistema de Tickets</a>";
?>