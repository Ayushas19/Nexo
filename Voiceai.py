import speech_recognition as sr
import pyttsx3
import pywhatkit
import wikipedia
import pyjokes
import datetime
import requests
import os
import threading
# API Keys
WEATHER_API_KEY = 'f00c38e0279b7bc85480c3fe775d518c'
OPENROUTER_API_KEY = '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'

# Initialize the recognizer and text-to-speech engine
listener = sr.Recognizer()
engine = pyttsx3.init()
# Set female voice (optional)
voices = engine.getProperty('voices')
engine.setProperty('voice', voices[1].id)  # You can use [0] for male voice
def talk(text):
    # Convert text to speech
    print("Alexa:", text)
    engine.say(text)
    engine.runAndWait()

def get_weather(location):
    api_url = 'https://api.openweathermap.org/data/2.5/weather'
    url = f"{api_url}?q={location}&appid={WEATHER_API_KEY}&units=metric"
    try:
        response = requests.get(url)
        data = response.json()
        if data.get('cod') == 200:
            temp = round(data['main']['temp'])
            feels_like = round(data['main']['feels_like'])
            description = data['weather'][0]['description']
            if temp < 15:
                temp_icon = '🥶'
            else:
                temp_icon = '🥵'
            return f"In {data['name']}, it's {temp_icon}{temp}°C, feels like {feels_like}°C, with {description}."
        else:
            return "Sorry, I couldn't find the weather for that location."
    except Exception as e:
        return "Error fetching weather data."

def get_ai_response(query):
    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }
    data = {
        "model": "google/gemini-flash-1.5",
        "messages": [{"role": "user", "content": query}]
    }
    try:
        response = requests.post(url, headers=headers, json=data)
        result = response.json()
        return result['choices'][0]['message']['content']
    except Exception as e:
        return "Sorry, I couldn't get a response from AI."
def take_command():
    # Listen to user's voice and recognize the command
    command = ""
    try:
        with sr.Microphone() as source:
            print("Listening...")
            listener.adjust_for_ambient_noise(source)
            voice = listener.listen(source)
            command = listener.recognize_google(voice)
            command = command.lower()
            if 'alexa' in command:
                command = command.replace('alexa', '').strip()
                print("You said:", command)
    except sr.UnknownValueError:
        print("Sorry, I didn't understand that.")
    except sr.RequestError:
        print("Network error. Check your internet connection.")
    return command
def run_alexa():
    # Process the command and respond accordingly
    command = take_command()
    if 'play' in command:
        song = command.replace('play', '').strip()
        talk("Playing " + song)
        pywhatkit.playonyt(song)
    elif 'time' in command:
        time = datetime.datetime.now().strftime('%I:%M %p')
        talk("The current time is " + time)
    elif 'who is' in command or 'who the heck is' in command:
        person = command.replace('who the heck is', '').replace('who is', '').strip()
        info = wikipedia.summary(person, 1)
        print(info)
        talk(info)
    elif 'date' in command:
        talk("Sorry, I have a headache today.")
    elif 'are you single' in command:
        talk("I am in a relationship with Wi-Fi.")
    elif 'joke' in command:
        talk(pyjokes.get_joke())
    elif 'weather' in command:
        location = command.replace('weather', '').replace('in', '').strip()
        if location:
            weather_info = get_weather(location)
            talk(weather_info)
        else:
            talk("Please specify a location for the weather.")
    elif command != "":
        ai_response = get_ai_response(command)
        talk(ai_response)
    else:
        pass  # No voice detected, ignore silently
# Run Alexa continuously
while True:
    run_alexa()
        