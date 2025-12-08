<?php
require_once "config.php";

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$data = json_decode(file_get_contents("php://input"), true);

if (!$data || !isset($data['email']) || !isset($data['password'])) {
    echo json_encode(["success" => false, "message" => "Missing email or password"]);
    exit;
}

$email = trim($data['email']);

try {
    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if ($user && password_verify($data['password'], $user['password'])) {
        echo json_encode([
            "success" => true,
            "message" => "Login successful",
            "user" => ["id" => $user['id'], "name" => $user['name'], "email" => $user['email']]
        ]);
    } else {
        echo json_encode(["success" => false, "message" => "Invalid email or password"]);
    }
} catch(Exception $e) {
    echo json_encode(["success" => false, "message"Error: " . $e->getMessage()]);
}
?>
