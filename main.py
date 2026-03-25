from memory.memory_engine import MemoryEngine
from memory.intent_responses import RESPONSES
from core.commands import execute_command


# =========================================================
# 🔥 Split multiple commands (SMART + SAFE)
# =========================================================
def split_commands(text):
    separators = [" and then ", " then ", " and ", ",", " & "]

    for sep in separators:
        if sep in text:
            return [t.strip() for t in text.split(sep) if t.strip()]

    return [text]


# =========================================================
# 🔥 Extract search query (CLEAN)
# =========================================================
def extract_search_query(text):
    words = ["search", "find", "look up", "search for"]

    for w in words:
        if w in text:
            return text.split(w)[-1].strip()

    return ""


# =========================================================
# 🔥 MAIN LOOP
# =========================================================
def run_orion():
    memory = MemoryEngine()
    last_query = None  # 🔥 context memory

    print("🔵 ORION Initialized (ADVANCED MODE)")

    while True:
        raw_input_text = input("You: ").strip()

        # ❌ ignore empty
        if not raw_input_text:
            continue

        # 🔥 normalize
        user_input = memory.normalize(raw_input_text)

        if user_input == "exit":
            print("🛑 ORION shutting down...")
            break

        # 🔥 split commands
        commands = split_commands(user_input)

        for cmd_text in commands:

            if not cmd_text:
                continue

            # 🧠 detect intent
            intent = memory.detect_intent(cmd_text)

            # ==================================================
            # 🔥 1. COMMAND EXECUTION (TOP PRIORITY)
            # ==================================================
            cmd_result = execute_command(cmd_text, intent, last_query)

            if cmd_result:
                print("ORION ⚡:", cmd_result)

                # 🔥 UPDATE CONTEXT AFTER SUCCESSFUL EXECUTION
                if intent == "search":
                    query = extract_search_query(cmd_text)

                    if query and query not in ["it", "this", "that"]:
                        last_query = query

                continue

            # ==================================================
            # ⚡ 2. LEARNED MEMORY
            # ==================================================
            learned = memory.get_learned(cmd_text)
            if learned:
                print("ORION ⚡:", learned)
                continue

            # ==================================================
            # ⚡ 3. INTENT RESPONSES
            # ==================================================
            if intent and intent in RESPONSES:

                if intent == "time":
                    from datetime import datetime
                    print("ORION ⚡:", datetime.now().strftime("%H:%M"))
                    continue

                if intent == "date":
                    from datetime import datetime
                    print("ORION ⚡:", datetime.now().strftime("%Y-%m-%d"))
                    continue

                print("ORION ⚡:", RESPONSES[intent])
                continue

            # ==================================================
            # 🧠 4. KNOWLEDGE SYSTEM
            # ==================================================
            knowledge = memory.get_knowledge(cmd_text)
            if knowledge:
                for key, value in knowledge.items():
                    print(f"{key.capitalize()}: {value}")
                continue

            # ==================================================
            # ❌ 5. LEARNING MODE
            # ==================================================
            print("ORION:", "I don't know that yet.")

            learn = input("Teach me? (y/n): ").strip().lower()

            if learn == "y":
                answer = input("Enter answer: ").strip()

                if answer:
                    memory.learn(cmd_text, answer)
                    print("ORION ⚡: Learned successfully!")
                else:
                    print("ORION ⚠️: Empty answer ignored.")


if __name__ == "__main__":
    run_orion()
