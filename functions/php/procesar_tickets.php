<?php
require_once 'config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        Utils::sendResponse(false, 'Método no permitido', null, 405);
    }

    if (empty($_POST)) {
        Utils::sendResponse(false, 'No se recibieron datos');
    }

    $conn = DatabaseConfig::getDirectConnection();

    $nombre = Utils::sanitizeInput($_POST['nombre'] ?? '');
    $email = Utils::sanitizeInput($_POST['email'] ?? '');
    $departamento = Utils::sanitizeInput($_POST['departamento'] ?? '');
    $categoria_id = filter_var($_POST['categoria'] ?? '', FILTER_VALIDATE_INT);
    $prioridad = Utils::sanitizeInput($_POST['prioridad'] ?? 'media');
    $titulo = Utils::sanitizeInput($_POST['titulo'] ?? '');
    $descripcion = Utils::sanitizeInput($_POST['descripcion'] ?? '');

    $errors = [];

    if (empty($nombre)) {
        $errors[] = 'El nombre es requerido';
    } elseif (strlen($nombre) > 100) {
        $errors[] = 'El nombre no puede exceder 100 caracteres';
    }

    if (empty($email)) {
        $errors[] = 'El correo electrónico es requerido';
    } elseif (!Utils::validateEmail($email)) {
        $errors[] = 'El formato del correo electrónico no es válido';
    } elseif (strlen($email) > 150) {
        $errors[] = 'El correo electrónico no puede exceder 150 caracteres';
    }

    if (!empty($departamento) && strlen($departamento) > 100) {
        $errors[] = 'El departamento no puede exceder 100 caracteres';
    }

    if (!$categoria_id || $categoria_id < 1 || $categoria_id > 7) {
        $errors[] = 'Debe seleccionar una categoría válida';
    }

    if (!in_array($prioridad, ['baja', 'media', 'alta', 'critica'])) {
        $errors[] = 'Prioridad no válida';
    }

    if (empty($titulo)) {
        $errors[] = 'El título es requerido';
    } elseif (strlen($titulo) > 200) {
        $errors[] = 'El título no puede exceder 200 caracteres';
    }

    if (empty($descripcion)) {
        $errors[] = 'La descripción es requerida';
    } elseif (strlen($descripcion) > 2000) {
        $errors[] = 'La descripción no puede exceder 2000 caracteres';
    }

    $imagen_url = null;
    if (isset($_FILES['imagen']) && $_FILES['imagen']['error'] !== UPLOAD_ERR_NO_FILE) {
        if ($_FILES['imagen']['error'] === UPLOAD_ERR_OK) {
            $allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
            $file_type = $_FILES['imagen']['type'];
            $file_size = $_FILES['imagen']['size'];
            $max_size = 5 * 1024 * 1024; // 5MB

            if (!in_array($file_type, $allowed_types)) {
                $errors[] = 'El archivo debe ser una imagen válida (JPG, PNG o GIF)';
            }

            if ($file_size > $max_size) {
                $errors[] = 'La imagen no puede superar los 5MB';
            }

            if (empty($errors)) {
                $upload_dir = '../../../uploads/tickets/';
                if (!file_exists($upload_dir)) {
                    mkdir($upload_dir, 0777, true);
                }

                $file_extension = pathinfo($_FILES['imagen']['name'], PATHINFO_EXTENSION);
                $unique_name = uniqid('ticket_', true) . '.' . $file_extension;
                $upload_path = $upload_dir . $unique_name;

                if (move_uploaded_file($_FILES['imagen']['tmp_name'], $upload_path)) {
                    $imagen_url = 'uploads/tickets/' . $unique_name;
                    error_log("Imagen guardada: $imagen_url");
                } else {
                    $errors[] = 'Error al guardar la imagen';
                    error_log("Error al mover archivo a: $upload_path");
                }
            }
        } elseif ($_FILES['imagen']['error'] !== UPLOAD_ERR_NO_FILE) {
            $errors[] = 'Error al subir la imagen';
            error_log("Error en upload de imagen: " . $_FILES['imagen']['error']);
        }
    }

    if (!empty($errors)) {
        Utils::sendResponse(false, implode(', ', $errors));
    }

    $conn->autocommit(false);

    try {
        $stmt_user_check = $conn->prepare("SELECT id FROM usuarios WHERE email = ?");
        if (!$stmt_user_check) {
            throw new Exception('Error en la consulta de usuario: ' . $conn->error);
        }
        
        $stmt_user_check->bind_param("s", $email);
        $stmt_user_check->execute();
        $result_user = $stmt_user_check->get_result();

        if ($result_user->num_rows > 0) {
            $user_data = $result_user->fetch_assoc();
            $usuario_id = $user_data['id'];
            
            $stmt_user_update = $conn->prepare("UPDATE usuarios SET nombre = ?, departamento = ? WHERE id = ?");
            if (!$stmt_user_update) {
                throw new Exception('Error en la actualización de usuario: ' . $conn->error);
            }
            $stmt_user_update->bind_param("ssi", $nombre, $departamento, $usuario_id);
            
            if (!$stmt_user_update->execute()) {
                throw new Exception('Error al actualizar usuario: ' . $stmt_user_update->error);
            }
        } else {
            $stmt_user_insert = $conn->prepare("INSERT INTO usuarios (nombre, email, departamento) VALUES (?, ?, ?)");
            if (!$stmt_user_insert) {
                throw new Exception('Error en la inserción de usuario: ' . $conn->error);
            }
            $stmt_user_insert->bind_param("sss", $nombre, $email, $departamento);
            
            if (!$stmt_user_insert->execute()) {
                throw new Exception('Error al insertar usuario: ' . $stmt_user_insert->error);
            }
            $usuario_id = $conn->insert_id;
        }

        $stmt_cat_check = $conn->prepare("SELECT id FROM categorias WHERE id = ?");
        if (!$stmt_cat_check) {
            throw new Exception('Error en la consulta de categoría: ' . $conn->error);
        }
        $stmt_cat_check->bind_param("i", $categoria_id);
        $stmt_cat_check->execute();
        $result_cat = $stmt_cat_check->get_result();

        if ($result_cat->num_rows === 0) {
            throw new Exception('Categoría no válida');
        }

        if ($imagen_url) {
            $stmt_ticket = $conn->prepare("
                INSERT INTO tickets (usuario_id, categoria_id, titulo, descripcion, prioridad, estado, imagen_url, fecha_creacion, fecha_actualizacion)
                VALUES (?, ?, ?, ?, ?, 'Abierto', ?, NOW(), NOW())
            ");

            if (!$stmt_ticket) {
                throw new Exception('Error en la inserción de ticket: ' . $conn->error);
            }

            $stmt_ticket->bind_param("iissss", $usuario_id, $categoria_id, $titulo, $descripcion, $prioridad, $imagen_url);
        } else {
            $stmt_ticket = $conn->prepare("
                INSERT INTO tickets (usuario_id, categoria_id, titulo, descripcion, prioridad, estado, fecha_creacion, fecha_actualizacion)
                VALUES (?, ?, ?, ?, ?, 'Abierto', NOW(), NOW())
            ");

            if (!$stmt_ticket) {
                throw new Exception('Error en la inserción de ticket: ' . $conn->error);
            }

            $stmt_ticket->bind_param("iisss", $usuario_id, $categoria_id, $titulo, $descripcion, $prioridad);
        }
        
        if (!$stmt_ticket->execute()) {
            throw new Exception('Error al insertar ticket: ' . $stmt_ticket->error);
        }

        $ticket_id = $conn->insert_id;

        $conn->commit();

        error_log("Ticket creado exitosamente - ID: $ticket_id, Usuario: $email" . ($imagen_url ? ", Con imagen: $imagen_url" : ""));

        Utils::sendResponse(true, 'Ticket creado exitosamente', [
            'ticket_id' => $ticket_id,
            'usuario_id' => $usuario_id,
            'imagen_url' => $imagen_url
        ]);

    } catch (Exception $e) {
        $conn->rollback();

        if ($imagen_url && file_exists('../../../' . $imagen_url)) {
            unlink('../../../' . $imagen_url);
        }
        
        error_log("Error en transacción: " . $e->getMessage());
        Utils::sendResponse(false, 'Error al procesar el ticket: ' . $e->getMessage());
    }

} catch (Exception $e) {
    error_log("Error general en procesar_tickets.php: " . $e->getMessage());
    Utils::sendResponse(false, 'Error de conexión a la base de datos. Verifica que la base de datos esté creada y las tablas existan.', null, 500);
} finally {
    if (isset($conn) && $conn instanceof mysqli) {
        DatabaseConfig::getInstance()->closeConnection();
    }
}