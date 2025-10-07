<?php
// functions/php/config.php - Versión corregida con mejor manejo de errores

// Iniciar sesión si no está iniciada
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

class DatabaseConfig {
    private const DB_HOST = 'localhost';
    private const DB_USERNAME = 'root';
    private const DB_PASSWORD = '';
    private const DB_NAME = 'sistema_tickets';
    private const DB_CHARSET = 'utf8mb4';
    private const APP_NAME = 'Sistema_Tickets';
    private const APP_VERSION = '1.0.1';
    private const DEBUG_MODE = true;

    private static $instance = null;
    private $connection = null;

    private function __construct() {}

    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function getConnection() {
        if ($this->connection === null) {
            try {
                // Intentar conexión con manejo de errores mejorado
                $this->connection = @new mysqli(
                    self::DB_HOST,
                    self::DB_USERNAME,
                    self::DB_PASSWORD,
                    self::DB_NAME
                );

                if ($this->connection->connect_error) {
                    $error_msg = "Error de conexión (" . $this->connection->connect_errno . "): " . $this->connection->connect_error;
                    error_log($error_msg);
                    throw new Exception($error_msg);
                }

                // Establecer charset
                if (!$this->connection->set_charset(self::DB_CHARSET)) {
                    error_log("Error al establecer charset: " . $this->connection->error);
                }

                if (self::DEBUG_MODE) {
                    error_log("Conexión a base de datos establecida exitosamente - " . date('Y-m-d H:i:s'));
                }
            } catch (Exception $e) {
                error_log("Error crítico al conectar a la base de datos: " . $e->getMessage());
                throw $e;
            }
        }

        return $this->connection;   
    }

    public function closeConnection() {
        if ($this->connection !== null) {
            $this->connection->close();
            $this->connection = null;
            if (self::DEBUG_MODE) {
                error_log("Conexión a base de datos cerrada - " . date('Y-m-d H:i:s'));
            }
        }
    }

    public static function isDebugMode() {
        return self::DEBUG_MODE;
    }

    public static function getDirectConnection() {
        $instance = self::getInstance();
        return $instance->getConnection();
    }
}

class Utils {
    public static function sanitizeInput($data) {
        if (is_array($data)) {
            return array_map([self::class, 'sanitizeInput'], $data);
        }
        return htmlspecialchars(strip_tags(trim($data)), ENT_QUOTES, 'UTF-8');
    }

    public static function validateEmail($email) {
        return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
    }

    public static function sendResponse($success, $message, $data = null, $httpCode = 200) {
        // Limpiar cualquier salida previa
        if (ob_get_length()) ob_clean();
        
        http_response_code($httpCode);
        header('Content-Type: application/json; charset=utf-8');

        $response = [
            'success' => $success,
            'message' => $message,
            'timestamp' => date('Y-m-d H:i:s')
        ];

        if ($data !== null) {
            if (is_array($data)) {
                $response = array_merge($response, $data);
            } else {
                $response['data'] = $data;
            }
        }

        echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        exit;
    }
    
    public static function logError($message, $context = []) {
        $log_message = "[" . date('Y-m-d H:i:s') . "] " . $message;
        if (!empty($context)) {
            $log_message .= " | Context: " . json_encode($context);
        }
        error_log($log_message);
    }
}

// Configuración de errores según el modo
if (DatabaseConfig::isDebugMode()) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
    ini_set('log_errors', 1);
    ini_set('error_log', __DIR__ . '/../../error.log');
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
    ini_set('log_errors', 1);
    ini_set('error_log', __DIR__ . '/../../error.log');
}

// Headers de seguridad
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');

// Permitir CORS solo desde el mismo dominio en producción
if (DatabaseConfig::isDebugMode()) {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
}
?>