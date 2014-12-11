(function() {

    "use strict";

    var userData = null;

    function init() {
        document.getElementById("send").onclick = sendBtnHandler;
        MashupPlatform.wiring.registerCallback('receiveMsg', processMsg);
        MashupPlatform.prefs.registerCallback(function(new_values) {
            if ('gravatar' in new_values) {
                getInfoFromGravatar();
            }
        });
        getInfoFromGravatar();
    }

    function sendBtnHandler(e) {
        var msgToSend = {};
        msgToSend.msg = document.getElementById("input").value;
        if (msgToSend.msg != "" && userData != null) {
            msgToSend.hash= userData.entry[0].hash;
            MashupPlatform.wiring.pushEvent('sendMsg', JSON.stringify(msgToSend));
            //echo disabled, to be received from NGSI
            //createMsgDiv(msgToSend.msg,'http://www.gravatar.com/avatar/' + msgToSend.hash,false);
        }
    }

    function processMsg(event_data) {
        var receivedMsg = JSON.parse(event_data);
        if (userData != null && receivedMsg.hash != userData.entry[0].hash) {
            createMsgDiv(receivedMsg.msg,'http://www.gravatar.com/avatar/' + receivedMsg.hash,true,receivedMsg.id);
        }
        else{ // Echo, mark as sent
            createMsgDiv(receivedMsg.msg,'http://www.gravatar.com/avatar/' + receivedMsg.hash,false,receivedMsg.id);
            document.getElementById(receivedMsg.id).parentElement.className = 'sent'; 
        }
    }

    function createMsgDiv(text,imageSrc,received,id){
        var newMsgP = document.createElement('p');
        var newMsgImg = document.createElement('img');
        var newMsgDiv = document.createElement('div');
        newMsgP.innerHTML = text;
        newMsgP.id = id;
        newMsgImg.src = imageSrc;
        newMsgImg.alt = 'User profile img';
        newMsgDiv.className=(received)?'received':'sent';
        newMsgDiv.appendChild(newMsgImg);
        newMsgDiv.appendChild(newMsgP);
        var conversations = document.getElementById('conversations');
        conversations.appendChild(newMsgDiv);
        conversations.scrollTop = newMsgDiv.offsetTop;
    }

    function getInfoFromGravatar() {
        var gravatarURL = MashupPlatform.prefs.get('gravatar');
        if (gravatarURL != undefined &&
            gravatarURL != "") {
            MashupPlatform.http.makeRequest(gravatarURL + '.json', {
                method: 'GET',
                onSuccess: function(response) {
                    var user_data;
                    user_data = JSON.parse(response.responseText);
                    if (user_data.error) {
                        onError();
                    } else {
                        userData = user_data;
                        printUserData(user_data);
                    }
                },
                onError: function() {
                    onError();
                }
            });
        }
    }

    function printUserData(user_data) {
        document.getElementById('username').innerHTML = user_data.entry[0].displayName;
        document.getElementById('photo').src = user_data.entry[0].thumbnailUrl;
    }

    document.addEventListener('DOMContentLoaded', init.bind(this), true);

})();
