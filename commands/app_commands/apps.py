# =========================================================
# ORION SYSTEM APP COMMANDS
# commands/app_commands/apps.py
# =========================================================

import subprocess
import json
import os
import re
import time
import psutil
import webbrowser
from difflib import get_close_matches


APPS_FILE = "memory/apps.json"

APP_ALIASES = {
    "vs code": "code",
    "vscode": "code",
    "visual studio code": "code",
    "google chrome": "chrome",
    "chrome browser": "chrome",
    "command prompt": "cmd",
    "smart connect": "smartconnect",
}

# Map of common app name keywords -> process .exe names
# Used for closing apps by name even if never opened via ORION
KNOWN_PROCESSES = {
    "chrome":           "chrome.exe",
    "firefox":          "firefox.exe",
    "edge":             "msedge.exe",
    "brave":            "brave.exe",
    "opera":            "opera.exe",
    "notepad":          "notepad.exe",
    "calculator":       "CalculatorApp.exe",
    "cmd":              "cmd.exe",
    "command prompt":   "cmd.exe",
    "powershell":       "powershell.exe",
    "vscode":           "Code.exe",
    "code":             "Code.exe",
    "visual studio code": "Code.exe",
    "task manager":     "Taskmgr.exe",
    "taskmgr":          "Taskmgr.exe",
    "control panel":    "control.exe",
    "paint":            "mspaint.exe",
    "wordpad":          "wordpad.exe",
    "explorer":         "explorer.exe",
    "file explorer":    "explorer.exe",
    "snipping tool":    "SnippingTool.exe",
    "camera":           "WindowsCamera.exe",
    "store":            "WinStore.App.exe",
    "terminal":         "WindowsTerminal.exe",
    "spotify":          "Spotify.exe",
    "discord":          "Discord.exe",
    "vlc":              "vlc.exe",
    "steam":            "steam.exe",
    "word":             "WINWORD.EXE",
    "excel":            "EXCEL.EXE",
    "powerpoint":       "POWERPNT.EXE",
    "outlook":          "OUTLOOK.EXE",
    "teams":            "Teams.exe",
    "zoom":             "Zoom.exe",
    "obs":              "obs64.exe",
    "postman":          "Postman.exe",
}


# ---------------------------------------------------------
# CONTEXT HELPER
# ---------------------------------------------------------
def get_context(obj):
    return obj if hasattr(obj, "remember_target") else None


# ---------------------------------------------------------
# NORMALIZE APP NAME
# ---------------------------------------------------------
def normalize_name(text):
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", " ", text)
    text = text.replace("_", " ").replace("-", " ")
    text = re.sub(r"\s+", " ", text)

    removable = [
        "open", "launch", "start", "run", "close", "stop",
        "kill", "end", "please", "for me", "app", "application", "the",
    ]

    words = [w for w in text.split() if w not in removable]
    text = " ".join(words).strip()

    if text in APP_ALIASES:
        text = APP_ALIASES[text]

    return text


# ---------------------------------------------------------
# UNIVERSAL APP RUNNER
# ---------------------------------------------------------
def run(command, label, context=None, target_name=None, process_name=None, target_type="app"):
    try:
        subprocess.Popen(
            command,
            shell=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )

        if context and target_name:
            if process_name and not process_name.lower().endswith(".exe"):
                process_name = process_name + ".exe"

            context.remember_target(
                name=target_name,
                target_type=target_type,
                process_name=process_name,
            )

        return f"Opening {label}"

    except Exception as e:
        return f"Failed to open {label}: {e}"


def run_path(path, label, context=None, target_name=None):
    try:
        if not os.path.exists(path):
            return f"Path not found for {label}"

        os.startfile(path)

        if context and target_name:
            process = os.path.basename(path).lower()

            context.remember_target(
                name=target_name,
                target_type="app",
                process_name=process,
            )

        return f"Opening {label}"

    except Exception as e:
        return f"Failed to open {label}: {e}"


# ---------------------------------------------------------
# LOAD SCANNED APPS
# ---------------------------------------------------------
def load_scanned_apps():
    if not os.path.exists(APPS_FILE):
        return {}

    try:
        with open(APPS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}


# ---------------------------------------------------------
# MATCH DYNAMIC APP
# ---------------------------------------------------------
def resolve_dynamic_app(app_name, apps):
    app_name = normalize_name(app_name)

    if app_name in apps:
        return app_name, apps[app_name]

    for name, path in apps.items():
        if app_name in name or name in app_name:
            return name, path

    matches = get_close_matches(app_name, list(apps.keys()), n=1, cutoff=0.65)
    if matches:
        best = matches[0]
        return best, apps[best]

    return None, None


