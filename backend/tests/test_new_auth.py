import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_google_login_mock(client: AsyncClient):
    # Test mock Google authentication bypass
    response = await client.post("/api/auth/google", json={"id_token": "mock-google-token"})
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["user"]["email"] == "mockgoogleuser@gmail.com"

    # Verify user session works
    me_resp = await client.get(
        "/api/auth/me", 
        headers={"Authorization": f"Bearer {data['access_token']}"}
    )
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == "mockgoogleuser@gmail.com"

@pytest.mark.asyncio
async def test_firebase_phone_login_mock(client: AsyncClient):
    # Test mock Firebase phone verification bypass
    phone_number = "+919876543210"
    response = await client.post(
        "/api/auth/firebase-phone", 
        json={"id_token": f"mock-phone-{phone_number}", "full_name": "Test Phone User"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    
    # User's email should be auto-generated
    assert data["user"]["email"].startswith("otp_")
    assert data["user"]["full_name"] == "Test Phone User"

    # Verify user session works
    me_resp = await client.get(
        "/api/auth/me", 
        headers={"Authorization": f"Bearer {data['access_token']}"}
    )
    assert me_resp.status_code == 200
    assert me_resp.json()["email"].startswith("otp_")
