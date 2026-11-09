import datetime
from datetime import timezone
from typing import Any, Dict, Optional
from jose import jwt, JWTError
from passlib.context import CryptContext
import pyotp
from app.core.config import settings

# Password hashing with Argon2id primary, bcrypt compatibility
pwd_context = CryptContext(
    schemes=["argon2", "bcrypt"],
    deprecated="auto"
)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plaintext password against an Argon2id hash."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Generates an Argon2id hash for the given password."""
    return pwd_context.hash(password)


def create_access_token(
    subject: str | Any,
    claims: Optional[Dict[str, Any]] = None,
    expires_delta: Optional[datetime.timedelta] = None
) -> str:
    """Generates a signed JWT access token."""
    now = datetime.datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + datetime.timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    payload = {
        "sub": str(subject),
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp())
    }
    if claims:
        payload.update(claims)
        
    return jwt.encode(payload, settings.APP_SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Decodes and validates a JWT token, returning its claims payload."""
    try:
        payload = jwt.decode(
            token,
            settings.APP_SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        return payload
    except JWTError:
        return None


# MFA / TOTP Utilities
def generate_totp_secret() -> str:
    """Generates a cryptographically secure random base32 secret for TOTP MFA."""
    return pyotp.random_base32()


def get_totp_uri(secret: str, user_email: str) -> str:
    """Generates an otpauth:// provisioning URI for QR code generation."""
    totp = pyotp.TOTP(secret)
    return totp.provisioning_uri(name=user_email, issuer_name=settings.APP_NAME)


def verify_totp_code(secret: str, code: str) -> bool:
    """Validates a 6-digit TOTP code against the shared secret with drift window."""
    totp = pyotp.TOTP(secret)
    return totp.verify(code, valid_window=1)
