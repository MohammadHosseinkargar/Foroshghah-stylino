from pydantic import BaseModel


class CommissionOut(BaseModel):
    id: int
    orderId: int
    fromUserId: int
    toUserId: int
    level: int
    amount: float
    status: str

    class Config:
        orm_mode = True
