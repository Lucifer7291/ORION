import webbrowser
import os
from datetime import datetime
import config


# 🔥 Intent → Action Mapping
def handle_intent(intent, text):

    # 🌐 WEB
    if intent == "open_youtube":
        webbrowser.open("https://youtube.com")
        return "Opening YouTube"

    if intent == "open_google":
        webbrowser.open("https://google.com")
        return "Opening Google"

    if intent == "open_github":
        webbrowser.open("https://github.com")
        return "Opening GitHub"

    # 🔍 SEARCH (dynamic)
    if intent == "search":
        # extract query after keywords
        words = ["search", "find", "look up", "search for"]
        query = text

        for w in words:
            if w in text:
                query = text.split(w)[-1].strip()

        if not query:
            return "What should I search?"

        webbrowser.open(f"https://www.google.com/search?q={query}")
        return f"Searching for {query}"

    # 💻 SYSTEM APPS
    if intent == "open_notepad":
        os.system("notepad")
        return "Opening Notepad"

    if intent == "open_calculator":
        os.system("calc")
        return "Opening Calculator"

    if intent == "open_cmd":
        os.system("start cmd")
        return "Opening Command Prompt"

    if intent == "open_vscode":
        try:
            os.system("code")
            return "Opening VS Code"
        except:
            return "VS Code not found"

    if intent == "open_chrome":
        try:
            os.system("start chrome")
            return "Opening Chrome"
        except:
            return "Chrome not found"

    # 📁 FILES
    if intent == "open_downloads":
        os.startfile(os.path.expanduser("~/Downloads"))
        return "Opening Downloads"

    if intent == "open_documents":
        os.startfile(os.path.expanduser("~/Documents"))
        return "Opening Documents"

    # 🔊 SYSTEM CONTROL
    if intent == "shutdown":
        os.system("shutdown /s /t 5")
        return "Shutting down in 5 seconds"

    if intent == "restart":
        os.system("shutdown /r /t 5")
        return "Restarting in 5 seconds"

    # ⏰ TIME / DATE
    if intent == "time":
        return datetime.now().strftime("Current time: %H:%M")

    if intent == "date":
        return datetime.now().strftime("Today's date: %Y-%m-%d")

    return None


# 🔥 FALLBACK NLP (if intent not detected)
def fallback_nlp(text):

    # very loose understanding
    if "youtube" in text:
        webbrowser.open("https://youtube.com")
        return "Opening YouTube"

    if "google" in text:
        webbrowser.open("https://google.com")
        return "Opening Google"

    return None


# 🔥 MAIN COMMAND FUNCTION
def execute_command(text, intent=None):
    text = text.lower().strip()

    # 🔥 AI MODE CONTROL (still direct)
    if "enable ai" in text:
        config.AI_MODE = True
        return "AI mode enabled"

    if "disable ai" in text:
        config.AI_MODE = False
        return "AI mode disabled"

    # 🔥 1. Try intent-based execution
    if intent:
        result = handle_intent(intent, text)
        if result:
            return result

    # 🔥 2. Fallback NLP
    return fallback_nlp(text)
