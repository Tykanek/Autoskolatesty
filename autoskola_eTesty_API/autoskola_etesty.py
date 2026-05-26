# https://github.com/RxiPland/autoskola-eTesty-API

import requests
import re
from urllib.parse import urljoin


USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36"
BASE_URL = "https://www.autoskola-testy.cz"
GROUP_B_QUESTION_ID_PATTERN = re.compile(r"^\d{8}$")


def is_group_b_question_id(question_id: str) -> bool:
    """
    Standard questions used by the group B import have 8-digit official codes.
    Short 6-digit codes are from separate "new questions" pages and must not be
    mixed into the group B dataset.
    """

    return bool(GROUP_B_QUESTION_ID_PATTERN.fullmatch(str(question_id or "").strip()))


def _absolute_media_url(value: str) -> str:
    media = re.search(r'src="([^"]+)"', value or "")

    if media is None:
        return ""

    return urljoin(BASE_URL, media.group(1).strip())


def get_question(url: str) -> dict:
    """
    Function will return dictionary with question based on full question URL
    """

    PATTERN_VALID_URL = r"https?://(www\.)?autoskola-testy\.cz/prohlizeni_otazek\.php\?otazka=.+"
    if not re.match(PATTERN_VALID_URL, url):
        raise Exception("URL is not valid!")

    response = requests.get(url, headers={"User-Agent": USER_AGENT})
    response_html = response.text

    question_text_match = re.search(r'"question-text".+?>(.+?)</p>', response_html, re.DOTALL)
    question_text = question_text_match.group(1).strip() if question_text_match else ""

    question_media_match = re.search(r'src="(/img/[a-zA-Z0-9/]+\.[a-zA-Z0-9]+)"', response_html)
    question_media = urljoin(BASE_URL, question_media_match.group(1).strip()) if question_media_match else ""

    correct_answer_html = re.findall(r'"answer otazka_spravne".+?<p>(.+?)</p>', response_html, re.DOTALL)
    wrong_answers_html = re.findall(r'"answer otazka_spatne".+?<p>(.+?)</p>', response_html, re.DOTALL)

    correct_text = ""
    correct_media = ""
    if correct_answer_html:
        if "/img/" in correct_answer_html[0]:
            correct_media = _absolute_media_url(correct_answer_html[0])
        else:
            correct_text = correct_answer_html[0].strip()

    wrong1_text = ""
    wrong1_media = ""
    if len(wrong_answers_html) > 0:
        if "/img/" in wrong_answers_html[0]:
            wrong1_media = _absolute_media_url(wrong_answers_html[0])
        else:
            wrong1_text = wrong_answers_html[0].strip()

    wrong2_text = ""
    wrong2_media = ""
    if len(wrong_answers_html) > 1:
        if "/img/" in wrong_answers_html[1]:
            wrong2_media = _absolute_media_url(wrong_answers_html[1])
        else:
            wrong2_text = wrong_answers_html[1].strip()

    question_id_match = re.search(r"má kód (\d+)", response_html)
    question_id = question_id_match.group(1).strip() if question_id_match else ""

    points_match = re.search(r"za její správné zodpovězení v testech se získá.+?(\d) body?", response_html)
    points = points_match.group(1).strip() if points_match else ""

    question_topic_id_match = re.search(r"Tato otázka ze skupiny .+\?okruh=(\d+)", response_html)
    question_topic_id = -1
    if question_topic_id_match:
        try:
            question_topic_id = int(question_topic_id_match.group(1).strip())
        except (ValueError, IndexError):
            pass

    return {
        "question_text": question_text,
        "question_media": question_media,
        "correct_text": correct_text,
        "correct_media": correct_media,
        "wrong1_text": wrong1_text,
        "wrong1_media": wrong1_media,
        "wrong2_text": wrong2_text,
        "wrong2_media": wrong2_media,
        "question_id": question_id,
        "topic_id": question_topic_id,
        "points": points,
    }


def get_random_question(question_topic_id: int) -> dict:
    """
    Function will return dictionary with random question based on topic ID (1-7)
    """
    if not 1 <= question_topic_id <= 7:
        raise Exception("Question topic ID integer must be between 1 and 7")

    URL = f"https://www.autoskola-testy.cz/prohlizeni_otazek.php?random={question_topic_id}"
    response = requests.get(URL, headers={"User-Agent": USER_AGENT, "Referer": URL})
    
    # We can reuse get_question by finding the canonical URL
    canonical_link_match = re.search(r'<link rel="canonical" href="([^"]+)"', response.text)
    if canonical_link_match:
        return get_question(canonical_link_match.group(1))

    # Fallback to parsing the random page directly if canonical link is not found
    return get_question(URL)


def get_questions_urls(questions_topic_id: int) -> list[tuple]:
    """
    Function will return list of tuples -> (question ID, question URL) of all questions based on topic id (1-7)
    """

    if not 1 <= questions_topic_id <= 7:
        raise Exception("Question topic ID integer must be between 1 and 7")

    URL = f"https://www.autoskola-testy.cz/prohlizeni_otazek.php?okruh={questions_topic_id}"

    final = []
    used_urls = set()

    response = requests.get(
        URL,
        headers={
            "User-Agent": USER_AGENT,
            "Referer": "https://www.autoskola-testy.cz/prohlizeni_otazek.php",
        },
    )

    response_html = response.text

    question_links = re.findall(
        r'(?:Otázka|kód)\s+(\d+),\s*<a href="([^"]*otazka=[^"]+)"',
        response_html,
        re.IGNORECASE,
    )

    if not question_links:
        question_links = [
            (str(index + 1), link)
            for index, link in enumerate(
                re.findall(r'href="([^"]*otazka=[^"]+)"', response_html)
            )
        ]

    for question_id, link in question_links:
        if not is_group_b_question_id(question_id):
            continue

        link = link.replace("&amp;", "&")

        if link.startswith("?"):
            full_url = urljoin(BASE_URL, "prohlizeni_otazek.php" + link)
        else:
            full_url = urljoin(BASE_URL + "/", link)

        if "prohlizeni_otazek.php?otazka=" not in full_url:
            continue

        if full_url in used_urls:
            continue

        used_urls.add(full_url)
        final.append((question_id, full_url))

    return final
