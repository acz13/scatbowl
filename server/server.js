const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('Socket.io')(http)
const path = require('path');
const url = require('url');

const clients={};
let correctAnswer='';
const scores=[];
const speed = 100; //currently this is separate on the server and client, should probably make it part of the room properties and send it over when the user connects
let scoresID=0;

let buzzes=[];
let currentPlaces=[];
let canBuzz=true;
let startWord;
let delayTime;
let currentQuestion='';
let roomJoined='';
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

    //the short circuit form is still way nicer, but fine

    //initializes the room property to all of the server information
    if (!(roomJoined in clients)) {
        clients[roomJoined] = [];
    };
    if (!(roomJoined in scores)) {
        scores[roomJoined] = [];
    }
    scores[roomJoined].push();

    if (!(roomJoined in buzzes)) {
        buzzes[roomJoined] = [];
    }

    fetchNewQuestion();


    let genNewName = "SCAT";
    let z = 1;

    //generates a new name that isn't in the room
    //at some point probably replace with a random name generator thing 
    while (!legalName({name: genNewName,room: roomJoined})){
        genNewName="SCAT"+z;
        z+=1;
    }

    //adds the new player to the scoreboard
    scores[roomJoined].push(
        {
            player: genNewName,
            value: 0
        }
    );
    clients[roomJoined].push(socket.id);


    socket.on('getStartingInfo',(room)=>{
        const roomJoined=room;
        //resets the roomJoined
        currentPlaces[roomJoined] = [];

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
                scores: scores[roomJoined],
                name: genNewName,
                startWord: startWord,
                delayTime: delayTime,
                canBuzz: canBuzz,
                question: currentQuestion
            });
        },50); //this wait is to account for latency
    });

    socket.on('currentPlace', (placeInfo) => {
        const roomJoined=placeInfo.room;
        const currentPlace=placeInfo.place;

        if(currentPlace!=null){ //because the client requesting will have nothing
            currentPlaces[roomJoined].push(currentPlace);
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
        console.log(buzzes);
        buzzes[roomJoined].push(buzzInfo);
        const name = buzzInfo.name;

        setTimeout(()=>{
            //sorts by timeSince, smallest to largest, which is essentially where they buzzed and the time between words they buzzed
            //the lower timeSince is, the earlier the buzz was
            buzzes[roomJoined].sort((a, b) => (a.timeSince > b.timeSince) ? 1 : -1)

            if(canBuzz&&buzzes[roomJoined][0].name==name){ //if no one else has buzzed yet and it was the first buzz
                canBuzz=false;
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
        canBuzz=true;
        buzzes[roomJoined]=[];

        //check if the answer is right --> eventually replace with some complicated function
        if (answer==correctAnswer){
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

            //updates the serverside scores
            for (x of scores[roomJoined]){
                if (x.player==name){
                    scoresID=scores[roomJoined].indexOf(x);
                }
            }
            scores[roomJoined][scoresID].value+=points;
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

            //updates server side score
            for (x of scores[roomJoined]){
                if (x.player==name){
                    scoresID=scores[roomJoined].indexOf(x);
                }
            }
            scores[roomJoined][scoresID].value+=points;
        }
    });

    socket.on('nextQuestion',(room)=>{
        const roomJoined=room;
        canBuzz=true;

        io.in(roomJoined).emit('nextQuestion',{
            questionText: fetchNewQuestion()
        });
    });

    socket.on('nameChange', (names) => {
        const roomJoined=names.room;

        //updates the score data on the server side
        for (x of scores[roomJoined]){
            if (x.player==names.oldName){
                x.player=names.newName;
            }
        }

        //updates the score data on the client side
        io.in(roomJoined).emit('nameChange',{
            newName: names.newName,
            oldName: names.oldName
        });
    });
});

//eventually this will be replaced with a function to search for the question
function fetchNewQuestion(){
    correctAnswer = 'energy';
    currentQuestion="Because this quantity is conserved, perpetual motion machines of the first kind cannot exist. A capacitor stores this quantity in an electric field between its plates. The SI unit for this quantity is describes the work done when a force of one (*)) newton moves an object one meter. For ten points, name this physical quantity that is measured in Joules and comes in kinetic and potential forms.";
    return(currentQuestion);
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
    for (scoreItem of scores[roomJoined]){
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
    for(place of currentPlaces[roomJoined]){
        total+=place;
    }
    return(total/currentPlaces[roomJoined].length);
}
