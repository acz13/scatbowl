const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('Socket.io')(http)
const path = require('path');
const url = require('url');


let startWord;
let delayTime;
let roomJoined = '';
const roomProperties = [];
const speed = 150;


app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) =>
{
	res.sendFile(path.join(__dirname, +'public/index.html'))
});

http.listen(3000, () =>
{
	console.log("listening on port 3000");
})

io.on('connection', (socket) =>
{
	console.log('user connected');
	socket.on('disconnect', () =>
	{
		console.log('user disconnected');
	});
	roomJoined = (url.parse(socket.handshake.headers.referer).query);
	socket.join(roomJoined);


	let genNewName = "SCAT";
	let z = 1;

	//generates a new name that isn't in the room
	//at some point probably replace with a random name generator thing 
	while (!legalName(
		{
			name: genNewName,
			room: roomJoined
		}))
	{
		genNewName = "SCAT" + z;
		z += 1;
	}

	if (!(roomProperties.find(x => x.roomName == roomJoined)))
	{
		newQuestion = fetchNewQuestion();
		roomProperties.push(
		{
			roomName: roomJoined,
			clients: [],
			scores: [],
			buzzes: [],
			currentQuestion: newQuestion.question,
			currentCategory: newQuestion.category,
			currentAnswer: newQuestion.answer,
			currentPlaces: [],
			canBuzz: true,
			speed: speed
		})
	}

	//adds the new player to the scoreboard
	pushProperty(roomJoined, 'clients', socket.id);
	pushProperty(roomJoined, 'scores',
	{
		player: genNewName,
		value: 0
	});


	socket.on('getStartingInfo', (room) =>
	{
		const roomJoined = room;
		//resets the currentPlaces to find them again
		setProperty(roomJoined, 'currentPlaces', []);

		io.in(roomJoined).emit('getCurrentPlace');
		// this will then send the currentPlace back to the server and add it to currentPlaces
		io.in(roomJoined).emit('addName', genNewName);

		setTimeout(() =>
		{
			//gets the average of all values, if the room is empty, it will be null so it gets set to 0.
			const averagePlace = getAverage(roomJoined) ? getAverage(roomJoined) : 0;
			//calculates when+where to start the question
			startWord = Math.floor(averagePlace / speed);
			delayTime = speed - averagePlace % speed;

			io.to(socket.id).emit('startingInformation',
			{
				scores: getProperty(roomJoined, 'scores'),
				name: genNewName,
				canBuzz: getProperty(roomJoined, 'canBuzz'),
				question: getProperty(roomJoined, 'currentQuestion'),
				speed: getProperty(roomJoined, 'speed'),
				startWord: startWord,
				delayTime: delayTime
			});
		}, 100); //this wait is to account for latency
	});

	socket.on('currentPlace', (placeInfo) =>
	{
		const roomJoined = placeInfo.room;
		const currentPlace = placeInfo.place;
		if (currentPlace != null)
		{ //because the client requesting will have nothing
			pushProperty(roomJoined, 'currentPlaces', currentPlace);
		}
	});

	socket.on('chatMessage', (messageInfo) =>
	{
		const roomJoined = messageInfo.room;
		const message = messageInfo.message;

		message.time = getFormattedTime();
		io.in(roomJoined).emit('chatMessage', message);
	});

	socket.on('buzz', (buzzInfo) =>
	{
		const roomJoined = buzzInfo.room;
		const name = buzzInfo.name;

		pushProperty(roomJoined, 'buzzes', buzzInfo)

		setTimeout(() =>
		{
			//sorts by timeSince, smallest to largest, which is essentially where they buzzed and the time between words they buzzed
			//the lower timeSince is, the earlier the buzz was
			const roomIndex = roomProperties.findIndex(room => room.roomName == roomJoined);

			roomProperties[roomIndex].buzzes.sort((a, b) => (a.timeSince > b.timeSince) ? 1 : -1)

			if (getProperty(roomJoined, 'canBuzz') && getProperty(roomJoined, 'buzzes')[0].name == name)
			{ //if no one else has buzzed yet and it was the first buzz
				setProperty(roomJoined, 'canBuzz', false);
				//sends a chat notification that there was a buzz
				io.in(roomJoined).emit('chatMessage',
				{
					content: name + " buzzed",
					time: getFormattedTime(),
					type: "notification"
				});
				//buzzes
				io.in(roomJoined).emit('buzz', name)
			}
		}, 50); //50 millisecond wait to account for potential latency differences 
	});

	socket.on('submitAnswer', (answerInfo) =>
	{
		const roomJoined = answerInfo.room;
		const name = answerInfo.name;
		const answer = answerInfo.answer;
		const finishedQuestion = answerInfo.finishedQuestion;
		const displayedText = answerInfo.displayedText;
		const power = !displayedText.includes("(*)")&&getProperty(roomJoined, 'currentQuestion').includes("(*)"); // either need to make this also detect bold or add this at the end of bold if it doesn't exist 


		//checks if the answer is right
		const isCorrect = checkCorrect(answer, getProperty(roomJoined, 'currentAnswer'), displayedText, getProperty(roomJoined, 'currentQuestion'), getProperty(roomJoined, 'currentCategory'));
		if (isCorrect == "correct")
		{
			setProperty(roomJoined, 'buzzes', []);
			setProperty(roomJoined, 'canBuzz', true);
			const points = ((power) ? 15 : 10);

			//updates client side score
			io.in(roomJoined).emit('updateScore',
			{
				player: name,
				scoreChange: points
			});

			//sends a chat notification of the answer
			io.in(roomJoined).emit('chatMessage',
			{
				content: name + "  for " + points + ".",
				time: getFormattedTime(),
				type: "notification"
			});

			// finds the index of the room
			const indexOfRoom = roomProperties.findIndex(x => x.roomName == roomJoined)
			// finds the index of the score that needs to be changed
			const indexOfScore = roomProperties[indexOfRoom].scores.findIndex(x => x.player == name)

			roomProperties[indexOfRoom].scores[indexOfScore].value += points;
		}
		else if (isCorrect == "prompt")
		{
			//sends a chat notification of the answer
			io.in(roomJoined).emit('chatMessage',
			{
				content: "prompt",
				time: getFormattedTime(),
				type: "notification"
			});
		}
		//if the answer is wrong
		else
		{
			setProperty(roomJoined, 'buzzes', []);
			setProperty(roomJoined, 'canBuzz', true);

			const points = ((finishedQuestion) ? 0 : -5);

			//updates client side score
			io.in(roomJoined).emit('updateScore',
			{
				player: name,
				scoreChange: points
			});

			//sends a chat notification of the answer
			io.in(roomJoined).emit('chatMessage',
			{
				content: name + ((finishedQuestion) ? ", no neg" : " negs 5"),
				time: getFormattedTime(),
				type: "notification"
			});
			// finds the index of the room
			const indexOfRoom = roomProperties.findIndex(x => x.roomName == roomJoined);
			// finds the index of the score that needs to be changed
			const indexOfScore = roomProperties[indexOfRoom].scores.findIndex(x => x.player == name)

			roomProperties[indexOfRoom].scores[indexOfScore].value += points;
		}
	});

	socket.on('nextQuestion', (room) =>
	{
		const roomJoined = room;
		setProperty(roomJoined, 'canBuzz', true);
		const newQuestion = fetchNewQuestion();
		setProperty(roomJoined, 'currentQuestion', newQuestion.question);
		setProperty(roomJoined, 'currentAnswer', newQuestion.answer);
		setProperty(roomJoined, 'currentCategory', newQuestion.category);


		io.in(roomJoined).emit('nextQuestion',
		{
			questionText: getProperty(roomJoined, 'currentQuestion')
		});
	});

	socket.on('nameChange', (names) =>
	{
		const roomJoined = names.room;

		//updates the score data on the server side

		// finds the index of the room
		const indexOfRoom = roomProperties.findIndex(x => x.roomName == roomJoined)
		// finds the index of the score that needs to be changed
		const indexOfScore = roomProperties[indexOfRoom].scores.findIndex(x => x.player == names.oldName)
		// sets that elements player value to the new name
		roomProperties[indexOfRoom].scores[indexOfScore].player = names.newName;

		//updates the score data on the client side
		io.in(roomJoined).emit('nameChange',
		{
			newName: names.newName,
			oldName: names.oldName
		});
	});
});

