from pydantic import BaseModel, EmailStr


class CandidateRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone: str | None = None
    location: str | None = None
    skills: str | None = None
    bio: str | None = None


class CandidateLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str    