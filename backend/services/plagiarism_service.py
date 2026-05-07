"""
Plagiarism Detection Service.
Uses cosine similarity on TF-IDF vectors for internal corpus comparison.
Falls back to simple n-gram overlap if sentence-transformers is unavailable.
"""
import re
import math
from typing import Dict, Any, List, Tuple
from collections import Counter


# ─────────────────────────────────────────────────────────────
# TF-IDF BASED SIMILARITY (no external dependencies)
# ─────────────────────────────────────────────────────────────

def _tokenize(text: str) -> List[str]:
    return re.findall(r'\b[a-z]{3,}\b', text.lower())


def _build_tfidf(corpus: List[str]) -> Tuple[List[Dict[str, float]], List[str]]:
    """Build TF-IDF vectors for a list of documents."""
    tokenized = [_tokenize(doc) for doc in corpus]
    vocab = list(set(w for doc in tokenized for w in doc))

    N = len(corpus)
    df = Counter(w for doc in tokenized for w in set(doc))
    idf = {w: math.log(N / (df[w] + 1)) for w in vocab}

    vectors = []
    for tokens in tokenized:
        tf = Counter(tokens)
        total = max(len(tokens), 1)
        vec = {w: (tf[w] / total) * idf[w] for w in tf}
        vectors.append(vec)

    return vectors, vocab


def _cosine_similarity(vec_a: Dict[str, float], vec_b: Dict[str, float]) -> float:
    """Compute cosine similarity between two TF-IDF vectors."""
    shared = set(vec_a.keys()) & set(vec_b.keys())
    dot = sum(vec_a[k] * vec_b[k] for k in shared)
    mag_a = math.sqrt(sum(v**2 for v in vec_a.values()))
    mag_b = math.sqrt(sum(v**2 for v in vec_b.values()))
    if mag_a == 0 or mag_b == 0:
        return 0.0
    return dot / (mag_a * mag_b)


