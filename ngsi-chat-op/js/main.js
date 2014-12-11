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
