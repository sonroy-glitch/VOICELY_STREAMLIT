import os
import io
import json
import base64
import requests
import streamlit as st
import streamlit.components.v1 as components
from groq import Groq
from elevenlabs import  play
from elevenlabs.client import ElevenLabs
from elevenlabs import stream
import assemblyai as aai

# Setup API keys from the previous a.py
groq_client = Groq(api_key=st.secrets["GROQ_API_KEY"])
API_KEY = st.secrets['ELEVEN_LABS_API']
client = ElevenLabs(api_key=API_KEY)
aai.settings.api_key = st.secrets['ASSEMBLY_API_KEY']
config = aai.TranscriptionConfig(speech_models=["universal-3-pro", "universal-2"], language_detection=False)

# Streamlit Page Config
st.set_page_config(layout="wide", page_title="Voicely", page_icon="🎤", initial_sidebar_state="collapsed")

st.markdown("""
<style>
    /* Force light background on HTML/Body to prevent dark mode browser flashes */
    :root { color-scheme: light; }
    html, body { background-color: #F9F9F9 !important; }
    
    #MainMenu {visibility: hidden;}
    header {visibility: hidden; background: #F9F9F9 !important;}
    footer {visibility: hidden;}
    [data-testid="stSidebar"] {display: none !important;}
    
    /* Ensure the Streamlit app container and block container stay light */
    .stApp { background-color: #F9F9F9 !important; }
    [data-testid="stAppViewContainer"] { background-color: #F9F9F9 !important; }
    [data-testid="stHeader"] { background-color: #F9F9F9 !important; }
    .block-container { padding: 0 !important; max-width: 100% !important; margin: 0 !important; background-color: #F9F9F9 !important; }
    
    /* Force iframe to be light even before content loads */
    iframe { 
        border: none; 
        width: 100vw; 
        height: 100vh !important; 
        position: fixed; 
        top: 0; 
        left: 0; 
        z-index: 99999; 
        background-color: #F9F9F9 !important;
        color-scheme: light;
    }
</style>
""", unsafe_allow_html=True)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DASHBOARD_DIR = os.path.join(BASE_DIR, "ui_dashboard")
INDEX_DIR = os.path.join(BASE_DIR, "ui_index")
LOGIN_DIR = os.path.join(BASE_DIR, "ui_login")
CHATS_DIR = os.path.join(BASE_DIR, "ui_chats")

# App Routing state
if 'current_page' not in st.session_state:
    st.session_state.current_page = 'index'
if 'component_args' not in st.session_state:
    st.session_state.component_args = {}
# Track processed request IDs to prevent duplicate processing
if 'processed_request_ids' not in st.session_state:
    st.session_state.processed_request_ids = set()

# Serve the components based on state
if st.session_state.current_page == 'index':
    index_comp = components.declare_component("index_ui", path=INDEX_DIR)
    result = index_comp(key="index_view")
    if result:
        action = result.get('action')
        if action in ('go_dashboard', 'go_login'):
            st.session_state.current_page = 'login'
            st.rerun()
        elif action == 'auto_login':
            st.session_state.user_data = result.get('user')
            st.session_state.current_page = 'dashboard'
            st.rerun()

elif st.session_state.current_page == 'login':
    login_comp = components.declare_component("login_ui", path=LOGIN_DIR)
    result = login_comp(key="login_view")
    if result:
        action = result.get('action')
        if action == 'go_index':
            st.session_state.current_page = 'index'
            st.rerun()
        elif action == 'login':
            user_data = result.get('user')
            if user_data:
                st.session_state.user_data = user_data
                st.session_state.current_page = 'dashboard'
                st.rerun()

