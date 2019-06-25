//import { start } from "repl";

/*
socket.on('message', message => {
    console.log(message);
});
*/



// I was really inconsistent on using these btw
const question = document.getElementById('question');
const chat = document.getElementById('chat');
const scoreboard = document.getElementById('scoreboard');
let playerName=""

let messages=[];
let scores=[];
let words;
let fullText='';
let lastWordTime;
const speed=100;
var socket = io("http://127.0.0.1:3000/");
let finishedQuestion=false;
let delay=0;
let displayText;
socket.on('chatMessage', (message) => {
    messages.push(message);
    updateChat();
});

socket.on('startingInformation', (startingInformation) => {
    scores=startingInformation.scores;
    playerName=startingInformation.name;
    words=startingInformation.startWord;
    delay=startingInformation.delayTime;
    document.getElementById('name').value=playerName;
    fullText=startingInformation.question;
    if (startingInformation.canBuzz==false){
        document.getElementById("buzzButton").style.disabled = true;
        if (whoBuzzed==playerName){
            document.getElementById("answer").style.visibility = "visible";
        }
    }
    else{
        //displayText = setInterval(nextWord, speed);
        setTimeout(function(){displayText = setInterval(nextWord, speed)},delay);
        updateScores();
    }
});

socket.on('updateScore', (scoreChange)=> {
    let scoresID=0;
    playerToChange=scoreChange.player;
    changeAmount=scoreChange.scoreChange;

    for (x of scores){
        if (x.player==scoreChange.name){
            scoresID=scores.indexOf(x);
        }
    }
    console.log(scores);
    scores[scoresID].value+=changeAmount;
    updateScores();
});

window.onload = function startingInfo(){
    console.log('loading');
    messages =[
    ];
    socket.emit('getStartingInfo');
}

function nextQuestion(){
    socket.emit('nextQuestion');
}

socket.on('nextQuestion', (nextQuestion)=>{
    clearInterval(displayText);
    words=0;
    fullText=nextQuestion.questionText;
    document.getElementById("buzzButton").style.disabled = false;
    document.getElementById("answer").style.visibility = "hidden";
    finishedQuestion=false;
    displayText = setInterval(nextWord, speed);
});


function nextWord(){
    time=new Date();
    lastWordTime=(((time.getHours()*60+time.getMinutes())*60+time.getSeconds())*1000+time.getMilliseconds());
    const textToShow = fullText.split(" ").splice(0,words).join(" ");
    const remainingText = fullText.split(" ").splice(words).join(" ");
    words=words+1;
    questionShowing.innerHTML=textToShow;
    questionHidden.innerHTML=remainingText;
    
    if(fullText != "" && textToShow==fullText){
        clearInterval(displayText);
        finishedQuestion=true;
    }
}

function buzz(){
    time=new Date();

    socket.emit('buzz', {
        name:playerName,
        timeSince: (words*speed+(((time.getHours()*60+time.getMinutes())*60+time.getSeconds())*1000+time.getMilliseconds())-lastWordTime)
    })
}

socket.on('buzz', (whoBuzzed) => {
    document.getElementById("buzzButton").style.disabled = true;
    if (whoBuzzed==playerName){
        document.getElementById("answer").style.visibility = "visible";
    }
    clearInterval(displayText);
});

socket.on('getCurrentPlace',()=>{
    time = new Date();
    const place=(words*speed+(((time.getHours()*60+time.getMinutes())*60+time.getSeconds())*1000+time.getMilliseconds())-lastWordTime)
    socket.emit('currentPlace',place);
});

function submitAnswer(){
    time = new Date();
    hours=time.getHours();
    minutes=time.getMinutes();
    socket.emit('submitAnswer', {name: playerName, answer: document.getElementById('answer').value.toLowerCase()});
}


function createMessageHTML(message){
    if (message.type=="chat"){
        return `
            <div class = "message">
            <span style="float: left">${
                message.author
            }: ${message.content}</span>
            <span style="float: right">${message.time}</span>
            </div>
        `; 
    }
    else{
        return `
            <div class = "message">
            <span class= "notification">
            ${message.content}</span>
            <span style="float: right">${message.time}</span>
            </div>
        `; 
    }

}

function createScoreHTML(score){
    return `
        <div class = "score">
        <span style="float: left">${
            score.player
        }</span>
        <span style="float: right">${score.value}</span>
        </div>
    `; 
}

function submitText(){
    time = new Date();
    hours=time.getHours();
    minutes=time.getMinutes();
    const message={
        author: playerName,
        content: document.getElementById('textChat').value,
        type: "chat"
    };
    socket.emit('chatMessage', message);
}



function updateChat(){
	const messagesHTML = messages
		.map(message => createMessageHTML(message))
        .join('');
    chat.innerHTML = messagesHTML;
}

function updateScores(){
	const scoresHTML = scores
		.map(score => createScoreHTML(score))
        .join('');
    scoreboard.innerHTML = scoresHTML;
}


 //Submits chats on enter
document.getElementById('textChat').onkeydown = function(e){
    if(e.keyCode == 13){
        submitText();
        document.getElementById('textChat').value="";
    }
 };

 //Submits answer on enter -- also need to add a timer like protobowl has
 document.getElementById('answer').onkeydown = function(e){
    if(e.keyCode == 13){
        submitAnswer();
    }
 }; 
 
 //changes name on enter
 document.getElementById('name').onkeydown = function(e){
    if(e.keyCode == 13){
        const oldPlayerName=playerName;
        playerName=document.getElementById('name').value;

        if (legalName(playerName) && playerName!=oldPlayerName){
            let scoresID=0;
            for (x of scores){ 
                if (x.player==oldPlayerName){
                    scoresID=scores.indexOf(x);
                }
            }
            scores[scoresID].player=playerName;
            
            socket.emit('nameChange',{
                newName: playerName,
                oldName: oldPlayerName
            });
            updateScores();
        }

        else{
            if (playerName!=oldPlayerName){
                window.alert("name taken");
            }
        }
    }
 }; 

 
function legalName(name){
    for (scoreItem of scores){
        if (scoreItem.player==name){
            return(false);
        }
    }
    return(true);
}