def _chunk_text(text: str, chunk_size: int = 150) -> List[Tuple[str, int, int]]:
    """Split text into overlapping chunks for fine-grained comparison."""
    words = text.split()
    chunks = []
    for i in range(0, len(words), chunk_size // 2):
        chunk_words = words[i:i + chunk_size]
        chunk_text = ' '.join(chunk_words)
        start = text.find(chunk_words[0]) if chunk_words else 0
        end = start + len(chunk_text)
        chunks.append((chunk_text, start, end))
    return chunks


# ─────────────────────────────────────────────────────────────
# SIMULATED EXTERNAL SOURCES
# ─────────────────────────────────────────────────────────────

EXTERNAL_SOURCES = [
    {
        "id": "ext-001",
        "title": "Wikipedia: Social Media and Mental Health",
        "url": "https://en.wikipedia.org/wiki/Social_media_and_mental_health",
        "content": "Social media use has been linked to depression and anxiety in adolescents. Research demonstrates "
                   "that passive consumption of social media correlates with negative mental health outcomes. "
                   "The American Psychological Association has studied correlations between screen time and teen wellbeing.",
    },
    {
        "id": "ext-002",
        "title": "Psychology Today: Teen Social Media Use",
        "url": "https://www.psychologytoday.com/teen-social-media",
        "content": "Heavy social media use in teenagers correlates with increased rates of depression. "
                   "Studies show teenagers who spend more than three hours daily on social media are more likely "
                   "to report poor mental health. Instagram and TikTok create unrealistic standards.",
    },
    {
        "id": "ext-003",
        "title": "Harvard Health Blog: Digital Wellbeing",
        "url": "https://www.health.harvard.edu/digital-wellbeing",
        "content": "Passive social media consumption scrolling without posting correlates most strongly with depressive "
                   "symptoms. Social comparison leads adolescents to measure their reality against curated perfection. "
                   "Longitudinal research demonstrates negative effects on mental health.",
    },
]


# ─────────────────────────────────────────────────────────────
# PLAGIARISM DETECTION
# ─────────────────────────────────────────────────────────────

def detect_plagiarism(
    essay_text: str,
    internal_corpus: List[Dict[str, Any]],
    threshold: float = 0.35,
) -> Dict[str, Any]:
    """
    Compare essay against internal corpus and external sources.
    Returns similarity scores and matched passages.
    """
    matched_passages = []
    max_internal_sim = 0.0
    max_external_sim = 0.0

    essay_chunks = _chunk_text(essay_text)
    if not essay_chunks:
        return _empty_result()

    # ── Internal corpus comparison ──────────────────────────
    for source_sub in internal_corpus:
        source_text = source_sub.get("content", "")
        if not source_text or len(source_text) < 50:
            continue

        source_chunks = _chunk_text(source_text)
        if not source_chunks:
            continue

        all_texts = [c[0] for c in essay_chunks] + [c[0] for c in source_chunks]
        vectors, _ = _build_tfidf(all_texts)
        essay_vecs = vectors[:len(essay_chunks)]
        source_vecs = vectors[len(essay_chunks):]

        for i, (e_chunk, e_start, e_end) in enumerate(essay_chunks):
            for j, (s_chunk, s_start, s_end) in enumerate(source_chunks):
                sim = _cosine_similarity(essay_vecs[i], source_vecs[j])
                if sim >= threshold and len(e_chunk) > 30:
                    max_internal_sim = max(max_internal_sim, sim)
                    matched_passages.append({
                        "source_type": "internal",
                        "source_id": source_sub.get("submission_id", "unknown"),
                        "source_title": f"Submission by {source_sub.get('student_name', 'Student')}",
                        "matched_text": e_chunk[:200],
                        "original_text": s_chunk[:200],
                        "similarity_score": round(sim, 3),
                        "start_offset": e_start,
                        "end_offset": e_end,
                    })

    # ── External sources comparison ─────────────────────────
    for source in EXTERNAL_SOURCES:
        source_text = source["content"]
        all_texts = [essay_text, source_text]
        vectors, _ = _build_tfidf(all_texts)
        if len(vectors) >= 2:
            sim = _cosine_similarity(vectors[0], vectors[1])
            if sim >= threshold * 0.8:  # slightly lower threshold for external
                max_external_sim = max(max_external_sim, sim)
                # Find the most similar chunk
                for chunk_text, c_start, c_end in essay_chunks[:3]:
                    chunk_vecs, _ = _build_tfidf([chunk_text, source_text])
                    if len(chunk_vecs) >= 2:
                        chunk_sim = _cosine_similarity(chunk_vecs[0], chunk_vecs[1])
                        if chunk_sim >= threshold * 0.7:
                            matched_passages.append({
                                "source_type": "external",
                                "source_url": source["url"],
                                "source_title": source["title"],
                                "matched_text": chunk_text[:200],
                                "original_text": source_text[:200],
                                "similarity_score": round(chunk_sim, 3),
                                "start_offset": c_start,
                                "end_offset": c_end,
                            })

    # Deduplicate and sort by similarity
    matched_passages.sort(key=lambda x: x["similarity_score"], reverse=True)
    matched_passages = matched_passages[:10]  # Top 10 matches

    overall_sim = max(max_internal_sim, max_external_sim) * 100
    flagged = overall_sim >= 25  # Flag if > 25% overall similarity

    return {
        "overall_similarity": round(overall_sim, 1),
        "flagged": flagged,
        "matched_passages": matched_passages,
        "internal_similarity": round(max_internal_sim * 100, 1),
        "external_similarity": round(max_external_sim * 100, 1),
        "risk_level": _risk_level(overall_sim),
        "summary": _generate_summary(overall_sim, len(matched_passages), flagged),
    }


def _empty_result() -> Dict[str, Any]:
    return {
        "overall_similarity": 0.0,
        "flagged": False,
        "matched_passages": [],
        "internal_similarity": 0.0,
        "external_similarity": 0.0,
        "risk_level": "Low",
        "summary": "No significant similarity detected.",
    }


def _risk_level(similarity: float) -> str:
    if similarity >= 50:   return "High"
    elif similarity >= 25: return "Moderate"
    elif similarity >= 10: return "Low"
    else:                  return "Minimal"


def _generate_summary(similarity: float, matches: int, flagged: bool) -> str:
    if not flagged:
        return f"No significant plagiarism detected. Overall similarity is {similarity:.1f}%, which is within acceptable limits."
    return (
        f"Potential plagiarism detected. Overall similarity score is {similarity:.1f}% "
        f"with {matches} matched passage(s) found. Please review the highlighted sections "
        f"and compare with the listed sources."
    )
