<?php
//El archivo de conexion funciona, se deben cambiar los datos al migrarlo a otro PC o Base de Datos.
//Comprobado que funcion con el archivo "prueba.php"
// Configuration de la base de datos
define('DB_HOST', 'localhost'); 
define('DB_NAME', 'prueba_db'); //Cambiar por nombre de base de datos actualizado
define('DB_USER', 'root');
define('DB_PASS', '');

date_default_timezone_set('America/Santiago');

// Conexión PDO segura
function getDB() {
    try {
        $pdo = new PDO(
            "mysql:host=".DB_HOST.";dbname=".DB_NAME.";charset=utf8",
            DB_USER,
            DB_PASS,
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
            ]
            
        );
        return $pdo;
    } catch(PDOException $e) {
        error_log("Error de conexión: " . $e->getMessage());
        die("Error al conectar con la base de datos");
    }
}
?>
