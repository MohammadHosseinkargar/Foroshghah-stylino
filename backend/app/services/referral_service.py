from typing import List

from prisma import Prisma
from prisma.models import Commission, User


async def _get_parent(prisma: Prisma, user_id: int) -> User | None:
    return await prisma.user.find_unique(where={"id": user_id})


async def create_commissions(prisma: Prisma, buyer_id: int, order_id: int, amount: float) -> List[Commission]:
    commissions_data = []
    buyer = await prisma.user.find_unique(where={"id": buyer_id})
    if not buyer or not buyer.referredById:
        return []

    level1_user = await _get_parent(prisma, buyer.referredById)
    if level1_user:
        commissions_data.append(
            {
                "orderId": order_id,
                "fromUserId": buyer_id,
                "toUserId": level1_user.id,
                "level": 1,
                "amount": round(amount * 0.10, 2),
                "status": "PAID",
            }
        )
        if level1_user.referredById:
            level2_user = await _get_parent(prisma, level1_user.referredById)
            if level2_user:
                commissions_data.append(
                    {
                        "orderId": order_id,
                        "fromUserId": buyer_id,
                        "toUserId": level2_user.id,
                        "level": 2,
                        "amount": round(amount * 0.05, 2),
                        "status": "PAID",
                    }
                )

    created: List[Commission] = []
    for data in commissions_data:
        commission = await prisma.commission.create(data=data)
        created.append(commission)
    return created