//eventually this will be replaced with a function to search for the question
function fetchNewQuestion()
{
	const genQuestion = "This work argues that raises in average wages have led luxury goods to be considered costumer “needs” in what is called the “dependence effect,” and it uses the term “social balance” to refer to the proper relationship between private and public spending. It advocates an increase in public spending in education to help foster a “new class” of workers who enjoy their jobs. Originally titled “Why the Poor are Poor,” this work forms a trilogy with its author's other books American Capitalism and The New Industrial State and introduces the term “conventional wisdom.” For 10 points, name this book reevaluating the American economy, by John Galbraith.";
	const genAnswer = 'Henry the second';
	const genCategory = 'Social Science';
	return (
	{
		question: genQuestion,
		answer: genAnswer,
		category: genCategory
	});
}

function getFormattedTime()
{
	time = new Date();
	hours = time.getHours();
	minutes = time.getMinutes();
	return ("" + hours + ":" + (String(minutes).length == 2 ? minutes : "0" + minutes));
}

function legalName(nameInfo)
{
	const roomJoined = nameInfo.room;
	const name = nameInfo.name;
	//checks if the name already exists in the room, returns false if it is, true if it isn't (true = can change name)
	for (scoreItem of getProperty(roomJoined, 'scores'))
	{
		if (scoreItem.player == name)
		{
			return (false);
		}
	}
	return (true);
}

