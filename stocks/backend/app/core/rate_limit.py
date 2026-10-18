from slowapi import Limiter
from slowapi.util import get_remote_address

# Shared rate limiter keyed by client remote address
limiter = Limiter(key_func=get_remote_address, default_limits=["100/minute"])
