import webbrowser
import os
import re
from datetime import datetime
import config


# =========================================================
# 🔥 GLOBAL STATE (IMPORTANT)
# =========================================================
if not hasattr(config, "LAST_VOLUME_ACTION"):
    config.LAST_VOLUME_ACTION = None


# =========================================================
# 🔥 Helper: check tool existence
# =========================================================
def tool_exists(tool):
    return any(
        os.access(os.path.join(path, tool), os.X_OK)
        for path in os.environ["PATH"].split(os.pathsep)
    )


# =========================================================
# 🔥 Extract search query
# =========================================================
def extract_query(text):
    words = ["search", "find", "look up", "search for"]
    for w in words:
        if w in text:
            return text.split(w)[-1].strip()
    return ""


# =========================================================
# 🔥 Extract number
# =========================================================
def extract_number(text, default=10):
    match = re.search(r"\d+", text)
    return int(match.group()) if match else default


# =========================================================
# 🔥 MAIN INTENT HANDLER
# =========================================================
def handle_intent(intent, text, last_query=None):

    # =====================================================
    # 🔥 "MORE" COMMAND (STATEFUL)
    # =====================================================
    if text in ["more", "increase more", "decrease more"]:
        if not tool_exists("nircmd.exe"):
            return "Install NirCmd to control volume."

        if config.LAST_VOLUME_ACTION == "up":
            os.system(f"nircmd changesysvolume {10 * 655}")
            return "Volume increased by 10"

        elif config.LAST_VOLUME_ACTION == "down":
            os.system(f"nircmd changesysvolume -{10 * 655}")
            return "Volume decreased by 10"

        return "Nothing to repeat."

    # =====================================================
    # 🔥 COMBINED YOUTUBE SEARCH (NO DOUBLE TAB)
    # =====================================================
    if "youtube" in text and "search" in text:
        query = extract_query(text)

        if query in ["it", "this", "that"] and last_query:
            query = last_query

        if not query:
            return "What should I search on YouTube?"

        webbrowser.open(
            f"https://www.youtube.com/results?search_query={query}")
        return f"Searching YouTube for {query}"

    # =====================================================
    # 🔍 GOOGLE SEARCH
    # =====================================================
    if intent == "search":
        query = extract_query(text)

        if query in ["it", "this", "that"] and last_query:
            query = last_query

        if not query:
            return "What should I search?"

        webbrowser.open(f"https://www.google.com/search?q={query}")
        return f"Searching for {query}"

    # =====================================================
    # 🌐 WEB OPEN (STRICT MATCH)
    # =====================================================
    if intent == "open_youtube":
        webbrowser.open("https://youtube.com")
        return "Opening YouTube"

    if intent == "open_google":
        webbrowser.open("https://google.com")
        return "Opening Google"

    if intent == "open_github":
        webbrowser.open("https://github.com")
        return "Opening GitHub"

    if intent == "open_stackoverflow":
        webbrowser.open("https://stackoverflow.com")
        return "Opening StackOverflow"

    # =====================================================
    # 💻 SYSTEM APPS (FIXED CMD BUG)
    # =====================================================
    if intent == "open_cmd":
        os.system('start "" cmd')
        return "Opening Command Prompt"

    if intent == "open_chrome":
        # ✅ FIX: no accidental cmd trigger
        os.system('start "" chrome')
        return "Opening Chrome"

    if intent == "open_notepad":
        os.system("notepad")
        return "Opening Notepad"

    if intent == "open_calculator":
        os.system("calc")
        return "Opening Calculator"

    if intent == "open_task_manager":
        os.system("taskmgr")
        return "Opening Task Manager"

    if intent == "open_control_panel":
        os.system("control")
        return "Opening Control Panel"

    # =====================================================
    # 📁 FILE SYSTEM
    # =====================================================
    if intent == "open_downloads":
        os.startfile(os.path.expanduser("~/Downloads"))
        return "Opening Downloads"

    if intent == "open_documents":
        os.startfile(os.path.expanduser("~/Documents"))
        return "Opening Documents"

    if intent == "open_desktop":
        os.startfile(os.path.expanduser("~/Desktop"))
        return "Opening Desktop"

    # =====================================================
    # 🔊 SYSTEM CONTROL
    # =====================================================
    if intent == "shutdown":
        os.system("shutdown /s /t 5")
        return "Shutting down"

    if intent == "restart":
        os.system("shutdown /r /t 5")
        return "Restarting"

    if intent == "lock":
        os.system("rundll32.exe user32.dll,LockWorkStation")
        return "Locking system"

    # =====================================================
    # 🔊 VOLUME CONTROL (FIXED + STATEFUL)
    # =====================================================
    if intent in ["volume_up", "volume_down", "mute"]:

        if not tool_exists("nircmd.exe"):
            return "Install NirCmd to control volume."

        # 🔥 special keywords
        if "max" in text:
            os.system("nircmd setsysvolume 65535")
            config.LAST_VOLUME_ACTION = "up"
            return "Max volume"

        if "zero" in text or "minimum" in text:
            os.system("nircmd setsysvolume 0")
            config.LAST_VOLUME_ACTION = "down"
            return "Volume set to 0"

        if "unmute" in text:
            os.system("nircmd mutesysvolume 0")
            return "Unmuted"

        if intent == "mute":
            os.system("nircmd mutesysvolume 1")
            return "Muted"

        amount = extract_number(text)

        # ✅ FIX: correct direction
        if intent == "volume_up":
            os.system(f"nircmd changesysvolume {amount * 655}")
            config.LAST_VOLUME_ACTION = "up"
            return f"Volume increased by {amount}"

        if intent == "volume_down":
            os.system(f"nircmd changesysvolume -{amount * 655}")
            config.LAST_VOLUME_ACTION = "down"
            return f"Volume decreased by {amount}"

    # =====================================================
    # ⏰ TIME / DATE
    # =====================================================
    if intent == "time":
        return datetime.now().strftime("Current time: %H:%M")

    if intent == "date":
        return datetime.now().strftime("Today's date: %Y-%m-%d")

    return None


# =========================================================
# 🔥 FALLBACK NLP
# =========================================================
def fallback_nlp(text, last_query=None):

    # YouTube search fallback
    if "youtube" in text and "search" in text:
        query = extract_query(text)

        if query in ["it", "this", "that"] and last_query:
            query = last_query

        webbrowser.open(
            f"https://www.youtube.com/results?search_query={query}")
        return f"Searching YouTube for {query}"

    # basic search fallback
    if text.startswith("search "):
        query = text.replace("search", "").strip()

        if query in ["it", "this", "that"] and last_query:
            query = last_query

        webbrowser.open(f"https://www.google.com/search?q={query}")
        return f"Searching for {query}"

    return None


# =========================================================
# 🔥 MAIN EXECUTOR
# =========================================================
def execute_command(text, intent=None, last_query=None):
    text = text.lower().strip()

    # AI MODE
    if "enable ai" in text:
        config.AI_MODE = True
        return "AI mode enabled"

    if "disable ai" in text:
        config.AI_MODE = False
        return "AI mode disabled"

    # EXECUTION
    if intent:
        result = handle_intent(intent, text, last_query)
        if result:
            return result

    return fallback_nlp(text, last_query)
