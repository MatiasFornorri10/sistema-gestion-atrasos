<?php
$host = "127.0.0.1";
$usuario = "root";
$contrasena = "";
$basedatos = "prueba_db";

$conn = new mysqli($host, $usuario, $contrasena, $basedatos);

if ($conn->connect_error) {
    die("Error de conexión: " . $conn->connect_error);
} else {
    echo "✅ Conexión exitosa a la base de datos de prueba";
}

$registro_usuario = $conn->prepare("INSERT INTO usuarios (nombre) VALUES (:nombre);");
$registro_usuario->bindParam(":nombre", $nombre);
$registro_usuario->execute();
?>