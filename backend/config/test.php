<?php
require_once './config/db.php';
try {
    $conn = getDB();
    echo "✅ Conexión exitosa a la DB";
} catch (PDOException $e) {
    echo "❌ Error: " . $e->getMessage();
}