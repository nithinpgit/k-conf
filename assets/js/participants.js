/**
 * @param id
 * @constructor
 */
function Participant(id,role,mode,webinar) {
    this.id   = id;
    this.role = role;
    this.mode = mode;
    this.webinar = webinar;
    this.rtcPeer = null;
    this.iceCandidateQueue = [];
}

/**
 *
 * @param error
 * @param offerSdp
 * @returns {*}
 */
Participant.prototype.offerToReceiveVideo = function (error, offerSdp) {
    if (error) {
        return console.error("sdp offer error");
    }
    var msg = {
        id: "receiveVideoFrom",
        sender: this.id,
        role  : this.role,
        sdpOffer: offerSdp
    };
    console.log('Invoking SDP offer callback function ' + msg.sender);
    //if(this.webinar == '0' || this.mode == 'presenter')
    sendMessage(msg);
    //alert('offer to receive video' + offerSdp);
};

/**
 * Message to send to server on Ice Candidate.
 * candidate contains 3 items that must be sent for it to work
 * in Internet Explorer/Safari.
 * @param candidate
 */
Participant.prototype.onIceCandidate = function (candidate) {
    ////console.log(this.id + " Local candidate" + JSON.stringify(candidate));
    var message = {
        id: 'onIceCandidate',
        candidate : {
            candidate : candidate.candidate,
            sdpMid: candidate.sdpMid,
            sdpMLineIndex: candidate.sdpMLineIndex
        },
        sender: this.id,
        role  : this.role
    };
    //if(this.webinar == '0' || this.mode == 'presenter')
    sendMessage(message);
};

/**
 * Dispose of a participant that has left the room
 */
Participant.prototype.dispose = function () {
    //console.log('Disposing participant ' + this.id);
    this.rtcPeer.dispose();
    this.rtcPeer = null;
};