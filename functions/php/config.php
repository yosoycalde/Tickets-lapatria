<?php
class DatabaseConfig {
    private const DB_HOST = 'localhost';
    private const DB_USERNAME = 'root';
    private const DB_PASSWORD = '';
    private const DB_NAME = 'sistema_tickets';
    private const DB_CHARSET = 'utf8mb4';
    private const APP_NAME = 'Sistema_Tickets';
    private const APP_VERSION = '1.0.0';
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
                $this->connection = new mysqli(
                    self::DB_HOST,
                    self::DB_USERNAME,
                    self::DB_PASSWORD,
                    self::DB_NAME
                );

                if ($this->connection->connect_error) {
                    throw new Exception("Error de conexión: " . $this->connection->connect_error);
                }

                $this->connection->set_charset(self::DB_CHARSET);

                if (self::DEBUG_MODE) {
                    error_log("Conexión a base de datos establecida exitosamente");
                }
            } catch (Exception $e) {
                error_log("Error al conectar a la base de datos: " . $e->getMessage());
                throw $e;
            }
        }

        return $this->connection;
    }

    public function closeConnection() {
        if ($this->connection !== null) {
            $this->connection->close();
            $this->connection = null;
        }
    }

    public static function isDebugMode() {
        return self::DEBUG_MODE;
    }

    // Método estático para obtener conexión directa
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
        http_response_code($httpCode);

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
}

// Configuración de errores según modo debug
if (DatabaseConfig::isDebugMode()) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
    ini_set('log_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
    ini_set('log_errors', 1);
}

// Headers de seguridad
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');
?>