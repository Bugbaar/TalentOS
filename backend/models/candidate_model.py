from sqlalchemy import Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from backend.core.database import Base


class Candidate(Base):
    __tablename__ = "candidates"

    id: Mapped[int] = mapped_column(Integer,primary_key=True,index=True)
    full_name: Mapped[str] = mapped_column(String(100),nullable=False)
    phone: Mapped[str | None] = mapped_column(String(20),nullable=True)
    email: Mapped[str]= mapped_column(String , nullable=False)
    hashed_password: Mapped[str]=mapped_column(String , nullable=False)
    location: Mapped[str | None] = mapped_column(String(100),nullable=True)
    skills: Mapped[str | None] = mapped_column(Text,nullable=True)
    bio: Mapped[str | None] = mapped_column(Text,nullable=True)