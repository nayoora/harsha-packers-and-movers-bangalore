<?php
/**
 * Harsha Packers and Movers - Quote/Lead form handler
 * Works on Hostinger Business (PHP + mail). Emails each enquiry and logs a backup CSV.
 *
 * SETUP (edit these two lines):
 *   $TO_EMAIL   - where leads are sent (your inbox)
 *   $FROM_EMAIL - an address ON YOUR DOMAIN (create it in Hostinger > Emails),
 *                 e.g. leads@harshapackersandmoversbangalore.com. Using a domain
 *                 address greatly improves delivery vs. a gmail "from".
 */

$TO_EMAIL   = 'harshapackersmovers@gmail.com, leads@harshapackersandmoversbangalore.com';
$FROM_EMAIL = 'leads@harshapackersandmoversbangalore.com';
$SITE_NAME  = 'Harsha Packers and Movers Bangalore';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

/* ---- Honeypot: bots fill this hidden field; humans never see it ---- */
if (!empty($_POST['company'])) {
    // Pretend success so the bot moves on, but send nothing.
    echo json_encode(['ok' => true]);
    exit;
}

function clean($key, $max = 500) {
    $v = isset($_POST[$key]) ? trim($_POST[$key]) : '';
    $v = str_replace(["\r", "\n", "%0a", "%0d"], ' ', $v); // strip header-injection chars
    return substr(strip_tags($v), 0, $max);
}

$name       = clean('name', 120);
$phone      = clean('phone', 20);
$email      = clean('email', 120);
$fromCity   = clean('moving_from', 120);
$toCity     = clean('moving_to', 120);
$floorFrom  = clean('floor_from', 60);
$floorTo    = clean('floor_to', 60);
$liftFrom   = clean('lift_from', 8);
$liftTo     = clean('lift_to', 8);
$bhk        = clean('bhk', 60);
$bigItems   = clean('big_items', 1500);
$boxes      = clean('boxes', 8);
$notes      = clean('notes', 800);
$moveType   = clean('move_type', 80);
$moveDate   = clean('move_date', 40);
$message    = clean('message', 1500);
$pageUrl    = clean('page_url', 300);

/* Vehicles can be a multi-value field */
$vehicles = '';
if (!empty($_POST['vehicle'])) {
    $v = (array) $_POST['vehicle'];
    $v = array_map(function ($x) { return substr(strip_tags(trim($x)), 0, 30); }, $v);
    $vehicles = implode(', ', $v);
}

/* ---- Validation ---- */
$errors = [];
if ($name === '')                                   $errors[] = 'name';
if (!preg_match('/^[+]?[0-9\s-]{10,15}$/', $phone))  $errors[] = 'phone';
if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) $errors[] = 'email';

if ($errors) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'errors' => $errors]);
    exit;
}

/* ---- Compose email ---- */
$subject = 'New Moving Enquiry: ' . $name . ' (' . $phone . ')';
$body  = "You have a new enquiry from your website.\n\n";
$body .= "Name        : $name\n";
$body .= "WhatsApp    : $phone\n";
if ($email)     $body .= "Email       : $email\n";
$body .= "\n";
if ($fromCity)  $body .= "Moving From : $fromCity" . ($floorFrom ? " (Floor: $floorFrom" . ($liftFrom ? ", Lift: $liftFrom" : '') . ")" : '') . "\n";
if ($toCity)    $body .= "Moving To   : $toCity" . ($floorTo ? " (Floor: $floorTo" . ($liftTo ? ", Lift: $liftTo" : '') . ")" : '') . "\n";
if ($moveDate)  $body .= "Shift Date  : $moveDate\n";
if ($bhk)       $body .= "Property    : $bhk\n";
if ($moveType)  $body .= "Service     : $moveType\n";
$body .= "\n";
if ($bigItems)  $body .= "Big Items   : $bigItems\n";
if ($vehicles)  $body .= "Vehicles    : $vehicles\n";
if ($boxes !== '') $body .= "Carton Boxes: $boxes\n";
if ($notes)     $body .= "Notes       : $notes\n";
if ($message)   $body .= "Message     : $message\n";
$body .= "\nPage        : $pageUrl\n";
$body .= "Time        : " . date('d M Y, h:i A') . "\n";
$body .= "IP          : " . ($_SERVER['REMOTE_ADDR'] ?? 'n/a') . "\n";

$headers  = "From: $SITE_NAME <$FROM_EMAIL>\r\n";
if ($email) $headers .= "Reply-To: $name <$email>\r\n";
else        $headers .= "Reply-To: $FROM_EMAIL\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

$sent = @mail($TO_EMAIL, $subject, $body, $headers);

/* ---- Backup log (CSV) in case email delivery fails ---- */
$logLine = sprintf(
    "%s,\"%s\",%s,%s,\"%s\",\"%s\",\"%s\",%s,\"%s\",%s\n",
    date('c'), $name, $phone, $email, $fromCity, $toCity, $bhk, $moveDate, $vehicles, $boxes
);
@file_put_contents(__DIR__ . '/leads.csv', $logLine, FILE_APPEND | LOCK_EX);

if ($sent) {
    echo json_encode(['ok' => true]);
} else {
    // Email failed but lead is logged; tell client so it can offer WhatsApp fallback.
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'mail_failed']);
}
