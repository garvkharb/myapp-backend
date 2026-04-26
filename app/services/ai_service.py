import os
from groq import Groq
from app.config import settings

client = Groq(api_key=settings.GROQ_API_KEY)
MODEL = "llama-3.3-70b-versatile"

def generate_study_plan(subjects: list, exam_date: str, daily_hours: float, notes: str = "") -> dict:
    from datetime import datetime
    try:
        exam_dt = datetime.strptime(exam_date, "%Y-%m-%d")
        days_left = max((exam_dt - datetime.now()).days, 1)
    except:
        days_left = 30

    prompt = f"""Create a detailed study plan for a student with these details:
- Subjects: {', '.join(subjects)}
- Exam/deadline date: {exam_date}
- Days remaining until exam: {days_left} days
- Available study hours per day: {daily_hours}
- Additional notes: {notes or 'None'}

IMPORTANT: Create a plan for EXACTLY {days_left} days (not more, not less).
Each day must have specific topics to study, not just subject names.

Return ONLY a valid JSON object with this exact structure:
{{
  "overview": "brief summary string",
  "days_planned": {days_left},
  "weekly_plan": [
    {{
      "week": 1,
      "focus": "focus area string",
      "tasks": [
        {{
          "id": "task_1",
          "day": "Monday",
          "day_number": 1,
          "date": "2026-04-25",
          "subject": "subject name",
          "topic": "SPECIFIC topic to study e.g. Arrays and Linked Lists",
          "subtopics": ["subtopic 1", "subtopic 2", "subtopic 3"],
          "duration_hours": 1.5,
          "description": "Exactly what to do: read chapter X, solve Y problems, watch Z"
        }}
      ]
    }}
  ],
  "tips": ["tip1", "tip2", "tip3"]
}}
No markdown, no explanation, just the JSON."""

    response = client.chat.completions.create(
    model=MODEL,
    messages=[{"role": "user", "content": prompt}],
    max_tokens=2000,
    )
    import json
    text = response.choices[0].message.content.strip()
    text = text.replace("```json", "").replace("```", "").strip()
    return json.loads(text)

def generate_mock_test(subject, topic, num_questions=10, difficulty="medium"):
    prompt = f"""Generate {num_questions} multiple choice questions for:
Subject: {subject}
Topic: {topic}
Difficulty: {difficulty}

For each question provide:
- question text
- 4 options (A, B, C, D)
- correct answer (A/B/C/D)
- brief explanation

Format as JSON array:
[{{"id": "q1", "question": "...", "options": ["A. ...", "B. ...", "C. ...", "D. ..."], "correct_answer": "A", "explanation": "..."}}]

Return ONLY the JSON array, no other text."""

    response = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=2000,
    )
    import json
    text = response.choices[0].message.content.strip()
    text = text.replace('```json', '').replace('```', '').strip()
    try:
        return json.loads(text)
    except:
        return []

def parse_uploaded_test(file_content):
    return []

def chat_with_filter(history, message):
    study_topics = ["math", "science", "physics", "chemistry", "biology", "history",
                    "geography", "english", "literature", "economics", "computer",
                    "programming", "study", "exam", "homework", "learn", "explain",
                    "what is", "how does", "why", "define", "calculate", "solve"]
    
    msg_lower = message.lower()
    is_study = any(topic in msg_lower for topic in study_topics)
    
    if not is_study and len(message.split()) < 4:
        return "I'm your study tutor! I can only help with academic subjects like Math, Science, History, English, and more. Please ask me a study-related question! 📚"

    messages = [{"role": "system", "content": "You are a helpful study tutor for students. Only answer questions related to academic subjects. Be clear, educational and encouraging."}]
    
    for h in history[-6:]:
        messages.append({"role": h["role"], "content": h["content"]})
    
    messages.append({"role": "user", "content": message})
    
    response = client.chat.completions.create(
        model=MODEL,
        messages=messages,
        max_tokens=800,
    )
    return response.choices[0].message.content

import json
from collections import Counter

