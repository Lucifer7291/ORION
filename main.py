from memory.memory_engine import MemoryEngine
from memory.intent_responses import RESPONSES
from core.commands import execute_command
from config import AI_MODE
from brain.ai_engine import OrionAI

ai = OrionAI()


def run_orion():
    memory = MemoryEngine()

    print("🔵 ORION Initialized (LOCAL MODE)")

    while True:
        user_input = input("You: ").lower().strip()

        if user_input == "exit":
            print("🛑 ORION shutting down...")
            break

        # 🔥 1. COMMANDS
        cmd = execute_command(user_input)
        if cmd:
            print("ORION ⚡:", cmd)
            continue

        # ⚡ 2. INTENT
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

        # 🧠 3. KNOWLEDGE
        knowledge = memory.get_knowledge(user_input)
        if knowledge:
            for key, value in knowledge.items():
                print(f"{key.capitalize()}: {value}")
            continue

        # 🧠 4. AI (optional)
        if AI_MODE:
            print("ORION 🧠:", ai.generate(user_input))
            continue

            # ❌ FALLBACK → LEARNING MODE
        print("ORION:", "I don't know that yet.")

        learn = input("Teach me? (y/n): ").lower().strip()

        if learn == "y":
            answer = input("Enter answer: ")

            memory.learn(user_input, answer)
            print("ORION ⚡: Learned successfully!")


if __name__ == "__main__":
    run_orion()
