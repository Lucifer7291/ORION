# =========================================================
# ORION BASIC COMMANDS
# commands/default_commands/basic.py
# =========================================================

from datetime import datetime
import platform


# ---------------------------------------------------------
# HELPER
# ---------------------------------------------------------
def get_context(obj):
    return obj if hasattr(obj, "history") else None


# ---------------------------------------------------------
# BASIC RESPONSES
# ---------------------------------------------------------
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
    return "You can open apps, search web, control system, use context commands, and automate tasks."


def capabilities(t, q):
    return "Automation, system control, memory, app launching, context awareness, and AI reasoning."


def joke(t, q):
    return "Why programmers hate nature? Too many bugs."


def motivation(t, q):
    return "Keep building. You're close to greatness."


# ---------------------------------------------------------
# SYSTEM INFO
# ---------------------------------------------------------
def time_now(t, q):
    return datetime.now().strftime("%H:%M")


def date_today(t, q):
    return datetime.now().strftime("%Y-%m-%d")


def os_info(t, q):
    return platform.system()


def python_version(t, q):
    return platform.python_version()


# ---------------------------------------------------------
# CONTEXT COMMANDS
# ---------------------------------------------------------
def repeat_last(t, q):
    context = get_context(q)

    if not context:
        return "Context system not available."

    repeatable = context.get_last_repeatable_command()
    if repeatable:
        return f"Repeat last command: {repeatable}"

    last_success = context.get_last_successful_command()
    if last_success:
        return f"Repeat last successful command: {last_success}"

    return "No previous repeatable command found."


def command_history(t, q):
    context = get_context(q)

    if not context:
        return "Context system not available."

    recent = context.get_recent_history(5)

    if not recent:
        return "No command history available."

    lines = []
    for i, item in enumerate(recent, start=1):
        cmd = item.get("command", "unknown")
        result = item.get("result", "")
        if result:
            lines.append(f"{i}. {cmd} → {result}")
        else:
            lines.append(f"{i}. {cmd}")

    return "Recent commands:\n" + "\n".join(lines)


def last_command(t, q):
    context = get_context(q)

    if not context:
        return "Context system not available."

    last = context.get_last_command()
    if last:
        return f"Previous command: {last}"

    return "No previous command available."


def open_it(t, q):
    context = get_context(q)

    if not context:
        return "Context system not available."

    # highest priority: reopen last closed app
    last_closed = context.get_last_closed_app()
    if last_closed:
        return f"Reopen last closed app: {last_closed}"

    # then last app
    last_app = context.get_last_app()
    if last_app:
        return f"Open last app: {last_app}"

    # then last search
    last_search = context.get_last_search()
    if last_search:
        return f"Open last search context: {last_search}"

    return "I don't know what 'it' refers to yet."


def close_it(t, q):
    context = get_context(q)

    if not context:
        return "Context system not available."

    last_app = context.get_last_app()
    if last_app:
        return f"Close last app: {last_app}"

    return "I don't know which app to close."


# ---------------------------------------------------------
# REGISTER
# ---------------------------------------------------------
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

    # context-aware commands
    register_command("repeat", repeat_last)
    register_command("history", command_history)
    register_command("last_command", last_command)
    register_command("open_it", open_it)
    register_command("close_it", close_it)
