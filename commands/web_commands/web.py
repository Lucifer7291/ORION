import webbrowser
import urllib.parse


# -------------------------------------------------
# HELPERS
# -------------------------------------------------
def extract_query(text):
    keywords = ["search for", "search", "find", "look up"]
    for k in keywords:
        if k in text:
            return text.split(k)[-1].strip()
    return ""


def google_search(text, last_query):
    query = extract_query(text)
    if not query:
        return "What should I search?"
    webbrowser.open(f"https://www.google.com/search?q={urllib.parse.quote(query)}")
    return f"Searching Google for {query}"


def youtube_search(text, last_query):
    query = extract_query(text)
    if not query:
        return "What should I search on YouTube?"
    webbrowser.open(
        f"https://www.youtube.com/results?search_query={urllib.parse.quote(query)}"
    )
    return f"Searching YouTube for {query}"


# -------------------------------------------------
# OPEN WEBSITES
# -------------------------------------------------
def open_google(t, q):
    webbrowser.open("https://google.com")
    return "Opening Google"


def open_youtube(t, q):
    webbrowser.open("https://youtube.com")
    return "Opening YouTube"


def open_github(t, q):
    webbrowser.open("https://github.com")
    return "Opening GitHub"


def open_stackoverflow(t, q):
    webbrowser.open("https://stackoverflow.com")
    return "Opening StackOverflow"


def open_reddit(t, q):
    webbrowser.open("https://reddit.com")
    return "Opening Reddit"


def open_twitter(t, q):
    webbrowser.open("https://twitter.com")
    return "Opening Twitter"


def open_linkedin(t, q):
    webbrowser.open("https://linkedin.com")
    return "Opening LinkedIn"


def open_instagram(t, q):
    webbrowser.open("https://instagram.com")
    return "Opening Instagram"


def open_whatsapp(t, q):
    webbrowser.open("https://web.whatsapp.com")
    return "Opening WhatsApp Web"


def open_gmail(t, q):
    webbrowser.open("https://mail.google.com")
    return "Opening Gmail"


def open_drive(t, q):
    webbrowser.open("https://drive.google.com")
    return "Opening Google Drive"


def open_maps(t, q):
    webbrowser.open("https://maps.google.com")
    return "Opening Google Maps"


def open_chatgpt(t, q):
    webbrowser.open("https://chat.openai.com")
    return "Opening ChatGPT"


def open_netflix(t, q):
    webbrowser.open("https://netflix.com")
    return "Opening Netflix"


def open_amazon(t, q):
    webbrowser.open("https://amazon.in")
    return "Opening Amazon"


def open_flipkart(t, q):
    webbrowser.open("https://flipkart.com")
    return "Opening Flipkart"


def open_wikipedia(t, q):
    webbrowser.open("https://wikipedia.org")
    return "Opening Wikipedia"


def open_news(t, q):
    webbrowser.open("https://news.google.com")
    return "Opening News"


def open_speedtest(t, q):
    webbrowser.open("https://fast.com")
    return "Opening Speed Test"


# -------------------------------------------------
# REGISTER
# -------------------------------------------------
def register(register_command):

    register_command("search", google_search)
    register_command("youtube_search", youtube_search)
    register_command("open_google", open_google)
    register_command("open_youtube", open_youtube)
    register_command("open_github", open_github)
    register_command("open_stackoverflow", open_stackoverflow)
    register_command("open_reddit", open_reddit)
    register_command("open_twitter", open_twitter)
    register_command("open_linkedin", open_linkedin)
    register_command("open_instagram", open_instagram)
    register_command("open_whatsapp", open_whatsapp)
    register_command("open_gmail", open_gmail)
    register_command("open_drive", open_drive)
    register_command("open_maps", open_maps)
    register_command("open_chatgpt", open_chatgpt)
    register_command("open_netflix", open_netflix)
    register_command("open_amazon", open_amazon)
    register_command("open_flipkart", open_flipkart)
    register_command("open_wikipedia", open_wikipedia)
    register_command("open_news", open_news)
    register_command("open_speedtest", open_speedtest)
