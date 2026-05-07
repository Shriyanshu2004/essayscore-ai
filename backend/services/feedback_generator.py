"""
Template-based feedback generator.
Produces coherent, personalized feedback for each trait
without requiring an LLM API key.
"""
from typing import Dict, Any, List
import random


# ─────────────────────────────────────────────────────────────
# FEEDBACK TEMPLATES BY TRAIT AND PERFORMANCE LEVEL
# ─────────────────────────────────────────────────────────────

GRAMMAR_TEMPLATES = {
    "high": {
        "feedback": "Your writing demonstrates strong command of grammar and mechanics. Sentences are well-constructed with minimal errors, allowing your ideas to shine through clearly.",
        "strengths": ["Consistent capitalization and punctuation", "Correct subject-verb agreement", "Effective sentence variety"],
        "improvements": ["Continue reviewing comma usage in complex sentences", "Watch for occasional article errors (a/an)"],
    },
    "medium": {
        "feedback": "Your writing shows a reasonable grasp of grammar, though there are several recurring errors that occasionally disrupt the reading experience. Focused revision will significantly improve your score.",
        "strengths": ["Generally clear sentence construction", "Appropriate paragraph breaks"],
        "improvements": ["Review homophones (their/there/they're, your/you're)", "Check for repeated words", "Proofread for capitalization at sentence starts"],
    },
    "low": {
        "feedback": "Grammar and mechanics issues are frequent in this essay and significantly impede comprehension. Systematic proofreading and grammar review are strongly recommended before resubmission.",
        "strengths": ["Ideas are present even if expression needs refinement"],
        "improvements": ["Review basic sentence structure and capitalization", "Use spell-check and grammar tools", "Read the essay aloud to catch errors", "Focus on one grammar rule at a time"],
    },
}

COHERENCE_TEMPLATES = {
    "high": {
        "feedback": "Your essay is exceptionally well-organized with a clear introduction, developed body paragraphs, and a strong conclusion. Transitions guide the reader smoothly between ideas.",
        "strengths": ["Clear three-part structure", "Effective use of transition words", "Balanced paragraph lengths", "Logical progression of ideas"],
        "improvements": ["Consider varying your transition vocabulary for more sophistication"],
    },
    "medium": {
        "feedback": "Your essay has a recognizable structure, but some transitions are abrupt and the connection between paragraphs could be strengthened. Work on signposting your argument more explicitly.",
        "strengths": ["Basic organizational structure is present", "Paragraphs generally focused on one idea"],
        "improvements": ["Add transition sentences at the end/beginning of body paragraphs", "Use discourse markers (however, furthermore, consequently)", "Ensure each paragraph connects back to your thesis"],
    },
    "low": {
        "feedback": "The essay lacks a clear organizational structure, making it difficult to follow your argument. Ideas appear somewhat random rather than building toward a coherent conclusion.",
        "strengths": ["Some relevant ideas are present"],
        "improvements": ["Create an outline before writing with Introduction, 2-3 body paragraphs, Conclusion", "Start each paragraph with a clear topic sentence", "Use transition words to connect ideas", "Ensure your introduction ends with a thesis statement"],
    },
}

VOCABULARY_TEMPLATES = {
    "high": {
        "feedback": "You demonstrate an impressive and varied vocabulary that enhances your argument. Your word choices are precise, sophisticated, and appropriate for academic writing.",
        "strengths": ["High lexical diversity", "Precise and domain-appropriate terminology", "Effective use of academic language"],
        "improvements": ["Occasionally vary your most-used academic phrases for even greater sophistication"],
    },
    "medium": {
        "feedback": "Your vocabulary is adequate for academic writing, though some word choices are repetitive or overly simple. Expanding your academic word list will significantly strengthen your writing.",
        "strengths": ["Appropriate word choices for the topic", "Some variety in expression"],
        "improvements": ["Replace vague words (good, bad, things) with specific alternatives", "Use a thesaurus to find stronger synonyms", "Incorporate more domain-specific terminology"],
    },
    "low": {
        "feedback": "Vocabulary is limited and frequently relies on simple, imprecise language. Academic writing requires a broader and more varied word choice to convey ideas effectively.",
        "strengths": ["Communication intent is clear"],
        "improvements": ["Build academic vocabulary by reading essays in your subject area", "Replace simple words: 'good' → 'effective/beneficial', 'bad' → 'detrimental/problematic'", "Avoid informal language and contractions in academic writing"],
    },
}