def knn_recommend_topics(user_tests, k=3):
    """
    KNN-based topic recommender.
    Finds k most similar past tests and recommends topics to study next.
    """
    if not user_tests or len(user_tests) < 2:
        return []

    # Convert tests to feature vectors [score, num_questions]
    def test_to_vector(t):
        return [t.get("score", 0), t.get("total", 10)]

    # Last test is our query point
    query = test_to_vector(user_tests[-1])
    past_tests = user_tests[:-1]

    # Calculate euclidean distance
    def distance(a, b):
        return ((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2) ** 0.5

    # Sort by distance and get k nearest
    distances = [(distance(query, test_to_vector(t)), t) for t in past_tests]
    distances.sort(key=lambda x: x[0])
    k_nearest = [t for _, t in distances[:k]]

    # Find weak subjects from nearest neighbors
    weak_subjects = []
    for t in k_nearest:
        if t.get("score", 100) < 70:
            weak_subjects.append(t.get("subject", ""))

    # Count most common weak subjects
    subject_counts = Counter(weak_subjects)
    recommendations = [subj for subj, _ in subject_counts.most_common(3) if subj]

    return recommendations

import random
from datetime import datetime, timedelta

def genetic_algorithm_timetable(subjects, exam_date_str, daily_hours, weak_subjects=[]):
    from datetime import datetime, timedelta
    import random

    try:
        exam_date = datetime.strptime(exam_date_str, "%Y-%m-%d")
        days_left = max((exam_date - datetime.now()).days, 1)
    except:
        days_left = 30

    days_left = min(days_left, 30)

    # Topic bank per subject for detailed tasks
    topic_templates = {
        "default": [
            "Introduction and fundamentals",
            "Core concepts and theory",
            "Problem solving practice",
            "Advanced topics",
            "Revision and mock questions",
            "Past paper practice",
            "Weak area reinforcement",
        ]
    }

    def get_topics_for_subject(subject, count):
        base_topics = [
            f"{subject} - Fundamentals & Introduction",
            f"{subject} - Core Concepts",
            f"{subject} - Formulas & Theorems",
            f"{subject} - Problem Solving Practice",
            f"{subject} - Advanced Topics",
            f"{subject} - Previous Year Questions",
            f"{subject} - Revision & Summary",
            f"{subject} - Mock Test Practice",
        ]
        topics = []
        for i in range(count):
            topics.append(base_topics[i % len(base_topics)])
        return topics

    POPULATION_SIZE = 20
    GENERATIONS = 50
    MUTATION_RATE = 0.2
    ELITE_SIZE = 4

    def create_chromosome():
        chromosome = []
        for _ in range(days_left):
            num_subjects = min(len(subjects), random.randint(1, 3))
            day_subjects = random.sample(subjects, num_subjects)
            hours_each = round(daily_hours / num_subjects, 1)
            chromosome.append([(s, hours_each) for s in day_subjects])
        return chromosome

    def fitness(chromosome):
        score = 0
        subject_coverage = {s: 0 for s in subjects}
        subject_hours = {s: 0.0 for s in subjects}
        for day in chromosome:
            for subject, hours in day:
                subject_coverage[subject] += 1
                subject_hours[subject] += hours
        for s in subjects:
            if subject_coverage[s] > 0:
                score += 10
        for s in weak_subjects:
            if s in subject_hours:
                score += subject_hours[s] * 3
        for s in subjects:
            if subject_coverage[s] == 0:
                score -= 20
        if subject_coverage:
            avg = sum(subject_coverage.values()) / len(subject_coverage)
            variance = sum((v - avg) ** 2 for v in subject_coverage.values())
            score -= variance * 0.5
        return score

    def crossover(parent1, parent2):
        point = random.randint(1, len(parent1) - 1)
        return parent1[:point] + parent2[point:]

    def mutate(chromosome):
        for i in range(len(chromosome)):
            if random.random() < MUTATION_RATE:
                num_subjects = min(len(subjects), random.randint(1, 3))
                day_subjects = random.sample(subjects, num_subjects)
                hours_each = round(daily_hours / num_subjects, 1)
                chromosome[i] = [(s, hours_each) for s in day_subjects]
        return chromosome

    def select_parents(population, fitnesses):
        tournament = random.sample(list(zip(population, fitnesses)), min(5, len(population)))
        return max(tournament, key=lambda x: x[1])[0]

    population = [create_chromosome() for _ in range(POPULATION_SIZE)]
    best_chromosome = None
    best_fitness = float('-inf')

    for generation in range(GENERATIONS):
        fitnesses = [fitness(c) for c in population]
        gen_best_idx = fitnesses.index(max(fitnesses))
        if fitnesses[gen_best_idx] > best_fitness:
            best_fitness = fitnesses[gen_best_idx]
            best_chromosome = population[gen_best_idx]
        sorted_pop = sorted(zip(population, fitnesses), key=lambda x: x[1], reverse=True)
        new_population = [c for c, _ in sorted_pop[:ELITE_SIZE]]
        while len(new_population) < POPULATION_SIZE:
            p1 = select_parents(population, fitnesses)
            p2 = select_parents(population, fitnesses)
            child = mutate(crossover(p1, p2))
            new_population.append(child)
        population = new_population

    today = datetime.now()
    timetable = []

    # Track topic index per subject for variety
    subject_topic_index = {s: 0 for s in subjects}

    for i, day in enumerate(best_chromosome):
        date = today + timedelta(days=i)
        sessions = []
        for s, h in day:
            topic_idx = subject_topic_index[s]
            topic = get_topics_for_subject(s, topic_idx + 1)[-1]
            subject_topic_index[s] += 1

            # Build what to do description
            descriptions = [
                f"Study {topic}. Read relevant chapters, make notes, and solve 5 practice problems.",
                f"Cover {topic}. Watch a video lecture, summarize key points, attempt exercises.",
                f"Practice {topic}. Solve previous year questions, identify weak areas.",
                f"Review {topic}. Create flashcards, test yourself with mock questions.",
            ]
            description = descriptions[subject_topic_index[s] % len(descriptions)]

            sessions.append({
                "subject": s,
                "topic": topic,
                "hours": h,
                "task_id": f"day_{i+1}_{s.replace(' ', '_')}",
                "description": description,
                "what_to_do": [
                    f"Open your {s} textbook/notes",
                    f"Study: {topic}",
                    f"Spend {h}h on this session",
                    "Solve at least 3 practice problems",
                    "Write a 5-line summary of what you learned"
                ]
            })

        timetable.append({
            "day": i + 1,
            "date": date.strftime("%d %b %Y"),
            "weekday": date.strftime("%A"),
            "sessions": sessions,
            "total_hours": sum(h for _, h in day),
            "task_id": f"day_{i+1}",
        })

    subject_total_hours = {s: 0.0 for s in subjects}
    for day in best_chromosome:
        for subject, hours in day:
            subject_total_hours[subject] += hours

    return {
        "timetable": timetable,
        "days_planned": days_left,
        "fitness_score": round(best_fitness, 2),
        "subject_hours": subject_total_hours,
        "weak_subjects_prioritized": weak_subjects,
    }