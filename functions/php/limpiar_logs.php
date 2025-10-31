<?php
require_once 'functions/php/config.php';

header('Content-Type: text/html; charset=utf-8');

$ADMIN_PASSWORD = 'admin123';

$password_provided = $_GET['password'] ?? '';
$action = $_GET['action'] ?? '';

?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Limpieza de Logs - Sistema de Tickets</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }
        
        .container {
            background: white;
            border-radius: 20px;
            padding: 40px;
            max-width: 800px;
            width: 100%;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }
        
        h1 {
            color: #2d3748;
            margin-bottom: 10px;
            font-size: 28px;
        }
        
        .subtitle {
            color: #718096;
            margin-bottom: 30px;
        }
        
        .info-box {
            background: #f7fafc;
            border-left: 4px solid #667eea;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 25px;
        }
        
        .info-box h3 {
            color: #2d3748;
            margin-bottom: 10px;
            font-size: 18px;
        }
        
        .info-box p {
            color: #4a5568;
            line-height: 1.6;
            margin-bottom: 8px;
        }
        
        .warning-box {
            background: #fffaf0;
            border-left: 4px solid #ed8936;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 25px;
        }
        
        .warning-box strong {
            color: #c05621;
        }
        
        .success-box {
            background: #f0fff4;
            border-left: 4px solid #48bb78;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 25px;
        }
        
        .success-box strong {
            color: #22543d;
        }
        
        .error-box {
            background: #fff5f5;
            border-left: 4px solid #f56565;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 25px;
        }
        
        .error-box strong {
            color: #742a2a;
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 8px;
            color: #2d3748;
            font-weight: 600;
        }
        
        .form-group input {
            width: 100%;
            padding: 12px;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            font-size: 16px;
        }
        
        .btn {
            padding: 12px 30px;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-block;
            margin-right: 10px;
            margin-bottom: 10px;
        }
        
        .btn-primary {
            background: #667eea;
            color: white;
        }
        
        .btn-primary:hover {
            background: #5a67d8;
            transform: translateY(-2px);
        }
        
        .btn-danger {
            background: #f56565;
            color: white;
        }
        
        .btn-danger:hover {
            background: #e53e3e;
            transform: translateY(-2px);
        }
        
        .btn-secondary {
            background: #626f83ff;
            color: white;
        }
        
        .btn-secondary:hover {
            background: #4a5568;
        }
        
        .log-info {
            background: #edf2f7;
            padding: 15px;
            border-radius: 9px;
            margin-bottom: 20px;
        }
        
        .log-info-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #cbd5e0;
        }
        
        .log-info-item:last-child {
            border-bottom: none;
        }
        
        .log-info-label {
            font-weight: 600;
            color: #2d3748;
        }
        
        .log-info-value {
            color: #4a5568;
        }
        
        .back-link {
            color: #667eea;
            text-decoration: none;
            font-weight: 600;
            margin-top: 20px;
            display: inline-block;
        }
        
        .back-link:hover {
            color: #5a67d8;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Limpieza de Logs</h1>
        <p class="subtitle">Sistema de Tickets - La Patria</p>
        
        <?php
        $log_file = __DIR__ . '/error.log';
        $log_exists = file_exists($log_file);
        
        if ($password_provided !== $ADMIN_PASSWORD && $action !== '') {
            echo '<div class="error-box">';
            echo '<strong>Error:</strong> Contraseña incorrecta.';
            echo '</div>';
            $action = '';
        }
        
        if ($action === 'clean' && $password_provided === $ADMIN_PASSWORD) {
            if (Utils::manualCleanLog()) {
                echo '<div class="success-box">';
                echo '<strong>Éxito:</strong> Los logs han sido limpiados correctamente. Se ha creado un respaldo.';
                echo '</div>';
            } else {
                echo '<div class="error-box">';
                echo '<strong>Error:</strong> No se pudieron limpiar los logs.';
                echo '</div>';
            }
            $log_exists = file_exists($log_file);
        }
        ?>
        
        <div class="info-box">
            <h3>Información</h3>
            <p><strong>Limpieza Automática:</strong> Los logs se limpian automáticamente cuando:</p>
            <p>• El archivo tiene más de 7 días de antigüedad</p>
            <p>• El archivo supera los 5 MB de tamaño</p>
            <p><strong>Respaldos:</strong> Se crean respaldos automáticos antes de limpiar</p>
            <p><strong>Respaldos antiguos:</strong> Se eliminan automáticamente después de 30 días</p>
        </div>
        
        <?php if ($log_exists): ?>
            <div class="log-info">
                <h3 style="margin-bottom: 15px; color: #2d3748;">Estado Actual del Log</h3>
                
                <div class="log-info-item">
                    <span class="log-info-label">Tamaño:</span>
                    <span class="log-info-value">
                        <?php 
                        $size_bytes = filesize($log_file);
                        $size_mb = $size_bytes / 1024 / 1024;
                        echo number_format($size_mb, 2) . ' MB (' . number_format($size_bytes) . ' bytes)';
                        ?>
                    </span>
                </div>
                
                <div class="log-info-item">
                    <span class="log-info-label">Última modificación:</span>
                    <span class="log-info-value">
                        <?php 
                        $last_modified = filemtime($log_file);
                        $days_old = floor((time() - $last_modified) / 86400);
                        echo date('Y-m-d H:i:s', $last_modified) . " ($days_old días)";
                        ?>
                    </span>
                </div>
                
                <div class="log-info-item">
                    <span class="log-info-label">Líneas:</span>
                    <span class="log-info-value">
                        <?php 
                        $lines = count(file($log_file));
                        echo number_format($lines) . ' líneas';
                        ?>
                    </span>
                </div>
                
                <div class="log-info-item">
                    <span class="log-info-label">Estado:</span>
                    <span class="log-info-value">
                        <?php 
                        if ($size_mb > 5) {
                            echo '<span style="color: #ff1f1fff; font-weight: 600;"> Tamaño excedido (>5MB)</span>';
                        } elseif ($days_old > 7) {
                            echo '<span style="color: #ff7300ff; font-weight: 600;"> Antiguo (>7 días)</span>';
                        } else {
                            echo '<span style="color: #3ea067ff; font-weight: 600;"> Normal</span>';
                        }
                        ?>
                    </span>
                </div>
            </div>
        <?php else: ?>
            <div class="warning-box">
                <strong> Información:</strong> No existe ningún archivo error.log actualmente.
            </div>
        <?php endif; ?>
        
        <?php if ($log_exists && $action !== 'confirm'): ?>
            <div class="warning-box">
                <strong> Advertencia:</strong> Esta acción creará un respaldo y limpiará el archivo error.log actual. Esta operación no se puede deshacer.
            </div>
            
            <form method="GET">
                <div class="form-group">
                    <label for="password">Contraseña de administrador:</label>
                    <input type="password" id="password" name="password" required placeholder="Ingresa la contraseña">
                </div>
                
                <button type="submit" name="action" value="clean" class="btn btn-danger">
                    Limpiar Logs Ahora
                </button>
                
                <a href="admin.html" class="btn btn-secondary">
                    ← Volver al Panel
                </a>
            </form>
        <?php else: ?>
            <a href="admin.html" class="btn btn-primary">
                Volver al Panel de Administración
            </a>
            
            <a href="index.html" class="btn btn-secondary">
                Ir al Inicio
            </a>
        <?php endif; ?>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e2e8f0;">
        
        <div class="info-box">
            <h3>Configuración Avanzada</h3>
            <p>Para cambiar los parámetros de limpieza automática, edita el archivo:</p>
            <p><code style="background: #edf2f7; padding: 2px 6px; border-radius: 4px;">functions/php/config.php</code></p>
            <p style="margin-top: 10px;">Variables configurables:</p>
            <p>• <code>$max_age_days</code> - Días antes de limpiar (actual: 7)</p>
            <p>• <code>$max_size_mb</code> - Tamaño máximo en MB (actual: 5)</p>
            <p>• <code>$max_backup_age</code> - Días para mantener respaldos (actual: 30)</p>
        </div>
        
        <p style="text-align: center; color: #718096; font-size: 14px; margin-top: 20px;">
            Sistema de Tickets - La Patria &copy; <?php echo date('Y'); ?>
        </p>
    </div>
</body>
</html>