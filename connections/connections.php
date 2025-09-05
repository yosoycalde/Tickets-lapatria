<?php
 class Database
 {
    Private $host = 'localhost';
    private $db_name = 'tickets-patria';
    private $username = 'root';
    private $password ='';
    private $conn;
    public function connect()
    {
        $this->conn = null;

        try {
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->db_name,
                $this->username,
                $this->password
            );
            this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        } catch (PDOException $e) {
            echo "error de conexion:" . $e->getMessage();
        }
        return $this->conn;
    }
 }
?>