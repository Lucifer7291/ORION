import os
import platform
import requests
from datetime import datetime

# For volume control on Windows
try:
    from ctypes import cast, POINTER
    from comtypes import CLSCTX_ALL
    from pycaw.pycaw import AudioUtilities, IAudioEndpointVolume
    PYCAW_AVAILABLE = True
except ImportError:
    PYCAW_AVAILABLE = False

try:
    import psutil
    PSUTIL_AVAILABLE = True
except ImportError:
    PSUTIL_AVAILABLE = False


# ---------------------------------------------------------
# VOLUME HELPER — get Windows audio endpoint
# ---------------------------------------------------------
def _get_volume_interface():
    if not PYCAW_AVAILABLE:
        return None
    try:
        devices = AudioUtilities.GetSpeakers()
        interface = devices.Activate(
            IAudioEndpointVolume._iid_, CLSCTX_ALL, None)
        return cast(interface, POINTER(IAudioEndpointVolume))
    except Exception:
        return None


def _get_context(q):
    return q if hasattr(q, "remember_volume_action") else None


# ---------------------------------------------------------
# SYSTEM COMMANDS
# ---------------------------------------------------------
def shutdown(t, q):
    os.system("shutdown /s /t 5")
    return "Shutting down in 5 seconds"


def restart(t, q):
    os.system("shutdown /r /t 5")
    return "Restarting in 5 seconds"


def lock(t, q):
    os.system("rundll32.exe user32.dll,LockWorkStation")
    return "System Locked"


def sleep(t, q):
    os.system("rundll32.exe powrprof.dll,SetSuspendState 0,1,0")
    return "Going to sleep"


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


# ---------------------------------------------------------
# CORE VOLUME ADJUSTER
# Used internally by all volume commands
# ---------------------------------------------------------
def _adjust_volume(action, context=None):
    """
    action: "up" | "down" | "mute" | "unmute" | "max" | "min"
    Saves the action to context so "more" / "less" can repeat it.
    """

    if context:
        context.remember_volume_action(action)

    if not PYCAW_AVAILABLE:
        # Fallback using nircmd
        fallback = {
            "up":     ("nircmd.exe changesysvolume 6554",  "Volume increased"),
            "down":   ("nircmd.exe changesysvolume -6554", "Volume decreased"),
            "mute":   ("nircmd.exe mutesysvolume 1",       "Muted"),
            "unmute": ("nircmd.exe mutesysvolume 0",       "Unmuted"),
            "max":    ("nircmd.exe setsysvolume 65535",    "Volume set to maximum"),
            "min":    ("nircmd.exe setsysvolume 0",        "Volume set to minimum"),
        }
        if action in fallback:
            os.system(fallback[action][0])
            return fallback[action][1]
        return "Unknown volume action"

    try:
        vol = _get_volume_interface()
        if not vol:
            return "Could not access volume control"

        if action == "up":
            current = vol.GetMasterVolumeLevelScalar()
            new_vol = min(1.0, current + 0.10)
            vol.SetMasterVolumeLevelScalar(new_vol, None)
            return f"Volume increased to {int(new_vol * 100)}%"

        elif action == "down":
            current = vol.GetMasterVolumeLevelScalar()
            new_vol = max(0.0, current - 0.10)
            vol.SetMasterVolumeLevelScalar(new_vol, None)
            return f"Volume decreased to {int(new_vol * 100)}%"

        elif action == "mute":
            vol.SetMute(1, None)
            return "Volume muted"

        elif action == "unmute":
            vol.SetMute(0, None)
            return "Volume unmuted"

        elif action == "max":
            vol.SetMasterVolumeLevelScalar(1.0, None)
            return "Volume set to maximum"

        elif action == "min":
            vol.SetMasterVolumeLevelScalar(0.0, None)
            return "Volume set to minimum"

        return "Unknown volume action"

    except Exception as e:
        return f"Volume error: {e}"


# ---------------------------------------------------------
# VOLUME COMMANDS
# ---------------------------------------------------------
def volume_up(t, q):
    return _adjust_volume("up", _get_context(q))


def volume_down(t, q):
    return _adjust_volume("down", _get_context(q))


