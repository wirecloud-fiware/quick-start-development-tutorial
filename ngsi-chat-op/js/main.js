/*
 * Copyright (c) 2014 CoNWeT Lab., Universidad Politécnica de Madrid
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

(function() {

    "use strict";

    var chatroom = null;
    var ngsi_connection = null;

    function init() {
        MashupPlatform.wiring.registerCallback('toBeSent', publishMsg);
        MashupPlatform.prefs.registerCallback(function(new_values) {
            if ('chatroom' in new_values) {
                subscribeChatRoom();
            }
        });

        ngsi_connection = new NGSI.Connection(MashupPlatform.prefs.get('ngsi_server'), {
            use_user_fiware_token: true,
            ngsi_proxy_url: MashupPlatform.prefs.get('ngsi_proxy')
        });

        subscribeChatRoom();
    }


    function publishMsg(event_data) {
        var now = new Date();
        var msg = JSON.parse(event_data);
        ngsi_connection.addAttributes([{
            entity: {id: MashupPlatform.prefs.get('chatroom') +  now.getTime() + msg.hash,
                     type: 'ChatMessage'},
            attributes: [
                {
                    type: 'string',
                    name: 'hash',
                    contextValue: msg.hash
                },
                {
                    type: 'string',
                    name: 'msg',
                    contextValue: msg.msg
                }]
        }]);
    }

    function subscribeChatRoom() {
        if (chatroom!=null){
            NGSI.cancelSubscription(chatroom);
        }

        var entityIdList = [
            {type: 'ChatMessage', id: MashupPlatform.prefs.get('chatroom') + '.*', isPattern: true}
        ];
        var attributeList = null;
        var duration = 'PT30M';
        var throttling = null;
        var notifyConditions = [{
            type: 'ONCHANGE',
            condValues: ['hash','msg']
        }];
        var options = {
            flat: true,
            onNotify: receiveMessage,
            onSuccess: function (data) {
                chatroom = data.subscriptionId;
            }
        };
        ngsi_connection.createSubscription(entityIdList, attributeList, duration, throttling, notifyConditions, options);
    }

    function receiveMessage(data){
        for(var msg in data.elements){
            MashupPlatform.wiring.pushEvent('toBeReceived', JSON.stringify(data.elements[msg]));   
        }
    }

    init();

})();
