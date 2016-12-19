var localVideo;
var sessionId;
var screensessionId;
var participants         = {};
var reloadforscreenshare = 0;
var globalconstraints    = 0;
var historyArray = {};
var socket = io.connect(node_url);
var session_time = 0;
var video_lock_array = {};
var audio_lock_array = {};
socket.on("connect", function (id) {
    register(role);    
});
window.onbeforeunload = function () {
    socket.disconnect();
};
/**
 * Register to a romm
 * @param role ( screen for screen share default role for cam share )
 */
function register(roleval) {
    var data = {
        id: "register",
        userName: userName,
        role: roleval,
        mode: mode,
        room:room
    };
    sendMessage(data);
}
/**
 * Register to a romm
 * @param callback for getting socket id
 */
socket.on("id", function (id) {
    sessionId       = id;
    screensessionId = id+'_screen';
    socketId        = id;
    //$('#myvideo').html('<video id="video-'+socketId+'"></video>');
});
/**
 * Send message to server
 * @param data
 */
function sendMessage(data) {

    socket.emit("message", data);
}
/*
   function for sending data to all
*/
function sendToAll(contentJson)
{
    var message = {
        id : 'sendToAll',
        name : socketId,
        contentJson : contentJson,
        room : room
    }; 
    sendMessage(message);
}

function onReceiveSendToAll(parsedMessage)
{
    if(parsedMessage.room == room)
    {
        var jsonstring = parsedMessage.contentJson;
        var parsedMessage = JSON.parse(jsonstring);
        var parsedValues;
            switch (parsedMessage.method) {
                case 'video_ctrl':
                        video_lock_array[parsedMessage.id] = parsedMessage.status;
                        controlVideo(parsedMessage.status, parsedMessage.id);
                        if (parsedMessage.status == 'true' && parsedMessage.id == socketId) {
                            showNotifiction('Your video is enabled by presenter');
                            $('.cam-on-off').removeClass('active');
                            
                        } else if (parsedMessage.id == socketId) {
                            showNotifiction('Your video is disabled by presenter');
                            $('.cam-on-off').addClass('active');
                            
                        }
                        if(parsedMessage.id != socketId && parsedMessage.status == 'true'){
                            $('#m-'+parsedMessage.id).removeClass('active'); 
                        }else if(parsedMessage.id != socketId && parsedMessage.status == 'false'){
                            $('#m-'+parsedMessage.id).removeClass('active');
                        }
                        break;
                    case 'audio_ctrl':
                        audio_lock_array[parsedMessage.id] = parsedMessage.status;
                        controlAudio(parsedMessage.status, parsedMessage.id);
                        if (parsedMessage.status == 'true' && parsedMessage.id == socketId) {
                            showNotifiction('Your audio is unmuted by presenter');
                            $('.cam-on-off').removeClass('active');
                           
                        } else if (parsedMessage.id == socketId) {
                            showNotifiction('Your audio is muted by presenter');
                             $('.mic-on-off').addClass('active');
                             
                        }
                        if(parsedMessage.id != socketId && parsedMessage.status == 'true'){
                            $('#m-'+parsedMessage.id).removeClass('active'); 
                        }else if(parsedMessage.id != socketId && parsedMessage.status == 'false'){
                            $('#m-'+parsedMessage.id).removeClass('active');
                        }
                        break;
                case 'onkick':
                     kickUserRecived(parsedMessage.user_id);
                     break;
                case 'chat':
                    loadChat(parsedMessage.name,parsedMessage.msg,false);
                    break;

                default:
                    console.error('Unrecognized message', parsedMessage);
            }
    }
}
/**
 * Invoke from nodejs server on each event triggers
 * @param message
 */
