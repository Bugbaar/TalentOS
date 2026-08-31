from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from backend.core.database import Base


class Resume(Base):
    __tablename__ = "resumes"

    id: Mapped[int] = mapped_column(Integer,primary_key=True,index=True)
    candidate_id: Mapped[int] = mapped_column(ForeignKey("candidates.id"),nullable=False)
    filename: Mapped[str] = mapped_column(String(255),nullable=False)
    file_path: Mapped[str] = mapped_column(String(500),nullable=False)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime,default=datetime.utcnow,nullable=False)