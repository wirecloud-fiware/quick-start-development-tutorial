This is a widget created for demo and teaching purposes. Despite that, it has been designed to be fully functional.

It is an incrementally created chat application that incorporate most of bsic wirecloud functionalities.

Initially a bare widget is created begining with an empty skeleton.

This basic widget is added some properties, where the user can indicate his own [gravatar.com](http://www.gravatar.com) profile. Further information about the user is gathered from his [gravatar.com](http://www.gravatar.com) profile, showing how to perform HTTP proxy-based requests.

Next, a basic chat functionality is implemented using wiring to send and receive _messages_ to other instance of the same widget. This allows showing how to use wiring, both for sending messages and for subscribing to them.

Finally, a fully functional chat application will be created making use of the Context Broker Generic Enabler (Orion Context Broker) integrated in FiLab to send and receive messages to/from other users. This widget will keep unmodified, but it will have access to the Context Broker through an operator, and the comunication with the operator will keep using wiring endpoints created in thie widget.
