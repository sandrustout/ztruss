import logging
import sys
import uuid
from contextvars import ContextVar

# Context variable to track the active request ID across async coroutines
request_id_ctx: ContextVar[str] = ContextVar("request_id", default="")


class RequestIDFilter(logging.Filter):
    """Injects current request ID into log records."""
    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = request_id_ctx.get() or "system"
        return True


def setup_logging() -> logging.Logger:
    """Configures structured terminal logging without leaking secrets."""
    logger = logging.getLogger("tripwise")
    logger.setLevel(logging.INFO)

    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        formatter = logging.Formatter(
            fmt="[%(asctime)s] [%(levelname)s] [req:%(request_id)s] %(name)s: %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        )
        handler.setFormatter(formatter)
        handler.addFilter(RequestIDFilter())
        logger.addHandler(handler)

    return logger


logger = setup_logging()
