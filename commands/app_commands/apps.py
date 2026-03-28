# =========================================================
# ORION SYSTEM APP COMMANDS
# commands/app_commands/apps.py
# =========================================================

import subprocess
import os


# ---------------------------------------------------------
# 🔥 UNIVERSAL APP RUNNER
# (NO extra cmd window)
# ---------------------------------------------------------
def run(command, label):

    try:
        subprocess.Popen(
            command, shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
        )
        return f"Opening {label}"

    except Exception as e:
        return f"Failed to open {label}: {e}"


# ---------------------------------------------------------
# 🧠 SYSTEM APPS
# ---------------------------------------------------------


def open_notepad(t, q):
    return run("notepad", "Notepad")


def open_chrome(t, q):
    return run("start chrome", "Chrome")


def open_calculator(t, q):
    return run("calc", "Calculator")


def open_cmd(t, q):
    return run("start cmd", "Command Prompt")


def open_powershell(t, q):
    return run("start powershell", "PowerShell")


def open_vscode(t, q):
    return run("code", "VS Code")


def open_task_manager(t, q):
    return run("taskmgr", "Task Manager")


def open_control_panel(t, q):
    return run("control", "Control Panel")


def open_settings(t, q):
    return run("start ms-settings:", "Windows Settings")


def open_paint(t, q):
    return run("mspaint", "Paint")


def open_wordpad(t, q):
    return run("write", "WordPad")


def open_explorer(t, q):
    return run("explorer", "File Explorer")


def open_snipping_tool(t, q):
    return run("snippingtool", "Snipping Tool")


def open_camera(t, q):
    return run("start microsoft.windows.camera:", "Camera")


def open_store(t, q):
    return run("start ms-windows-store:", "Microsoft Store")


def open_terminal(t, q):
    return run("wt", "Windows Terminal")


def open_registry(t, q):
    return run("regedit", "Registry Editor")


def open_services(t, q):
    return run("services.msc", "Services")


def open_device_manager(t, q):
    return run("devmgmt.msc", "Device Manager")


def open_disk_manager(t, q):
    return run("diskmgmt.msc", "Disk Management")


def open_event_viewer(t, q):
    return run("eventvwr", "Event Viewer")


# ---------------------------------------------------------
# 🔥 COMMAND REGISTRATION
# ---------------------------------------------------------
def register(register_command):

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
