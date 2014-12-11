# Developing phases

## Basic widget

The first step is to build a blank widget. It must have defined the metadata and a basic HTML. The metadata is written in the `config.xml` file, that could be similar to this:

    :::xml
    <?xml version='1.0' encoding='UTF-8'?>
    <widget xmlns="http://wirecloud.conwet.fi.upm.es/ns/macdescription/1" vendor="CoNWeT" name="basic-chat" version="0.1">
        <details>
            <title>Basic chat</title>
            <homepage>https://conwet.fi.upm.es/widgets/basic-chat</homepage>
            <authors>Miguel Jiménez</authors>
            <email>mjimenez@fi.upm.es</email>
            <image>images/chat_logo.png</image> <!-- 170x80 -->
            <description>Basic chat functionality and WireCloud features demonstrator</description>
            <longdescription>README.md</longdescription>
            <license>AGPLv3+ w/linking exception</license>
            <licenseurl>http://www.gnu.org/licenses/agpl-3.0.html</licenseurl>
            <doc>doc/developer-guide.md</doc>
            <changelog>doc/changelog.md</changelog>
        </details>
        <contents src="index.html" useplatformstyle="true"/>
        <rendering width="5" height="24"/>
    </widget>

That template indicates widget metadata such as author/vendor, together with longer descriptions that can be written using MarkDown.

Note the `vendor`, `name` and `version` indicated as attributes of the root element. Please consider that, depending on the WireCloud configuration, it might not admit uploading a widget twice (same version/name/vendor), so you should increase version, subversion or revision number to upload new versions of the widget. Moreover, you must change the vendor, since WireCloud will not upload the widget if another user has uploaded already the same widget (version, name and vendor).

Two remarkable elements are the `rendering` element, wigh basic information about the size of the widget, and the reference to the main HTML file. Such file will be the entry point to the widget, and contains references to JavaScript or CSS files.

A basic HTML, named `index.html` as indicated in `config.xml` is indicated below. This document contains a basic header for user photo and nickname, a panel for messages, and a basic form for sending messages.

    :::html
	<!DOCTYPE html>
    <html>
        <head>
            <meta http-equiv="Content-Type" content="application/xhtml+xml; charset=UTF-8"></meta>
            <script type="text/javascript" src="js/main.js"></script>
            <link rel="stylesheet" type="text/css" href="css/style.css" />
        </head>
        <body>
            <div id="header">
                <img id="photo"id="photo"  alt="Profile photo" max-height="60" max-width="60" />
                <h2 id="username">Username</h2>
            </div>
            <div id="conversations"></div>
            <div id="footer">
                <input id="input" type="text" /><button id="send" type="button">Send</button>
            </div>
        </body>
    </html>

This HTML code refers to the `js/main.js` JavaScript file, that should contain the necessary code. JavaScript code will be throroughly described below. In addition, a CSS file is referenced, containing basic styling for our chat application.

    :::css
    body {  padding: 0;
            margin: 0;
            font-family: sans-serif;
            color: #333;}
    #photo {padding: 3px;
            border: 2px solid #eaeaea;
            max-height: 48px;
            max-width: 48px;
            float:left;}
    .sent,.received {
            min-height: 36px;
            padding: 2px;
            border: 1px solid #eaeaea;
            border-radius: 5px;}
    .sent{  margin: 1px 35px 1px 1px;}
    .received{ margin: 1px 1px 1px 35px;
            text-align: right;}
    .received > p{ display: inline;}
    .sent > img{ max-height: 28px;
            max-width: 28px;
            margin: 2px;
            float:left;}
    .sent > p{ display:inline;}
    .received > img{ max-height: 28px;
            max-width: 28px;
            margin: 2px;
            float:right;}
    #username { display: inline;}
    #conversations { height: 65%;
            overflow: scroll;}
    #footer{position: fixed;
            bottom: 0;}
    #header{height:60px;}
    body,html { height: 100%;}

Finally, the referenced `js/main.js` is created. Here we include some basic elements such as a closure, an `init()` function and two functions to deal with the HTML interface.

    :::javascript
	(function() {
        "use strict";
        
		// object with the data received from gravatar
		var userData = null;
    
        function init() {
            document.getElementById("send").onclick = sendBtnHandler;
            getInfoFromGravatar();
        }
    
        function sendBtnHandler(e) {
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
			// Put the info in userData variable
        }
    
        function printUserData(user_data) {
            document.getElementById('username').innerHTML = user_data.entry[0].displayName;
            document.getElementById('photo').src = user_data.entry[0].thumbnailUrl;
        }
    
        document.addEventListener('DOMContentLoaded', init.bind(this), true);
    
    })();


## Adding preferences

The first feature that we ae adding is preferences. Widget preferences must be declared in the `config.xml`, and after they're accessed through the WireCloud JavaScript API. The declaration of a preference for getting user gravatar profile would be like this:

    :::xml
	<preferences>
        <preference name="gravatar" type="text" label="Gravatar URL" description="URL to the gravatar profile of the user" />
    </preferences>

This `<preferences>` section must be inside the root element `<widget>`. Now we can access its value using the `name` we've chosen. The following line will be inside the `getInfoFromGravatar()` function, so it can make the HTTP request to the specific URL.

	:::javascript
	var gravatarURL = MashupPlatform.prefs.get('gravatar');

