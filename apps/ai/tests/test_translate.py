"""Tests for translate endpoint"""

import pytest
from unittest.mock import patch, MagicMock, AsyncMock


class TestTranslateEndpoint:
    """Tests for /api/v1/translate endpoint"""

    def test_translate_success(self, client, mock_openai_translation):
        """Test successful translation"""
        response = client.post(
            "/api/v1/translate",
            json={
                "segments": [
                    {"start": 0.0, "end": 5.0, "text": "Hello world"},
                    {"start": 5.0, "end": 10.0, "text": "How are you?"},
                ],
                "sourceLanguage": "en",
                "targetLanguage": "ko",
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "data" in data
        assert "segments" in data["data"]
        assert len(data["data"]["segments"]) == 2
        assert "meta" in data
        assert "translatedCount" in data["meta"]
        assert "processingTime" in data["meta"]

    def test_translate_empty_segments(self, client):
        """Test with empty segments"""
        response = client.post(
            "/api/v1/translate",
            json={
                "segments": [],
                "sourceLanguage": "en",
                "targetLanguage": "ko",
            },
        )

        # Should fail validation - min_length=1
        assert response.status_code == 422

    def test_translate_missing_segments(self, client):
        """Test with missing segments field"""
        response = client.post(
            "/api/v1/translate",
            json={
                "sourceLanguage": "en",
                "targetLanguage": "ko",
            },
        )

        assert response.status_code == 422

    def test_translate_invalid_segment(self, client):
        """Test with invalid segment (missing text)"""
        response = client.post(
            "/api/v1/translate",
            json={
                "segments": [
                    {"start": 0.0, "end": 5.0},  # missing text
                ],
            },
        )

        assert response.status_code == 422

    def test_translate_negative_timestamps(self, client):
        """Test with negative timestamps"""
        response = client.post(
            "/api/v1/translate",
            json={
                "segments": [
                    {"start": -1.0, "end": 5.0, "text": "Hello"},
                ],
            },
        )

        assert response.status_code == 422

    def test_translate_default_languages(self, client, mock_openai_translation):
        """Test with default source/target languages"""
        response = client.post(
            "/api/v1/translate",
            json={
                "segments": [
                    {"start": 0.0, "end": 5.0, "text": "Hello"},
                ],
            },
        )

        assert response.status_code == 200
        # Default should be en -> ko

    def test_translate_korean_to_english(self, client, mock_openai_translation):
        """Test Korean to English translation"""
        response = client.post(
            "/api/v1/translate",
            json={
                "segments": [
                    {"start": 0.0, "end": 5.0, "text": "안녕하세요"},
                ],
                "sourceLanguage": "ko",
                "targetLanguage": "en",
            },
        )

        assert response.status_code == 200

    def test_translate_response_format(self, client, mock_openai_translation):
        """Test response format matches expected schema"""
        response = client.post(
            "/api/v1/translate",
            json={
                "segments": [
                    {"start": 0.0, "end": 5.0, "text": "Hello"},
                ],
            },
        )

        assert response.status_code == 200
        data = response.json()

        # Check response structure
        assert "success" in data
        assert "data" in data
        assert "meta" in data

        # Check data structure
        assert "segments" in data["data"]
        segment = data["data"]["segments"][0]
        assert "start" in segment
        assert "end" in segment
        assert "originalText" in segment
        assert "translatedText" in segment

        # Check meta structure
        assert "translatedCount" in data["meta"]
        assert "processingTime" in data["meta"]


@pytest.fixture
def mock_openai_translation():
    """Mock OpenAI client for translation"""
    with patch("app.services.translation.OpenAI") as mock:
        mock_instance = MagicMock()
        mock_response = MagicMock()
        mock_response.choices = [
            MagicMock(
                message=MagicMock(
                    content='{"translations": [{"id": 0, "text": "번역된 텍스트"}, {"id": 1, "text": "번역된 텍스트 2"}]}'
                )
            )
        ]
        mock_instance.chat.completions.create.return_value = mock_response
        mock.return_value = mock_instance
        yield mock_instance
