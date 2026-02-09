import pytest
import os
from unittest.mock import MagicMock, patch

# Mock transformers pipeline to avoid downloading model during test
# and to simulate different scoring scenarios
@patch("app.services.moderation_service.pipeline")
def test_moderation_initialization(mock_pipeline):
    from app.services.moderation_service import ModerationService
    
    service = ModerationService()
    # LAZY LOADING: Pipeline should NOT be called at init
    assert mock_pipeline.call_count == 0
    assert service.use_model is False 
    assert service._model_loaded is False

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
    
    # "Hello friend" should trigger lazy load
    is_safe, reason, scores = service.check_prompt("Hello friend")
    
    # Verify Load
    mock_pipeline.assert_called_once() 
    assert service.use_model is True
    
    assert is_safe is True
    assert "toxic" in scores
    assert scores["toxic"] == 0.01

    # Case 2: Toxic content
    # NOTE: Must use a prompt NOT in the keyword blocklist ("hate", "kill", etc.)
    # to ensure it reaches the AI model.
    mock_classifier.return_value = [[
        {"label": "toxic", "score": 0.95},
        {"label": "severe_toxic", "score": 0.1},
        {"label": "obscene", "score": 0.0},
        {"label": "threat", "score": 0.85},
        {"label": "insult", "score": 0.9},
        {"label": "identity_hate", "score": 0.0}
    ]]
    
    # "You are a total failure" bypasses keyword list (no "hate", "kill", etc.)
    # but our mock says it's toxic/threat
    is_safe, reason, scores = service.check_prompt("You are a total failure")
    
    assert is_safe is False
    assert "toxic" in reason
    assert "threat" in reason

def test_moderation_fallback():
    # Test fallback when model fails to load
    with patch("app.services.moderation_service.pipeline", side_effect=Exception("Model Load Error")):
        from app.services.moderation_service import ModerationService
        service = ModerationService()
        
        # Trigger load
        service.check_prompt("trigger load")
        
        assert service._model_loaded is True
        assert service.use_model is False
        
        # Should still catch keywords
        is_safe, reason, _ = service.check_prompt("This contains nsfw")
        assert is_safe is False
        assert "keyword" in reason