socket.on("message", function (message) {
    switch (message.id) {
        case "registered":
             joinRoom(room,message.role);
        break;
        case "existingParticipants":
            if(message.role == 'screen')
            {
               onExistingParticipants(message,screensessionId,screensessionId,'screen');
            }
            else
            {
                onExistingParticipants(message,sessionId,socketId,role);
            }
        break;
        case "receiveVideoAnswer":
            onReceiveVideoAnswer(message);
        break;
        case "newParticipantArrived":
            onNewParticipant(message);
        break;
        case "participantLeft":
             onParticipantLeft(message);
        break;
        case "onExistingUserForConnectionCheck":
             onExistingUserForConnectionCheck(message);
        break;
        case "iceCandidate":
            var participant = participants[message.sessionId];
            if (participant != null) {
                participant.rtcPeer.addIceCandidate(message.candidate, function (error) {
                    if (error) {
                        if (message.sessionId === sessionId) {
                            console.error("Error adding candidate to self : " + error);
                        } else {
                            console.error("Error adding candidate : " + error);
                        }
                    }
                });
            } else {
                console.error('still does not establish rtc peer for : ' + message.sessionId);
            }
        break;
        case 'onReceiveSendToOne':
              onReceiveSendToOne(message);
        break;
        case 'onReceiveSendToAll':  
              onReceiveSendToAll(message);
        break;
        default:
             console.log("Unrecognized message: "+message.id);
    }
});
/**
 * Check if roomName exists, use DOM roomName otherwise, then join room
 * @param roomName and roleval
 */
function joinRoom(roomName,roleval) {

    if(typeof roomName == 'undefined'){
        roomName = room;
    }
    var data = {
        id: "joinRoom",
        roomName: roomName,
        userName: userName,
        role: roleval,
        mode: mode,
        webinar: webinar,
        recording: record
    };
    sendMessage(data);
}
/**
 * Request video from all existing participants
 * @param message
 */

function onExistingParticipants(message,ses_id,name_id,cur_role) {
    showNotifiction('successfully connected to server');
    connctionLost = 0;
    if(globalconstraints==0)
    {
        if(webinar == '0' || mode == 'presenter')
        {
            var constraints = {
                audio: true,
                video: {
                frameRate: 15,
                width: 320,
                height: 240
                }
            };
        }
        else
        {
            var constraints = {
                audio: false,
                video: false
            };
        }
            
    }
    else
    {
        var constraints = globalconstraints;
    }
    var localParticipant = new Participant(ses_id,cur_role,mode,webinar);
    participants[ses_id] = localParticipant;
    createVideoForuserList(userName,name_id,cur_role,mode,'true','true');
    localVideo = document.getElementById("video-"+name_id);
    var video = localVideo;

    // bind function so that calling 'this' in that function will receive the current instance
    var options = {
        localVideo: video,
        mediaConstraints: constraints,
        onicecandidate: localParticipant.onIceCandidate.bind(localParticipant)
    };

    if(webinar == '0' || mode == 'presenter')
    {
        localParticipant.rtcPeer = new kurentoUtils.WebRtcPeer.WebRtcPeerSendonly(options, function (error) {
            if (error) {
                swal("Message", "Camera or Microphone is not connected properly");
                return console.error(error);
            }
            localVideo = document.getElementById("video-"+name_id);
            localVideo.src = localParticipant.rtcPeer.localVideo.src;
            localVideo.muted = true; 
            this.generateOffer(localParticipant.offerToReceiveVideo.bind(localParticipant));
            
        });
    }
    if(reloadforscreenshare == 0)
    {
        for (var i in message.data) {
            var str = message.data[i];
            var res = str.split("*_*");
            var request             = {};
                request['userid']   = res[0];
                request['userName'] = res[1];
                request['role']     = res[2];
                request['mode']     = res[3];
                request['video'] = res[4];
                request['audio'] = res[5];
                receiveVideoFrom(res[0],request);
       }
    }
    var message = {
                id: "startRecording",
                room:room
            };
    sendMessage(message);
    reloadforscreenshare = 0;
}
/**
 * Receive video from new participant
 * @param message
 */
function onNewParticipant(message) {
    message.video = 'true';
    message.audio = 'true';
    receiveVideoFrom(message.new_user_id,message);
}
/**
 * Add new participant locally and request video from new participant
 * @param sender
 */
function receiveVideoFrom(sender,message) {
    var res = sender.replace("_screen", "");
    if(res != socketId)
    {
        var participant = new Participant(sender,role,mode,webinar);
        participants[sender] = participant;
        var video = createVideoForParticipant(sender,message);

        // bind function so that calling 'this' in that function will receive the current instance
        var options = {
            remoteVideo: video,
            onicecandidate: participant.onIceCandidate.bind(participant)
        };

        participant.rtcPeer = new kurentoUtils.WebRtcPeer.WebRtcPeerRecvonly(options, function (error) {
            if (error) {
                alert('error');
                return console.error(error);
            }
            this.generateOffer(participant.offerToReceiveVideo.bind(participant));
        });
    }
}
/**
 * On receive video answer
 * @param message
 */
