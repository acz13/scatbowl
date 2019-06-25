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

var socket = io("http://127.0.0.1:3000/");

socket.on('chatMessage', (message) => {
    messages.push(message);
    updateChat();
});

socket.on('scores', (updatedScores) => {
    console.log('this happened');
    scores=updatedScores;

    //This could probably be done better ngl 
    if (playerName==""){
        playerName=scores[scores.length-1].player;
    }
    updateScores();
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


    updateChat();  
    updateScores();
    startNewQuestion();
}

function startNewQuestion(){
    socket.emit('nextQuestion');
    const finishedQuestion=false;
    words=0;
    displayText;
}


socket.on('nextQuestion', (nextQuestion)=>{
    fullText=nextQuestion;
});

var displayText = setInterval(function(){
    words=words+1;
    const textToShow = fullText.split(" ").splice(0,words).join(" ");
    const remainingText = fullText.split(" ").splice(words).join(" ");
    questionShowing.innerHTML=textToShow;
    questionHidden.innerHTML=remainingText;
    
    if(fullText != "" && textToShow==fullText){
        clearInterval(displayText);
        finishedQuestion=true;
    }
}, 100)

function buzz(){
    document.getElementById("buzzButton").style.display = "none";
    document.getElementById("answer").style.display = "block";
    clearInterval(displayText);
}

function submitAnswer(){
    time = new Date();
    hours=time.getHours();
    minutes=time.getMinutes();

    console.log(document.getElementById('answer').value.toLowerCase());

    socket.emit('submitAnswer', {name: playerName, answer: document.getElementById('answer').value.toLowerCase(), hours: hours, minutes: minutes});
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
        time: "" + hours + ":" + (String(minutes).length==2 ? minutes:"0"+minutes),
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
        console.log(playerName);
        
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
 }; 
