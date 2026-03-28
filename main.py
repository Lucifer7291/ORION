# =========================================================
# ORION CORE ENGINE
# main.py
# =========================================================

from memory.memory_engine import MemoryEngine
from core.commands import (
    execute_command,
    register_command,
    reload_commands,
)

from datetime import datetime
import importlib


# =========================================================
# 🔥 LOAD ALL COMMAND MODULES
# =========================================================
def load_commands():
    """
    Loads every command module and registers commands.
    Each module MUST expose:
        def register(register_command)
    """

    modules = [
        "commands.web_commands.web",
        "commands.app_commands.apps",
        "commands.default_commands.basic",
        "commands.system_commands.system",
        "commands.system_commands.app_scanner",
    ]

    for module_path in modules:
        try:
            module = importlib.import_module(module_path)
            module = importlib.reload(module)

            if hasattr(module, "register"):
                module.register(register_command)
                print(f"✅ Loaded: {module_path}")
            else:
                print(f"⚠️ No register() in {module_path}")

        except Exception as e:
            print(f"❌ Failed loading {module_path}: {e}")

    print("\n🚀 All command modules initialized.\n")


# =========================================================
# 🔥 Split Multiple Commands
# =========================================================
def split_commands(text: str):
    separators = [" and then ", " then ", " and ", ",", " & "]

    for sep in separators:
        if sep in text:
            return [t.strip() for t in text.split(sep) if t.strip()]

    return [text]


# =========================================================
# 🔥 Extract Search Query
# =========================================================
def extract_search_query(text: str):
    keywords = ["search for", "search", "find", "look up"]

    for key in keywords:
        if key in text:
            return text.split(key)[-1].strip()

    return None


# =========================================================
# 🔥 Intent Response Handler
# =========================================================
def handle_intent(memory: MemoryEngine, intent: str):
    if not intent:
        return None

    # responses.json
    response = memory.get_response(intent)
    if response:
        return response

    # dynamic intents
    if intent == "time":
        return datetime.now().strftime("%H:%M")

    if intent == "date":
        return datetime.now().strftime("%Y-%m-%d")

    return None


# =========================================================
# 🔥 ORION MAIN LOOP
# =========================================================
def run_orion():
    memory = MemoryEngine()

    # VERY IMPORTANT → load commands once
    load_commands()

    last_query = None

    print("🧠 ORION Initialized (ADVANCED MODE)")
    print("Type 'exit' to quit.\n")

    while True:
        try:
            raw_input_text = input("You: ").strip()
        except KeyboardInterrupt:
            print("\nORION shutting down...")
            break

        if not raw_input_text:
            continue

        user_input = memory.normalize(raw_input_text)

        # -------------------------------------------------
        # EXIT
        # -------------------------------------------------
        if user_input in ["exit", "quit", "bye"]:
            print("ORION shutting down...")
            break

        # -------------------------------------------------
        # RELOAD COMMANDS
        # -------------------------------------------------
        if user_input in ["reload commands", "refresh commands"]:
            print("ORION ⚡:", reload_commands(load_commands))
            continue

        commands = split_commands(user_input)

        # ==================================================
        # PROCESS EACH COMMAND
        # ==================================================
        for cmd_text in commands:
            if not cmd_text:
                continue

            intent = memory.detect_intent(cmd_text)

            # ------------------------------------------------
            # 1️⃣ COMMAND EXECUTION
            # ------------------------------------------------
            try:
                cmd_result = execute_command(
                    cmd_text,
                    intent=intent,
                    last_query=last_query,
                )
            except Exception as e:
                print("ORION ❌ Command Error:", e)
                continue

            if cmd_result:
                print("ORION ⚡:", cmd_result)

                if intent == "search":
                    query = extract_search_query(cmd_text)
                    if query and query not in ["it", "this", "that"]:
                        last_query = query

                continue

            # ------------------------------------------------
            # 2️⃣ LEARNED MEMORY
            # ------------------------------------------------
            learned = memory.get_learned(cmd_text)
            if learned:
                print("ORION ⚡:", learned)
                continue

            # ------------------------------------------------
            # 3️⃣ INTENT RESPONSES
            # ------------------------------------------------
            response = handle_intent(memory, intent)
            if response:
                print("ORION ⚡:", response)
                continue

            # ------------------------------------------------
            # 4️⃣ KNOWLEDGE SYSTEM
            # ------------------------------------------------
            knowledge = memory.get_knowledge(cmd_text)
            if knowledge:
                if isinstance(knowledge, dict):
                    for key, value in knowledge.items():
                        print(f"{key.capitalize()}: {value}")
                else:
                    print("ORION ⚡:", knowledge)
                continue

            # ------------------------------------------------
            # 5️⃣ LEARNING MODE
            # ------------------------------------------------
            print("ORION:", "I don't know that yet.")

            learn = input("Teach me? (y/n): ").strip().lower()

            if learn == "y":
                answer = input("Enter answer: ").strip()

                if answer:
                    memory.learn(cmd_text, answer)
                    print("ORION ⚡: Learned successfully!")
                else:
                    print("ORION ⚠️: Empty answer ignored.")


# =========================================================
# ENTRY POINT
# =========================================================
if __name__ == "__main__":
    run_orion()