elif st.session_state.current_page == 'dashboard':
    dashboard_comp = components.declare_component("dashboard_ui", path=DASHBOARD_DIR)
    # Default paragraph to not block UI rendering loop
    if 'scoring_paragraph' not in st.session_state:
        st.session_state.scoring_paragraph = "Click 'Generate Paragraph' to load a new topic."
        
    comp_args = st.session_state.component_args.copy()
    comp_args['scoring_paragraph'] = st.session_state.scoring_paragraph
    if 'user_data' in st.session_state:
        comp_args['user_details'] = st.session_state.user_data
    
    result = dashboard_comp(key="dash_view", **comp_args)
    if st.session_state.component_args != {}:
        st.session_state.component_args = {}

    if result:
        action = result.get('action')
        request_id = result.get('request_id')

        # Skip if we already processed this exact request
        if request_id and request_id in st.session_state.processed_request_ids:
            pass  # Already processed — do nothing

        elif action == "generate_voice":
            text = result.get('text', '')
            lang = result.get('lang', 'English (US)')
            if text and request_id:
                st.session_state.processed_request_ids.add(request_id)
                
                lang_map = {
                    "English (US)": "en",
                    "English (UK)": "en",
                    "Spanish": "es",
                    "French": "fr",
                    "German": "de",
                    "Italian": "it",
                    "Portuguese": "pt",
                    "Mandarin": "zh",
                    "Japanese": "ja",
                    "Korean": "ko"
                }
                iso_lang = lang_map.get(lang, "en")
                
                user_data = st.session_state.get('user_data', {})
                voice_id = user_data.get('voice_id') if user_data.get('voice_id') else 'dCtAsXo1CxxIQ7K1C8ee'
                
                audio_iterator = client.text_to_speech.convert(
                    voice_id=voice_id,
                    model_id="eleven_multilingual_v2",
                    text=text,
                    language_code=iso_lang
                )
                
                
                audio_bytes = b"".join(list(audio_iterator)) if not isinstance(audio_iterator, bytes) else audio_iterator
                
                try:
                    play(audio_bytes)
                except Exception as e:
                    print("Local Host Playback Failed. Pushing straight to frontend. Error:", e)
                

                audio_b64 = base64.b64encode(audio_bytes).decode()
                st.session_state.component_args = {"audio_b64": audio_b64}
                st.rerun()

        elif action == "conversation_audio":
            audio_b64 = result.get('audio')
            mode = result.get('mode', 'Casual Chat')
            difficulty = result.get('difficulty', 'Intermediate')
            voice_name = result.get('voice', 'Bakari')
            uuid_mapping = {
                "Bakari": "74d27bc3",
                "Harel": "c8376c74",
                "Mei": "14a42c76",
                "Hao": "0d24591b",
                "Defne": "64ad5770"
            }
            voice_uuid = uuid_mapping.get(voice_name, "74d27bc3")
            if audio_b64 and request_id:
                st.session_state.processed_request_ids.add(request_id)
                audio_bytes = base64.b64decode(audio_b64)
                try:
                    transcript = aai.Transcriber(config=config).transcribe(audio_bytes)
                    if transcript and transcript.text:
                        history = result.get('history', [])
                        
                        system_prompt = f'''
                        You are a conversational AI acting as a partner in a language learning simulator.
                        Mode: {mode}
                        Difficulty: {difficulty}
                        Keep your responses concise, natural, and under 120 words.
                        '''
                        
                        messages = [{"role": "system", "content": system_prompt}]
                        for m in history:
                            messages.append({"role": m.get("role"), "content": m.get("content")})
                            
                        # Add current transcript
                        messages.append({"role": "user", "content": transcript.text})
                        
                        completion = groq_client.chat.completions.create(
                            model="llama-3.3-70b-versatile",
                            messages=messages,
                            temperature=1, max_completion_tokens=120
                        )
                        reply = completion.choices[0].message.content
                        response = requests.post(
                            "https://f.cluster.resemble.ai/synthesize",
                            headers={"Authorization":st.secrets["RESEMBLE_API_KEY"]},
                            json={"voice_uuid": voice_uuid, "data": reply}
                        )
                        b64_out = None
                        if response.status_code == 200:
                            data = response.json()
                            b64_str = data.get("audio_content", "")
                            if b64_str:
                                audio_out = base64.b64decode("".join(b64_str.split()))
                                b64_out = base64.b64encode(audio_out).decode()
                        try:
                            if st.session_state.get('user_data'):
                                chat_array = history + [
                                    {"role": "user", "content": transcript.text},
                                    {"role": "assistant", "content": reply}
                                ]
                                resp = requests.post("https://voicely-backend.vercel.app/create_chat", json={
                                    "chat": json.dumps(chat_array),
                                    "user_id": st.session_state.user_data.get("id")
                                })
                                
                        except:
                            pass
                        st.session_state.component_args = {"reply_text": reply, "audio_b64": b64_out, "user_transcript": transcript.text}
                        st.rerun()
                except Exception as e:
                    print("Conversation Error:", e)

        elif action == "score_pronunciation":
            audio_b64 = result.get('audio')
            if audio_b64 and request_id:
                st.session_state.processed_request_ids.add(request_id)
                audio_bytes = base64.b64decode(audio_b64)
                try:
                    transcript = aai.Transcriber(config=config).transcribe(audio_bytes)
                    if transcript and getattr(transcript, 'text', None):
                        score_prompt = f'''
                        You are a strict language evaluator.
                        Original Text: "{st.session_state.scoring_paragraph}"
                        User Said: "{transcript.text}"
                        
                        Give a score from 0-100 on these metrics.
                        OUTPUT STRICT JSON exactly like this:
                        {{"fluency": 85, "accuracy": 92, "intonation": 78, "rhythm": 88, "score": 86}}
                        '''
                        completion = groq_client.chat.completions.create(
                            model="llama-3.3-70b-versatile",
                            messages=[{"role": "user", "content": score_prompt}],
                            temperature=0, max_completion_tokens=150
                        )
                        json_str = completion.choices[0].message.content
                        try:
                            score_dict = json.loads(json_str)
                        except:
                            import re
                            match = re.search(r'\{.*?\}', json_str, re.DOTALL)
                            if match:
                                score_dict = json.loads(match.group(0))
                            else:
                                score_dict = {"fluency":0, "accuracy":0, "intonation":0, "rhythm":0, "score":0}
                        
                        st.session_state.component_args = {"scoring_results": score_dict}
                    else:
                        st.session_state.component_args = {"scoring_results": {"fluency":0, "accuracy":0, "intonation":0, "rhythm":0, "score":0, "error": True}}
                    st.rerun()
                except Exception as e:
                    print("Scoring Error:", e)

        elif action == "generate_paragraph":
            if request_id:
                st.session_state.processed_request_ids.add(request_id)
                try:
                    completion = groq_client.chat.completions.create(
                        model="llama-3.3-70b-versatile",
                        messages=[{"role": "user", "content": "Generate a very short 2-3 sentence paragraph about a random interesting topic. Return just the text without any quotes or preamble."}],
                        temperature=1, max_completion_tokens=120
                    )
                    st.session_state.scoring_paragraph = completion.choices[0].message.content.strip()
                except Exception:
                    st.session_state.scoring_paragraph = "The quick brown fox jumps over the lazy dog."
                
                st.session_state.component_args = {"scoring_paragraph": st.session_state.scoring_paragraph}
                st.rerun()

        elif action in ("upload_sample", "record_sample"):
            audio_b64 = result.get('audio')
            filename = result.get('filename', 'my_cloned_voice.webm' if action == 'record_sample' else 'uploaded_voice.wav')
            if audio_b64 and request_id:
                st.session_state.processed_request_ids.add(request_id)
                audio_bytes = base64.b64decode(audio_b64)
                print("Uploaded", filename)
                try:
                    temp_filepath = os.path.join(BASE_DIR, filename)
                    with open(temp_filepath, "wb") as f:
                        f.write(audio_bytes)
                        
                    with open(temp_filepath, "rb") as file_obj:
                        url = "https://api.elevenlabs.io/v1/voices/add"
                        headers = {"xi-api-key": API_KEY}
                        files_payload = {"files": file_obj}
                        data_payload = {"name": "my_cloned_voice"}
                        response = requests.post(url, headers=headers, files=files_payload, data=data_payload)
                    
                    voice_data = response.json()
                    print(voice_data)
                    voice_id = voice_data.get('voice_id')
                    print("Voice ID:", voice_id)
                    
                    if os.path.exists(temp_filepath):
                        os.remove(temp_filepath)
                        
                    if st.session_state.get('user_data') and voice_id:
                        requests.post("https://voicely-backend.vercel.app/voice_id", json={
                            "id": st.session_state.user_data.get("id"),
                            "voice_id": voice_id
                        })
                        st.session_state.user_data['voice_id'] = voice_id
                except Exception as e:
                    print("Upload Sample Error:", e)
                    
        elif action == "view_chat":
            st.session_state.viewing_chat = result.get('chat')
            st.session_state.current_page = 'chats'
            st.rerun()
            
        elif action == "signout":
            if request_id:
                st.session_state.processed_request_ids.add(request_id)
            for key in list(st.session_state.keys()):
                del st.session_state[key]
            st.rerun()

        # Keep the set from growing unbounded — trim to last 50 entries
        if len(st.session_state.processed_request_ids) > 50:
            st.session_state.processed_request_ids = set(list(st.session_state.processed_request_ids)[-25:])

elif st.session_state.current_page == 'chats':
    chats_comp = components.declare_component("chats_ui", path=CHATS_DIR)
    result = chats_comp(key="chats_view", chat_data=st.session_state.get("viewing_chat", "[]"))
    if result:
        if result.get("action") == "go_dashboard":
            st.session_state.current_page = 'dashboard'
            st.rerun()
