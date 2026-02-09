"""
Content Moderation Service
Handles safety checks for prompts and generated content using local AI models.
"""

import logging
from typing import List, Dict, Any, Tuple
import torch
from transformers import pipeline

logger = logging.getLogger(__name__)

class ModerationService:
    def __init__(self):
        # Initialize Semantic Classifier (DistilBERT fine-tuned for toxicity)
        # Using a small, efficient model suitable for CPU inference
        self.model_name = "unitary/unbiased-toxic-roberta" 
        try:
            logger.info(f"Loading moderation model: {self.model_name}")
            self.classifier = pipeline(
                "text-classification", 
                model=self.model_name, 
                tokenizer=self.model_name,
                top_k=None, # Return all scores
                device=-1 # CPU
            )
            self.use_model = True
        except Exception as e:
            logger.error(f"Failed to load moderation model: {e}")
            logger.warning("Falling back to keyword-based moderation.")
            self.use_model = False

        # Fallback keyword blocklist
        self.blocked_keywords = [
            "nsfw", "nude", "naked", "porn", "xxx", "sex", 
            "violence", "blood", "gore", "kill", "murder",
            "hate", "racist", "nazi"
        ]
        
        # Risk thresholds (0.0 - 1.0)
        self.risk_thresholds = {
            "toxic": 0.8,
            "severe_toxic": 0.6,
            "obscene": 0.8,
            "threat": 0.7,
            "insult": 0.8,
            "identity_hate": 0.6
        }

    def check_prompt(self, prompt: str) -> Tuple[bool, str, Dict[str, float]]:
        """
        Check if a prompt contains unsafe content using semantic analysis.
        Returns (is_safe, reason, scores)
        """
        if not prompt:
            return True, "Empty prompt", {}

        # 1. Quick Keyword Check (Fail-fast)
        prompt_lower = prompt.lower()
        for keyword in self.blocked_keywords:
            if keyword in prompt_lower:
                logger.warning(f"Blocked unsafe prompt (keyword): {keyword}")
                return False, f"Prompt contains blocked keyword: {keyword}", {"keyword_match": 1.0}

        # 2. Semantic Analysis
        if self.use_model:
            try:
                # Run inference
                results = self.classifier(prompt)[0] # List of {label, score}
                
                # Convert to dict for easier lookup
                scores = {param['label']: param['score'] for param in results}
                
                # Check against thresholds
                violations = []
                for label, score in scores.items():
                    # Map model labels to our risk categories if needed
                    # The unitary model returns: toxic, severe_toxic, obsolete, threat, insult, identity_hate
                    if label in self.risk_thresholds and score > self.risk_thresholds[label]:
                        violations.append(f"{label} ({score:.2f})")

                if violations:
                    reason = f"Content safety violation: {', '.join(violations)}"
                    logger.warning(f"Blocked unsafe prompt (AI): {reason}")
                    return False, reason, scores
                
                return True, "Safe (AI Verified)", scores

            except Exception as e:
                logger.error(f"Error during semantic moderation: {e}")
                # Fallback to safe if AI fails but keywords passed? 
                # Or fail secure? Let's fail secure for high compliance.
                return False, "Moderation service unavailable", {}

        return True, "Safe (Keyword Verified)", {}

    async def check_image(self, image_path: str) -> bool:
        """
        Check if an image is safe (NSFW detection).
        Placeholder for future AI model integration.
        """
        # TODO: Integrate NSFW detection model (e.g., Falcons.ai/nsfw_image_detection)
        return True

    async def check_video(self, video_path: str) -> bool:
        """
        Check if a video is safe.
        Placeholder for future integration.
        """
        # TODO: Implement video moderation (sample frames -> check_image)
        return True

# Global instance
moderation_service = ModerationService()
