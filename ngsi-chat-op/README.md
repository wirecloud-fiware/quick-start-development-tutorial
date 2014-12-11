This is an operator developed to provide NGSI functionality to the basic-chat widget. It send messages to a chat room using entities typed as ChatMessage, creating an instance per message. It also subscribes to such entities, sending them back to the widget for it to receive the messages.

Messages contain hash of the email of the sender (gravatar mail hash) and the text itself. The hash can be used to obtain the profile picture associated with the sender.

It is used by Basic Chat widget to connect to the chat room using wiring. Messages sent by the widget are received by this operator and published on the Context Broker, and messages received from the Context Broker subscription are sent back to the widget.
