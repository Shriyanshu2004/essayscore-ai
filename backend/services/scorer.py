"""
Multi-Trait Essay Scorer.
Converts NLP analysis output into scores for each rubric trait.
All scores are normalized to 0-100 scale.
"""
from typing import Dict, Any, List
from .nlp_engine import analyze_essay


# ─────────────────────────────────────────────────────────────
# SCORING WEIGHTS AND CONFIGURATION
# ─────────────────────────────────────────────────────────────

TRAIT_WEIGHTS = {
    "Grammar":          1.0,
    "Coherence":        1.2,
    "Vocabulary":       0.8,
    "Argument Strength": 1.5,
    "Style":            0.7,
}

DEFAULT_TRAIT_MAX = 25.0  # per-trait max (out of 25, weighted to 100)


# ─────────────────────────────────────────────────────────────
# INDIVIDUAL TRAIT SCORERS
# ─────────────────────────────────────────────────────────────

def score_grammar(analysis: Dict[str, Any]) -> float:
    """Score grammar based on error count and severity (0–100)."""
    summary = analysis.get("grammar_summary", {})
    errors   = summary.get("error", 0)
    warnings = summary.get("warning", 0)
    total_words = analysis.get("basic_stats", {}).get("word_count", 200)

    # Error rate per 100 words
    error_rate   = (errors * 3 + warnings) / max(total_words / 100, 1)

    # Penalize by error rate
    if error_rate == 0:       score = 100
    elif error_rate < 1:      score = 95
    elif error_rate < 2:      score = 85
    elif error_rate < 4:      score = 72
    elif error_rate < 7:      score = 58
    elif error_rate < 10:     score = 42
    else:                     score = 25

    return round(score, 1)


def score_coherence(analysis: Dict[str, Any]) -> float:
    """Score coherence based on structure, transitions, paragraph balance (0–100)."""
    stats = analysis.get("basic_stats", {})
    vocab = analysis.get("vocabulary", {})

    para_count = stats.get("paragraph_count", 1)
    sent_count = stats.get("sentence_count", 1)
    avg_para_sents = stats.get("avg_paragraph_sentences", 3)
    transitions = vocab.get("transition_words_found", 0)
    sentence_lengths = analysis.get("sentence_lengths", {})
    std_dev = sentence_lengths.get("std_dev", 0)

    score = 50  # baseline

    # Paragraph structure bonus
    if para_count >= 3:   score += 15
    elif para_count >= 2: score += 7

    # Transition words bonus
    if transitions >= 5:  score += 20
    elif transitions >= 3: score += 12
    elif transitions >= 1: score += 5

    # Sentence variety (higher std_dev = more variety = better flow)
    if std_dev > 5:       score += 15
    elif std_dev > 3:     score += 8

    return round(min(100, score), 1)


def score_vocabulary(analysis: Dict[str, Any]) -> float:
    """Score vocabulary based on TTR, word sophistication, and diversity (0–100)."""
    vocab = analysis.get("vocabulary", {})

    ttr = vocab.get("type_token_ratio", 0.4)
    avg_word_len = vocab.get("avg_word_length", 4.5)
    simple_ratio = vocab.get("simple_word_ratio", 0.3)

    # Type-token ratio contribution (40 pts)
    ttr_score = min(40, ttr * 60)

    # Word length (sophistication) (30 pts)
    if avg_word_len >= 5.5:    length_score = 30
    elif avg_word_len >= 4.8:  length_score = 20
    elif avg_word_len >= 4.2:  length_score = 12
    else:                      length_score = 5

    # Simple word penalty (30 pts max)
    simple_score = max(0, 30 * (1 - simple_ratio * 2))

    return round(min(100, ttr_score + length_score + simple_score), 1)


