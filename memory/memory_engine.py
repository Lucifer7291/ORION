import json
import os
from difflib import get_close_matches


class MemoryEngine:
    def __init__(self):
        self.data_file = "memory/data.json"
        self.learned_file = "memory/learned.json"

        os.makedirs("memory", exist_ok=True)

        # Create files if not exist
        for file in [self.data_file, self.learned_file]:
            if not os.path.exists(file):
                with open(file, "w") as f:
                    json.dump({}, f)

        self.load()

    def load(self):
        with open(self.data_file, "r") as f:
            self.data = json.load(f)

        with open(self.learned_file, "r") as f:
            self.learned = json.load(f)

    def normalize(self, text):
        return text.lower().strip()

    # 🔥 1. LEARNED MEMORY (HIGHEST PRIORITY)
    def get_learned(self, query):
        query = self.normalize(query)

        if query in self.learned:
            return self.learned[query]

        # fuzzy
        match = get_close_matches(query, self.learned.keys(), n=1, cutoff=0.7)
        if match:
            return self.learned[match[0]]

        return None

    # 🔥 2. INTENT DETECTION
    def detect_intent(self, query):
        query = self.normalize(query)

        for key, value in self.data.items():
            if isinstance(value, list):
                if query in value:
                    return key

                match = get_close_matches(query, value, n=1, cutoff=0.7)
                if match:
                    return key

        return None

    # 🧠 3. KNOWLEDGE
    def get_knowledge(self, query):
        query = self.normalize(query)

        for key, value in self.data.items():
            if isinstance(value, dict):
                if key in query:
                    return value

        return None

    # 💾 SAVE LEARNED DATA
    def learn(self, query, answer):
        query = self.normalize(query)
        self.learned[query] = answer

        with open(self.learned_file, "w") as f:
            json.dump(self.learned, f, indent=4)
