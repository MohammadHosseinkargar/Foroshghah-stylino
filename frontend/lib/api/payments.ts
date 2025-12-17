import { apiRequest } from "../api";

export type PaymentCreateRequest = {
  order_id: number;
  amount_toman: number;
  description: string;
  mobile?: string;
  email?: string;
};

export type PaymentCreateResponse = {
  authority: string;
  payment_url: string;
  code: number;
  message: string;
};

/**
 * Call backend to create a Zarinpal payment and return the redirect URL.
 */
export async function createZarinpalPayment(
  payload: PaymentCreateRequest,
  token?: string
): Promise<PaymentCreateResponse> {
  try {
    return await apiRequest<PaymentCreateResponse>(
      "/payments/zarinpal/create",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      token
    );
  } catch (e: any) {
    const message = e?.message || "خطا در اتصال به درگاه پرداخت زرین‌پال";
    throw new Error(message);
  }
}
