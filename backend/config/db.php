<?php
// Configuración de la base de datos
define('DB_HOST', 'localhost');
define('DB_NAME', 'GestionAtrasosLiceo');
define('DB_USER', 'root');
define('DB_PASS', '224314280');
date_default_timezone_set('America/Santiago');

// Conexión PDO segura
function getDB() {
    try {
        \ = new PDO(
            "mysql:host=".DB_HOST.";dbname=".DB_NAME.";charset=utf8",
            DB_USER, 
            DB_PASS,
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
            ]
        );
        return \;
    } catch(PDOException \) {
        error_log("Error de conexión: " . \->getMessage());
        die("Error al conectar con la base de datos");
    }
}
?>
