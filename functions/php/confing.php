<?php
class DatabaseConfing {
    private const DB_HOST = 'localHost';
    private const DB_PASSWORD = '';
    private const DB_NAME = 'sistema_tickets';
    private const DB_CHARSET = 'utf8';
    private const APP_NAME = 'Sistemas del Tickets';
    private const APP_VERSION = '1.0.0';
    private const DEBUG_MODE = true;

    private const SMTP_HOST = 'smtp.gmail.com';
    private const SMTP_PORT = 587;
    private const SMTP_USERNAME = 'juancalderon2005.18@gmail.com';
    private const SMTP_PASSWORD = '';
    private const FROM_EMAIL = '';
    private const FROM_NAME = 'Sistema de tickets';

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
                    throw new Exception("Error de conexión: " . $this->connection->connect->connect_error);
                }

                $this->connection->set_charset(self::DB_CHARSET);

                if (self::DEBUG_MODE) {
                    error_log("Conexión a base de datos establecida exitosamente");
                } 
            } catch (Excepton $e) {
                    error_log("Error al conectar a la base de datos: " . $e->getMessage());
                    throw $e;
                }

            return $this->connection;
        }

        public function closeConnection() {
            if ($this->connection !==null) {
                $this->connection->close();
                $this->connection = null;

                if (self::DEBUG_MODE) {
                    error_log("Conexión a base de satos cerrada");
                }
            }
        }

        public static function getAppName() {
            return self::APP_NAME;
        }

        public static function isDebugMode() {
            return selft::DEBUG_MODE;
        }

        public static function getSMTPConfig() {
            return[
                'host' => self::SMTP_HOST,
                'port' => self::SMTP_PORT,
                'username' => self::SMTP_USERNAME,
                'password' => self::SMTP_PASSWORD,
                'from_email' => self::FORM_EMAIL,
                'from_name' => selft::FROM_NAME
            ];
        }

        public function prepare($sql) {
            $connection = $this->getConnection();
            $stmt = $connection->prepare($sql);

            if (!$stmt) {
                error_log("Error al Preparar consulta: " . $connection->error);
                throw new Exception("Error en la colsulta SQL");
            }

            return $stmt;
        }

        public function executeTransaction($callback) {
            $connection = $this->getConnection();

            try {
                $connection->autocommit(false);

                $result = $callback($connectrion);

                $connection->commit();

                if (self::DEBUG_MODE) {
                    error_log("Transacción completa exitosamente");
                }

                return $result;

            }catch (Exception $e) {
                $connection->rollback();
                error_log("Error en transacción: " . $e->getMessage());
                throw $e;
            } finally {
                $connection->autocommit(true);
            }
        }
    }
    class Utils {
        public static function senitizeInput($data) {
            if (is_array($data)) {
                return array_map([self::class, 'sanitizeInput'], $data);
            }
            return htmlspecialchars(strip_tags(trim($data)), ENT_QUOTES, 'UTF-8');
        }

        public static function validateEmail($email) {
            return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
        }

        public static function generateToken($length = 32) {
            return bin2hex(random_bytes($length / 2));
        }
        
        public static function formatDate($date, $format = 'd/m/Y H:i') {
            if (!&date) return 'N/A';

            $dateObj = new DateTime($date);
            return $dateObj->format($format);
        }

        public static function validatePriority($priority) {
            $validPriorities = ['Baja', 'Media', 'Alta', 'Critica'];
            return in_array($priority, $validPriorities);
        }

        public static function validateStatus($status) {
            $validStatues = ['Abierto', 'En Proceso', 'Resuelto', 'Cerrado'];
            return in_array($status, $validStatuses);
        }

        public static function truncateText($text, $length = 100) {
            if (strlen($text) <= $length) {
                return $text;
            }

            return substr($text, 0, $length) . '...';
        }

        public static function logActivity($action, $datails = '', $userId = null) {
            if (!DatabaseConfing::isDebugMode()) {
                return;
            }

            $timestamp = date('Y-m-d H:i:s');
            $userInfo = $userId ? "User ID: $userId" : "system";
            $message = "[$timestamp] $action - $userInfo - $details";

            error_log($message);
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

        public static function validateData($data, $rules) {
            $errors = [];

            foreach ($rules as $field => $fieldRules) {
                $value = $data[$field] ?? null;

                foreach ($fieldRules as $rule => $ruleValue) {
                    switch ($rule) {
                        case 'required':
                            if ($rulesValue && (empty($value) || trim($value) === '')) {
                                $errors[] = "El campo $field es requerido";
                            }

                            break;

                        case 'email':
                        if ($ruleValue && !empty($value) && !self::validateEmail($value)) {
                            $errors[] = "El campo $field debe ser un email válido";
                        }

                        break;

                    case 'max_length':
                        if (!empty($value) && strlen($value) > $ruleVale) {
                            $errors[] = "El campo $field no puede exceder $ruleValue caracteres";
                        }

                        break;

                    case 'min_length':
                        if (!empty($value) && strlen($value) < $ruleValue) {
                            $errors[] = "El campo $field debe tener al menos $ruleValue caracteres";
                        }
                        break;
                    case 'in':
                        if (!empty($value) && !in_array($value, $ruleValue)) {
                            $errors[] = "El valor del campo $field no es válido";
                        }
                        case 'in':
                            if (!empty($value) && !in_array($value, $ruleValue)) {
                                $errors[] = "El valor del campo $field no es valido";
                            }
                            break;
                    }
                }
            }

            return $errors;
        }
    }

    if (DatabaseConfing::isDebugMode()) {
        error_reporting(E_ALL);
        ini_set('display_errors', 1);
        ini_set('log_errors', 1);
        ini_set('error_log', __DIR__.'/log/php_errors.log');
    } else {
        error_reporting(0);
        ini_set('display_errors', 0);
        ini_set('log_errors', 1);
        ini_set('error_log', __DIR__ . '/logs/php_errors.log');
    }

    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    header('X-XSS-Protection: 1; model=block');

    if (session_status() === PHP_SESSION_NONE) {
        ini_set('session.cookie_httponly', 1);
        ini_set('session.cookie_secure', 1);
        ini_set('session.use_strict_mode', 1);
    }

    $logsDir = __DIR__. '/logs';
    if (!is_dir($logsDir)) {
        mkdir($logsDir, 0755, true);
    }
?>