ARGUMENT_TEMPLATES = {
    "high": {
        "feedback": "Your argument is logically structured, persuasive, and well-supported. The thesis is clear and specific, evidence is relevant and properly contextualized, and you address counterarguments thoughtfully.",
        "strengths": ["Clear, arguable thesis statement", "Specific evidence with source citation", "Effective counterargument and rebuttal", "Strong concluding synthesis"],
        "improvements": ["Consider incorporating more diverse types of evidence (anecdotal, statistical, expert opinion)"],
    },
    "medium": {
        "feedback": "Your argument has a recognizable structure with a thesis and supporting points, but the evidence could be stronger and the counterargument is either missing or underdeveloped.",
        "strengths": ["Thesis statement is identifiable", "Some supporting evidence provided"],
        "improvements": ["Strengthen evidence with specific statistics, research, or expert quotes", "Add a dedicated counterargument paragraph with a rebuttal", "Make your thesis more specific and arguable", "Ensure each body paragraph directly supports your thesis"],
    },
    "low": {
        "feedback": "The essay does not present a clear argument. There is no identifiable thesis, evidence is missing or anecdotal, and the piece reads more as a general discussion than a persuasive essay.",
        "strengths": ["Topic is relevant to the assignment"],
        "improvements": ["Start with a one-sentence thesis that makes a specific, arguable claim", "Include at least 2-3 pieces of research evidence with citations", "Structure: Intro+Thesis → Evidence 1 → Evidence 2 → Counterargument → Conclusion", "Every body paragraph should start with a topic sentence linking to your thesis"],
    },
}

STYLE_TEMPLATES = {
    "high": {
        "feedback": "Your writing style is engaging, appropriately formal, and demonstrates a distinctive voice. Sentence structures are varied and the prose flows naturally.",
        "strengths": ["Distinctive and consistent academic voice", "Good sentence length variation", "Appropriate tone for the assignment", "Minimal passive voice overuse"],
        "improvements": ["Experiment with more complex sentence structures for even greater sophistication"],
    },
    "medium": {
        "feedback": "Your writing style is functional but could be more engaging. Sentence structures are somewhat repetitive and the tone occasionally shifts between formal and informal.",
        "strengths": ["Generally appropriate academic tone", "Some sentence variety present"],
        "improvements": ["Vary sentence openings (avoid starting multiple sentences with 'The')", "Reduce passive voice constructions", "Maintain consistent formal tone throughout", "Use more specific, vivid language"],
    },
    "low": {
        "feedback": "The writing style is informal and inconsistent, which undermines the academic quality of the essay. Significant revision of tone and sentence structure is recommended.",
        "strengths": ["Ideas are communicated, if not always clearly"],
        "improvements": ["Remove informal language (I think, I feel, stuff, things)", "Vary your sentence length — mix short punchy sentences with longer complex ones", "Eliminate passive voice where possible", "Read published essays in this genre to develop a sense of academic style"],
    },
}

TRAIT_TEMPLATES = {
    "Grammar":          GRAMMAR_TEMPLATES,
    "Coherence":        COHERENCE_TEMPLATES,
    "Vocabulary":       VOCABULARY_TEMPLATES,
    "Argument Strength": ARGUMENT_TEMPLATES,
    "Style":            STYLE_TEMPLATES,
}

