<?php
/**
 * Gestor de error.log - Limpia automáticamente el archivo cuando alcanza un límite
 * 
 * Configuración:
 * - MAX_LOG_SIZE: Tamaño máximo del archivo en MB (5 MB por defecto)
 * - MAX_LINES: Número máximo de líneas (5000 por defecto)
 * - BACKUP_ENABLED: Crear backup antes de limpiar (true por defecto)
 */

class LogManager {
    private const MAX_LOG_SIZE = 5; // MB
    private const MAX_LINES = 5000;
    private const BACKUP_ENABLED = true;
    private const LOG_PATH = __DIR__ . '/error.log';
    private const BACKUP_DIR = __DIR__ . '/log_backups';

    /**
     * Verifica y limpia el error.log si es necesario
     */
    public static function checkAndCleanLog() {
        if (!file_exists(self::LOG_PATH)) {
            return;
        }

        $fileSize = filesize(self::LOG_PATH);
        $maxSizeBytes = self::MAX_LOG_SIZE * 1024 * 1024;

        // Verificar si el archivo excede el tamaño máximo
        if ($fileSize > $maxSizeBytes) {
            self::cleanLog('size');
            return;
        }

        // Verificar si el archivo excede el número máximo de líneas
        $lines = count(file(self::LOG_PATH, FILE_SKIP_EMPTY_LINES));
        if ($lines > self::MAX_LINES) {
            self::cleanLog('lines');
            return;
        }
    }

    /**
     * Limpia el error.log
     * 
     * @param string $reason Razón de la limpieza: 'size' o 'lines'
     */
    private static function cleanLog($reason) {
        try {
            // Crear backup si está habilitado
            if (self::BACKUP_ENABLED) {
                self::createBackup($reason);
            }

            // Limpiar el archivo
            file_put_contents(self::LOG_PATH, '');

            // Registrar la limpieza
            $logMessage = "[" . date('Y-m-d H:i:s') . "] [LOG CLEANED] ";
            $logMessage .= "Razón: " . ($reason === 'size' ? 'Tamaño máximo alcanzado' : 'Límite de líneas alcanzado');
            $logMessage .= " | Tamaño anterior: " . self::getFormattedSize() . " | Líneas anteriores: " . self::countLines();
            
            error_log($logMessage);

        } catch (Exception $e) {
            error_log("[ERROR] No se pudo limpiar error.log: " . $e->getMessage());
        }
    }

    /**
     * Crea un backup del error.log actual
     * 
     * @param string $reason Razón de la limpieza
     */
    private static function createBackup($reason) {
        try {
            if (!is_dir(self::BACKUP_DIR)) {
                mkdir(self::BACKUP_DIR, 0755, true);
            }

            $timestamp = date('Y-m-d_H-i-s');
            $reasonStr = $reason === 'size' ? 'size' : 'lines';
            $backupFile = self::BACKUP_DIR . '/error_log_backup_' . $timestamp . '_' . $reasonStr . '.log';

            if (copy(self::LOG_PATH, $backupFile)) {
                error_log("[LOG BACKUP] Backup creado: $backupFile");

                self::cleanOldBackups();
            }

        } catch (Exception $e) {
            error_log("[ERROR] No se pudo crear backup: " . $e->getMessage());
        }
    }

    private static function cleanOldBackups() {
        try {
            if (!is_dir(self::BACKUP_DIR)) {
                return;
            }

            $backupFiles = array_filter(
                scandir(self::BACKUP_DIR),
                function($file) {
                    return strpos($file, 'error_log_backup_') === 0;
                }
            );

            if (count($backupFiles) > 10) {
                usort($backupFiles, function($a, $b) {
                    return filemtime(self::BACKUP_DIR . '/' . $a) - 
                           filemtime(self::BACKUP_DIR . '/' . $b);
                });

                $toDelete = array_slice($backupFiles, 0, count($backupFiles) - 10);
                foreach ($toDelete as $file) {
                    $filePath = self::BACKUP_DIR . '/' . $file;
                    if (unlink($filePath)) {
                        error_log("[LOG CLEANUP] Backup antiguo eliminado: $file");
                    }
                }
            }

        } catch (Exception $e) {
            error_log("[ERROR] Error al limpiar backups antiguos: " . $e->getMessage());
        }
    }

    /**
     * Obtiene información sobre el estado actual del log
     * 
     * @return array Información del estado del log
     */
    public static function getLogStatus() {
        if (!file_exists(self::LOG_PATH)) {
            return [
                'exists' => false,
                'message' => 'Archivo error.log no existe'
            ];
        }

        $fileSize = filesize(self::LOG_PATH);
        $maxSizeBytes = self::MAX_LOG_SIZE * 1024 * 1024;
        $lines = self::countLines();
        $percentage = ($fileSize / $maxSizeBytes) * 100;

        return [
            'exists' => true,
            'size' => $fileSize,
            'size_formatted' => self::formatBytes($fileSize),
            'max_size' => self::MAX_LOG_SIZE . ' MB',
            'max_size_bytes' => $maxSizeBytes,
            'percentage' => round($percentage, 2),
            'lines' => $lines,
            'max_lines' => self::MAX_LINES,
            'status' => $percentage >= 80 ? 'warning' : 'normal',
            'last_modified' => date('Y-m-d H:i:s', filemtime(self::LOG_PATH))
        ];
    }

    private static function countLines() {
        if (!file_exists(self::LOG_PATH)) {
            return 0;
        }
        return count(file(self::LOG_PATH, FILE_SKIP_EMPTY_LINES));
    }

    /**
     * Obtiene el tamaño formateado del archivo
     */
    private static function getFormattedSize() {
        return self::formatBytes(filesize(self::LOG_PATH));
    }

    /**
     * Convierte bytes a formato legible
     */
    private static function formatBytes($bytes, $precision = 2) {
        $units = ['B', 'KB', 'MB', 'GB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        $bytes /= (1 << (10 * $pow));

        return round($bytes, $precision) . ' ' . $units[$pow];
    }

    public static function getLastError() {
        if (!file_exists(self::LOG_PATH)) {
            return null;
        }

        $lines = array_reverse(file(self::LOG_PATH, FILE_SKIP_EMPTY_LINES));
        return !empty($lines) ? trim($lines[0]) : null;
    }

    /**
     * Limpia manualmente el error.log
     */
    public static function forceClean() {
        try {
            self::cleanLog('manual');
            return [
                'success' => true,
                'message' => 'Error.log limpiado manualmente'
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Error al limpiar: ' . $e->getMessage()
            ];
        }
    }
}

// Ejecutar verificación automática al cargar este archivo
LogManager::checkAndCleanLog();
?>