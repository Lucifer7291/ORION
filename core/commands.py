import webbrowser
import os
from datetime import datetime
import config


# 🔥 Helper: safer keyword matching
def contains(text, keywords):
    return any(word in text for word in keywords)


def execute_command(text):
    text = text.lower().strip()

    # 🔥 ─── AI MODE CONTROL ─────────────────────────
    if contains(text, ["enable ai", "turn on ai", "start ai"]):
        config.AI_MODE = True
        return "AI mode enabled"

    if contains(text, ["disable ai", "turn off ai", "stop ai"]):
        config.AI_MODE = False
        return "AI mode disabled"

    # 🌐 ─── BROWSER COMMANDS (STRICT MATCH) ─────────
    if contains(text, ["open youtube", "start youtube", "launch youtube"]):
        webbrowser.open("https://youtube.com")
        return "Opening YouTube"

    if contains(text, ["open google", "start google", "launch google"]):
        webbrowser.open("https://google.com")
        return "Opening Google"

    if contains(text, ["open github", "start github"]):
        webbrowser.open("https://github.com")
        return "Opening GitHub"

    # 🔍 SMART SEARCH
    if "search" in text:
        query = text.split("search")[-1].strip()

        if not query:
            return "What should I search?"

        webbrowser.open(f"https://www.google.com/search?q={query}")
        return f"Searching for {query}"

    # 💻 ─── SYSTEM APPS ────────────────────────────
    if contains(text, ["open notepad", "start notepad"]):
        os.system("notepad")
        return "Opening Notepad"

    if contains(text, ["open calculator", "start calculator", "calc"]):
        os.system("calc")
        return "Opening Calculator"

    if contains(text, ["open cmd", "command prompt"]):
        os.system("start cmd")
        return "Opening Command Prompt"

    if contains(text, ["open vscode", "visual studio code"]):
        try:
            os.system("code")
            return "Opening VS Code"
        except:
            return "VS Code not found"

    if contains(text, ["open chrome", "start chrome"]):
        try:
            os.system("start chrome")
            return "Opening Chrome"
        except:
            return "Chrome not found"

    # 📁 ─── FILE EXPLORER ─────────────────────────
    if contains(text, ["open downloads", "show downloads"]):
        os.startfile(os.path.expanduser("~/Downloads"))
        return "Opening Downloads"

    if contains(text, ["open documents", "show documents"]):
        os.startfile(os.path.expanduser("~/Documents"))
        return "Opening Documents"

    # 🔊 ─── SYSTEM CONTROL ────────────────────────
    if contains(text, ["shutdown pc", "turn off computer", "power off"]):
        os.system("shutdown /s /t 5")
        return "Shutting down in 5 seconds"

    if contains(text, ["restart pc", "reboot system"]):
        os.system("shutdown /r /t 5")
        return "Restarting in 5 seconds"

    # ⏰ ─── TIME / DATE ───────────────────────────
    if contains(text, ["time", "current time"]):
        return datetime.now().strftime("Current time: %H:%M")

    if contains(text, ["date", "today date"]):
        return datetime.now().strftime("Today's date: %Y-%m-%d")

    # ❌ No command matched
    return None
