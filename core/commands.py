import webbrowser
import os
from datetime import datetime
import config


# 🔥 Helper: check if any keyword exists in text
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

    # 🌐 ─── BROWSER COMMANDS ───────────────────────
    if contains(text, ["youtube"]):
        webbrowser.open("https://youtube.com")
        return "Opening YouTube"

    if contains(text, ["google"]):
        webbrowser.open("https://google.com")
        return "Opening Google"

    if contains(text, ["github"]):
        webbrowser.open("https://github.com")
        return "Opening GitHub"

    # 🔍 Smart search (natural language)
    if "search" in text:
        query = text.split("search")[-1].strip()

        if not query:
            return "What should I search?"

        url = f"https://www.google.com/search?q={query}"
        webbrowser.open(url)
        return f"Searching for {query}"

    # 💻 ─── SYSTEM APPS ────────────────────────────
    if contains(text, ["notepad"]):
        os.system("notepad")
        return "Opening Notepad"

    if contains(text, ["calculator", "calc"]):
        os.system("calc")
        return "Opening Calculator"

    if contains(text, ["cmd", "command prompt"]):
        os.system("start cmd")
        return "Opening Command Prompt"

    # 📁 ─── FILE EXPLORER ─────────────────────────
    if contains(text, ["downloads"]):
        os.startfile(os.path.expanduser("~/Downloads"))
        return "Opening Downloads"

    if contains(text, ["documents"]):
        os.startfile(os.path.expanduser("~/Documents"))
        return "Opening Documents"

    # 🔊 ─── SYSTEM CONTROL ────────────────────────
    if contains(text, ["shutdown"]):
        os.system("shutdown /s /t 5")
        return "Shutting down in 5 seconds"

    if contains(text, ["restart"]):
        os.system("shutdown /r /t 5")
        return "Restarting in 5 seconds"

    # ⏰ ─── TIME / DATE ───────────────────────────
    if contains(text, ["time"]):
        return datetime.now().strftime("Current time: %H:%M")

    if contains(text, ["date"]):
        return datetime.now().strftime("Today's date: %Y-%m-%d")

    # ❌ No command matched
    return None
