from typing import List, Optional
from pydantic import BaseModel


class ProductBase(BaseModel):
    name: str
    description: str
    basePrice: float
    discountPrice: Optional[float] = None
    categoryId: int
    brand: str
    colors: List[str] = []
    sizes: List[str] = []
    images: List[str] = []
    isActive: bool = True


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    basePrice: Optional[float] = None
    discountPrice: Optional[float] = None
    categoryId: Optional[int] = None
    brand: Optional[str] = None
    colors: Optional[List[str]] = None
    sizes: Optional[List[str]] = None
    images: Optional[List[str]] = None
    isActive: Optional[bool] = None


class ProductOut(ProductBase):
    id: int
    sellerId: int
    categoryName: Optional[str] = None

    class Config:
        orm_mode = True
