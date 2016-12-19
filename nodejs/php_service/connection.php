<?php
$DATABASE_NAME    =     "ms2part2";
$DATABASE_HOST    =     "localhost";
$DATABASE_USER    =     "root";
$DATABASE_PASS    =     "Admin@123#";
$con = mysql_connect($DATABASE_HOST,$DATABASE_USER,$DATABASE_PASS);
if (!$con)	
{
  	die('Could not connect: ' . mysql_error());
}
mysql_select_db($DATABASE_NAME, $con);
?>