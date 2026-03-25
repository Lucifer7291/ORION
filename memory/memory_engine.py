import json
import os
import re
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

    # =========================================================
    # 🔥 ADVANCED NORMALIZATION (CRITICAL FIX)
    # =========================================================
    def normalize(self, text):
        text = text.lower().strip()

        # remove extra spaces
        text = re.sub(r'\s+', ' ', text)

        # limit repeated characters (hiiii → hii)
        text = re.sub(r'(.)\1{2,}', r'\1\1', text)

        return text

    # =========================================================
    # 🔥 1. LEARNED MEMORY (TOP PRIORITY)
    # =========================================================
    def get_learned(self, query):
        query = self.normalize(query)

        if query in self.learned:
            return self.learned[query]

        # fuzzy match
        match = get_close_matches(query, self.learned.keys(), n=1, cutoff=0.7)
        if match:
            return self.learned[match[0]]

        return None

    # =========================================================
    # 🔥 2. INTENT DETECTION (SMART PRIORITY SYSTEM)
    # =========================================================
    def detect_intent(self, query):
        query = self.normalize(query)

        # ❗ STEP 1: BLOCK INTENT if KNOWLEDGE EXISTS
        for key, value in self.data.items():
            if isinstance(value, dict):
                if key in query:
                    return None  # let knowledge system handle it

        # ❗ STEP 2: DETECT INTENTS
        for key, value in self.data.items():
            if isinstance(value, list):

                # exact match
                if query in value:
                    return key

                # partial match (natural language)
                for phrase in value:
                    if phrase in query:
                        return key

                # fuzzy match
                match = get_close_matches(query, value, n=1, cutoff=0.7)
                if match:
                    return key

        return None

    # =========================================================
    # 🧠 3. KNOWLEDGE SYSTEM (UPGRADED)
    # =========================================================
    def get_knowledge(self, query):
        query = self.normalize(query)

        for key, value in self.data.items():
            if isinstance(value, dict):

                # direct keyword match
                if key in query:
                    return value

                # fuzzy keyword match (important)
                match = get_close_matches(query, [key], n=1, cutoff=0.6)
                if match:
                    return value

        return None

    # =========================================================
    # 💾 SAVE LEARNED DATA
    # =========================================================
    def learn(self, query, answer):
        query = self.normalize(query)
        self.learned[query] = answer

        with open(self.learned_file, "w") as f:
            json.dump(self.learned, f, indent=4)
