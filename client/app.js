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
let writingQuestion;
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
        document.getElementById("buzzButton").disabled = true;
        document.getElementById("nextButton").disabled = true;

        writingQuestion=false;
    }
    else{
        writingQuestion=true;
        lastWordTime=getTime();
        setTimeout(nextWord,delay);
    }
    updateScores();
});

socket.on('updateScore', (scoreChange)=> {
    let scoresID=0;
    playerToChange=scoreChange.player;
    console.log(playerToChange);
    console.log(JSON.stringify(scores));
    changeAmount=scoreChange.scoreChange;

    for (x of scores){
        if (x.player==playerToChange){
            console.log("it noticed");
            scoresID=scores.indexOf(x);
        }
    }
    scores[scoresID].value+=changeAmount;
    updateScores();

    document.getElementById("answer").value="";
    document.getElementById("answer").style.visibility = "hidden";
    document.getElementById("nextButton").disabled = false;

    if (changeAmount>0){
        finishedQuestion=true;
        words=fullText.length;
    }
    else{
        document.getElementById("buzzButton").disabled = false;
        lastWordTime=getTime();
        setTimeout(nextWord,speed);
        writingQuestion=true;
    }

});

window.onload = function startingInfo(){
    messages =[
    ];
    socket.emit('getStartingInfo');
}

function nextQuestion(){
    socket.emit('nextQuestion');
}

socket.on('nextQuestion', (nextQuestion)=>{
    writingQuestion=true;
    finishedQuestion=false;
    words=0;
    fullText=nextQuestion.questionText;
    document.getElementById("buzzButton").disabled = false;
    document.getElementById("nextButton").disabled = false;

    document.getElementById("answer").style.visibility = "hidden";
    lastWordTime=getTime();
    setTimeout(nextWord, speed);
});


function nextWord(){
    time=new Date();
    const textToShow = fullText.split(" ").splice(0,words).join(" ");
    const remainingText = fullText.split(" ").splice(words).join(" ");
    //console.log("getTime(): "+(getTime()-lastWordTime));
    wordsChange=(Math.floor(getTime()-lastWordTime)/speed);
    words+=wordsChange;
    if (wordsChange!=0){
        lastWordTime=getTime();
    }
    delay=(speed-((getTime()-lastWordTime)%speed));
    questionShowing.innerHTML=textToShow;
    questionHidden.innerHTML=remainingText;
    
    if(fullText != "" && textToShow==fullText){
        writingQuestion=false;
        finishedQuestion=true;
    }
    if (writingQuestion){
        setTimeout(nextWord, delay);
    }
}

function buzz(){
    time=new Date();
    socket.emit('buzz', {
        name:playerName,
        timeSince: (words*speed+getTime()-lastWordTime),
    })
}

socket.on('buzz', (whoBuzzed) => {
    document.getElementById("buzzButton").disabled = true;
    document.getElementById("nextButton").disabled = true;
    if (whoBuzzed==playerName){
        document.getElementById("answer").style.visibility = "visible";
    }
    writingQuestion=false;
});

socket.on('getCurrentPlace',()=>{
    time = new Date();
    const place=(words*speed+getTime()-lastWordTime)
    socket.emit('currentPlace',place);
});

function submitAnswer(){
    socket.emit('submitAnswer', {
        name: playerName, 
        answer: document.getElementById('answer').value.toLowerCase(),
        finishedQuestion: finishedQuestion,
        power: !fullText.split(" ").splice(0,words).join(" ").includes("(*)") //This doesn't work with IE, so should probably just write a function, but I'm lazy rn
    });
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

 socket.on('addName',(newName)=>{
     scores.push({player: newName, value:0});
     updateScores();
 })
 socket.on('nameChange',(names)=>{
    for (x of scores){
        if (x.player==names.oldName){
            x.player=names.newName;
        }
    }
    updateScores();
 });
 //changes name on enter
 document.getElementById('name').onkeydown = function(e){
    if(e.keyCode == 13){
        const oldPlayerName=playerName;
        playerName=document.getElementById('name').value;

        if (legalName(playerName) && playerName!=oldPlayerName){
            socket.emit('nameChange',{
                newName: playerName,
                oldName: oldPlayerName
            });
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

function getTime(){
    time=new Date();
    return(((time.getHours()*60+time.getMinutes())*60+time.getSeconds())*1000+time.getMilliseconds());
}
