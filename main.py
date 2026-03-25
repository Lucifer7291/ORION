from memory.memory_engine import MemoryEngine
from memory.intent_responses import RESPONSES
from core.commands import execute_command


def run_orion():
    memory = MemoryEngine()

    print("🔵 ORION Initialized (LOCAL MODE)")

    while True:
        user_input = input("You: ").lower().strip()

        if user_input == "exit":
            print("🛑 ORION shutting down...")
            break

        # 🔥 1. COMMANDS (TOP PRIORITY)
        cmd = execute_command(user_input)
        if cmd:
            print("ORION ⚡:", cmd)
            continue

        # ⚡ 2. LEARNED MEMORY (NEW)
        learned = memory.get_learned(user_input)
        if learned:
            print("ORION ⚡:", learned)
            continue

        # ⚡ 3. INTENT RESPONSES
        intent = memory.detect_intent(user_input)
        if intent and intent in RESPONSES:
            if intent == "time":
                from datetime import datetime
                print("ORION ⚡:", datetime.now().strftime("%H:%M"))
            elif intent == "date":
                from datetime import datetime
                print("ORION ⚡:", datetime.now().strftime("%Y-%m-%d"))
            else:
                print("ORION ⚡:", RESPONSES[intent])
            continue

        # 🧠 4. KNOWLEDGE SYSTEM
        knowledge = memory.get_knowledge(user_input)
        if knowledge:
            for key, value in knowledge.items():
                print(f"{key.capitalize()}: {value}")
            continue

        # ❌ 5. FALLBACK → LEARNING MODE
        print("ORION:", "I don't know that yet.")

        learn = input("Teach me? (y/n): ").lower().strip()

        if learn == "y":
            answer = input("Enter answer: ")
            memory.learn(user_input, answer)
            print("ORION ⚡: Learned successfully!")


if __name__ == "__main__":
    run_orion()
