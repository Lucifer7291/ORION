# =========================================================
# ORION CORE ENGINE
# main.py
# =========================================================

from memory.memory_engine import MemoryEngine
from core.commands import execute_command, register_command, reload_commands
from core.context_manager import ContextManager

from datetime import datetime
import importlib
import os
import subprocess
import psutil
import time


# =========================================================
# LOAD COMMAND MODULES
# =========================================================
def load_commands():

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
# SPLIT MULTIPLE COMMANDS
# =========================================================
def split_commands(text: str):
    separators = [" and then ", " then ", " and ", ",", " & "]

    for sep in separators:
        if sep in text:
            return [t.strip() for t in text.split(sep) if t.strip()]

    return [text]


# =========================================================
# EXTRACT SEARCH QUERY
# =========================================================
def extract_search_query(text: str):
    keywords = ["search for", "search", "find", "look up"]

    for key in keywords:
        if key in text:
            return text.split(key)[-1].strip()

    return None


# =========================================================
# EXTRACT CLOSE TARGET
# Fix: only strip whole words, not substrings inside words
# e.g. "whatsapp" must NOT become "whats" by stripping "app"
# =========================================================
def extract_close_target(text: str):
    prefixes = ["close ", "stop ", "end ", "kill ", "shut "]
    lowered = text.lower().strip()

    for p in prefixes:
        if lowered.startswith(p):
            target = lowered[len(p):].strip()

            # Only remove noise if it's a standalone word, not part of another word
            # e.g. remove "the" from "the chrome" but NOT "app" from "whatsapp"
            noise_words = ["the", "my", "this", "that", "window"]
            words = target.split()
            words = [w for w in words if w not in noise_words]
            target = " ".join(words).strip()

            return target if target else None

    return None


# =========================================================
# INTENT HANDLER
# =========================================================
def handle_intent(memory: MemoryEngine, intent: str):

    if not intent:
        return None

    response = memory.get_response(intent)
    if response:
        return response

    if intent == "time":
        return datetime.now().strftime("%H:%M")

    if intent == "date":
        return datetime.now().strftime("%Y-%m-%d")

    return None


# =========================================================
# KNOWN BROWSERS
# =========================================================
KNOWN_BROWSERS = {
    "chrome":   "chrome.exe",
    "firefox":  "firefox.exe",
    "edge":     "msedge.exe",
    "msedge":   "msedge.exe",
    "opera":    "opera.exe",
    "brave":    "brave.exe",
}

KNOWN_BROWSER_EXES = set(KNOWN_BROWSERS.values())


def _is_browser_process(process_name: str) -> bool:
    return (process_name or "").lower() in KNOWN_BROWSER_EXES


