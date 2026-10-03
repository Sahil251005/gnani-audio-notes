import uuid
from datetime import datetime

from sqlalchemy import BigInteger, DateTime, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class AudioNote(Base):
    __tablename__ = "audio_notes"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    original_filename: Mapped[str] = mapped_column(String(255))

    content_type: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    file_size_bytes: Mapped[int | None] = mapped_column(
        BigInteger,
        nullable=True,
    )

    storage_key: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )
    
    language_code: Mapped[str] = mapped_column(
    String(20),
    nullable=False,
    )
    
    status: Mapped[str] = mapped_column(
        String(50),
        default="UPLOADED",
    )

    gnani_job_id: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    gnani_status: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    transcript: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    summary: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    
    error_code: Mapped[str | None] = mapped_column(
    String(100),
    nullable=True,
    )

    error_message: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    completed_at: Mapped[datetime | None] = mapped_column(
    DateTime(timezone=True),
    nullable=True,
    )

    