function onReceiveVideoAnswer(message) {
    var participant = participants[message.sessionId];
    participant.rtcPeer.processAnswer(message.sdpAnswer, function (error) {
        if (error) {
            console.error(error);
        } else {
            participant.isAnswer = true;
            while (participant.iceCandidateQueue.length) {
                var candidate = participant.iceCandidateQueue.shift();
                participant.rtcPeer.addIceCandidate(candidate);
            }
        }
    });
}
/**
 * Create video DOM element
 * @param participant
 * @returns {Element}
 */
function createVideoForParticipant(userid,message) {

    //pingUsers(userid);
    
         var videoId = "video-" + userid;
         createVideoForuserList(message.userName,userid,message.role,message.mode,message.video, message.audio);
         return document.getElementById(videoId);
   
   
}
/**
 * Function for creating video elements
 * @param realName,name_id,userRole,userMode
 */
function createVideoForuserList(realName,name_id,userRole,userMode,video,audio)
{
    //alert(realName+'//'+userMode+'//'+video+'//'+audio);
  
  if(webinar == '0' || userMode == 'presenter'){
     var video_html ='<video data-myid="'+name_id+'" onplay="onPlayVideo(\''+name_id+'\')" width="320" height="240" id="video-'+name_id+'" autoplay="true"></video>';
     if(name_id == socketId){
        $('#layout').append(video_html);
     }else{
        $('#layout').append(video_html);
     }
     layout();
  }
  generateUserList(realName,userMode,name_id,video,audio);
     
}
/**
 * Function triggered when playing a video 
 * @param socketId
 */
function onPlayVideo(id)
{

}
/**
 * Destroy videostream/DOM element on participant leaving room
 * @param message
 */
function onParticipantLeft(message) {
    if(participants[message.sessionId]){
        var participant = participants[message.sessionId];
        participant.dispose();
        delete participants[message.sessionId];
    }
    $('#video-'+message.sessionId).remove();
    $('#user-'+message.sessionId).remove();
    layout();
}
/**
 * Send data to perticular user
 * @param contentJson,receiversocket
 */
function sendToOne(contentJson,receiversocket)
{
    var message = {
        id : 'sendToOne',
        receiversocket : receiversocket,
        sendersocket : socketId,
        contentJson : contentJson,
        room : room
    };

    sendMessage(message);
}  
/**
 * Trigger when someone send data to only me
 * @param parsedMessage
 */
function onReceiveSendToOne(parsedMessage)
{
    
        
        var jsonstring = parsedMessage.contentJson;
        var jsonobject = JSON.parse(jsonstring);
        var parsedValues;
        
                switch (jsonobject.method) 
                {
                    case 'pinguser':
                    break;                    
                    default:
                        console.error('Unrecognized message', parsedMessage);
                }
   
}
/**
 * Destroy ping session for findout ghost user
 * @param message
 */
//==============================================================
function onReceivePingReply(pingdata)
{ 
     
      var pingid = pingdata['pingid'];
      if(pingRegistry.hasOwnProperty(pingid))
        {
           var aliveuser = pingRegistry[pingid];
           delete pingRegistry[pingid];
           //console.log('User alive : '+aliveuser);
           
        }
}
function pingreplysend(pingdata,sendersocket)
{
        
        pingdata['method']              = 'pingreply';
        var jsonpingdata                = JSON.stringify(pingdata);
        sendToOne(jsonpingdata,sendersocket);
}
/**
 * Tell room you're leaving and remove all video elements
 */
function leaveRoom(){
    if(participants)
    {
         if(participants.hasOwnProperty(sessionId))
          {
            var message = {
                id: "leaveRoom"
            };
            if(webinar == '0')
            {
                participants[sessionId].rtcPeer.dispose();
            }
            
            sendMessage(message);
            participants = {};
            var myNode = document.getElementById("layout");
            while (myNode.firstChild) {
                myNode.removeChild(myNode.firstChild);
            }
            $('.chat-content').html(''); 
            $('.part-content').html('');
            layout();
         }
    } 
}


