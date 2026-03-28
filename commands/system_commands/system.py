import os
from datetime import datetime


def shutdown(t, q):
    os.system("shutdown /s /t 5")
    return "Shutting down"


def restart(t, q):
    os.system("shutdown /r /t 5")
    return "Restarting"


def lock(t, q):
    os.system("rundll32.exe user32.dll,LockWorkStation")
    return "System Locked"


def sleep(t, q):
    os.system("rundll32.exe powrprof.dll,SetSuspendState 0,1,0")
    return "Sleeping"


def logout(t, q):
    os.system("shutdown -l")
    return "Logging out"


def open_downloads(t, q):
    os.startfile(os.path.expanduser("~/Downloads"))
    return "Opening Downloads"


def open_documents(t, q):
    os.startfile(os.path.expanduser("~/Documents"))
    return "Opening Documents"


def open_desktop(t, q):
    os.startfile(os.path.expanduser("~/Desktop"))
    return "Opening Desktop"


def show_time(t, q):
    return datetime.now().strftime("Time: %H:%M")


def show_date(t, q):
    return datetime.now().strftime("Date: %Y-%m-%d")


def clear_screen(t, q):
    os.system("cls")
    return "Screen Cleared"


def register(register_command):

    register_command("shutdown", shutdown)
    register_command("restart", restart)
    register_command("lock", lock)
    register_command("sleep", sleep)
    register_command("logout", logout)
    register_command("open_downloads", open_downloads)
    register_command("open_documents", open_documents)
    register_command("open_desktop", open_desktop)
    register_command("time", show_time)
    register_command("date", show_date)
    register_command("clear", clear_screen)
