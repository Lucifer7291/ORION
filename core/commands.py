# =========================================================
# ORION COMMAND ENGINE
# core/commands.py
# =========================================================

import importlib
import pkgutil
import config


# =========================================================
# 🔥 GLOBAL COMMAND REGISTRY
# =========================================================
COMMAND_REGISTRY = {}

LOADED_MODULES = []


# =========================================================
# 🔥 REGISTER COMMAND
# Each module calls this
# =========================================================
def register_command(intent, handler):
    COMMAND_REGISTRY[intent] = handler


# =========================================================
# 🔥 AUTO LOAD COMMAND MODULES
# =========================================================
def load_commands():

    COMMAND_REGISTRY.clear()
    LOADED_MODULES.clear()

    packages = [
        "commands.web_commands",
        "commands.app_commands",
        "commands.system_commands",
        "commands.default_commands",
    ]

    for package in packages:

        try:
            module = importlib.import_module(package)

            for _, name, _ in pkgutil.iter_modules(module.__path__):

                module_path = f"{package}.{name}"

                try:
                    mod = importlib.import_module(module_path)

                    # plugin registration hook
                    if hasattr(mod, "register"):
                        mod.register(register_command)

                    LOADED_MODULES.append(module_path)

                except Exception as e:
                    print(f"[Command Module Error] {module_path} -> {e}")

        except Exception as e:
            print(f"[Command Package Error] {package} -> {e}")


# =========================================================
# 🔥 RELOAD COMMANDS (Dashboard Feature)
# =========================================================
def reload_commands():
    load_commands()
    return "Commands reloaded successfully"


# =========================================================
# 🔥 LOAD AT STARTUP
# =========================================================
load_commands()


# =========================================================
# 🔥 MAIN EXECUTOR
# =========================================================
def execute_command(text, intent=None, last_query=None):

    text = text.lower().strip()

    # -----------------------------------------------------
    # AI MODE SWITCH
    # -----------------------------------------------------
    if "enable ai" in text:
        config.AI_MODE = True
        return "AI mode enabled"

    if "disable ai" in text:
        config.AI_MODE = False
        return "AI mode disabled"

    # -----------------------------------------------------
    # HOT RELOAD (DEV POWER FEATURE)
    # -----------------------------------------------------
    if text in ["reload commands", "refresh commands"]:
        return reload_commands()

    # -----------------------------------------------------
    # COMMAND EXECUTION
    # -----------------------------------------------------
    if intent and intent in COMMAND_REGISTRY:

        try:
            handler = COMMAND_REGISTRY[intent]
            return handler(text, last_query)

        except Exception as e:
            return f"Command error: {e}"

    return None  # =========================================================


# ORION COMMAND ENGINE
# core/commands.py
# =========================================================

import importlib
import pkgutil
import config


# =========================================================
# 🔥 GLOBAL COMMAND REGISTRY
# =========================================================
COMMAND_REGISTRY = {}

LOADED_MODULES = []


# =========================================================
# 🔥 REGISTER COMMAND
# Each module calls this
# =========================================================
def register_command(intent, handler):
    COMMAND_REGISTRY[intent] = handler


# =========================================================
# 🔥 AUTO LOAD COMMAND MODULES
# =========================================================
def load_commands():

    COMMAND_REGISTRY.clear()
    LOADED_MODULES.clear()

    packages = [
        "commands.web_commands",
        "commands.app_commands",
        "commands.system_commands",
        "commands.default_commands",
    ]

    for package in packages:

        try:
            module = importlib.import_module(package)

            for _, name, _ in pkgutil.iter_modules(module.__path__):

                module_path = f"{package}.{name}"

                try:
                    mod = importlib.import_module(module_path)

                    # plugin registration hook
                    if hasattr(mod, "register"):
                        mod.register(register_command)

                    LOADED_MODULES.append(module_path)

                except Exception as e:
                    print(f"[Command Module Error] {module_path} -> {e}")

        except Exception as e:
            print(f"[Command Package Error] {package} -> {e}")


# =========================================================
# 🔥 RELOAD COMMANDS (Dashboard Feature)
# =========================================================
def reload_commands():
    load_commands()
    return "Commands reloaded successfully"


# =========================================================
# 🔥 LOAD AT STARTUP
# =========================================================
load_commands()


# =========================================================
# 🔥 MAIN EXECUTOR
# =========================================================
def execute_command(text, intent=None, last_query=None):

    text = text.lower().strip()

    # -----------------------------------------------------
    # AI MODE SWITCH
    # -----------------------------------------------------
    if "enable ai" in text:
        config.AI_MODE = True
        return "AI mode enabled"

    if "disable ai" in text:
        config.AI_MODE = False
        return "AI mode disabled"

    # -----------------------------------------------------
    # HOT RELOAD (DEV POWER FEATURE)
    # -----------------------------------------------------
    if text in ["reload commands", "refresh commands"]:
        return reload_commands()

    # -----------------------------------------------------
    # COMMAND EXECUTION
    # -----------------------------------------------------
    if intent and intent in COMMAND_REGISTRY:

        try:
            handler = COMMAND_REGISTRY[intent]
            return handler(text, last_query)

        except Exception as e:
            return f"Command error: {e}"

    return None
