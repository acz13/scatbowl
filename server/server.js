const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('Socket.io')(http)
const path = require('path');
const url = require('url');


let startWord;
let delayTime;
let roomJoined='';
const roomProperties=[];
const speed = 100;


app.use(express.static(path.join(__dirname, 'public')));

app.get('/',(req,res) => {
    res.sendFile(path.join(__dirname, + 'public/index.html'))
});

http.listen(3000, () => {
    console.log("listening on port 3000");
})

io.on('connection', (socket) => {

    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
    roomJoined=(url.parse(socket.handshake.headers.referer).query);
    socket.join(roomJoined);


    let genNewName = "SCAT";
    let z = 1;

    //generates a new name that isn't in the room
    //at some point probably replace with a random name generator thing 
    
    
    if(!(roomProperties.find(x => x.roomName==roomJoined))){
        newQuestion = fetchNewQuestion();
        roomProperties.push({
                roomName: roomJoined,
                clients: [],
                scores: [],
                buzzes: [],
                currentQuestion: newQuestion.question,
                currentAnswer: newQuestion.answer,
                currentPlaces: [],
                canBuzz: true,
                speed: speed
        })
    }

    while (!legalName({name: genNewName,room: roomJoined})){
        genNewName="SCAT"+z;
        z+=1;
    }


    pushProperty(roomJoined, 'clients', socket.id);
    pushProperty(roomJoined, 'scores', {player: genNewName, value: 0});


    //adds the new player to the scoreboard

    socket.on('getStartingInfo',(room)=>{
        const roomJoined=room;
        //resets the currentPlaces to find them again
        setProperty(roomJoined,'currentPlaces',[]);

        io.in(roomJoined).emit('getCurrentPlace');
        // this will then send the currentPlace back to the server and add it to currentPlaces
        io.in(roomJoined).emit('addName',genNewName);

        setTimeout(()=>{
            //gets the average of all values, if the room is empty, it will be null so it gets set to 0.
            const averagePlace = getAverage(roomJoined) ? getAverage(roomJoined) : 0;
            //calculates when+where to start the question
            startWord = Math.floor(averagePlace/speed);  
            delayTime = speed-averagePlace % speed;

            io.to(socket.id).emit('startingInformation', {
                scores: getProperty(roomJoined, 'scores'),
                name: genNewName,
                canBuzz: getProperty(roomJoined, 'canBuzz'),
                question: getProperty(roomJoined, 'currentQuestion'),
                speed: getProperty(roomJoined, 'speed'),
                startWord: startWord,
                delayTime: delayTime
            });
        },100); //this wait is to account for latency
    });

    socket.on('currentPlace', (placeInfo) => {
        const roomJoined=placeInfo.room;
        const currentPlace=placeInfo.place;
        if(currentPlace!=null){ //because the client requesting will have nothing
            pushProperty(roomJoined, 'currentPlaces', currentPlace);
        }
    });

    socket.on('chatMessage', (messageInfo) => {
        const roomJoined = messageInfo.room;
        const message = messageInfo.message;

        message.time=getFormattedTime();
        io.in(roomJoined).emit('chatMessage', message);
    });

    socket.on('buzz', (buzzInfo) => {
        const roomJoined=buzzInfo.room;
        const name = buzzInfo.name;

        pushProperty(roomJoined, 'buzzes', buzzInfo)

        setTimeout(()=>{
            //sorts by timeSince, smallest to largest, which is essentially where they buzzed and the time between words they buzzed
            //the lower timeSince is, the earlier the buzz was
            const roomIndex = roomProperties.findIndex(room => room.roomName == roomJoined);

            roomProperties[roomIndex].buzzes.sort((a, b) => (a.timeSince > b.timeSince) ? 1 : -1)

            if(getProperty(roomJoined, 'canBuzz') && getProperty(roomJoined, 'buzzes')[0].name==name){ //if no one else has buzzed yet and it was the first buzz
                setProperty(roomJoined, 'canBuzz', false);
                //sends a chat notification that there was a buzz
                io.in(roomJoined).emit('chatMessage',{
                    content: name + " buzzed",
                    time: getFormattedTime(),
                    type: "notification"
                });
                //buzzes
                io.in(roomJoined).emit('buzz',name)        
            }
        }, 50); //50 millisecond wait to account for potential latency differences 
    });

    socket.on('submitAnswer', (answerInfo) => {
        const roomJoined=answerInfo.room;
        const name = answerInfo.name;
        const answer = answerInfo.answer;
        const finishedQuestion = answerInfo.finishedQuestion;
        const power = answerInfo.power;
        setProperty(roomJoined, 'buzzes', []);
        setProperty(roomJoined, 'canBuzz', true);


        //checks if the answer is right
        if (answer==getProperty(roomJoined, 'currentAnswer')){
            const points=((power) ? 15 : 10);

            //updates client side score
            io.in(roomJoined).emit('updateScore', {
                player: name,
                scoreChange: points
            });
            
            //sends a chat notification of the answer
            io.in(roomJoined).emit('chatMessage',{
                content: name + "  for " + points+".",
                time: getFormattedTime(),
                type: "notification"
            });

            // finds the index of the room
            const indexOfRoom = roomProperties.findIndex(x => x.roomName == roomJoined)
            // finds the index of the score that needs to be changed
            const indexOfScore = roomProperties[indexOfRoom].scores.findIndex(x => x.player == name)

            roomProperties[indexOfRoom].scores[indexOfScore].value+=points;
        }

        //if the answer is wrong
        else{
            const points=((finishedQuestion) ? 0 : -5);
            
            //updates client side score
            io.in(roomJoined).emit('updateScore', {
                player: name,
                scoreChange: points
            });

            //sends a chat notification of the answer
            io.in(roomJoined).emit('chatMessage',{
                content: name + ((finishedQuestion) ? ", no neg" : " negs 5"),
                time: getFormattedTime(),
                type: "notification"
            });
            // finds the index of the room
            const indexOfRoom = roomProperties.findIndex(x => x.roomName == roomJoined);
            // finds the index of the score that needs to be changed
            const indexOfScore = roomProperties[indexOfRoom].scores.findIndex(x => x.player == name)

            roomProperties[indexOfRoom].scores[indexOfScore].value+=points;
        }
    });

    socket.on('nextQuestion',(room)=>{
        const roomJoined=room;
        setProperty(roomJoined, 'canBuzz', true);
        const newQuestion = fetchNewQuestion();
        setProperty(roomJoined, 'currentQuestion', newQuestion.question);
        setProperty(roomJoined, 'currentAnswer', newQuestion.answer);

        io.in(roomJoined).emit('nextQuestion', {
            questionText: getProperty(roomJoined, 'currentQuestion')
        });
    });

    socket.on('nameChange', (names) => {
        const roomJoined=names.room;

        //updates the score data on the server side
        
        // finds the index of the room
        const indexOfRoom = roomProperties.findIndex(x => x.roomName == roomJoined)
        // finds the index of the score that needs to be changed
        const indexOfScore = roomProperties[indexOfRoom].scores.findIndex(x => x.player == names.oldName)
        // sets that elements player value to the new name
        roomProperties[indexOfRoom].scores[indexOfScore].player=names.newName;

        //updates the score data on the client side
        io.in(roomJoined).emit('nameChange',{
            newName: names.newName,
            oldName: names.oldName
        });
    });
});

