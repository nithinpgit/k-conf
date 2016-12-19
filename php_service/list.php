<?php 
  include('connection.php');
  if(isset($_POST['delete'])){
  
      $deletequery = "DELETE  FROM `recordings`";      
      $res = mysql_query($deletequery);
      echo "<script>window.location.href = 'list.php';</script>";
  }
  $selectquery = "SELECT `id`,`session_id`,`title`,`date`,date(`date`) as `dateonly` FROM `recordings` ORDER BY date desc";
  $res = mysql_query($selectquery);
  //print_r(mysql_fetch_assoc($res));
?>
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta content='width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no' name='viewport'>
    <!-- The above 3 meta tags *must* come first in the head; any other head content must come *after* these tags -->
    <title>Recordings List</title>
    <script src="../assets/js/jquery.min.js"></script>
    <!-- Bootstrap -->
    <link rel="stylesheet" type="text/css" href="../assets/css/bootstrap.css">
    <link rel="stylesheet" href="../assets/css/video.css" />
    <style>
      body{
        margin: 0px;
      }
      .header{
        background-color: #3e5c6e;
        width: 100%;
        height: 80px;
      }
      .header img{
        height: 64px;
      }
      hr{
        background-color: #9a9a9a;
      }
      .heading{
          font-family: Arial;
          font-weight: bold;
          font-size: 24px;
          margin-left: 30px;
          color: #fff;
          padding-top: 23px;
      }
      .down-but{
          width: 106px;
          height: 25px;
          border-radius: 6px;
          border-width: 0px;
          background-color: green;
          color: #fff;
      }
    </style>

    <!-- HTML5 shim and Respond.js for IE8 support of HTML5 elements and media queries -->
    <!-- WARNING: Respond.js doesn't work if you view the page via file:// -->
    <!--[if lt IE 9]>
      <script src="https://oss.maxcdn.com/html5shiv/3.7.2/html5shiv.min.js"></script>
      <script src="https://oss.maxcdn.com/respond/1.4.2/respond.min.js"></script>
    <![endif]-->
  </head>
  <body>
    <div class="header">
       <div class="heading">Video Conference Recordings</div>
    </div>
    <div class="container">
      <div class="row">
        <br>
        
      </div>
      <div class="row">
        <!--<form onsubmit="return confirm('Do you really want to delete all recordings ?');" style="padding-left:44px;" action="" method="POST">
              <input type="hidden" name="delete" value="delete"/>
              <input type="submit" value="Delete All"></input>
        </form>
        <br>
        <hr>
        <br/>-->
    <?php 
      $date = 0;
      if($res){
        while($result = mysql_fetch_assoc($res)){
        if($date != $result['dateonly']){

              echo '<h4 style="width:100%;float:right;">Recordings On '.$result['dateonly'].'</h4>';
        }
        
    ?>
        <div class="col-lg-2 col-md-2 col-sm-3 col-xs-6 text-center">
          <a onClick="redirectLink('<?php echo $result['session_id']?>','true')"><img src="../assets/images/thumb.png" alt="Recording <?php echo $result['id'] ?>"></a>
          <p><a onClick="redirectLink('<?php echo $result['session_id']?>','false')"><button class="down-but">Download</button></a></p>
          
          <p><a><?php echo $result['date'] ?></a></p>
        </div>
    <?php
    $date   =  $result['dateonly'];
        }
      }
    ?>  
      </div>
    </div>

    <!-- jQuery (necessary for Bootstrap's JavaScript plugins) -->
    <script type="text/javascript" src="assets/js/jquery.min.js"></script>
    <!-- Include all compiled plugins (below), or include individual files as needed -->
  </body>
</html>
<script>
function redirectLink(room,play){
  $.ajax({
          url: "check_recording.php",
          data: { room: room},
          method: "POST",
          success: function(d){
              if(d == 'true'){
                var url = '../recordings/export-record/export.php?id='+room+'&play='+play;
                window.open(url, '_blank');
              }else{
                alert('recording processing you have to wait '+d+' hours');
              }
          }
        });
     
     //window.location=url;

     
}
</script>