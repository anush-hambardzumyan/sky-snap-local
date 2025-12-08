<?php
require_once "config.php";

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$data = json_decode(file_get_contents("php://input"), true);

if (!$data || !isset($data['name']) || !isset($data['email']) || !isset($data['password'])) {
    echo json_encode(["success" => false, "message" => "Missing fields"]);
    exit;
}

$name = trim($data['name']);
$email = trim($data['email']);
$password = password_hash($data['password'], PASSWORD_DEFAULT);

try {
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->rowCount() > 0) {
        echo json_encode(["success" => false, "message" => "Email already exists"]);
        exit;
    }

    $stmt = $pdo->prepare("INSERT INTO users (name, email, password) VALUES (?, ?, ?)");
    $stmt->execute([$name, $email, $password]);

    echo json_encode(["success" => true, "message" => "Registered successfully!"]);
} catch(Exception $e) {
    echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
}
?>