// gets the average of all currentPlaces values
function getAverage(room)
{
	const roomJoined = room;
	let total = 0;
	for (place of getProperty(roomJoined, 'currentPlaces'))
	{
		total += place;
	}
	return (total / getProperty(roomJoined, 'currentPlaces').length);
}

function pushProperty(room, property, update)
{
	index = roomProperties.findIndex(x => x.roomName == room);
	roomProperties[index][property].push(update);
}

function setProperty(room, property, update)
{
	index = roomProperties.findIndex(x => x.roomName == room);
	roomProperties[index][property] = update;
}

function getProperty(room, property)
{
	try
	{
		return (roomProperties.find(x => x.roomName == room)[property]);
	}
	catch
	{
		return ([]);
	}
}

function wordInAnswer(word, list, allowAbrev){
	return(list.some(elem => {
  	return(distance(word,elem,allowAbrev)>0.85);  
  }));
  
}

function checkCorrect(submitted, actual, displayedText, questionText){
  let [promptList, noAcceptList, acceptList, boldedAnswer, mistakesPromptList, mistakesNoAcceptList, mistakesAcceptList] = setAnswerInfo(actual);
  
  //do preliminary tests -- allows for finding anomalies like "the invisible man" vs "invisible man", they're slightly less accurate but should be fine
	const distances = [].concat(...[mistakesPromptList, mistakesNoAcceptList, mistakesAcceptList]).map(elem => distance(submitted, elem));
  
  let max = distances[0];
  let maxIndex = 0;
  for (let i = 1; i < distances.length; i++) {
      if (distances[i] > max) {
          maxIndex = i;
          max = arr[i];
      }
  }
  /* 
  if there is an answer that is close figure out which type of answer it is and return that
  */
  if(max>0.85){
  	if (maxIndex<mistakesPromptList.length){
    	return ("prompt");
    }
    else if (maxIndex<mistakesPromptList.length+mistakesNoAcceptList.length){
    	return("wrong")
    }
    else{
    	return("correct")
    }
  }

	displayedText=fixAnswer(displayedText).split(" ");
	questionText=questionText.toLowerCase();

	const allOkayWords = [].concat(...[promptList, acceptList,displayedText.slice(-15).map(elem => [elem])]).flat();
  
  const submittedAnswer = fixAnswer(submitted, questionText).split(" ");
	
	let whatToDo = "";
	let toReturn;

	
	//ANSWER INCORRECT CHECK
  
  //check if this is true for any answer that shouldn't be accepted
    if (noAcceptList.some(noAcceptAnswer => {
    	const allowAbrev=noAcceptAnswer.length>1;
    	//check if every word from the wrong answer is in the submitted answer
      return (
        noAcceptAnswer.every(elem => {
          return(wordInAnswer(elem,submittedAnswer, allowAbrev));
        })
        &&
         //check if every word from the submitted answer is in the wrong answer
        submittedAnswer.every(elem => {
          return(wordInAnswer(elem, noAcceptAnswer, allowAbrev));
        })
      )
    }))
    {
    	return("wrong");
    }
    
    
   //ANSWER PROMPT CHECK

	//check if this is true for any answer that should be prompted
  if (promptList.some(promptAnswer => {
    const allowAbrev=promptAnswer.length>1;

    const stillGood=isStillGood(promptAnswer,displayedText)
    if (stillGood){
      if(stillGood!=true){
        promptAnswer=stillGood;
      }
    }
    else{
      return(false);
    }

    return (
      //check if every word from the prompt answer is in the submitted answer
      promptAnswer.every(elem => {
        return(wordInAnswer(elem,submittedAnswer, allowAbrev));
      })
      &&
       //check if every word from the submitted answer is in an okay answer
      submittedAnswer.every(elem => {
        return(wordInAnswer(elem, allOkayWords, allowAbrev));
      })
    )
  }))
  {
    return("prompt");
  }
    
   //ANSWER CORRECT CHECK
  
  let toPrompt=false;
  //check if this is true for any answer that should be correct
  if (acceptList.some(acceptAnswer => { 
    const allowAbrev=acceptAnswer.length>1;
    const stillGood=isStillGood(acceptAnswer,displayedText)
    if (stillGood){
      if(stillGood!=true){
        acceptAnswer=stillGood;
      }
    }
    else{
      return(false);
    }

	if ( 
      //check if every word from the submitted answer is in an okay answer
      ((submittedAnswer.every(elem => {
        return(wordInAnswer(elem, allOkayWords, allowAbrev));
      }))) 

      &&
       //check if at least 2 words from the correct answer are in the submitted answer, or the correct answer is just 1 word
      acceptAnswer.filter(elem => {
        return(wordInAnswer(elem, submittedAnswer, allowAbrev));
      }).length>(allowAbrev?1:0)
    )
    {
    	return(true)
    }

    const lastWordSame=(distance(submittedAnswer.slice(-1)[0],acceptAnswer.slice(-1)[0],false));
    //else if the last word is the same, if it's a person then it's right, otherwise prompt
		if (lastWordSame > 0.85)
		{
			if (questionText.includes("this person") || questionText.includes("this man") || questionText.includes("this woman") || questionText.includes("this author") || questionText.includes("this writer") || questionText.includes("this poet") || questionText.includes("this painter") || questionText.includes("this sculptor") || questionText.includes("this pyhsicist") || questionText.includes("this composer"))
			{
				return(true);
			}
			else if(!(questionText.includes("this book")||questionText.includes("this novel")||questionText.includes("this poem")||questionText.includes("this short story")||questionText.includes("this story"))) //prompt if last word is right unless it's a book because then it needs exact
			{
      	toPrompt=true;
				return(false);
			}
		}
    else{
    	return false;
    }
  }))
  {
		return("correct")
  }
  else if(toPrompt){
      return("prompt");
  }
  else{
      return("wrong")
  }
}
  
