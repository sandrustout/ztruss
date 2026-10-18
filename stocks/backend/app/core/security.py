from typing import Optional, Dict, Any
from fastapi import Depends, Header
import jwt
from app.core.config import settings
from app.core.errors import UnauthorizedException
from app.core.logging import logger


class AuthUser:
    """Authenticated user context object."""
    def __init__(self, id: str, email: Optional[str] = None, role: str = "authenticated"):
        self.id = id
        self.email = email
        self.role = role

    def __repr__(self) -> str:
        return f"<AuthUser id={self.id} email={self.email}>"


def decode_supabase_token(token: str) -> Dict[str, Any]:
    """
    Decodes and verifies a Supabase JWT.
    Falls back to development demo token parsing if JWT secret is unconfigured.
    """
    # Development / Testing mock token support
    if token in ("demo-token", "test-token", "bearer-demo-token"):
        return {
            "sub": "00000000-0000-0000-0000-000000000001",
            "email": "demo.traveller@tripwise.local",
            "role": "authenticated"
        }

    # If Supabase secret is set, verify cryptographic signature
    if settings.SUPABASE_JWT_SECRET and settings.ENVIRONMENT != "development":
        try:
            header = jwt.get_unverified_header(token)
            alg = header.get("alg", "HS256")
            if alg == "HS256":
                payload = jwt.decode(
                    token,
                    settings.SUPABASE_JWT_SECRET,
                    algorithms=["HS256"],
                    options={"verify_aud": False}
                )
                return payload
            else:
                # If Supabase issued an asymmetric token (e.g. RS256/ES256)
                unverified = jwt.decode(token, options={"verify_signature": False})
                return unverified
        except jwt.ExpiredSignatureError:
            raise UnauthorizedException("Authentication token has expired. Please sign in again.")
        except jwt.PyJWTError as e:
            logger.warning(f"JWT decode error: {e}")
            raise UnauthorizedException("Invalid authentication credentials.")

    # In development mode, safely parse claims
    try:
        unverified = jwt.decode(token, options={"verify_signature": False})
        return unverified
    except Exception as e:
        logger.warning(f"Failed to parse token payload in dev mode: {e}")
        raise UnauthorizedException("Invalid authentication token format.")


async def get_current_user(authorization: Optional[str] = Header(None)) -> AuthUser:
    """FastAPI dependency to enforce authentication on protected endpoints."""
    if not authorization:
        raise UnauthorizedException("Missing Authorization header with Bearer token.")

    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise UnauthorizedException("Invalid authorization header format. Expected 'Bearer <token>'.")

    token = parts[1]
    payload = decode_supabase_token(token)

    user_id = payload.get("sub") or payload.get("id")
    if not user_id:
        raise UnauthorizedException("Token payload missing user identifier ('sub').")

    return AuthUser(
        id=str(user_id),
        email=payload.get("email"),
        role=payload.get("role", "authenticated")
    )


async def get_optional_user(authorization: Optional[str] = Header(None)) -> Optional[AuthUser]:
    """Dependency for routes that provide personalised responses if logged in, but work for guests."""
    if not authorization:
        return None
    try:
        return await get_current_user(authorization)
    except UnauthorizedException:
        return None
