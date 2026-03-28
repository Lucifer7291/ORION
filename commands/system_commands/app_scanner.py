# =========================================================
# ORION APP SCANNER SYSTEM
# commands/system_commands/app_scanner.py
# =========================================================

import os
import json
import threading

APPS_FILE = "memory/apps.json"

SCAN_STATE = {
    "running": False,
    "progress": 0,
    "total": 0,
    "found": [],
}


# ---------------------------------------------------------
# 🔥 SAVE APPS DATABASE
# ---------------------------------------------------------
def save_apps(apps_dict):
    os.makedirs("memory", exist_ok=True)

    with open(APPS_FILE, "w", encoding="utf-8") as f:
        json.dump(apps_dict, f, indent=4)


# ---------------------------------------------------------
# 🔥 NORMALIZE APP NAME
# ---------------------------------------------------------
def normalize_app_name(filename: str):
    name = filename.lower().strip()

    if name.endswith(".exe"):
        name = name[:-4]

    # clean separators
    name = name.replace("_", " ")
    name = name.replace("-", " ")

    # normalize spaces
    name = " ".join(name.split())

    return name


# ---------------------------------------------------------
# 🔎 REAL APP SCAN
# ---------------------------------------------------------
def scan_worker():
    SCAN_STATE["running"] = True
    SCAN_STATE["progress"] = 0
    SCAN_STATE["total"] = 0
    SCAN_STATE["found"] = []

    paths = [
        r"C:\Program Files",
        r"C:\Program Files (x86)",
        os.path.expandvars(r"%LOCALAPPDATA%\Programs"),
    ]

    files = []

    # first collect all exe files
    for path in paths:
        if os.path.exists(path):
            for root, _, filenames in os.walk(path):
                for filename in filenames:
                    if filename.lower().endswith(".exe"):
                        full_path = os.path.join(root, filename)
                        files.append((filename, full_path))

    SCAN_STATE["total"] = len(files)

    apps_dict = {}

    for i, (filename, full_path) in enumerate(files, start=1):
        app_name = normalize_app_name(filename)

        # keep first discovered path for a given app name
        if app_name not in apps_dict:
            apps_dict[app_name] = full_path
            SCAN_STATE["found"].append(app_name)

        SCAN_STATE["progress"] = i

    save_apps(apps_dict)
    SCAN_STATE["running"] = False


# ---------------------------------------------------------
# 🚀 START SCAN
# ---------------------------------------------------------
def scan_apps(t, q):
    if SCAN_STATE["running"]:
        return "Scan already running."

    thread = threading.Thread(target=scan_worker, daemon=True)
    thread.start()

    return "Application scan started."


# ---------------------------------------------------------
# 📊 SCAN PROGRESS
# ---------------------------------------------------------
def scan_progress(t, q):
    if SCAN_STATE["total"] == 0:
        return "No scan started."

    percent = int((SCAN_STATE["progress"] / SCAN_STATE["total"]) * 100)

    return f"Scan Progress: {percent}% ({SCAN_STATE['progress']}/{SCAN_STATE['total']})"


# ---------------------------------------------------------
# 📡 SCAN STATUS
# ---------------------------------------------------------
def scan_status(t, q):
    if SCAN_STATE["running"]:
        return "Scanning in progress..."

    if SCAN_STATE["total"] > 0:
        return f"Scan complete. {len(SCAN_STATE['found'])} apps discovered."

    return "Scanner idle."


# ---------------------------------------------------------
# 📦 SHOW SCANNED APP COUNT
# ---------------------------------------------------------
def scanned_apps_count(t, q):
    if not os.path.exists(APPS_FILE):
        return "No apps database found."

    try:
        with open(APPS_FILE, "r", encoding="utf-8") as f:
            apps = json.load(f)
        return f"{len(apps)} apps indexed."
    except Exception as e:
        return f"Failed to read apps database: {e}"


# ---------------------------------------------------------
# REGISTER
# ---------------------------------------------------------
def register(register_command):
    register_command("scan_apps", scan_apps)
    register_command("scan_progress", scan_progress)
    register_command("scan_status", scan_status)
    register_command("apps_count", scanned_apps_count)
