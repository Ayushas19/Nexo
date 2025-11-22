// Modal elements
const modal = document.getElementById('assistantModal');
const closeBtn = document.querySelector('.close');
const speakBtn = document.getElementById('speakBtn');
const modalResponse = document.getElementById('modalResponse');
const startBtn = document.getElementById('startBtn');
const responseDiv = document.getElementById('response');
const manualSpeakBtn = document.getElementById('manualSpeakBtn');
const modalManualSpeakBtn = document.getElementById('modalManualSpeakBtn');
const customBtn = document.getElementById('customBtn');
const retryMicBtn = document.getElementById('retryMicBtn');

// Auto-enable modal on page load and start listening
window.onload = function() {
    modal.style.display = 'block';
    requestMicrophonePermission();
};

function requestMicrophonePermission() {
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(function(stream) {
            console.log('Microphone access granted');
            recognition.start();
        })
        .catch(function(err) {
            console.error('Microphone access denied:', err);
            modalResponse.textContent = 'Microphone access denied. Please allow microphone access and refresh the page.';
        });
}

// Close modal
closeBtn.onclick = function() {
    modal.style.display = 'none';
};

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = 'none';
    }
};

// Speech recognition
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.continuous = true;
recognition.interimResults = false;
recognition.lang = 'en-US';

let isListening = false;
let isProcessingCommand = false;

recognition.onstart = function() {
    isListening = true;
    modalResponse.textContent = 'Always listening for "Hey Alexa"...';
};

recognition.onresult = function(event) {
    const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase();
    modalResponse.textContent = `You said: ${transcript}`;
    if (transcript.includes('hey alexa')) {
        modalResponse.textContent = 'Alexa activated! Listening for command...';
        // Stop current recognition and start a new one for the command
        recognition.stop();
        setTimeout(() => {
            const commandRecognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
            commandRecognition.continuous = false;
            commandRecognition.interimResults = false;
            commandRecognition.lang = 'en-US';

            commandRecognition.onstart = function() {
                modalResponse.textContent = 'Listening for command...';
            };

            commandRecognition.onresult = function(event) {
                const commandTranscript = event.results[0][0].transcript.toLowerCase();
                modalResponse.textContent = `Command: ${commandTranscript}`;
                processCommand(commandTranscript);
            };

            commandRecognition.onerror = function(event) {
                modalResponse.textContent = 'Error occurred in recognition: ' + event.error;
                restartListening();
            };

            commandRecognition.onend = function() {
                modalResponse.textContent = 'Always listening for "Hey Alexa"...';
                restartListening();
            };

            commandRecognition.start();
        }, 1000); // Small delay to restart
    }
};

recognition.onerror = function(event) {
    console.error('Recognition error:', event.error);
    if (event.error === 'aborted') {
        // Aborted is expected when stopping for command, so don't show error
        return;
    }
    modalResponse.textContent = 'Error occurred in recognition: ' + event.error + '. Retrying...';
    if (event.error === 'not-allowed') {
        retryMicBtn.style.display = 'block';
    }
    restartListening();
};

recognition.onend = function() {
    isListening = false;
    if (!isListening && !isProcessingCommand) {
        restartListening();
    }
};

function restartListening() {
    if (!isListening && !isProcessingCommand) {
        setTimeout(() => {
            if (!isListening && !isProcessingCommand) {
                recognition.start();
            }
        }, 200); // Small delay to avoid aborted errors
    }
}

// Speech synthesis
function speak(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
}

// Process command
function processCommand(command) {
    if (command.includes('alexa')) {
        command = command.replace('alexa', '').trim();
    }

    if (command.includes('play')) {
        const song = command.replace('play', '').trim();
        speak(`Playing ${song}`);
        // Note: pywhatkit.playonyt(song) can't be used in browser, so just speak
    } else if (command.includes('time')) {
        const time = new Date().toLocaleTimeString();
        speak(`The current time is ${time}`);
    } else if (command.includes('who is') || command.includes('who the heck is')) {
        const person = command.replace('who the heck is', '').replace('who is', '').trim();
        modalResponse.textContent = 'Processing...';
        fetch('/ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: `Tell me about ${person}` })
        })
        .then(response => response.json())
        .then(data => {
            speak(data.response);
            modalResponse.textContent = data.response;
        });
    } else if (command.includes('date')) {
        speak("Sorry, I have a headache today.");
    } else if (command.includes('are you single')) {
        speak("I am in a relationship with Wi-Fi.");
    } else if (command.includes('joke')) {
        modalResponse.textContent = 'Processing...';
        fetch('/ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: 'Tell me a joke' })
        })
        .then(response => response.json())
        .then(data => {
            speak(data.response);
            modalResponse.textContent = data.response;
        });
    } else if (command.includes('weather')) {
        let location = command.replace('weather', '').replace('in', '').replace('today\'s', '').replace('todays', '').trim();
        if (!location) {
            location = 'London'; // Default location if none specified
        }
        modalResponse.textContent = 'Processing...';
        fetch('/weather', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ location: location })
        })
        .then(response => response.json())
        .then(data => {
            speak(data.response);
            modalResponse.textContent = data.response;
        });
    } else {
        modalResponse.textContent = 'Processing...';
        fetch('/ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: command })
        })
        .then(response => response.json())
        .then(data => {
            speak(data.response);
            modalResponse.textContent = data.response;
        });
    }
}

// Event listeners
speakBtn.onclick = function() {
    const commandRecognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    commandRecognition.continuous = false;
    commandRecognition.interimResults = false;
    commandRecognition.lang = 'en-US';

    commandRecognition.onstart = function() {
        modalResponse.textContent = 'Listening for command...';
    };

    commandRecognition.onresult = function(event) {
        const commandTranscript = event.results[0][0].transcript.toLowerCase();
        console.log('Manual command heard:', commandTranscript);
        modalResponse.textContent = `Command: ${commandTranscript}`;
        processCommand(commandTranscript);
    };

    commandRecognition.onerror = function(event) {
        console.error('Manual recognition error:', event.error);
        modalResponse.textContent = 'Error occurred in recognition: ' + event.error + '. Try again.';
    };

    commandRecognition.onend = function() {
        modalResponse.textContent = 'Always listening for "Hey Alexa"...';
    };

    commandRecognition.start();
};
