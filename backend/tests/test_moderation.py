import pytest
import os
from unittest.mock import MagicMock, patch

# Mock transformers pipeline to avoid downloading model during test
# and to simulate different scoring scenarios
@patch("app.services.moderation_service.pipeline")
def test_moderation_initialization(mock_pipeline):
    from app.services.moderation_service import ModerationService
    
    service = ModerationService()
    mock_pipeline.assert_called_once()
    assert service.use_model is True

@patch("app.services.moderation_service.pipeline")
def test_moderation_semantic_check(mock_pipeline):
    # Setup mock return values
    mock_classifier = MagicMock()
    # Case 1: Safe content
    mock_classifier.return_value = [[
        {"label": "toxic", "score": 0.01},
        {"label": "severe_toxic", "score": 0.00},
        {"label": "obscene", "score": 0.02},
        {"label": "threat", "score": 0.00},
        {"label": "insult", "score": 0.01},
        {"label": "identity_hate", "score": 0.00}
    ]]
    mock_pipeline.return_value = mock_classifier
    
    from app.services.moderation_service import ModerationService
    service = ModerationService()
    
    is_safe, reason, scores = service.check_prompt("Hello friend")
    assert is_safe is True
    assert "toxic" in scores
    assert scores["toxic"] == 0.01

    # Case 2: Toxic content
    mock_classifier.return_value = [[
        {"label": "toxic", "score": 0.95},
        {"label": "severe_toxic", "score": 0.1},
        {"label": "obscene", "score": 0.0},
        {"label": "threat", "score": 0.85},
        {"label": "insult", "score": 0.9},
        {"label": "identity_hate", "score": 0.0}
    ]]
    
    is_safe, reason, scores = service.check_prompt("I hate you")
    assert is_safe is False
    assert "toxic" in reason
    assert "threat" in reason

def test_moderation_fallback():
    # Test fallback when model fails to load
    with patch("app.services.moderation_service.pipeline", side_effect=Exception("Model Load Error")):
        from app.services.moderation_service import ModerationService
        service = ModerationService()
        
        assert service.use_model is False
        
        # Should still catch keywords
        is_safe, reason, _ = service.check_prompt("This contains nsfw")
        assert is_safe is False
        assert "keyword" in reason
