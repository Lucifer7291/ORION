import json
import os
from difflib import get_close_matches


class MemoryEngine:
    def __init__(self):
        self.file = "memory/data.json"
        os.makedirs("memory", exist_ok=True)

        if not os.path.exists(self.file):
            with open(self.file, "w") as f:
                json.dump({}, f)

        self.load()

    def load(self):
        with open(self.file, "r") as f:
            self.data = json.load(f)

    def normalize(self, text):
        return text.lower().strip()

    # 🔥 INTENT DETECTION
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

    # 🧠 KNOWLEDGE FETCH
    def get_knowledge(self, query):
        query = self.normalize(query)

        for key, value in self.data.items():
            if isinstance(value, dict):
                if key in query:
                    return value

        return None

    # 🔥 LEARNING SYSTEM (FIXED INDENTATION)
    def learn(self, query, answer):
        query = self.normalize(query)

        self.data[query] = answer

        with open(self.file, "w") as f:
            json.dump(self.data, f, indent=4)