function isStillGood(answer,text){
  //if the answer can only be accepted at some time
  if ((answer.includes("until") || answer.includes("before")))
  {
  	const index = answer.indexOf("before")>-1?answer.indexOf("before"):answer.indexOf("until");				     //sees if the words to buzz before exist in the displayedText
    if (!answer.slice(index,1).some((elem) => text.includes(elem)))
    {
      // removes all the packet junk after "before" or "accept"
      return(answer.slice(index, answer.length));
    }
    else{
      // answer can't be accepted at this point in the question
      return(false);
    }
  }
  else{
  	return(true);
  }
}

function setAnswerInfo(fullText, questionText)
{
	//fullText is full answer 
	let correctAnswers = [];
	let incorrectAnswers = [];
	let promptAnswers = [];

  fullText=fullText.toLowerCase();

	let bolded = fullText.replace(/ *\[[^\]]*]/g, ''); //removes text between []
	bolded = bolded.replace(/\s*\(.*?\)\s*/g, ''); //removes text between ()
	bolded = bolded.replace(/(\{.*?\})/g, ''); //removes text between {}

	if (bolded.includes("/"))
	{
		bolded.split("/").forEach((elem) => correctAnswers.push(fixAnswer(elem, questionText).split(" ")));
	}
	if (bolded.includes(" or "))
	{
		bolded.split(" or ").forEach((elem) => correctAnswers.push(fixAnswer(elem, questionText).split(" ")));
  }
  if (bolded.includes("-"))
	{
		bolded.split("-").forEach((elem) => correctAnswers.push(fixAnswer(elem, questionText).split(" ")));
  }

	//if there is bolded text then that becomes the bolded text
	bolded = (/<b>(.*?)<\/b>/.exec(bolded) != null ? /<b>(.*?)<\/b>/.exec(bolded)[1] : bolded)
	bolded = bolded.replace(/(<.*?\>)/g, ''); //removes text between <>
	bolded = bolded.replace(/(<.*?\>)/g, ''); //removes text between < and >  which occurs sometimes instead of <>

	let [mistakesIncorrectAnswers, mistakesPromptAnswers, mistakesCorrectAnswers] = commonAnswerMistakes(bolded);

	correctAnswers.push(fixAnswer(bolded, questionText).split(" "));


	fullText = fullText.replace(/\[/g, "(").replace(/\]/g, ")"); // replace brackets with parentheses to make later things easier
	const re = /\((.*)\)/i;
	fullText = fullText.match(re) != null ? fullText.match(re)[0].replace(/\(/g, "").replace(/\)/g, "") : ""; //get text between parentheses, regex returns it with parentheses, so those are then removed

	fullText = "accept " + fullText;
	//split on prompts and accepts, trim every element, then remove blanks
	fullText = fullText.split(/(prompt|accept)+/).map((elem) => elem.trim()).filter((elem) =>
	{
		//if it's empty, remove it
		return (elem != "");
	});

	let tempTxt=[];
	for (let i = 0; i < fullText.length; i++)
	{
		if (fullText[i] != "accept" && fullText[i] != "prompt")
		{
			//split on "," , "or" , and ";", trim every element, then remove blanks
      let wordsMinusDash=[];
			tempTxt = fullText[i].split(/,| or |;|\//).map((elem) => {if(elem.includes("-")){wordsMinusDash.push(elem.replace("-"," "))};return(elem.trim())}).filter((elem) =>
			{
				//if it's empty, remove it
				return (elem != "");
			});
      wordsMinusDash.forEach(elem => tempTxt.push(elem));

			if (fullText[i - 1] == "accept")
			{
				if (fullText[i - 2] != null ? fullText[i - 2].split(" ").slice(-1)[0] == "not" : false)
        { // if it is wrong
        	tempTxt.forEach((elem) => incorrectAnswers.push(fixAnswer(elem, questionText).trim().split()));
				}
				else
				{
					tempTxt.forEach((elem) => correctAnswers.push(fixAnswer(elem, questionText).trim().split(" ")));
				}
			}
			else
			{
				tempTxt.forEach((elem) => promptAnswers.push(fixAnswer(elem, questionText).trim().split(" ")));
			}
		}
	}

	//remove all empty elements
	promptAnswers = promptAnswers.filter((elem) =>
	{
		return (elem != "");
	});
	incorrectAnswers = incorrectAnswers.filter((elem) =>
	{
		return (elem != "");
	});
	correctAnswers = correctAnswers.filter((elem) =>
	{
		return (elem != "");
	});

	return [promptAnswers, incorrectAnswers, correctAnswers, bolded, mistakesPromptAnswers, mistakesIncorrectAnswers, mistakesCorrectAnswers];
}

