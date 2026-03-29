# =========================================================
# ORION COMMAND ENGINE
# core/commands.py
# =========================================================

import config

# =========================================================
# 🔥 GLOBAL COMMAND REGISTRY
# =========================================================
COMMAND_REGISTRY = {}
LOADED_MODULES = []


# =========================================================
# 🔥 REGISTER COMMAND
# Called by command modules
# =========================================================
def register_command(intent, handler):

    if not intent or not handler:
        return

    COMMAND_REGISTRY[intent] = handler


# =========================================================
# 🔥 CLEAR REGISTRY
# =========================================================
def clear_registry():
    COMMAND_REGISTRY.clear()
    LOADED_MODULES.clear()


# =========================================================
# 🔥 RELOAD COMMANDS
# =========================================================
def reload_commands(loader_callback=None):

    clear_registry()

    if loader_callback:
        loader_callback()

    return "Commands reloaded successfully"


# =========================================================
# 🔥 MAIN EXECUTOR
# =========================================================
def execute_command(text, intent=None, last_query=None, context=None):

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
    # COMMAND EXECUTION
    # -----------------------------------------------------
    if intent and intent in COMMAND_REGISTRY:
        try:
            handler = COMMAND_REGISTRY[intent]

            # pass context first if available
            if context is not None:
                return handler(text, context)

            # fallback
            return handler(text, last_query)

        except Exception as e:
            return f"Command error: {e}"

    return None
