"""
NLP Engine — Core text analysis pipeline.
Provides grammar checking, readability metrics, style analysis,
and vocabulary analysis without requiring paid APIs.
"""
import re
import math
from typing import List, Dict, Any, Tuple

# ─────────────────────────────────────────────────────────────
# Try importing optional heavy libraries; fall back gracefully
# ─────────────────────────────────────────────────────────────
try:
    import textstat
    HAS_TEXTSTAT = True
except ImportError:
    HAS_TEXTSTAT = False

try:
    import nltk
    nltk.download("punkt", quiet=True)
    nltk.download("punkt_tab", quiet=True)
    nltk.download("averaged_perceptron_tagger", quiet=True)
    nltk.download("stopwords", quiet=True)
    from nltk.tokenize import sent_tokenize, word_tokenize
    from nltk.corpus import stopwords
    HAS_NLTK = True
except ImportError:
    HAS_NLTK = False


# ─────────────────────────────────────────────────────────────
# TOKENIZATION UTILITIES
# ─────────────────────────────────────────────────────────────

def tokenize_sentences(text: str) -> List[str]:
    if HAS_NLTK:
        return sent_tokenize(text)
    # Regex fallback
    return [s.strip() for s in re.split(r'(?<=[.!?])\s+', text) if s.strip()]


def tokenize_words(text: str) -> List[str]:
    if HAS_NLTK:
        return word_tokenize(text)
    return re.findall(r'\b[a-zA-Z]+\b', text.lower())


def get_paragraphs(text: str) -> List[str]:
    return [p.strip() for p in re.split(r'\n{2,}', text.strip()) if p.strip()]


# ─────────────────────────────────────────────────────────────
# BASIC TEXT STATISTICS
# ─────────────────────────────────────────────────────────────

def compute_basic_stats(text: str) -> Dict[str, Any]:
    sentences = tokenize_sentences(text)
    words = tokenize_words(text)
    paragraphs = get_paragraphs(text)
    unique_words = set(w.lower() for w in words if w.isalpha())

    avg_sentence_len = len(words) / max(len(sentences), 1)
    avg_para_len = len(sentences) / max(len(paragraphs), 1)

    return {
        "word_count": len(words),
        "sentence_count": len(sentences),
        "paragraph_count": len(paragraphs),
        "unique_word_count": len(unique_words),
        "avg_sentence_length": round(avg_sentence_len, 1),
        "avg_paragraph_sentences": round(avg_para_len, 1),
        "type_token_ratio": round(len(unique_words) / max(len(words), 1), 3),
    }


# ─────────────────────────────────────────────────────────────
# READABILITY SCORES
# ─────────────────────────────────────────────────────────────

def _count_syllables(word: str) -> int:
    """Rough syllable counter using vowel group heuristic."""
    word = word.lower().rstrip("e")
    vowels = "aeiou"
    count = 0
    prev_vowel = False
    for char in word:
        is_vowel = char in vowels
        if is_vowel and not prev_vowel:
            count += 1
        prev_vowel = is_vowel
    return max(count, 1)


def compute_readability(text: str) -> Dict[str, Any]:
    if HAS_TEXTSTAT:
        return {
            "flesch_reading_ease":    round(textstat.flesch_reading_ease(text), 1),
            "flesch_kincaid_grade":   round(textstat.flesch_kincaid_grade(text), 1),
            "gunning_fog_index":      round(textstat.gunning_fog(text), 1),
            "smog_index":             round(textstat.smog_index(text), 1),
            "automated_readability":  round(textstat.automated_readability_index(text), 1),
            "reading_level":          textstat.text_standard(text, float_output=False),
        }

    # Manual Flesch calculation as fallback
    words = tokenize_words(text)
    sentences = tokenize_sentences(text)
    syllables = sum(_count_syllables(w) for w in words)

    num_words = max(len(words), 1)
    num_sents = max(len(sentences), 1)

    flesch = 206.835 - 1.015 * (num_words / num_sents) - 84.6 * (syllables / num_words)
    flesch = round(max(0, min(100, flesch)), 1)

    fk_grade = 0.39 * (num_words / num_sents) + 11.8 * (syllables / num_words) - 15.59
    fk_grade = round(max(1, fk_grade), 1)

    # Estimate reading level from Flesch
    if flesch >= 90:    level = "5th grade"
    elif flesch >= 70:  level = "6th-7th grade"
    elif flesch >= 60:  level = "8th-9th grade"
    elif flesch >= 50:  level = "10th-12th grade"
    elif flesch >= 30:  level = "College"
    else:               level = "College Graduate"

    return {
        "flesch_reading_ease":    flesch,
        "flesch_kincaid_grade":   fk_grade,
        "gunning_fog_index":      round(fk_grade + 2.5, 1),
        "smog_index":             round(fk_grade + 1.2, 1),
        "automated_readability":  round(fk_grade - 0.5, 1),
        "reading_level":          level,
    }