//=========================================================================
//===================== common util functions==============================
/* 
* Generate Unique id 
* @return: Unique id
*/
function generateUUID(){
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        var out = (c=='x' ? r : (r&0x3|0x8)).toString(16);
        var ret = out.substr(out.length - 3);
        return ret;
    });
    var ret = uuid.substr(uuid.length - 6);
    return ret;
}
function loadSettings(){
    var locstr = localStorage.getItem(room+"-settings");
    if(locstr){
        var object = JSON.parse(locstr),
        dateString = object.timestamp,
        now = new Date().getTime().toString();
        var difference = now-dateString;
        var minuteDifference = Math.floor(difference/1000/60);
        if(minuteDifference > 30){
            
            settingsClick();
        }
    }else{
        settingsClick();
    }
}
$('document').ready(function(){
    loadHistory();
    loadSettings();
    $(".chat-input").keypress(function(event){
                if(event.keyCode == 13)
                {
                    var msg = $('.chat-input').val();
                    if(msg != ''){
                      loadChat(userName,msg,true);
                    }
                    $('.chat-input').val('');
                    event.preventDefault();
                }

            });
    $('.send-chat').click(function(){
         var msg = $('.chat-input').val();
                    if(msg != ''){
                      loadChat(userName,msg,true);
                    }
                    $('.chat-input').val('');
    });
    $('.settings').click(function(){
           settingsClick();  
    });  
    $('.leavemeeting').click(function(){
           swal({   title: "Are you sure?",   text: "Are you sure to leave from the current meeting session ?",   type: "warning",   showCancelButton: true,   confirmButtonColor: "#DD6B55",   confirmButtonText: "Yes, Leave !",   closeOnConfirm: false }, function(){ leaveRoom();socket.disconnect();swal("Leave!", "Your have been succesfully leave from the current session.", "success"); }); 
    }); 
    $('.cam-on-off').click(function(){
        var obj = {};
        obj['method'] = 'video_ctrl';
        obj['id'] = socketId;
        var allow = 1;
        if($('.cam-on-off').hasClass('active')){
           
           if (video_lock_array.hasOwnProperty(socketId)) {
                if (video_lock_array[socketId] == 'false') {
                    allow = 0;
                }
            }
            if (allow == 1) {
                controlVideo('true', socketId);
                $('.cam-on-off').removeClass('active');
                obj['status'] = 'true';
                showNotifiction('Your camera has been enabled succesfully');
            } else {
                showNotifiction('You cannot enable video this time');
            }
           
        }else{
           $('.cam-on-off').addClass('active');
           controlVideo('false', socketId);
                    obj['status'] = 'false';
           showNotifiction('Your camera has been disabled succesfully');
        }
        if (allow == 1){
            sendToAll(JSON.stringify(obj));
        }
    });
    $('.mic-on-off').click(function(){
        var obj = {};
        obj['method'] = 'audio_ctrl';
        obj['id'] = socketId;
        var allow = 1;
        if($('.mic-on-off').hasClass('active')){
           if (audio_lock_array.hasOwnProperty(socketId)) {
                if (audio_lock_array[socketId] == 'false') {
                    allow = 0;
                }
            }
            if (allow == 1) {
                $('.mic-on-off').removeClass('active');
                obj['status'] = 'true';
                showNotifiction('Your audio is unmuted succesfully');
            } else {
                showNotifiction('You cannot enable audio this time');
            }
           showNotifiction('Your microphone has been unmuted succesfully');
        }else{
           $('.mic-on-off').addClass('active');
           obj['status'] = 'false';
           showNotifiction('Your microphone has been muted succesfully');
        }   
        if (allow == 1){
            sendToAll(JSON.stringify(obj));
        }
    });
    $('.screenshare').click(function(){
          if($('.screenshare').hasClass('active')){
           $('.screenshare').removeClass('active');

           showNotifiction('Your screensharing stopped');
           
        }else{
           $('.screenshare').addClass('active');
           showNotifiction('You have been succesfully initiated screenshare');
        }    
    });
    if(mode == 'presenter'){
        timerFunction();
    }
});
function timerFunction(){
         if(socketId){
            session_time++;
            if(session_time % 5 == 0){
                var data = {
                    id: "saveRecTime",
                    room: room
                };
                sendMessage(data);
            }
          }
            setTimeout(timerFunction,1000);
        }