function commonAnswerMistakes(answer)
{
	let correctAnswers = [];
	let incorrectAnswers = [];
	let promptAnswers = [];

	if (answer == "the invisible man")
	{
		incorrectAnswers.push("invisible man")
	}
	if (answer == "invisible man")
	{
		incorrectAnswers.push("the invisible man")
	}
	return ([incorrectAnswers, promptAnswers, correctAnswers]);
}


function fixAnswer(answer, questionText)
{
	if (questionText == null)
	{
		questionText = "";
	}
	else{
		questionText=questionText.toLowerCase();
	}
	answer = answer.trim();
	answer = answer.toLowerCase();

	//remove grammar
  answer=answer.replace(/[^A-Za-z0-9\s]/g,'');

	let answerWords = answer.split(" ");
	//general stop words -- make sure i isn't included
	const stopWords = ["like", "law", "experiment", "answers","required",'king', 'queen', "unless", "type", "word", "forms", "equivalent", "more", "this", "anything", "related", "name", "which", "includes", "any", "underlined", "bolded", "portion", "partial", "answer", "it", "it's", "its","they","them","a","their","what","mention", "mentioned", "who", "which", "that", "grudgingly", "begrudgingly", "involving", 'am', 'is', 'are', 'was', 'were', 'be', 'been', "specific", "specifics", "has", "have", "had", "do", "does","did",'a',"an","but","if","or",'as','because', "specifically", "etc", "afterwards", "force", "de", "la", "el", 'of', 'at', 'by', 'for', 'theory', 'with', 'about', 'during', 'after','to','in','on','now','then','once','there','when','why','how','all','any','both','more','other','otherwise','most','suuch','as','no','not','only','same','some','so','can',"don't","will","just","should","the", "no.","no","number","vitamin","vitamins","effect"];
	//remove stop words
	if (answerWords.length - 1 > 0) //check to make sure it's not some weird question with a stop word as the answers
	{ 
		if (questionText.includes("this book")||questionText.includes("this novel")||questionText.includes("this poem")||questionText.includes("this short story")||questionText.includes("this story"))
		{ //since books/novels/poems actually cares about stop words after the beginning because it's generally a work, only remove beginning stop words -- didn't include "this work" because music often has stop words
			stopWords.forEach((stopWord) =>
			{
				if (distance(answerWords[0], stopWord) > 0.85)
				{
					answerWords.shift();
				}
			});
		}
		else
		{
			answerWords = answerWords.map((answerWord) =>
			{
				whatToReturn = answerWord;
				stopWords.forEach((stopWord) =>
				{
					if (distance(answerWord, stopWord) > 0.85)
					{
						whatToReturn = "";
					}
				});
				return (whatToReturn);
			});
		}
	}

	//removes any elements that were set to blank
	answerWords = answerWords.filter((elem) =>
	{
		return elem != "";
	});

	// deal with numbers
	answerWords = answerWords.map((answerWord) =>
	{
		// convert roman numerals to numbers
		if (!new RegExp("[^\sxiv]").test(answerWord))
		{ //if the word only has x, i, and v in it
			return (convertFromRoman(answerWord).toString());
		}

		// remove suffixes from numbers
		answerWord = answerWord.replace(/(\d+)(st|nd|rd|th)/, "$1")
		// convert text to numbers
		const ordinalNumbers = ["zeroth", "first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "tenth", "eleventh", "twelfth", "thirteenth", "fourteenth", "fifteenth", "sixteenth", "seventeenth", "eighteenth", "nineteenth", "twentieth", "twenty first"];
		const cardinalNumbers = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty", "twenty one"];

		for (let i = 0; i < ordinalNumbers.length; i++)
		{
			if (distance(answerWord, ordinalNumbers[i]) > 0.85)
			{
				return (i.toString());
			}
		}
		for (let i = 0; i < cardinalNumbers.length; i++)
		{
			if (distance(answerWord, cardinalNumbers[i]) > 0.85)
			{
				return (i.toString());
			}
		}
		return (answerWord);
	});

	//if any words end in "s", "ing", or "ed", remove that ending
	answerWords = answerWords.map((word) => removeEndings(word));
	answer = answerWords.join(" ");

	//turn accept or prompt and prompt or accept into just accept -- this is for when they say "do not accept or prompt on"
	answer.replace(/prompt or accept/g, "accept")
	answer.replace(/accept or prompt/g, "accept")

	//replace anti-prompt with prompt cuz i'm to lazy to add a separate case
	answer.replace(/antiprompt/g, "prompt")
	answer.replace(/anti prompt/g, "prompt")
	answer.replace(/anti-prompt/g, "prompt")

	return (answer.trim());
}

function convertFromRoman(str)
{
	var result = 0;
	// the result is now a number, not a string
	var decimal = [10, 9, 5, 4, 1];
	var roman = ["x", "ix", "v", "iv", "i"];
	for (var i = 0; i <= decimal.length; i++)
	{
		while (str.indexOf(roman[i]) == 0)
		{
			//checking for the first characters in the string
			result += decimal[i];
			//adding the decimal value to our result counter
			str = str.replace(roman[i], '');
			//remove the matched Roman letter from the beginning
		}
	}
	return (result);
}

function removeEndings(word)
{
	if (word.slice(-3) == "ing")
	{
		return (word.slice(0, -3));
	}
	else if (word.slice(-2) == "ed")
	{
		return (word.slice(0, -2));
	}
	else if (word.slice(-1) == "s")
	{
		return (word.slice(0, -1));
	}
	return (word);

}

function distance(seq1,seq2,allowAbrev) {

	// s1 is submitted answer stuff, s2 is given stuff
  if (allowAbrev){
  	if (seq1.substring(0,1)==seq2 || seq2.substring(0,1)==seq1){
    	return(1);
    }
  }

	//some short circuit stuff for efficiency
  if (seq1==seq2){
  	return 1
  }
  if (Math.abs(seq1.length-seq2.length)>2){
  	return 0
  }



	// check if  numbers are the exact same because they normally have to be
	let submittedNumb = !(seq1.match(/\d/g)) ? "" : seq1.match(/\d/g).join(""); //extract number
	let correctNumb = !(seq2.match(/\d/g)) ? "" : seq2.match(/\d/g).join("");
	if (submittedNumb != correctNumb)
	{
		return (0);
	}



    let len1=seq1.length;
    let len2=seq2.length;
    let i, j;
    let dist;
    let ic, dc, rc;
    let last, old, column;

    const weighter={
        insert:function(c) { return insertDeleteLetterCalc(c); },
        delete:function(c) { return insertDeleteLetterCalc(c); },
        replace:function(c, d) { return charDist(c,d); }
    };

    if (len1 == 0 || len2 == 0) {
        dist = 0;
        while (len1)
            dist += weighter.delete(seq1[--len1]);
        while (len2)
            dist += weighter.insert(seq2[--len2]);
        return dist;
    }

    column = []; 

    column[0] = 0;
    for (j = 1; j <= len2; ++j)
        column[j] = column[j - 1] + weighter.insert(seq2[j - 1]);

    for (i = 1; i <= len1; ++i) {
        last = column[0]; /* m[i-1][0] */
        column[0] += weighter.delete(seq1[i - 1]); /* m[i][0] */
        for (j = 1; j <= len2; ++j) {
            old = column[j];
            if (seq1[i - 1] == seq2[j - 1]) {
                column[j] = last; /* m[i-1][j-1] */
            } else {
                ic = column[j - 1] + weighter.insert(seq2[j - 1]);      /* m[i][j-1] */
                dc = column[j] + weighter.delete(seq1[i - 1]);          /* m[i-1][j] */
                rc = last + weighter.replace(seq1[i - 1], seq2[j - 1]); /* m[i-1][j-1] */
                column[j] = ic < dc ? ic : (dc < rc ? dc : rc);
            }
            last = old;
        }
    }

    dist = column[len2];
    
    //if chars are swapped then reduce score
    for (let i=0;i<seq1.split("").length-2;i++){
    	if((seq1.substring(i,i+1)==seq1.substring(i+1,i+2))){
      	if (!seq2.includes(seq1.substring(i,i+2))){
        	dist-=0.5;
        }
      }
    }
    for (let i=0;i<seq2.split("").length-2;i++){
    	if((seq2.substring(i,i+1)==seq2.substring(i+1,i+2))){
      	if (!seq1.includes(seq2.substring(i,i+2))){
        	dist-=0.25;
        }
      }
    }
    return (1-dist/(1.6*(0.5+Math.min(seq1.length,seq2.length))));
}

function insertDeleteLetterCalc(char){
	if (char==' '){
  	return(1.5)
  }
  else{
  	return(1);
  }
}


function charDist(c1,c2){
  keyboard = {
  	1: [-1,0],
    2: [-1,1],
  	3: [-1,2],
    4: [-1,3],
  	5: [-1,4],
    6: [-1,5],
  	7: [-1,6],
    8: [-1,7],
  	9: [-1,8],
    0: [-1,9],
  	"-": [-1,10],
    "+": [-1,11],
    q: [0, 0],
    w: [0, 1],
    e: [0, 2],
    r: [0, 3],
    t: [0, 4],
    y: [0, 5],
    u: [0, 6],
    i: [0, 7],
    o: [0, 8],
    p: [0, 9],
    "[": [0, 10],
    "]": [0, 11],
    a: [1, 0],
    s: [1, 1],
    d: [1, 2],
    f: [1, 3],
    g: [1, 4],
    h: [1, 5],
    j: [1, 6],
    k: [1, 7],
    l: [1, 8],
    ";": [0, 10],
    "'": [0, 11], 
    z: [2, 0],
    x: [2, 1],
    c: [2, 2],
    v: [2, 3],
    b: [2, 4],
    n: [2, 5],
    m: [2, 6],
    ",": [2, 7],
    ".": [2, 8]
  }
  try {
    return(((Math.sqrt(Math.abs(keyboard[c1][0]-keyboard[c2][0])+Math.abs(keyboard[c1][1]-keyboard[c2][1])))<1.5)
    	?0.4:
      (((Math.sqrt(
    Math.abs(keyboard[c1][0]-keyboard[c2][0])+
    Math.abs(keyboard[c1][1]-keyboard[c2][1])
    )<2)?0.75:1.5)));
  }
  catch (err){
  	return(1.5)
  }   
}