# ─────────────────────────────────────────────────────────────
# GRAMMAR CHECKING (regex-based heuristics)
# ─────────────────────────────────────────────────────────────

GRAMMAR_RULES = [
    # (pattern, message, suggestion, type, severity)
    (r'\bi\b(?![\'.])',        "Capitalize 'I'",                           "'I'",         "capitalization", "error"),
    (r'\b(a)\s+[aeiou]',       "Use 'an' before vowel sounds",             "'an'",        "article_usage",  "error"),
    (r'\b(an)\s+[^aeiou\s]',   "Use 'a' before consonant sounds",          "'a'",         "article_usage",  "error"),
    (r'\s{2,}',                "Extra whitespace",                         "single space","whitespace",     "info"),
    (r'\b(\w+)\s+\1\b',        "Repeated word",                            "remove one",  "repetition",     "warning"),
    (r',\s*and\s*,',            "Comma before 'and' in list",               "remove comma","punctuation",    "warning"),
    (r'\b(their|there|they\'re)\b', "Verify homophones their/there/they're", "check usage","homophone",      "info"),
    (r'\b(your|you\'re)\b',    "Verify your/you're usage",                  "check usage","homophone",      "info"),
    (r'\b(its|it\'s)\b',       "Verify its/it's usage",                    "check usage","homophone",      "info"),
    (r'\b(affect|effect)\b',   "Verify affect/effect usage",               "check usage","homophone",      "info"),
    (r'[.!?][a-z]',            "Sentence should start with capital letter", "Capitalize",  "capitalization", "error"),
    (r'\b(alot)\b',            "'alot' is not a word",                     "'a lot'",     "spelling",       "error"),
    (r'\b(definately)\b',      "Spelling error",                           "'definitely'","spelling",       "error"),
    (r'\b(recieve)\b',         "Spelling error",                           "'receive'",   "spelling",       "error"),
    (r'\b(occured)\b',         "Spelling error",                           "'occurred'",  "spelling",       "error"),
    (r'\b(seperate)\b',        "Spelling error",                           "'separate'",  "spelling",       "error"),
    (r'\b(arguement)\b',       "Spelling error",                           "'argument'",  "spelling",       "error"),
    (r'\b(wierd)\b',           "Spelling error",                           "'weird'",     "spelling",       "error"),
]


def check_grammar(text: str) -> List[Dict[str, Any]]:
    """Return list of grammar/spelling issues with offsets."""
    issues = []
    for pattern, message, suggestion, rule_type, severity in GRAMMAR_RULES:
        for match in re.finditer(pattern, text, re.IGNORECASE):
            issues.append({
                "start_offset": match.start(),
                "end_offset": match.end(),
                "annotation_type": "grammar",
                "severity": severity,
                "message": message,
                "suggestion": suggestion,
                "rule_id": rule_type,
                "matched_text": match.group(),
            })
    # Deduplicate overlapping issues
    issues.sort(key=lambda x: x["start_offset"])
    deduped = []
    last_end = -1
    for issue in issues:
        if issue["start_offset"] >= last_end:
            deduped.append(issue)
            last_end = issue["end_offset"]
    return deduped


def count_grammar_errors(text: str) -> Dict[str, int]:
    issues = check_grammar(text)
    by_severity = {"error": 0, "warning": 0, "info": 0}
    for issue in issues:
        by_severity[issue.get("severity", "info")] += 1
    return {"total": len(issues), **by_severity}


# ─────────────────────────────────────────────────────────────
# PASSIVE VOICE DETECTION
# ─────────────────────────────────────────────────────────────

PASSIVE_PATTERN = re.compile(
    r'\b(am|is|are|was|were|be|been|being)\s+'
    r'([\w]+ed|[\w]+en)\b',
    re.IGNORECASE
)

def detect_passive_voice(text: str) -> Dict[str, Any]:
    sentences = tokenize_sentences(text)
    passive_sentences = []
    for sent in sentences:
        if PASSIVE_PATTERN.search(sent):
            passive_sentences.append(sent)

    pct = round(len(passive_sentences) / max(len(sentences), 1) * 100, 1)
    return {
        "passive_sentence_count": len(passive_sentences),
        "total_sentences": len(sentences),
        "passive_percentage": pct,
        "passive_sentences": passive_sentences[:5],  # sample
        "assessment": "High" if pct > 30 else "Moderate" if pct > 15 else "Low",
    }


# ─────────────────────────────────────────────────────────────
# SENTENCE LENGTH DISTRIBUTION
# ─────────────────────────────────────────────────────────────

