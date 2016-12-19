<?php
include('connection.php');
date_default_timezone_set('Asia/Kolkata');
$title         = 'untitled';
     $session_query = 'INSERT INTO `recordings`(`session_id`,`title`,`date`) VALUES("'.$_POST['room'].'","'.$title.'",now())';

mysql_query($session_query);

?>