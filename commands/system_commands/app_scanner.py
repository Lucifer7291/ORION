# =========================================================
# ORION APP SCANNER SYSTEM
# commands/system_commands/app_scanner.py
# =========================================================

import os
import threading
import time

SCAN_STATE = {"running": False, "progress": 0, "total": 0, "found": []}


# ---------------------------------------------------------
# 🔎 SIMULATED APP SCAN
# ---------------------------------------------------------
def scan_worker():

    SCAN_STATE["running"] = True
    SCAN_STATE["progress"] = 0
    SCAN_STATE["found"] = []

    paths = [
        r"C:\Program Files",
        r"C:\Program Files (x86)",
        os.path.expandvars(r"%LOCALAPPDATA%\Programs"),
    ]

    files = []

    for path in paths:
        if os.path.exists(path):
            for root, _, filenames in os.walk(path):
                for f in filenames:
                    if f.endswith(".exe"):
                        files.append(os.path.join(root, f))

    SCAN_STATE["total"] = len(files)

    for i, file in enumerate(files):

        SCAN_STATE["found"].append(file)
        SCAN_STATE["progress"] = i + 1

        time.sleep(0.002)  # smooth progress update

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
# REGISTER
# ---------------------------------------------------------
def register(register_command):

    register_command("scan_apps", scan_apps)
    register_command("scan_progress", scan_progress)
    register_command("scan_status", scan_status)
