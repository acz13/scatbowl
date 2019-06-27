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

let roomName='';

window.onload = function startingInfo(){
    roomName = window.location.search.slice(1);
    socket.emit('getStartingInfo',roomName);
}

socket.on('startingInformation', (startingInformation) => {
    scores=startingInformation.scores;
    playerName=startingInformation.name;
    words=startingInformation.startWord;
    delay=startingInformation.delayTime;
    document.getElementById('name').value=playerName;
    fullText=startingInformation.question;

    //if someone has buzzed don't write the question and disable buttons
    if (startingInformation.canBuzz==false){
        document.getElementById("buzzButton").disabled = true;
        document.getElementById("nextButton").disabled = true;
        writingQuestion=false;
    }
    else{
        //starts writing the question after the delay
        writingQuestion=true;
        lastWordTime=getTime();
        setTimeout(nextWord,delay);
    }
    updateScores();
});

socket.on('chatMessage', (message) => {
    messages.push(message);
    updateChat();
});


socket.on('updateScore', (scoreChange)=> {
    playerToChange=scoreChange.player;    
    changeAmount=scoreChange.scoreChange;

    let scoresID=0;
    //determines which element of score needs to be changed and changes it
    for (x of scores){
        if (x.player==playerToChange){
            scoresID=scores.indexOf(x);
        }
    }
    scores[scoresID].value+=changeAmount;
    updateScores();

    //resets buttons
    document.getElementById("answer").value="";
    document.getElementById("answer").style.visibility = "hidden";
    document.getElementById("nextButton").disabled = false;

    //if the answer was right, go to the end of the question
    if (changeAmount>0){
        finishedQuestion=true;
        words=fullText.length;
    }
    //if the answer was wrong, continue with the question
    else{
        document.getElementById("buzzButton").disabled = false;
        lastWordTime=getTime();
        setTimeout(nextWord,speed);
        writingQuestion=true;
    }
});


function nextQuestion(){
    socket.emit('nextQuestion',roomName);
}

socket.on('nextQuestion', (nextQuestion)=>{
    fullText=nextQuestion.questionText;
    writingQuestion=true;
    finishedQuestion=false;
    words=0;

    document.getElementById("buzzButton").disabled = false;
    document.getElementById("nextButton").disabled = false;
    document.getElementById("answer").style.visibility = "hidden";

    lastWordTime=getTime();
    setTimeout(nextWord, speed);
});


function nextWord(){
    const textToShow = fullText.split(" ").splice(0,words).join(" ");
    const remainingText = fullText.split(" ").splice(words).join(" ");

    //calculates whether or not it is time to display the next word, and how long to wait before the next word -- to account for variance in setTimeout
    wordsChange=(Math.floor((getTime()-lastWordTime)/speed));
    words+=wordsChange;
    delay=(speed-((getTime()-lastWordTime)%100));
    //if the next word was added, update when the lastWord was added
    if (wordsChange!=0){
        lastWordTime=getTime();
    }

    questionShowing.innerHTML=textToShow;
    questionHidden.innerHTML=remainingText;

    //checks if the question is over
    if(fullText != "" && textToShow==fullText){
        writingQuestion=false;
        finishedQuestion=true;
    }
    if (writingQuestion){
        setTimeout(nextWord, delay);
    }
}

socket.on('buzz', (whoBuzzed) => {
    document.getElementById("buzzButton").disabled = true;
    document.getElementById("nextButton").disabled = true;
    
    //displays the answer box if this was the client that buzzed
    if (whoBuzzed==playerName){
        document.getElementById("answer").style.visibility = "visible";
    }

    writingQuestion=false;
});

function buzz(){
    time=new Date();
    socket.emit('buzz', {
        name: playerName,
        timeSince: (words*speed+getTime()-lastWordTime),
        room: roomName
    })
}

socket.on('getCurrentPlace',()=>{
    time = new Date();
    const place=(words*speed+getTime()-lastWordTime)
    socket.emit('currentPlace',{place: place,room: roomName});
});

socket.on('addName',(newName)=>{
    scores.push({player: newName, value:0});
    updateScores();
})

socket.on('nameChange',(names)=>{
    // finds the player in scores with the old name and changes it to the new name
   for (x of scores){
       if (x.player==names.oldName){
           x.player=names.newName;
       }
   }
   updateScores();
});

function submitAnswer(){
    socket.emit('submitAnswer', {
        name: playerName, 
        answer: document.getElementById('answer').value.toLowerCase(),
        finishedQuestion: finishedQuestion,
        power: !fullText.split(" ").splice(0,words).join(" ").includes("(*)"), //This doesn't work with IE, so should probably just write a function, but I'm lazy rn -- point is to check if the power mark is in the written part of the question
        room: roomName
    });
}

function submitText(){
    const message={
        author: playerName,
        content: document.getElementById('textChat').value,
        type: "chat"
    };
    socket.emit('chatMessage', {message: message, room: roomName});
}

//goes through every message, converts it to html, and sets the chat 
function updateChat(){
	const messagesHTML = messages
		.map(message => createMessageHTML(message))
        .join('');
    document.getElementById('chat').innerHTML = messagesHTML;
}

//goes through every scoreItem, converts it to html, and sets the scoreboard 
function updateScores(){
	const scoresHTML = scores
		.map(score => createScoreHTML(score))
        .join('');
    document.getElementById('scoreboard').innerHTML = scoresHTML;
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
            socket.emit('nameChange',{
                newName: playerName,
                oldName: oldPlayerName,
                room: roomName

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