function generateUserList(realName,userMode,name_id,video,audio){
    var userHtml  = '<div class="user" id="user-'+name_id+'">';
        userHtml += '<img src="assets/images/avatar1.png"/>';
        userHtml += '<div class="options">';
        if(userMode == 'presenter'){
            userHtml += '<span id="name-'+name_id+'">'+realName+'( presenter)</span>';
        }else{
            userHtml += '<span id="name-'+name_id+'">'+realName+'</span>';
        }
        if(name_id != socketId){
            userHtml += '<ul>';
            if(video == 'false'){
               userHtml += '<li class="cam-on-off-user active" id="v-'+name_id+'"><i class="fa fa-video-camera cam-ic"></i></li>';
               //controlVideo(video, name_id);
            }else{
               userHtml += '<li class="cam-on-off-user" id="v-'+name_id+'"><i class="fa fa-video-camera cam-ic"></i></li>';
            }
            if(audio == 'false'){
               userHtml += '<li class="mic-on-off-user active" id="m-'+name_id+'" style="padding-left:8px !important;"><i class="fa fa-microphone"></i></li>';
               //controlAudio(audio, name_id);
            }else{
               userHtml += '<li class="mic-on-off-user" id="m-'+name_id+'" style="padding-left:8px !important;"><i class="fa fa-microphone"></i></li>';
            }
            if(mode == 'presenter')
            userHtml += '<li id="k-'+name_id+'" style="padding-left:7px !important;"><i class="fa fa-times" aria-hidden="true"></i></li>';
            userHtml += '</ul>';
            if (mode != 'presenter') {
                video_lock_array[name_id] = video;
                audio_lock_array[name_id] = audio;
            }
        }
        userHtml += '</div>';
        userHtml += '</div>';
    $('.part-content').append(userHtml);
    $('#v-'+name_id).click(function(){
        var status = 'false';
        var allow = 1;
        if($('#v-'+name_id).hasClass('active')){
           if (video_lock_array.hasOwnProperty(name_id)) {
                if (video_lock_array[name_id] == 'false') {
                    allow = 0;
                }
            }
            status = 'true';
            if (allow == 1){
                $('#v-'+name_id).removeClass('active');
                showNotifiction(realName+'\'s camera has been enabled succesfully');
            }
           
        }else{
           $('#v-'+name_id).addClass('active');
           status = 'false';
           showNotifiction(realName+'\'s camera has been disabled succesfully');
        }
        if (allow == 1) {
                controlVideo(status, name_id);
                var obj = {};
                obj['method'] = 'video_ctrl';
                obj['id'] = name_id;
                obj['status'] = status;
                if (mode == 'presenter')
                    sendToAll(JSON.stringify(obj));
            } else {
                showNotifiction('you cannot enable video this time');
        }

    });
    $('#m-'+name_id).click(function(){
        var allow = 1;
        if($('#m-'+name_id).hasClass('active')){
           status = 'true';
           if (audio_lock_array.hasOwnProperty(name_id)) {
                if (audio_lock_array[name_id] == 'false') {
                    allow = 0;
                }
            }
            if (allow == 1){
                $('#m-'+name_id).removeClass('active');
                showNotifiction(realName+'\'s camera has been enabled succesfully');
            }
           
        }else{
           $('#m-'+name_id).addClass('active');
           showNotifiction(realName+'\'s mic has been muted succesfully');
        }
        if (allow == 1) {
            controlAudio(status, name_id);
            var name = $("#name-" + name_id).html();
            var obj = {};
            obj['method'] = 'audio_ctrl';
            obj['id'] = name_id;
            obj['status'] = status;
            if (mode == 'presenter'){
                sendToAll(JSON.stringify(obj));
            }
        }else {
             showNotifiction('you cannot enable audio this time')
        }

    });

    $('#k-'+name_id).click(function(){
        var kickdata = {};
                kickdata['method'] = 'onkick';
                kickdata['user_id'] = name_id;
                var kickjson = JSON.stringify(kickdata);
                sendToAll(kickjson);
    });
}

