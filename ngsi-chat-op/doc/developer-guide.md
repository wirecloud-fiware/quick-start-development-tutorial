# Implementation phases

## Initial operator

The operator is defined on a `config.xml` declarative file, which references one or many JavaScript files containing its behaviour.

Like widgets, the `config.xml` has vendor, name and version information that should be updated so as to avoid conflicts or WireCloud rejecting an operator.


    :::xml
    <?xml version='1.0' encoding='UTF-8'?>
    <operator xmlns="http://wirecloud.conwet.fi.upm.es/ns/macdescription/1" 
        vendor="CoNWeT" name="ngsi-chat-op" version="0.1.1">
        <details>
            <title>NGSI chat operator</title>
            <homepage>https://conwet.fi.upm.es/widgets/basic-chat</homepage>
            <authors>Miguel Jiménez</authors>
            <email>mjimenez@fi.upm.es</email>
            <image>images/operator_logo.png</image> <!-- 170x80 -->
            <description>Connect to Orion Context Broker through NGSI WireCloud API for chat room</description>
            <longdescription>README.md</longdescription>
            <license>Apache License 2.0</license>
            <licenseurl>http://www.apache.org/licenses/LICENSE-2.0.html</licenseurl>
            <doc>doc/developer-guide.md</doc>
        </details>
        <scripts>
            <script src="js/main.js"/>
        </scripts>
    </operator>

The widget has some preferences for easy indicating the URLs of the NGSI server and the proxy for accessing it from widgets/operators. Moreover, a `chatroom` preference has been added.

    :::xml
        <preferences>
            <preference name="ngsi_server" 
                type="text" label="NGSI server URL" 
                description="URL of the Orion Context Broker to use for retrieving entity information" 
                default="http://orion.lab.fi-ware.org:10026/"/>
            <preference name="ngsi_proxy" 
                type="text" 
                label="NGSI proxy URL" 
                description="URL of the PubSub Context Broker proxy to use for receiving notifications about changes" 
                default="https://ngsiproxy.lab.fi-ware.org/"/>
            <preference name="chatroom" 
                type="text" 
                label="Chat room" 
                description="Chat room to send and receive messages" 
                default="Startup Weekends"/>
        </preferences>

Wiring is also used in the widget. It sends received messages back to the widget, and forwards user messages to the NGSI API:

    :::xml
        <wiring>
            <outputendpoint name="toBeReceived" 
                type="text" 
                label="Messages from NGSI" 
                description="Forward a message to a chat widget" 
                friendcode="message" />
            <inputendpoint name="toBeSent" 
                type="text" 
                label="Message to NGSI"  
                description="Receive messages to be sent to the chat room" 
                friendcode="message" />
        </wiring>

Basic JavaScript file is written below, containing initialization function, preferences and wiring subscriptions and some skeletons:

    :::javascript
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
    
            subscribeChatRoom();
        }
    
    
        function publishMsg(event_data) {
        }
    
        function subscribeChatRoom() {
        }
    
        function receiveMessage(data){
            for(var msg in data.elements){
                MashupPlatform.wiring.pushEvent('toBeReceived', JSON.stringify(data.elements[msg]));   
            }
        }
    
        init();
    
    })();


## NGSI connection

First, NGSI must be declared as a required feature in the `config.xml` file:

    :::xml
        <requirements>
            <feature name="NGSI"/>
        </requirements>

An NGSI connection must be stablished so as to make requests over it. It is authenticating using FIWARE tokens from the user logged on WireCloud. I've declared a global (closure) variable to hold it and access from other functions.

    :::javascript
    ngsi_connection = new NGSI.Connection(MashupPlatform.prefs.get('ngsi_server'), {
        use_user_fiware_token: true,
        ngsi_proxy_url: MashupPlatform.prefs.get('ngsi_proxy')
    });

## NGSI publication

To create a new entity or modify an existing one, function `addAttributes()` of the connection is used. For the chat application, a new instance of class `ChatMessage`is created, using its `hash` and `msg` attributes (exactly as the event sent by wiring). Further information can be found on the [NGSI API of WireCloud documentation](http://conwet.fi.upm.es/docs/display/wirecloud/NGSI+Javascript+API) or on the [Orion Context Broker with Wiercloud tutorial](http://conwet.fi.upm.es/docs/display/wirecloud/Using+Orion+Context+Broker).

The entity to create is like this one, that

    :::javascript
    [{
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
    }]

Full `publishMsg()` definition ends like this:

    :::javascript
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


Note that the ID of the entity has been created with a fixed part (a preference indicating the chat room), plus a timestamp and the hast of the user writing.

## NGSI subscription

This operator wants to receive the modification (creation is a kind of modification) of any instance of type `ChatMessage` whose ID starts with the chat room. If we had previously created the subscription (stored on `chatroom` variable), we start cancelling it.

Several objects have to be created for this, before invoking `createSubscription()` function of the formerly created connection:

    :::javascript
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

The subscription duration is set to 30 minutes, and should be renewed (or the page reloaded) before that.

## NGSI periodic reconnection