def score_argument_strength(analysis: Dict[str, Any]) -> float:
    """Score argument quality based on structural completeness (0–100)."""
    arg = analysis.get("argumentation", {})
    stats = analysis.get("basic_stats", {})

    has_thesis    = arg.get("has_thesis", False)
    has_evidence  = arg.get("has_evidence", False)
    has_counter   = arg.get("has_counterargument", False)
    has_conclusion = arg.get("has_conclusion", False)
    completeness  = arg.get("argument_completeness", 0)

    score = 0
    if has_thesis:     score += 25
    if has_evidence:   score += 30
    if has_counter:    score += 25
    if has_conclusion: score += 20

    # Word count bonus (longer essays tend to have more developed arguments)
    word_count = stats.get("word_count", 0)
    if word_count >= 500:   score = min(100, score + 5)
    if word_count >= 700:   score = min(100, score + 5)

    return round(score, 1)


def score_style(analysis: Dict[str, Any]) -> float:
    """Score writing style based on readability, passive voice, sentence variety (0–100)."""
    readability = analysis.get("readability", {})
    passive = analysis.get("passive_voice", {})
    sentence_lengths = analysis.get("sentence_lengths", {})

    flesch = readability.get("flesch_reading_ease", 50)
    passive_pct = passive.get("passive_percentage", 0)
    std_dev = sentence_lengths.get("std_dev", 0)

    # Flesch Reading Ease: 60-80 is ideal for academic writing
    if 50 <= flesch <= 80:    flesch_score = 40
    elif 40 <= flesch < 50:   flesch_score = 30
    elif 80 < flesch <= 90:   flesch_score = 28
    else:                     flesch_score = 15

    # Passive voice (lower is better for most writing)
    if passive_pct < 10:      passive_score = 30
    elif passive_pct < 20:    passive_score = 22
    elif passive_pct < 30:    passive_score = 14
    else:                     passive_score = 5

    # Sentence variety
    if std_dev > 5:           variety_score = 30
    elif std_dev > 3:         variety_score = 20
    elif std_dev > 1:         variety_score = 12
    else:                     variety_score = 5

    return round(min(100, flesch_score + passive_score + variety_score), 1)


# ─────────────────────────────────────────────────────────────
# MASTER SCORER
# ─────────────────────────────────────────────────────────────

def compute_trait_scores(text: str) -> Dict[str, Any]:
    """Run full NLP analysis and return trait scores + weighted total."""
    analysis = analyze_essay(text)

    raw_scores = {
        "Grammar":          score_grammar(analysis),
        "Coherence":        score_coherence(analysis),
        "Vocabulary":       score_vocabulary(analysis),
        "Argument Strength": score_argument_strength(analysis),
        "Style":            score_style(analysis),
    }

    # Weighted average
    total_weight = sum(TRAIT_WEIGHTS.values())
    weighted_sum = sum(raw_scores[t] * TRAIT_WEIGHTS[t] for t in raw_scores)
    weighted_total = round(weighted_sum / total_weight, 1)

    # Build trait detail objects
    traits = []
    for trait_name, score in raw_scores.items():
        traits.append({
            "trait_name":   trait_name,
            "score":        score,
            "max_score":    100,
            "raw_score":    round(score * DEFAULT_TRAIT_MAX / 100, 1),
            "max_raw":      DEFAULT_TRAIT_MAX,
            "weight":       TRAIT_WEIGHTS[trait_name],
            "grade":        _score_to_grade(score),
        })

    return {
        "overall_score":   weighted_total,
        "overall_grade":   _score_to_grade(weighted_total),
        "traits":          traits,
        "raw_analysis":    analysis,
    }


def _score_to_grade(score: float) -> str:
    if score >= 90:   return "A+"
    elif score >= 80: return "A"
    elif score >= 70: return "B"
    elif score >= 60: return "C"
    elif score >= 50: return "D"
    else:             return "F"


def score_essay(text: str) -> Dict[str, Any]:
    """Public API: score an essay and return all data."""
    return compute_trait_scores(text)