def mute(t, q):
    return _adjust_volume("mute", _get_context(q))


def unmute(t, q):
    return _adjust_volume("unmute", _get_context(q))


def max_volume(t, q):
    return _adjust_volume("max", _get_context(q))


def min_volume(t, q):
    return _adjust_volume("min", _get_context(q))


# ---------------------------------------------------------
# MORE / LESS — repeats or reverses last volume action
#
# Usage:
#   "increase volume" → volume goes up 10%
#   "more"            → volume goes up another 10%
#   "more"            → volume goes up another 10%
#   "less"            → volume goes back down 10%
# ---------------------------------------------------------
def volume_more(t, q):
    context = _get_context(q)

    if not context:
        return "Context not available"

    last = context.get_last_volume_action()

    if not last:
        return "No recent volume action to repeat. Try 'volume up' or 'volume down' first."

    return _adjust_volume(last, context)


def volume_less(t, q):
    context = _get_context(q)

    if not context:
        return "Context not available"

    last = context.get_last_volume_action()

    if not last:
        return "No recent volume action to repeat."

    # Reverse the last action
    reverse = {
        "up":     "down",
        "down":   "up",
        "max":    "min",
        "min":    "max",
        "mute":   "unmute",
        "unmute": "mute",
    }

    reversed_action = reverse.get(last, last)

    # Pass context=None so the reversed action does NOT overwrite
    # the saved context — "less" should never flip the saved direction
    return _adjust_volume(reversed_action, context=None)


# ---------------------------------------------------------
# SYSTEM INFO
# ---------------------------------------------------------
def system_info(t, q):
    if not PSUTIL_AVAILABLE:
        return "psutil not installed. Run: pip install psutil"

    try:
        cpu = psutil.cpu_percent(interval=1)
        ram = psutil.virtual_memory()
        ram_used = ram.used // (1024 ** 2)
        ram_total = ram.total // (1024 ** 2)
        ram_percent = ram.percent

        battery_info = ""
        battery = psutil.sensors_battery()
        if battery:
            status = "Charging" if battery.power_plugged else "Discharging"
            battery_info = f" | Battery: {int(battery.percent)}% ({status})"

        return (
            f"CPU: {cpu}% | "
            f"RAM: {ram_used}MB / {ram_total}MB ({ram_percent}%)"
            f"{battery_info}"
        )
    except Exception as e:
        return f"System info error: {e}"


# ---------------------------------------------------------
# WEATHER
# ---------------------------------------------------------
def weather(t, q):
    try:
        city = "Ludhiana"  # default city

        keywords = ["weather in", "temperature in", "weather of"]
        for kw in keywords:
            if kw in t.lower():
                city = t.lower().split(kw)[-1].strip()
                break

        url = f"https://wttr.in/{city}?format=3"
        response = requests.get(url, timeout=5)

        if response.status_code == 200:
            return response.text.strip()
        else:
            return f"Could not fetch weather for {city}"

    except requests.exceptions.ConnectionError:
        return "No internet connection"
    except Exception as e:
        return f"Weather error: {e}"


# ---------------------------------------------------------
# REGISTER ALL COMMANDS
# ---------------------------------------------------------
def register(register_command):

    # System power
    register_command("shutdown", shutdown)
    register_command("restart", restart)
    register_command("lock", lock)
    register_command("sleep", sleep)
    register_command("logout", logout)

    # Folders
    register_command("open_downloads", open_downloads)
    register_command("open_documents", open_documents)
    register_command("open_desktop", open_desktop)

    # Time / Date
    register_command("time", show_time)
    register_command("date", show_date)

    # Screen
    register_command("clear", clear_screen)

    # Volume
    register_command("volume_up", volume_up)
    register_command("volume_down", volume_down)
    register_command("mute", mute)
    register_command("unmute", unmute)
    register_command("max_volume", max_volume)
    register_command("min_volume", min_volume)

    # Volume repeat / reverse
    register_command("volume_more", volume_more)
    register_command("volume_less", volume_less)

    # System info
    register_command("system_info", system_info)

    # Weather
    register_command("weather", weather)