# ---------------------------------------------------------
# SYSTEM APPS
# ---------------------------------------------------------
def open_notepad(t, q):
    context = get_context(q)
    return run("notepad", "Notepad", context, "notepad", "notepad.exe")


def open_chrome(t, q):
    context = get_context(q)
    return run("start chrome", "Chrome", context, "chrome", "chrome.exe")


def open_calculator(t, q):
    context = get_context(q)
    return run("calc", "Calculator", context, "calculator", "CalculatorApp.exe")


def open_cmd(t, q):
    context = get_context(q)
    return run("start cmd", "Command Prompt", context, "command prompt", "cmd.exe")


def open_powershell(t, q):
    context = get_context(q)
    return run("start powershell", "PowerShell", context, "powershell", "powershell.exe")


def open_vscode(t, q):
    context = get_context(q)
    return run("code", "VS Code", context, "vscode", "Code.exe")


def open_task_manager(t, q):
    context = get_context(q)
    return run("taskmgr", "Task Manager", context, "task manager", "Taskmgr.exe", "system_tool")


def open_control_panel(t, q):
    context = get_context(q)
    return run("control", "Control Panel", context, "control panel", "control.exe", "system_tool")


def open_settings(t, q):
    context = get_context(q)
    return run("start ms-settings:", "Windows Settings", context, "settings", "SystemSettings.exe", "system_tool")


def open_paint(t, q):
    context = get_context(q)
    return run("mspaint", "Paint", context, "paint", "mspaint.exe")


def open_wordpad(t, q):
    context = get_context(q)
    return run("write", "WordPad", context, "wordpad", "wordpad.exe")


def open_explorer(t, q):
    context = get_context(q)
    return run("explorer", "File Explorer", context, "explorer", "explorer.exe")


def open_snipping_tool(t, q):
    context = get_context(q)
    return run("snippingtool", "Snipping Tool", context, "snipping tool", "SnippingTool.exe")


def open_camera(t, q):
    context = get_context(q)
    return run("start microsoft.windows.camera:", "Camera", context, "camera", "WindowsCamera.exe")


def open_store(t, q):
    context = get_context(q)
    return run("start ms-windows-store:", "Microsoft Store", context, "store", "WinStore.App.exe")


def open_terminal(t, q):
    context = get_context(q)
    return run("wt", "Windows Terminal", context, "terminal", "WindowsTerminal.exe")


def open_registry(t, q):
    context = get_context(q)
    return run("regedit", "Registry Editor", context, "registry editor", "regedit.exe", "system_tool")


def open_services(t, q):
    context = get_context(q)
    return run("services.msc", "Services", context, "services", "mmc.exe", "system_tool")


def open_device_manager(t, q):
    context = get_context(q)
    return run("devmgmt.msc", "Device Manager", context, "device manager", "mmc.exe", "system_tool")


def open_disk_manager(t, q):
    context = get_context(q)
    return run("diskmgmt.msc", "Disk Management", context, "disk management", "mmc.exe", "system_tool")


def open_event_viewer(t, q):
    context = get_context(q)
    return run("eventvwr", "Event Viewer", context, "event viewer", "mmc.exe", "system_tool")


# ---------------------------------------------------------
# WEB COMMANDS
# ---------------------------------------------------------
def open_youtube(t, q):
    context = get_context(q)
    webbrowser.open("https://www.youtube.com")
    if context:
        context.remember_target(name="youtube", target_type="web_tab",
                                process_name="chrome.exe", url="https://www.youtube.com")
    return "Opening YouTube"


def open_google(t, q):
    context = get_context(q)
    webbrowser.open("https://www.google.com")
    if context:
        context.remember_target(name="google", target_type="web_tab",
                                process_name="chrome.exe", url="https://www.google.com")
    return "Opening Google"


def open_github(t, q):
    context = get_context(q)
    webbrowser.open("https://www.github.com")
    if context:
        context.remember_target(name="github", target_type="web_tab",
                                process_name="chrome.exe", url="https://www.github.com")
    return "Opening GitHub"


def open_stackoverflow(t, q):
    context = get_context(q)
    webbrowser.open("https://stackoverflow.com")
    if context:
        context.remember_target(name="stackoverflow", target_type="web_tab",
                                process_name="chrome.exe", url="https://stackoverflow.com")
    return "Opening Stack Overflow"


# ---------------------------------------------------------
# DYNAMIC APP LAUNCHER
# ---------------------------------------------------------
def open_dynamic_app(text, q):
    context = get_context(q)
    apps = load_scanned_apps()

    if not apps:
        return "No scanned apps found. Run 'scan apps' first."

    app_name = normalize_name(text)

    if not app_name:
        return "Which app should I open?"

    matched_name, path = resolve_dynamic_app(app_name, apps)

    if matched_name and path:
        return run_path(path, matched_name, context, matched_name)

    return f"Could not find app: {app_name}"


