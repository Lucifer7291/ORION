from datetime import datetime
import platform


def greeting(t, q):
    return "Hello Lucifer 👋"


def status(t, q):
    return "ORION is fully operational."


def thanks(t, q):
    return "You're welcome."


def farewell(t, q):
    return "Goodbye."


def identity(t, q):
    return "I am ORION, your AI assistant."


def how_are_you(t, q):
    return "Running perfectly."


def version(t, q):
    return "ORION v2 Core"


def creator(t, q):
    return "Created by Lucifer."


def uptime(t, q):
    return "System running normally."


def help_cmd(t, q):
    return "You can open apps, search web, or control system."


def capabilities(t, q):
    return "Automation, control, memory, and AI reasoning."


def joke(t, q):
    return "Why programmers hate nature? Too many bugs."


def motivation(t, q):
    return "Keep building. You're close to greatness."


def time_now(t, q):
    return datetime.now().strftime("%H:%M")


def date_today(t, q):
    return datetime.now().strftime("%Y-%m-%d")


def os_info(t, q):
    return platform.system()


def python_version(t, q):
    return platform.python_version()


def register(register_command):

    register_command("greeting", greeting)
    register_command("status", status)
    register_command("thanks", thanks)
    register_command("farewell", farewell)
    register_command("identity", identity)
    register_command("how_are_you", how_are_you)
    register_command("version", version)
    register_command("creator", creator)
    register_command("uptime", uptime)
    register_command("help", help_cmd)
    register_command("capabilities", capabilities)
    register_command("joke", joke)
    register_command("motivation", motivation)
    register_command("time_basic", time_now)
    register_command("date_basic", date_today)
    register_command("os_info", os_info)
    register_command("python_version", python_version)
