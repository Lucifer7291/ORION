import webbrowser
import urllib.parse


# -------------------------------------------------
# HELPERS
# -------------------------------------------------
def get_context(obj):
    return obj if hasattr(obj, "remember_target") else None


def remember_web_target(context, name, url, browser="chrome.exe"):
    """
    Stores a full web context target.
    """
    if context:
        context.remember_target(
            name=name,
            target_type="web_tab",
            process_name=browser,
            url=url,
        )


def extract_query(text):
    keywords = ["search for", "search", "find", "look up"]
    for k in keywords:
        if k in text:
            return text.split(k)[-1].strip()
    return ""


# -------------------------------------------------
# SEARCH
# -------------------------------------------------
def google_search(text, q):

    context = get_context(q)

    query = extract_query(text)
    if not query:
        return "What should I search?"

    url = f"https://www.google.com/search?q={urllib.parse.quote(query)}"
    webbrowser.open(url)

    remember_web_target(context, "google", url)

    return f"Searching Google for {query}"


def youtube_search(text, q):

    context = get_context(q)

    query = extract_query(text)
    if not query:
        return "What should I search on YouTube?"

    url = f"https://www.youtube.com/results?search_query={urllib.parse.quote(query)}"
    webbrowser.open(url)

    remember_web_target(context, "youtube", url)

    return f"Searching YouTube for {query}"


# -------------------------------------------------
# GENERIC WEBSITE OPENER
# -------------------------------------------------
def open_site(name, url, context):

    webbrowser.open(url)

    remember_web_target(context, name, url)

    return f"Opening {name.capitalize()}"


# -------------------------------------------------
# OPEN WEBSITES
# -------------------------------------------------
def open_google(t, q):
    context = get_context(q)
    return open_site("google", "https://google.com", context)


def open_youtube(t, q):
    context = get_context(q)
    return open_site("youtube", "https://youtube.com", context)


def open_github(t, q):
    context = get_context(q)
    return open_site("github", "https://github.com", context)


def open_stackoverflow(t, q):
    context = get_context(q)
    return open_site("stackoverflow", "https://stackoverflow.com", context)


def open_reddit(t, q):
    context = get_context(q)
    return open_site("reddit", "https://reddit.com", context)


def open_twitter(t, q):
    context = get_context(q)
    return open_site("twitter", "https://twitter.com", context)


def open_linkedin(t, q):
    context = get_context(q)
    return open_site("linkedin", "https://linkedin.com", context)


def open_instagram(t, q):
    context = get_context(q)
    return open_site("instagram", "https://instagram.com", context)


def open_whatsapp(t, q):
    context = get_context(q)
    return open_site("whatsapp", "https://web.whatsapp.com", context)


def open_gmail(t, q):
    context = get_context(q)
    return open_site("gmail", "https://mail.google.com", context)


def open_drive(t, q):
    context = get_context(q)
    return open_site("drive", "https://drive.google.com", context)


def open_maps(t, q):
    context = get_context(q)
    return open_site("maps", "https://maps.google.com", context)


def open_chatgpt(t, q):
    context = get_context(q)
    return open_site("chatgpt", "https://chat.openai.com", context)


def open_netflix(t, q):
    context = get_context(q)
    return open_site("netflix", "https://netflix.com", context)


def open_amazon(t, q):
    context = get_context(q)
    return open_site("amazon", "https://amazon.in", context)


def open_flipkart(t, q):
    context = get_context(q)
    return open_site("flipkart", "https://flipkart.com", context)


def open_wikipedia(t, q):
    context = get_context(q)
    return open_site("wikipedia", "https://wikipedia.org", context)


def open_news(t, q):
    context = get_context(q)
    return open_site("news", "https://news.google.com", context)


def open_speedtest(t, q):
    context = get_context(q)
    return open_site("speedtest", "https://fast.com", context)


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
