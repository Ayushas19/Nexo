from flask import Flask, render_template, request, jsonify
import requests
import os

app = Flask(__name__)

# API Keys
WEATHER_API_KEY = 'f00c38e0279b7bc85480c3fe775d518c'
OPENROUTER_API_KEY = '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'

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/weather', methods=['POST'])
def weather():
    data = request.json
    location = data.get('location')
    if not location:
        return jsonify({'error': 'Location required'}), 400

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
            result = f"In {data['name']}, it's {temp_icon}{temp}°C, feels like {feels_like}°C, with {description}."
            return jsonify({'response': result})
        else:
            return jsonify({'response': "Sorry, I couldn't find the weather for that location."})
    except Exception as e:
        return jsonify({'response': "Error fetching weather data."})

@app.route('/ai', methods=['POST'])
def ai():
    data = request.json
    query = data.get('query')
    if not query:
        return jsonify({'error': 'Query required'}), 400

    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "google/gemini-flash-1.5",
        "messages": [{"role": "user", "content": query}]
    }
    try:
        response = requests.post(url, headers=headers, json=payload)
        result = response.json()
        ai_response = result['choices'][0]['message']['content']
        return jsonify({'response': ai_response})
    except Exception as e:
        return jsonify({'response': "Sorry, I couldn't get a response from AI."})

if __name__ == '__main__':
    app.run(debug=True)
