import json
import random
import time

import autoskola_etesty as etesty


TOPICS = {
    1: "Pravidla provozu",
    2: "Dopravní značky",
    3: "Zásady bezpečné jízdy",
    4: "Dopravní situace",
    5: "Technické podmínky",
    6: "Předpisy související s provozem",
    7: "Zdravotnická příprava",
}


def build_answer(text, media_url, is_correct):
    text = (text or "").strip()
    media_url = (media_url or "").strip()

    return {
        "answer_text": text or media_url,
        "media_url": media_url or None,
        "is_correct": is_correct,
    }


all_questions = []
used_ids = set()

for topic_id, category in TOPICS.items():
    print(f"Načítám téma {topic_id}: {category}")

    try:
        urls = etesty.get_questions_urls(topic_id)
    except Exception as error:
        print(f"Chyba při načítání URL pro téma {topic_id}: {error}")
        continue

    print(f"Nalezeno URL: {len(urls)}")

    for item in urls:
        try:
            url = item[1] if isinstance(item, tuple) else item
            question = etesty.get_question(url)

            question_id = question.get("question_id")

            if not question_id or question_id in used_ids:
                continue

            used_ids.add(question_id)

            try:
                points = int(question.get("points"))
            except (TypeError, ValueError):
                points = 1

            answers = [
                build_answer(
                    question.get("correct_text"),
                    question.get("correct_media"),
                    True,
                ),
                build_answer(
                    question.get("wrong1_text"),
                    question.get("wrong1_media"),
                    False,
                ),
                build_answer(
                    question.get("wrong2_text"),
                    question.get("wrong2_media"),
                    False,
                ),
            ]
            answers = [answer for answer in answers if answer["answer_text"]]

            if len(answers) < 2 or sum(answer["is_correct"] for answer in answers) != 1:
                print(f"Přeskakuji neúplnou otázku: {question_id}")
                continue

            converted = {
                "source_id": question_id,
                "question_text": question.get("question_text", "").strip(),
                "category": category,
                "points": points,
                "image_url": question.get("question_media") or None,
                "answers": answers,
            }

            random.shuffle(converted["answers"])
            all_questions.append(converted)

            print(f"OK: {len(all_questions)} otázek")
            time.sleep(0.2)

        except Exception as error:
            print(f"Chyba u otázky: {error}")

with open("questions_export.json", "w", encoding="utf-8") as file:
    json.dump(all_questions, file, ensure_ascii=False, indent=2)

print(f"Hotovo. Celkem exportováno: {len(all_questions)} otázek")
print("Soubor: questions_export.json")
