<?php
$time_limit = 5;
include('connection.php');
$_POST['room'] = $_POST['room'];
$selectquery = 'SELECT * FROM `recordings` WHERE `session_id`="'.$_POST['room'].'" ORDER BY date desc';
$res = mysql_query($selectquery);
$data = mysql_fetch_assoc($res);
//print_r($data);
date_default_timezone_set('Asia/Kolkata');
$timeSecond  = strtotime($data['date']);
$timeFirst   =   date('Y-m-d H:i:s', time());
$timeFirst  = strtotime($timeFirst);
$differenceInSeconds = $timeFirst-$timeSecond;
if($differenceInSeconds > ($time_limit*60)){
   echo 'true';
}else{
  echo foo(($time_limit*60)-$differenceInSeconds);
}

function foo($seconds) {
  $t = round($seconds);
  return sprintf('%02d:%02d:%02d', ($t/3600),($t/60%60), $t%60);
}

?>