//eventually this will be replaced with a function to search for the question
function fetchNewQuestion(){
    const genQuestion = "Because this quantity is conserved, perpetual motion machines of the first kind cannot exist. A capacitor stores this quantity in an electric field between its plates. The SI unit for this quantity is describes the work done when a force of one (*)) newton moves an object one meter. For ten points, name this physical quantity that is measured in Joules and comes in kinetic and potential forms.";
    const genAnswer = 'energy';
    return({question: genQuestion, answer: genAnswer});
}

function getFormattedTime(){
    time = new Date();
    hours=time.getHours();
    minutes=time.getMinutes();
    return("" + hours + ":" + (String(minutes).length==2 ? minutes:"0"+minutes));
}

function legalName(nameInfo){
    const roomJoined=nameInfo.room;
    const name=nameInfo.name;
    //checks if the name already exists in the room, returns false if it is, true if it isn't (true = can change name)
    for (scoreItem of getProperty(roomJoined, 'scores')){
        if (scoreItem.player==name){
            return(false);
        }
    }
    return(true);
}

// gets the average of all currentPlaces values
function getAverage(room){
    const roomJoined=room;
    let total=0;
    for(place of getProperty(roomJoined, 'currentPlaces')){
        total+=place;
    }
    return(total/getProperty(roomJoined, 'currentPlaces').length);
}

function pushProperty(room, property, update) {
    index = roomProperties.findIndex(x => x.roomName == room);
    roomProperties[index][property].push(update);
}

function setProperty(room, property, update) {
    index = roomProperties.findIndex(x => x.roomName == room);
    roomProperties[index][property]=update;
}

function getProperty(room, property){
    return(roomProperties.find(x => x.roomName == room)[property]);
}
