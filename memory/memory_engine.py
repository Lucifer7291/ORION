import json
import os
import re
import random
from difflib import get_close_matches


class MemoryEngine:

    # =================================================
    # INIT
    # =================================================
    def __init__(self):

        os.makedirs("memory", exist_ok=True)

        self.intents_file = "memory/intents.json"
        self.responses_file = "memory/responses.json"
        self.knowledge_file = "memory/knowledge.json"
        self.learned_file = "memory/learned.json"

        for file in [
            self.intents_file,
            self.responses_file,
            self.knowledge_file,
            self.learned_file,
        ]:
            if not os.path.exists(file):
                with open(file, "w", encoding="utf-8") as f:
                    json.dump({}, f)

        self.load()

    # =================================================
    # LOAD FILES
    # =================================================
    def load(self):
        with open(self.intents_file, "r", encoding="utf-8") as f:
            self.intents = json.load(f)

        with open(self.responses_file, "r", encoding="utf-8") as f:
            self.responses = json.load(f)

        with open(self.knowledge_file, "r", encoding="utf-8") as f:
            self.knowledge = json.load(f)

        with open(self.learned_file, "r", encoding="utf-8") as f:
            self.learned = json.load(f)

    # =================================================
    # NORMALIZE
    # =================================================
    def normalize(self, text):
        text = text.lower().strip()
        text = re.sub(r"\s+", " ", text)
        text = re.sub(r"(.)\1{2,}", r"\1\1", text)
        return text

    # =================================================
    # INTENT DETECTION (SPECIFICITY-FIRST FIX)
    # =================================================
    def detect_intent(self, query):
        query = self.normalize(query)

        exact_candidates = []
        partial_candidates = []

        for intent, phrases in self.intents.items():
            if not isinstance(phrases, list):
                continue

            for phrase in phrases:
                norm_phrase = self.normalize(phrase)

                # exact match gets highest priority
                if query == norm_phrase:
                    exact_candidates.append((len(norm_phrase), intent))

                # partial match
                elif norm_phrase in query:
                    partial_candidates.append((len(norm_phrase), intent))

        # 1. longest exact phrase wins
        if exact_candidates:
            exact_candidates.sort(reverse=True)
            return exact_candidates[0][1]

        # 2. longest partial phrase wins
        if partial_candidates:
            partial_candidates.sort(reverse=True)
            return partial_candidates[0][1]

        # 3. fuzzy fallback
        best_intent = None
        best_score_phrase_len = -1

        for intent, phrases in self.intents.items():
            if not isinstance(phrases, list):
                continue

            match = get_close_matches(query, phrases, n=1, cutoff=0.75)
            if match:
                phrase_len = len(match[0])
                if phrase_len > best_score_phrase_len:
                    best_score_phrase_len = phrase_len
                    best_intent = intent

        return best_intent

    # =================================================
    # RESPONSES
    # =================================================
    def get_response(self, intent):
        if intent is None:
            return None

        responses = self.responses.get(intent)

        if not responses:
            return None

        if isinstance(responses, list):
            return random.choice(responses)

        return responses

    # =================================================
    # KNOWLEDGE
    # =================================================
    def get_knowledge(self, query):
        query = self.normalize(query)

        for key, value in self.knowledge.items():
            norm_key = self.normalize(key)

            if norm_key in query:
                return value

            match = get_close_matches(query, [norm_key], n=1, cutoff=0.7)
            if match:
                return value

        return None

    # =================================================
    # LEARNED MEMORY
    # =================================================
    def get_learned(self, query):
        query = self.normalize(query)

        if query in self.learned:
            return self.learned[query]

        match = get_close_matches(query, self.learned.keys(), n=1, cutoff=0.75)
        if match:
            return self.learned[match[0]]

        return None

    # =================================================
    # SAVE LEARNING
    # =================================================
    def learn(self, query, answer):
        query = self.normalize(query)
        self.learned[query] = answer

        with open(self.learned_file, "w", encoding="utf-8") as f:
            json.dump(self.learned, f, indent=4)

    # =================================================
    # THINK
    # =================================================
    def think(self, query):
        learned = self.get_learned(query)
        if learned:
            return learned

        intent = self.detect_intent(query)
        response = self.get_response(intent)
        if response:
            return response

        knowledge = self.get_knowledge(query)
        if knowledge:
            return knowledge

        return None