# =========================================================
# CLOSE PROCESS (apps)
# =========================================================
def close_process(process_name):
    if not process_name:
        return False

    try:
        result = subprocess.run(
            f'taskkill /IM "{process_name}" /F',
            shell=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        return result.returncode == 0
    except Exception:
        return False


# =========================================================
# CLOSE SPECIFIC BROWSER TAB BY NAME
# =========================================================
def close_browser_tab(process_name="chrome", tab_name=""):
    proc_name = process_name.replace(".exe", "").strip().lower()
    search_term = tab_name.lower().strip()

    script = rf"""
Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes

Add-Type @"
using System;
using System.Runtime.InteropServices;
public class Win32 {{
    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);
    [DllImport("user32.dll")]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
}}
"@

$proc = Get-Process -Name "{proc_name}" -ErrorAction SilentlyContinue |
    Where-Object {{ $_.MainWindowHandle -ne 0 }} |
    Sort-Object CPU -Descending |
    Select-Object -First 1

if (-not $proc) {{ exit 1 }}

$hwnd = $proc.MainWindowHandle
[Win32]::ShowWindow($hwnd, 9)
Start-Sleep -Milliseconds 400
[Win32]::SetForegroundWindow($hwnd)
Start-Sleep -Milliseconds 600

$root = [System.Windows.Automation.AutomationElement]::FromHandle($hwnd)
if (-not $root) {{ exit 2 }}

$tabCondition = New-Object System.Windows.Automation.PropertyCondition(
    [System.Windows.Automation.AutomationElement]::ControlTypeProperty,
    [System.Windows.Automation.ControlType]::TabItem
)

$tabs = $root.FindAll(
    [System.Windows.Automation.TreeScope]::Descendants,
    $tabCondition
)

if (-not $tabs -or $tabs.Count -eq 0) {{
    $wshell = New-Object -ComObject WScript.Shell
    $wshell.SendKeys("^w")
    exit 0
}}

$searchTerm = "{search_term}"
$found = $false

foreach ($tab in $tabs) {{
    $tabName = $tab.Current.Name.ToLower()
    if ($tabName -like "*$searchTerm*") {{
        try {{
            $invokePattern = $tab.GetCurrentPattern(
                [System.Windows.Automation.InvokePattern]::Pattern
            )
            $invokePattern.Invoke()
        }} catch {{
            try {{
                $selectPattern = $tab.GetCurrentPattern(
                    [System.Windows.Automation.SelectionItemPattern]::Pattern
                )
                $selectPattern.Select()
            }} catch {{}}
        }}

        Start-Sleep -Milliseconds 500

        $wshell = New-Object -ComObject WScript.Shell
        $wshell.SendKeys("^w")
        $found = $true
        break
    }}
}}

if (-not $found) {{ exit 3 }}

exit 0
"""

    try:
        result = subprocess.run(
            ["powershell", "-NoProfile", "-NonInteractive", "-Command", script],
            capture_output=True,
            timeout=15,
        )
        if result.returncode == 0:
            return True
        if result.returncode == 3:
            return False
    except Exception:
        pass

    return False


# =========================================================
# DYNAMIC PROCESS FINDER
# =========================================================
def _find_running_process(name):
    name = name.lower().strip()

    for proc in psutil.process_iter(["name"]):
        try:
            proc_name = (proc.info["name"] or "").lower()
            proc_clean = (
                proc_name
                .replace(".exe", "")
                .replace("_", " ")
                .replace("-", " ")
                .lower()
            )

            if name in proc_clean or proc_clean in name:
                return proc.info["name"]

        except (psutil.NoSuchProcess, psutil.AccessDenied):
            continue

    return None


def _find_running_browser():
    try:
        running = {
            p.info["name"].lower()
            for p in psutil.process_iter(["name"])
            if p.info["name"]
        }

        for exe in KNOWN_BROWSER_EXES:
            if exe.lower() in running:
                return exe

    except Exception:
        pass

    return None


# =========================================================
# BUILD CLOSE TARGET — fully dynamic
# =========================================================
def build_close_target(name, context):
    """
    Resolve what to close at runtime.

    Decision order:
      1. Context match — last opened app (non-web)
      2. Direct browser name → kill whole browser
      3. Live process scan:
            - browser exe  → kill whole browser
            - other app    → kill that app
      4. No process found → web tab
    """
    cleaned = name.lower().strip()

    # Step 1: Context match (only for non-web targets)
    last_target = context.get_last_target()
    if last_target:
        last_name = (last_target.get("name") or "").lower().strip()
        if cleaned == last_name or cleaned in last_name or last_name in cleaned:
            if last_target.get("type") not in ("web_tab",):
                return last_target

    # Step 2: Direct browser name
    if cleaned in KNOWN_BROWSERS:
        return {
            "name": cleaned,
            "type": "browser",
            "process_name": KNOWN_BROWSERS[cleaned],
            "url": None,
            "title": None,
            "extra": {},
        }

    # Step 3: Live process scan
    matched_process = _find_running_process(cleaned)
    if matched_process:
        if _is_browser_process(matched_process):
            return {
                "name": cleaned,
                "type": "browser",
                "process_name": matched_process,
                "url": None,
                "title": None,
                "extra": {},
            }
        return {
            "name": cleaned,
            "type": "app",
            "process_name": matched_process,
            "url": None,
            "title": None,
            "extra": {},
        }

    # Step 4: Treat as browser tab
    browser_process = _find_running_browser()
    return {
        "name": cleaned,
        "type": "web_tab",
        "process_name": browser_process or "chrome.exe",
        "url": None,
        "title": None,
        "extra": {},
    }


# =========================================================
# HANDLE CLOSE TARGET
# =========================================================
def handle_close_target(target, context):
    if not target:
        return "I don't know what to close."

    name = target.get("name")
    target_type = target.get("type")
    process_name = target.get("process_name")

    # --- Web tab ---
    if target_type == "web_tab":
        browser_process = process_name or "chrome.exe"
        success = close_browser_tab(browser_process, tab_name=name)

        if success:
            context.remember_closed_target(
                name=name,
                target_type=target_type,
                process_name=browser_process,
                url=target.get("url"),
                title=target.get("title"),
                extra=target.get("extra"),
            )
            return f"Closed {name} tab"

        return f"Could not find a tab matching '{name}'"

    # --- Browser, App, or System tool — all just kill the process ---
    if target_type in ("browser", "app", "system_tool"):
        if process_name and close_process(process_name):
            context.remember_closed_target(
                name=name,
                target_type=target_type,
                process_name=process_name,
            )
            return f"Closed {name}"
        return f"Could not close {name}"

    return f"Don't know how to close {name}"


# =========================================================
# FOLLOWUP ACTIONS
# =========================================================
def execute_followup_action(cmd_result, context, memory):
    if not isinstance(cmd_result, str):
        return False

    if cmd_result.startswith("Close last app:"):
        target = context.get_last_target()
        print("ORION ⚡:", handle_close_target(target, context))
        return True

    if cmd_result.startswith("Open last app:"):
        target = context.get_last_target()
        if not target:
            print("ORION ⚡:", "No previous target found.")
            return True

        synthetic = f"open {target.get('name')}"
        intent = memory.detect_intent(synthetic)
        result = execute_command(
            synthetic,
            intent=intent,
            last_query=context.get_last_search(),
            context=context,
        )

        if result:
            print("ORION ⚡:", result)
            context.remember(synthetic, result)
        else:
            print("ORION ⚡:", f"Could not open {target.get('name')}")
        return True

    if cmd_result.startswith("Reopen last closed app:"):
        target = context.get_last_closed_target()
        if not target:
            print("ORION ⚡:", "No recently closed target.")
            return True

        synthetic = f"open {target.get('name')}"
        intent = memory.detect_intent(synthetic)
        result = execute_command(
            synthetic,
            intent=intent,
            last_query=context.get_last_search(),
            context=context,
        )

        if result:
            print("ORION ⚡:", result)
            context.remember(synthetic, result)
        else:
            print("ORION ⚡:", f"Could not reopen {target.get('name')}")
        return True

    if cmd_result.startswith("Repeat last command:"):
        repeated = cmd_result.replace("Repeat last command:", "").strip()

        if repeated in ["again", "repeat", "do it again", "one more time"]:
            print("ORION ⚡:", "No safe repeatable command found.")
            return True

        intent = memory.detect_intent(repeated)
        result = execute_command(
            repeated,
            intent=intent,
            last_query=context.get_last_search(),
            context=context,
        )

        if result:
            print("ORION ⚡:", result)
            context.remember(repeated, result)
        else:
            print("ORION ⚡:", f"Could not repeat: {repeated}")
        return True

    return False


# =========================================================
# ORION MAIN LOOP
# =========================================================
def run_orion():

    memory = MemoryEngine()
    context = ContextManager()

    load_commands()

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

        if user_input in ["exit", "quit", "bye"]:
            print("ORION shutting down...")
            break

        if user_input in ["cls", "clear", "clear screen"]:
            os.system("cls")
            continue

        if user_input in ["reload commands", "refresh commands"]:
            print("ORION ⚡:", reload_commands())
            load_commands()
            continue

        # -------------------------------------------------------
        # DYNAMIC CLOSE HANDLER
        # -------------------------------------------------------
        close_name = extract_close_target(user_input)

        if close_name:
            if close_name in {"it", "that"}:
                target = context.get_last_target()
            else:
                target = build_close_target(close_name, context)

            print("ORION ⚡:", handle_close_target(target, context))
            continue

        commands = split_commands(user_input)

        for cmd_text in commands:

            intent = memory.detect_intent(cmd_text)

            try:
                cmd_result = execute_command(
                    cmd_text,
                    intent=intent,
                    last_query=context.get_last_search(),
                    context=context,
                )
            except Exception as e:
                print("ORION ❌ Command Error:", e)
                continue

            if cmd_result:

                if execute_followup_action(cmd_result, context, memory):
                    continue

                print("ORION ⚡:", cmd_result)
                context.remember(cmd_text, cmd_result)

                if intent == "search":
                    query = extract_search_query(cmd_text)
                    if query:
                        context.remember_search(query)

                continue

            learned = memory.get_learned(cmd_text)
            if learned:
                print("ORION ⚡:", learned)
                context.remember(cmd_text, learned)
                continue

            response = handle_intent(memory, intent)
            if response:
                print("ORION ⚡:", response)
                context.remember(cmd_text, response)
                continue

            knowledge = memory.get_knowledge(cmd_text)
            if knowledge:

                if isinstance(knowledge, dict):
                    for key, value in knowledge.items():
                        print(f"{key.capitalize()}: {value}")
                else:
                    print("ORION ⚡:", knowledge)

                context.remember(cmd_text, knowledge)
                continue

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
