const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('Socket.io')(http)
const path = require('path');
const url = require('url');

const clients={};
let correctAnswer='';
const scores=[];
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

io.on('connection', (socket) => {

    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
    roomJoined=(url.parse(socket.handshake.headers.referer).query);
    socket.join(roomJoined);

    //the short circuit form is still way nicer, but fine
    if (!(roomJoined in clients)) {
        clients[roomJoined] = [];
    };
    if (!(roomJoined in scores)) {
        scores[roomJoined] = [];
    }
    if(currentQuestion==''){
        fetchNewQuestion();
    }
    clients[roomJoined].push(socket.id);

    let genNewName = "SCAT";
    let z = 1;
    while (!legalName({name: genNewName,room: roomJoined})){
        genNewName="SCAT"+z;
        z+=1;
    }
    scores[roomJoined].push(
        {
            player: genNewName,
            value: 0
        }
    );

    socket.on('getStartingInfo',(room)=>{
        const roomJoined=room;
        currentPlaces[roomJoined] = [];
        io.in(roomJoined).emit('getCurrentPlace');
        io.in(roomJoined).emit('addName',genNewName);

        setTimeout(()=>{
            const averagePlace = getAverage(roomJoined) ? getAverage(roomJoined) : 0;
            startWord = Math.floor(averagePlace/100);  //the 100 is the speed, probably should change it to a var
            delayTime = 100-averagePlace % 100;
            io.to(socket.id).emit('startingInformation', {
                scores: scores[roomJoined],
                name: genNewName,
                startWord: startWord,
                delayTime: delayTime,
                canBuzz: canBuzz,
                question: currentQuestion
            });
        },100); //this wait is also to account for latency
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
        if (!(roomJoined in buzzes)) {
            buzzes[roomJoined] = [];
        }
        buzzes[roomJoined].push(buzzInfo);
        const name = buzzInfo.name;
        setTimeout(()=>{
            buzzes[roomJoined].sort((a, b) => (a.timeSince > b.timeSince) ? 1 : -1)
            if(canBuzz&&buzzes[roomJoined][0].name==name){
                canBuzz=false;
                io.in(roomJoined).emit('chatMessage',{
                    content: name + " buzzed",
                    time: getFormattedTime(),
                    type: "notification"
                });
                io.in(roomJoined).emit('buzz',name)        
            }
        }, 50); //the 50 is how much time it waits, this should make it work if latency is under 50 milliseconds right now (also helps dealing with variance in setinterval)
    });

    socket.on('submitAnswer', (answerInfo) => {
        const roomJoined=answerInfo.room;
        const name = answerInfo.name;
        const answer = answerInfo.answer;
        const finishedQuestion = answerInfo.finishedQuestion;
        const power = answerInfo.power;
        canBuzz=true;
        buzzes=[];
        if (answer==correctAnswer){
            const points=((power) ? 15 : 10);
            io.in(roomJoined).emit('updateScore', {
                player: name,
                scoreChange: points
            });
            io.in(roomJoined).emit('chatMessage',{
                content: name + "  for " + points+".",
                time: getFormattedTime(),
                type: "notification"
            });

            for (x of scores[roomJoined]){
                if (x.player==name){
                    scoresID=scores[roomJoined].indexOf(x);
                }
            }
            scores[roomJoined][scoresID].value+=points;
        }
        else{
            const points=((finishedQuestion) ? 0 : -5);

            io.in(roomJoined).emit('updateScore', {
                player: name,
                scoreChange: points
            });

            io.in(roomJoined).emit('chatMessage',{
                content: name + ((finishedQuestion) ? ", no neg" : " negs 5"),
                time: getFormattedTime(),
                type: "notification"
            });

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
        time=new Date();
        io.in(roomJoined).emit('nextQuestion',{
            questionText: fetchNewQuestion()
        });
    });

    socket.on('nameChange', (names) => {
        const roomJoined=names.room;

        for (x of scores[roomJoined]){
            if (x.player==names.oldName){
                x.player=names.newName;
            }
        }
        io.in(roomJoined).emit('nameChange',{
            newName: names.newName,
            oldName: names.oldName
        });
    });
});

http.listen(3000, () => {
    console.log("listening on port 3000");
})

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
    for (scoreItem of scores[roomJoined]){
        if (scoreItem.player==name){
            return(false);
        }
    }
    return(true);
}
function getAverage(room){
    const roomJoined=room;
    let total=0;
    for(place of currentPlaces[roomJoined]){
        total+=place;
    }
    return(total/currentPlaces[roomJoined].length);
}
