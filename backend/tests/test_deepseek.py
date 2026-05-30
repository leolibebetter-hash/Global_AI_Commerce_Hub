from app.services.deepseek import chat


def test_deepseek_connectivity():
    response = chat(prompt="Reply with exactly: OK")
    assert "OK" in response, f"Expected 'OK' in response, got: {response}"


def test_deepseek_chat_returns_content():
    response = chat(
        prompt="What is 2+2? Answer with just the number.",
        system="You are a precise assistant. Answer only what is asked.",
    )
    assert "4" in response, f"Expected '4' in response, got: {response}"