If we did this only, once the user has indicated his profile we would have to reload the widget so as to get the profile from Gravatar. To do things smartly, we're being notified from the platform on any preferences change, and react accordingly. In this case, we will invoke `getInfoFromGravatar()` again. Following code goes inside `init()` function:

    :::javascript
        MashupPlatform.prefs.registerCallback(function(new_values) {
            if ('gravatar' in new_values) {
                getInfoFromGravatar();
            }
        });

## Making an HTTP request

Now it's time to make the HTTP request to gather other information from the user. Gravatar offers a JSON version of the profile on the same URL, appending a '.json' extension, so that will be the base URL for our request.

The basic HTTP request might be like this:

    :::javascript
        MashupPlatform.http.makeRequest(url, {
            method: 'GET',
            onSuccess: function(response) {
                var user_data;
                user_data = JSON.parse(response.responseText);
                if (user_data.error) {
					// handle error
					onError();                        
                } else {
                    // perform actions
                }
            },
            onError: function() {
				onError();
            }
        });

This structure is invoked with the URL resulted from the concatenation of the obtained user preference `gravatarURL` and the string `'.json'`. And the actions to be performed are storing the data on the `userData` variable, and making it appear on the widget using the previously created `printUserData()` function:

	:::javascript
	var url = gravatarURL + '.json';

	...

        onSuccess: function(response) {
            var user_data;
            user_data = JSON.parse(response.responseText);
			if (user_data.error) {
                onError();
            } else {
                userData = user_data;
                printUserData(user_data);
            }
        }

The `userData` obtained from gravatar has a simple structure that is used for accessin its information, for example on the `printUserData()`:

    :::javascript
	{
        "entry": [{
            "id": "9508921",
            "hash": "61ac3cca6452efd339cb85c7864c147b",
            "requestHash": "mjimenezganan",
            "profileUrl": "http:\/\/gravatar.com\/mjimenezganan",
            "preferredUsername": "mjimenezganan",
            "thumbnailUrl": "http:\/\/2.gravatar.com\/avatar\/61ac3cca6452efd339cb85c7864c147b",
            "photos": [{
                "value": "http:\/\/2.gravatar.com\/avatar\/61ac3cca6452efd339cb85c7864c147b",
                "type": "thumbnail"
            }],
            "name": {
                "givenName": "Miguel",
                "familyName": "Jim\u00e9nez"
            },
            "displayName": "mjimenezganan",
            "aboutMe": "More info on www.twitter.com\/miguel_jimg",
            "currentLocation": "Spain",
            "urls": []
        }]
    }


## Sending and receiving through wiring

Chat functionality on the widget is done through the wiring mechanism of WireCloud. First of all, input and output endpoints have to be declared on the `config.xml` file:

    :::xml
	<wiring>
        <outputendpoint name="sendMsg" type="text" label="Send a message" description="The messages sent by the user are sent through this output endpoint" friendcode="message"/>
        <inputendpoint name="receiveMsg" type="text" label="Receive a message"  description="This is where messages sent by other widgets can be received" friendcode="message" />
    </wiring>

Sending messages implies invoking the `MashupPlatform.wiring.pushEvent()` function referencing the output endpoint name as declared.

    :::javascript
	MashupPlatform.wiring.pushEvent('sendMsg', text);

It shall be added to the `sendBtnHandler()`. To be able to send messages with metadata (i.e. the Gravatar hash that allows getting sender's image), a JSON serialized object is sent:

    :::javascript
	function sendBtnHandler(e) {
        var msgToSend = {};
        msgToSend.msg = document.getElementById("input").value;
        if (msgToSend.msg != "" && userData != null) {
            msgToSend.hash= userData.entry[0].hash;
            MashupPlatform.wiring.pushEvent('sendMsg', JSON.stringify(msgToSend));
        }
    }

Now the message is sent through wiring, but the widget needs to receive other widgets' messages and print them on the conversations panel. This is performed registering a callback function on the platform registering for messages received on a specific input endpoint. identified by its name. On the `init()` function we would write somethint like this:

    :::javascript
	MashupPlatform.wiring.registerCallback('receiveMsg', processMsg);

And a `processMsg()` function shall be created to indicate the desired behaviour. In our case, creating a message in the conversations panel. Since messages are sent as serialized JSON objects, they are de-serialized for accessing its elements. It is a bit tricky, since it detects my own messages and prints them as sent (different CSS style). This is how the echo is going to work.

    :::javascript
	function processMsg(event_data) {
        var receivedMsg = JSON.parse(event_data);
        if (userData != null && receivedMsg.hash != userData.entry[0].hash) {
            createMsgDiv(receivedMsg.msg, 'http://www.gravatar.com/avatar/' + receivedMsg.hash, true, receivedMsg.id);
        } else { // My message, echo, mark as sent
            createMsgDiv(receivedMsg.msg,'http://www.gravatar.com/avatar/' + receivedMsg.hash, false, receivedMsg.id);
            document.getElementById(receivedMsg.id).parentElement.className = 'sent'; 
        }
    }