def analyze_sentence_lengths(text: str) -> Dict[str, Any]:
    sentences = tokenize_sentences(text)
    lengths = [len(tokenize_words(s)) for s in sentences]
    if not lengths:
        return {}

    avg = sum(lengths) / len(lengths)
    variance = sum((l - avg) ** 2 for l in lengths) / len(lengths)

    distribution = {"short(1-8)": 0, "medium(9-18)": 0, "long(19-30)": 0, "very_long(30+)": 0}
    for l in lengths:
        if l <= 8:       distribution["short(1-8)"] += 1
        elif l <= 18:    distribution["medium(9-18)"] += 1
        elif l <= 30:    distribution["long(19-30)"] += 1
        else:            distribution["very_long(30+)"] += 1

    return {
        "min_length": min(lengths),
        "max_length": max(lengths),
        "avg_length": round(avg, 1),
        "std_dev": round(math.sqrt(variance), 1),
        "distribution": distribution,
        "lengths": lengths,
    }


# ─────────────────────────────────────────────────────────────
# VOCABULARY ANALYSIS
# ─────────────────────────────────────────────────────────────

# Common/simple words that suggest basic vocabulary
SIMPLE_WORDS = {
    "good", "bad", "big", "small", "nice", "great", "very", "really",
    "a lot", "thing", "stuff", "people", "think", "know", "get", "make",
    "go", "see", "come", "take", "give", "look", "want", "need"
}

# Transition words indicating coherence
TRANSITION_WORDS = {
    "however", "furthermore", "moreover", "therefore", "consequently",
    "additionally", "nonetheless", "nevertheless", "subsequently", "accordingly",
    "in contrast", "on the other hand", "in conclusion", "as a result",
    "for instance", "for example", "in particular", "specifically",
    "firstly", "secondly", "finally", "ultimately", "overall"
}

ARGUMENT_INDICATORS = {
    "thesis": ["argue", "claim", "assert", "contend", "maintain", "propose"],
    "evidence": ["research", "study", "data", "statistics", "evidence", "according", "findings", "demonstrates"],
    "counterargument": ["however", "although", "despite", "opponents", "critics", "counterargument", "while", "though"],
    "conclusion": ["therefore", "thus", "consequently", "in conclusion", "ultimately"],
}


def analyze_vocabulary(text: str) -> Dict[str, Any]:
    words = tokenize_words(text)
    words_lower = [w.lower() for w in words if w.isalpha()]

    simple_count = sum(1 for w in words_lower if w in SIMPLE_WORDS)
    transition_count = sum(1 for t in TRANSITION_WORDS if t in text.lower())

    # Lexical diversity
    ttr = len(set(words_lower)) / max(len(words_lower), 1)

    # Average word length as proxy for sophistication
    avg_word_len = sum(len(w) for w in words_lower) / max(len(words_lower), 1)

    return {
        "type_token_ratio": round(ttr, 3),
        "avg_word_length": round(avg_word_len, 1),
        "simple_word_count": simple_count,
        "simple_word_ratio": round(simple_count / max(len(words_lower), 1), 3),
        "transition_words_found": transition_count,
        "vocabulary_level": "Advanced" if ttr > 0.7 else "Intermediate" if ttr > 0.5 else "Basic",
    }


def analyze_argumentation(text: str) -> Dict[str, Any]:
    text_lower = text.lower()
    found = {cat: [] for cat in ARGUMENT_INDICATORS}
    for category, keywords in ARGUMENT_INDICATORS.items():
        for kw in keywords:
            if kw in text_lower:
                found[category].append(kw)

    has_thesis = len(found["thesis"]) > 0
    has_evidence = len(found["evidence"]) >= 2
    has_counter = len(found["counterargument"]) > 0
    has_conclusion = len(found["conclusion"]) > 0

    completeness = sum([has_thesis, has_evidence, has_counter, has_conclusion]) / 4

    return {
        "has_thesis": has_thesis,
        "has_evidence": has_evidence,
        "has_counterargument": has_counter,
        "has_conclusion": has_conclusion,
        "argument_completeness": round(completeness * 100, 1),
        "indicators_found": found,
        "strength": "Strong" if completeness >= 0.75 else "Moderate" if completeness >= 0.5 else "Weak",
    }


# ─────────────────────────────────────────────────────────────
# FULL ANALYSIS PIPELINE
# ─────────────────────────────────────────────────────────────

def analyze_essay(text: str) -> Dict[str, Any]:
    """Run all NLP analyses and return a complete profile."""
    return {
        "basic_stats":        compute_basic_stats(text),
        "readability":        compute_readability(text),
        "grammar_issues":     check_grammar(text),
        "grammar_summary":    count_grammar_errors(text),
        "passive_voice":      detect_passive_voice(text),
        "sentence_lengths":   analyze_sentence_lengths(text),
        "vocabulary":         analyze_vocabulary(text),
        "argumentation":      analyze_argumentation(text),
    }
