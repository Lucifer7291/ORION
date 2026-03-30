# =========================================================
# ORION CONTEXT MANAGER
# core/context_manager.py
# =========================================================


class ContextManager:

    def __init__(self):
        self.history = []

        self.last_command = None
        self.last_result = None

        self.last_successful_command = None
        self.last_successful_result = None

        self.last_repeatable_command = None

        self.last_search = None

        # Dynamic target context
        self.last_target = None
        self.last_closed_target = None

        # Volume action context
        # Stores: "up" | "down" | "mute" | "unmute" | "max" | "min"
        self.last_volume_action = None

    # -----------------------------------------------------
    # STORE COMMAND
    # -----------------------------------------------------
    def remember(self, command, result=None, success=True, repeatable=True):

        entry = {
            "command": command,
            "result": result,
            "success": success,
            "repeatable": repeatable,
        }

        self.history.append(entry)

        if len(self.history) > 50:
            self.history.pop(0)

        self.last_command = command
        self.last_result = result

        if success:
            self.last_successful_command = command
            self.last_successful_result = result

        if success and repeatable:
            self.last_repeatable_command = command

    # -----------------------------------------------------
    # STORE SEARCH CONTEXT
    # -----------------------------------------------------
    def remember_search(self, query):
        self.last_search = query

    # -----------------------------------------------------
    # STORE VOLUME ACTION
    # action: "up" | "down" | "mute" | "unmute" | "max" | "min"
    # -----------------------------------------------------
    def remember_volume_action(self, action):
        self.last_volume_action = action

    def get_last_volume_action(self):
        return self.last_volume_action

    # -----------------------------------------------------
    # STORE TARGET CONTEXT
    # type can be:
    #   app
    #   browser
    #   web_tab
    #   system_tool
    # -----------------------------------------------------
    def remember_target(
        self,
        name,
        target_type="app",
        process_name=None,
        url=None,
        title=None,
        extra=None,
    ):
        self.last_target = {
            "name": name,
            "type": target_type,
            "process_name": process_name,
            "url": url,
            "title": title,
            "extra": extra or {},
        }

    # -----------------------------------------------------
    # STORE CLOSED TARGET CONTEXT
    # -----------------------------------------------------
    def remember_closed_target(
        self,
        name,
        target_type="app",
        process_name=None,
        url=None,
        title=None,
        extra=None,
    ):
        self.last_closed_target = {
            "name": name,
            "type": target_type,
            "process_name": process_name,
            "url": url,
            "title": title,
            "extra": extra or {},
        }

    # -----------------------------------------------------
    # BACKWARD COMPATIBILITY HELPERS
    # -----------------------------------------------------
    def remember_app(self, app_name):
        self.remember_target(
            name=app_name,
            target_type="app",
            process_name=app_name,
        )

    def remember_closed_app(self, app_name):
        self.remember_closed_target(
            name=app_name,
            target_type="app",
            process_name=app_name,
        )

    # -----------------------------------------------------
    # GETTERS
    # -----------------------------------------------------
    def get_last_command(self):
        return self.last_command

    def get_last_result(self):
        return self.last_result

    def get_last_successful_command(self):
        return self.last_successful_command

    def get_last_successful_result(self):
        return self.last_successful_result

    def get_last_repeatable_command(self):
        return self.last_repeatable_command

    def get_last_search(self):
        return self.last_search

    def get_last_target(self):
        return self.last_target

    def get_last_closed_target(self):
        return self.last_closed_target

    # -----------------------------------------------------
    # COMPATIBILITY GETTERS
    # -----------------------------------------------------
    def get_last_app(self):
        if self.last_target:
            return self.last_target.get("name")
        return None

    def get_last_closed_app(self):
        if self.last_closed_target:
            return self.last_closed_target.get("name")
        return None

    # -----------------------------------------------------
    # HISTORY HELPERS
    # -----------------------------------------------------
    def get_recent_history(self, limit=5):
        return self.history[-limit:]

    # -----------------------------------------------------
    # CLEAR CONTEXT
    # -----------------------------------------------------
    def reset(self):
        self.history.clear()

        self.last_command = None
        self.last_result = None

        self.last_successful_command = None
        self.last_successful_result = None

        self.last_repeatable_command = None

        self.last_search = None

        self.last_target = None
        self.last_closed_target = None

        self.last_volume_action = None