# ---------------------------------------------------------
# CLOSE HELPERS
# ---------------------------------------------------------
def _find_running_process(name):
    name = name.lower().strip()
    for proc in psutil.process_iter(["name"]):
        try:
            proc_name = (proc.info["name"] or "").lower()
            proc_clean = (
                proc_name
                .replace(".exe", "")
                .replace("_", " ")
                .replace("-", " ")
                .lower()
            )
            if name in proc_clean or proc_clean in name:
                return proc.info["name"]
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            continue
    return None


def _find_running_browser():
    known_browsers = [
        "chrome.exe", "firefox.exe", "msedge.exe", "opera.exe", "brave.exe"
    ]
    try:
        running = {
            p.info["name"].lower()
            for p in psutil.process_iter(["name"])
            if p.info["name"]
        }
        for browser in known_browsers:
            if browser.lower() in running:
                return browser
    except Exception:
        pass
    return None


def _kill_process(name, process_name, context=None):
    try:
        result = subprocess.run(
            f'taskkill /IM "{process_name}" /F',
            shell=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        if result.returncode == 0:
            if context:
                context.remember_closed_target(
                    name=name,
                    target_type="app",
                    process_name=process_name,
                )
            return f"Closed {name}"
        return f"Could not close {name}. It may already be closed."
    except Exception as e:
        return f"Error closing {name}: {e}"


# ---------------------------------------------------------
# CLOSE APP BY NAME — "close chrome", "close spotify" etc.
# ---------------------------------------------------------
def close_app(text, q):
    context = get_context(q)
    app_name = normalize_name(text)

    if not app_name:
        return "Which app should I close?"

    # 1. Check known process map first
    process_name = None
    for key, exe in KNOWN_PROCESSES.items():
        if app_name in key or key in app_name:
            process_name = exe
            break

    # 2. Fuzzy match on known processes
    if not process_name:
        matches = get_close_matches(app_name, list(
            KNOWN_PROCESSES.keys()), n=1, cutoff=0.6)
        if matches:
            process_name = KNOWN_PROCESSES[matches[0]]

    # 3. Scan live processes as last resort
    if not process_name:
        process_name = _find_running_process(app_name)

    if process_name:
        return _kill_process(app_name, process_name, context)

    return f"Could not find a running process for: {app_name}"


# ---------------------------------------------------------
# CLOSE LAST (close it / close that)
# ---------------------------------------------------------
def close_last_app(text, q):
    context = get_context(q)

    if not context:
        return "Context system not available."

    target = context.get_last_target()

    if not target:
        return "I don't remember what I last opened."

    name = target.get("name", "")
    target_type = target.get("type", "app")
    process_name = target.get("process_name", "")

    # web tab — send Ctrl+W to the browser
    if target_type == "web_tab":
        from main import close_browser_tab
        browser = process_name or "chrome.exe"
        success = close_browser_tab(browser)
        if success:
            context.remember_closed_target(
                name=name,
                target_type=target_type,
                process_name=browser,
                url=target.get("url"),
            )
            return f"Closed {name} tab"
        return f"Could not close {name} tab"

    # regular app
    if process_name:
        return _kill_process(name, process_name, context)

    return f"Don't know how to close {name}"


# ---------------------------------------------------------
# COMMAND REGISTRATION
# ---------------------------------------------------------
def register(register_command):

    # Built-in apps
    register_command("open_notepad", open_notepad)
    register_command("open_chrome", open_chrome)
    register_command("open_calculator", open_calculator)
    register_command("open_cmd", open_cmd)
    register_command("open_powershell", open_powershell)
    register_command("open_vscode", open_vscode)
    register_command("open_task_manager", open_task_manager)
    register_command("open_control_panel", open_control_panel)
    register_command("open_settings", open_settings)
    register_command("open_paint", open_paint)
    register_command("open_wordpad", open_wordpad)
    register_command("open_explorer", open_explorer)
    register_command("open_snipping_tool", open_snipping_tool)
    register_command("open_camera", open_camera)
    register_command("open_store", open_store)
    register_command("open_terminal", open_terminal)
    register_command("open_registry", open_registry)
    register_command("open_services", open_services)
    register_command("open_device_manager", open_device_manager)
    register_command("open_disk_manager", open_disk_manager)
    register_command("open_event_viewer", open_event_viewer)

    # Web commands
    register_command("open_youtube", open_youtube)
    register_command("open_google", open_google)
    register_command("open_github", open_github)
    register_command("open_stackoverflow", open_stackoverflow)

    # Dynamic + close
    register_command("open_app", open_dynamic_app)
    register_command("close_app", close_app)
    register_command("close_it", close_last_app)