function kickUserRecived(id) {

    if (id == socketId) {
        stopSession = 1;
        leaveRoom();
        showNotifiction('You have been kicked from this meeting');
        swal("Message", "You have been kicked from this meeting");
        socket.disconnect();
    }

}
function controlAudio(status, id) {
        if (status == 'false') {
            $('#video-' + id).prop('muted', true);
            $('.m-' + id).addClass('active');
        } else {
            var allow = 1;
            if (audio_lock_array.hasOwnProperty(id)) {
                if (audio_lock_array[id] == 'false') {
                    allow = 0;
                }
            }
            if (allow == 1) {
                $('#video-' + id).prop('muted', false);
                $('.m-' + id).removeClass('active');
            } else {
                showNotifiction('You cannot unmute audio this time');
            }

        }
}
function controlVideo(status, id) {
            if (status == 'false') {
                if ($(".novideo-" + id).length != 0) {
                    //it doesn't exist
                    return;
                }
                var layH = $('#layout').height();
                var loadimg = $('<img width="320" height="240" style="object-fit:cover;" class="novideo-' + id + ' center-block" src="assets/images/novideo.jpg" alt="loader" />');
                $('#video-' + id).parent().append(loadimg);
                loadimg.addClass('hideclass');
                setTimeout(function tout() {
                    loadimg.removeClass('hideclass');
                }, 500)
                loadimg.height($('#video-' + id).height());
                $('#video-' + id).hide();
                $('.v-' + id).addClass('active');
                layout();
            } else {
                var allow = 1;
                if (video_lock_array.hasOwnProperty(id)) {
                    if (video_lock_array[id] == 'false') {
                        allow = 0;
                    }
                }

                if (allow == 1) {
                    $('#video-' + id).show();
                    $('.novideo-' + id).remove();
                    layout();
                    $('.v-' + id).removeClass('active');
                } else {
                    showNotifiction('You cannot enable video this time');
                }

            }

}
function settingsClick(){
    swal({ html:true, title:'<b>Audio Video Settings</b>', text:'<div id="hardware-setup"></div><div id="testbut">Test Sound</div>',confirmButtonText: 'continue'},
           function(){
                var object = {value: "value", timestamp: new Date().getTime()}
                localStorage.setItem(room+"-settings", JSON.stringify(object));
                window.location.reload();
            });;
           var element = document.querySelector('#hardware-setup');
            var component = createOpentokHardwareSetupComponent(element, {
                insertMode: 'append'
            }, function(error) {
                if (error) {
                    swal("Error getting device", error.message);
                    return;
                }
                //component.destroy
            });

            $('.sweet-alert').addClass('top100');
            $('#testbut').click(function(){
                PlaySound();
            });
}
function PlaySound() {
  var sound = document.getElementById('testsound');
  sound.Play();
}
function loadChat(name,msg,send){
   var chat_html = '';
   if(send){
     chat_html  += '<div class="mychat"><span class="yourname">'+name+'</span>'+msg+'</div>';
     var chatJson = {};
         chatJson['method'] = 'chat';
         chatJson['name']   = name;
         chatJson['msg']    = msg;
         chatJson           = JSON.stringify(chatJson);
    sendToAll(chatJson);
   }else{
     chat_html  += '<div class="yourchat"><span class="yourname">'+name+'</span>'+msg+'</div>';
   }
   $('.chat-content').append(chat_html);
   $('.chat-content').scrollTop($('.chat-content').prop("scrollHeight"));
    historyArray['action']  = 'chat';
    historyArray['html']    = $('.chat-content').html();
    storeHistoryData();
}

function storeHistoryData(){
      
      var dataJson = JSON.stringify(historyArray);
      if (typeof(Storage) !== "undefined") {
      // Code for localStorage/sessionStorage.
         localStorage.setItem("history_"+room+"_"+userName, dataJson);
         
      } else {
      // Sorry! No Web Storage support..
         alert('notsupport');
      }
  }

  function loadHistory(){
     var histroyJson = localStorage.getItem("history_"+room+"_"+userName);

     if(histroyJson){
      var histObj     = JSON.parse(histroyJson);
      var action      = histObj['action'];
        switch (action) {
                case 'chat':
                   if(histObj.html){
                      $('.chat-content').html(histObj.html);
                   } 
                break; 
                default:
                    console.error('Unrecognized history key', parsedMessage);
            }
     }
     
  }    
  function showNotifiction(txt) {
            $('.not-txt').html(txt);
            if($(document).width() <600){
                $('.green-not').animate({
                height: "55"
               });
            }else{
                $('.green-not').animate({
                height: "35"
               });
            }
            
            setTimeout(function sh(){$('.not-txt').show()},500);
            setTimeout(function hidenot() {
                $('.green-not').animate({
                    height: "0"
                });
                $('.not-txt').hide();
            }, 3000)
}     