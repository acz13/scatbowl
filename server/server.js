const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('Socket.io')(http)
const path = require('path');
const url = require('url');

const clients=[];
let correctAnswer='';
const scores=[];
let scoresID=0;

const buzzes=[];
let currentPlaces=[];
let canBuzz=true;
let startWord;
let delayTime;
let currentQuestion='';
app.use(express.static(path.join(__dirname, 'public')));

app.get('/',(req,res) => {
    res.sendFile(path.join(__dirname, + 'public/index.html'))
});


function legalName(name){
    for (scoreItem of scores.roomJoined){
        if (scoreItem.player==name){
            return(false);
        }
    }
    return(true);
}
function getAverage(){
    let total=0;
    for(place of currentPlaces){
        total+=place;
    }
    return(total/currentPlaces.length);
}
io.on('connection', (socket) => {
    let roomJoined=(url.parse(socket.handshake.headers.referer).query);
    !('roomJoined' in clients) && (clients.roomJoined = []);
    !('roomJoined' in scores) && (scores.roomJoined = []);

    socket.join(roomJoined);
    if(currentQuestion==''){
        fetchNewQuestion();
    }
    clients.roomJoined.push(socket.id);

    let genNewName = "SCAT";
    let z = 1;
    while (!legalName(genNewName)){
        genNewName="SCAT"+z;
        z+=1;
    }
    scores.roomJoined.push(
        {
            player: genNewName,
            value: 0
        }
    );
    socket.on('getStartingInfo',()=>{
        currentPlaces=[];
        io.in(roomJoined).emit('getCurrentPlace');
        io.in(roomJoined).emit('addName',genNewName);

        setTimeout(()=>{
            const averagePlace = getAverage() ? getAverage() : 0;
            startWord = Math.floor(averagePlace/100);  //the 100 is the speed, probably should change it to a var
            delayTime = 100-averagePlace % 100;
            console.log("json " +JSON.stringify(scores));
            io.to(socket.id).emit('startingInformation', {
                scores: scores.roomJoined,
                name: genNewName,
                startWord: startWord,
                delayTime: delayTime,
                canBuzz: canBuzz,
                question: currentQuestion
            });
        },100); //this wait is also to account for latency
    });
    

    socket.on('disconnect', () => {
        console.log('user disconnected');
    });

    socket.on('currentPlace', (currentPlace) => {
        if(currentPlace!=null){
            currentPlaces.push(currentPlace);
        }
    });

    socket.on('chatMessage', (message) => {
        message.time=getTime();
        io.in(roomJoined).emit('chatMessage', message);
    });

    socket.on('buzz', (buzzInfo) => {
        buzzes.push(buzzInfo);
        const name = buzzInfo.name;
        const timeSince = buzzInfo.timeSince;
        setTimeout(()=>{
            buzzes.sort((a, b) => (a.timeSince > b.timeSince) ? 1 : -1)
            if(canBuzz&&buzzes[0].name==name){
                canBuzz=false;
                io.in(roomJoined).emit('chatMessage',{
                    content: name + " buzzed",
                    time: getTime(),
                    type: "notification"
                });
                io.in(roomJoined).emit('buzz',name)        
            }
        }, 50); //the 50 is how much time it waits, this should make it work if latency is under 50 milliseconds right now (also helps dealing with variance in setinterval)
    });

    socket.on('submitAnswer', (answerInfo) => {
        const name = answerInfo.name;
        const answer = answerInfo.answer;
 
        if (answer==correctAnswer){
            io.in(roomJoined).emit('updateScore', {
                player: name,
                scoreChange: 10
            });
            io.in(roomJoined).emit('chatMessage',{
                content: name + "  for 10.",
                time: getTime(),
                type: "notification"
            });

            for (x of scores.roomJoined){
                if (x.player==name){
                    scoresID=scores.roomJoined.indexOf(x);
                }
            }
            scores.roomJoined[scoresID].value+=10;
        }
        else{
            io.in(roomJoined).emit('updateScore', {
                name: name,
                scoreChange: -5
            });

            io.in(roomJoined).emit('chatMessage',{
                content: name + " negs 5.",
                time: getTime(),
                type: "notification"
            });

            for (x of scores.roomJoined){
                if (x.player==name){
                    scoresID=scores.roomJoined.indexOf(x);
                }
            }
            scores.roomJoined[scoresID].value-=5;
        }
    });

    socket.on('nextQuestion',()=>{
        canBuzz=true;
        time=new Date();
        io.in(roomJoined).emit('nextQuestion',{
            questionText: fetchNewQuestion()
        });
    });

    socket.on('nameChange', (names) => {
        for (x of scores.roomJoined){
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


function getTime(){
    time = new Date();
    hours=time.getHours();
    minutes=time.getMinutes();
    return("" + hours + ":" + (String(minutes).length==2 ? minutes:"0"+minutes));
}
