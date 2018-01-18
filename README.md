# chatter-box
A MEAN (MongoDB, Express.js, AngularJS, and Node.js) stack online chatting app.

### Notes
* This is an assignment for HKU Course COMP3322 by Dr. Chuan Wu. The lecturer (and/or the tutors) owns the copyright of the assignment requirements.
* The database and the design logic are based on the requirements of the assignment. In my point of view, the requirements (especially the function APIs and the database schema) are terrible and inefficient. Nevertheless, the program is fully functionable.

### Set Up Guide:
```Bash
  sudo npm install -g express-generator
  mkdir data
```
Run the following codes in a separate window
```Bash
   mongod --dbpath data
```
and run the following codes in the origin window
```Bash
   npm start
```

#### Showcase
The login page:
![login](https://github.com/irsisyphus/pictures/raw/master/chatter-box/login.png "login")
The main panel:
![main](https://github.com/irsisyphus/pictures/raw/master/chatter-box/main.png "main")
The user info page:
![info](https://github.com/irsisyphus/pictures/raw/master/chatter-box/info.png "info")
The chatting page, with a friend:
![chat](https://github.com/irsisyphus/pictures/raw/master/chatter-box/chat.png "chat")
Recall a message:
![recall](https://github.com/irsisyphus/pictures/raw/master/chatter-box/recall.png "recall")
