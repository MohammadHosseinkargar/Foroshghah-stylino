from typing import List
from pydantic import BaseModel


class OrderItemCreate(BaseModel):
    productId: int
    quantity: int


class OrderCreate(BaseModel):
    items: List[OrderItemCreate]


class OrderItemOut(BaseModel):
    productId: int
    productName: str
    quantity: int
    unitPrice: float
    totalPrice: float


class OrderOut(BaseModel):
    id: int
    totalAmount: float
    status: str
    paymentStatus: str
    createdAt: str
    items: List[OrderItemOut]

    class Config:
        orm_mode = True


class SellerOrderItem(BaseModel):
    productId: int
    productName: str
    quantity: int
    totalPrice: float


class SellerOrderOut(BaseModel):
    id: int
    customerId: int
    totalAmount: float
    status: str
    paymentStatus: str
    createdAt: str
    items: List[SellerOrderItem]


class SellerStats(BaseModel):
    revenue: float
    monthlyOrders: int
    totalOrders: int


class AdminOrderOut(BaseModel):
    id: int
    customerId: int
    totalAmount: float
    status: str
    paymentStatus: str
    createdAt: str
    items: List[OrderItemOut]
