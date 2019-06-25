const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('Socket.io')(http)
const path = require('path');

let correctAnswer='';
const scores=[];
//Currently this is just a random preset, would be cleaner to have it actually get the first connection's name
let scoresID=0;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/',(req,res) => {
    res.sendFile(path.join(__dirname, + 'public/index.html'))
});


function legalName(name){
    console.log("oof " + JSON.stringify(scores));
    for (scoreItem of scores){
        console.log("this happening" + JSON.stringify(scoreItem));
        if (scoreItem.player==name){
            console.log("it's illegal!");
            return(false);
        }
    }
    return(true);
}

io.on('connection', (socket) => {
    console.log("a user connected");
    console.log("current players..." + JSON.stringify(scores));
    let genNewName = "SCAT";
    let z = 1;
    while (!legalName(genNewName)){
        genNewName="SCAT"+z;
        z+=1;
    }
    scores.push(
        {
            player: genNewName,
            value: 0
        }
    );
    io.emit('scores', scores);

    socket.on('disconnect', () => {
        console.log('user disconnected');
    });

    socket.on('chatMessage', (message) => {
        io.emit('chatMessage', message);
    });

    socket.on('buzz', (buzzInfo) => {
        const name = buzzInfo.name;
        const lastWord = buzzInfo.lastWord;
        const timeSince = buzzInfo.timeSince;
    });

    socket.on('submitAnswer', (answerInfo) => {
        const name = answerInfo.name;
        const answer = answerInfo.answer;
        const hours = answerInfo.hours;
        const minutes = answerInfo.minutes;
        console.log("answer: " + answer + " " + "correct answer: " + correctAnswer);
        if (answer==correctAnswer){
            io.emit('updateScore', {
                name: name,
                scoreChange: 10
            });
            io.emit('chatMessage',{
                content: name + "  for 10.",
                time: "" + hours + ":" + (String(minutes).length==2 ? minutes:"0"+minutes),
                type: "notification"
            });

            for (x of scores){
                if (x.player==name){
                    scoresID=scores.indexOf(x);
                }
            }
            scores[scoresID].value+=10;
        }
        else{
            io.emit('updateScore', {
                name: name,
                scoreChange: -5
            });

            io.emit('chatMessage',{
                content: name + " negs 5.",
                time: "" + hours + ":" + (String(minutes).length==2 ? minutes:"0"+minutes),
                type: "notification"
            });

            for (x of scores){
                if (x.player==name){
                    scoresID=scores.indexOf(x);
                }
            }
            scores[scoresID].value-=5;
        }
    });

    socket.on('nextQuestion', () =>{
        io.emit('nextQuestion',fetchNewQuestion());
    });

    socket.on('nameChange', (names) => {
        for (x of scores){
            if (x.player==names.oldName){
                scoresID=scores.indexOf(x);
            }
        }
        scores[scoresID].player=names.newName;
    });
});

http.listen(3000, () => {
    console.log("listening on port 3000");
})

function fetchNewQuestion(){
    correctAnswer = 'energy';
    return("Because this quantity is conserved, perpetual motion machines of the first kind cannot exist. A capacitor stores this quantity in an electric field between its plates. The SI unit for this quantity is describes the work done when a force of one (*)) newton moves an object one meter. For ten points, name this physical quantity that is measured in Joules and comes in kinetic and potential forms.");
}
