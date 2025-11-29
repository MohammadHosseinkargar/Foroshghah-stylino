from pydantic import BaseModel


class CategoryCreate(BaseModel):
    name: str
    slug: str


class CategoryOut(BaseModel):
    id: int
    name: str
    slug: str

    class Config:
        orm_mode = True