HOLISTIC_TEMPLATES = {
    "high": [
        "This is an outstanding essay that demonstrates sophisticated writing skills across all evaluated dimensions. Your argument is compelling, your evidence well-chosen, and your prose polished. With minor refinements, this could serve as a model essay.",
        "Excellent work overall. This essay reflects strong critical thinking and writing craft. You've successfully met the assignment's demands and demonstrated genuine mastery of argumentative writing.",
    ],
    "medium": [
        "This essay shows solid understanding of the assignment and genuine effort. Your core argument is sound, and with focused revision—particularly on evidence development and grammatical accuracy—this has strong potential for improvement.",
        "A competent response to the assignment with room for meaningful growth. Your ideas are on the right track; the key is now refining your expression and strengthening your argument's structure.",
    ],
    "low": [
        "This essay needs significant revision to meet the assignment's expectations. The foundation of your ideas is there, but the argument needs clearer structure, stronger evidence, and more careful attention to grammar. I encourage you to revise using the feedback provided.",
        "While your topic engagement is evident, this draft needs considerable development. Focus on establishing a clear thesis, supporting it with specific evidence, and proofreading for grammatical errors. Don't hesitate to visit the writing center for additional support.",
    ],
}


def _level(score: float) -> str:
    if score >= 75:   return "high"
    elif score >= 50: return "medium"
    else:             return "low"


def generate_trait_feedback(trait_name: str, score: float) -> Dict[str, Any]:
    """Generate feedback for a single trait based on score."""
    templates = TRAIT_TEMPLATES.get(trait_name, GRAMMAR_TEMPLATES)
    level = _level(score)
    tmpl = templates[level]

    return {
        "trait_name":   trait_name,
        "score":        score,
        "level":        level,
        "feedback":     tmpl["feedback"],
        "strengths":    tmpl["strengths"],
        "improvements": tmpl["improvements"],
    }


def generate_holistic_feedback(overall_score: float, trait_scores: Dict[str, float]) -> str:
    """Generate overall holistic feedback considering all traits."""
    level = _level(overall_score)
    templates = HOLISTIC_TEMPLATES[level]
    base = random.choice(templates)

    # Find weakest and strongest traits
    if trait_scores:
        weakest = min(trait_scores, key=trait_scores.get)
        strongest = max(trait_scores, key=trait_scores.get)
        base += f" Pay particular attention to improving your {weakest.lower()}, which is your area of greatest growth potential. Your {strongest.lower()} is your strongest dimension—continue building on this strength."

    return base


def generate_full_feedback(scoring_result: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate complete feedback from a scoring result.
    Input: output from scorer.score_essay()
    Output: feedback document ready for MongoDB storage
    """
    overall = scoring_result.get("overall_score", 0)
    traits = scoring_result.get("traits", [])

    trait_scores = {t["trait_name"]: t["score"] for t in traits}
    trait_feedback = [generate_trait_feedback(t["trait_name"], t["score"]) for t in traits]
    holistic = generate_holistic_feedback(overall, trait_scores)

    # Generate inline annotations from grammar issues
    annotations = []
    grammar_issues = scoring_result.get("raw_analysis", {}).get("grammar_issues", [])
    for issue in grammar_issues[:20]:  # cap at 20 annotations
        annotations.append({
            "start_offset":     issue["start_offset"],
            "end_offset":       issue["end_offset"],
            "annotation_type":  issue.get("annotation_type", "grammar"),
            "severity":         issue.get("severity", "warning"),
            "message":          issue["message"],
            "suggestion":       issue.get("suggestion"),
            "rule_id":          issue.get("rule_id"),
        })

    # Add style annotations for passive voice
    passive_sents = scoring_result.get("raw_analysis", {}).get("passive_voice", {}).get("passive_sentences", [])
    for sent in passive_sents[:3]:
        annotations.append({
            "start_offset": 0,
            "end_offset": len(sent),
            "annotation_type": "style",
            "severity": "info",
            "message": "Consider rewriting in active voice",
            "suggestion": "Active voice makes writing more direct and engaging",
            "rule_id": "passive_voice",
        })

    return {
        "annotations":      annotations,
        "trait_feedback":   trait_feedback,
        "holistic_feedback": holistic,
        "overall_score":    overall,
        "source":           "automated",
    }
