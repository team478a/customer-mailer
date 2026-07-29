export const MAX_CUSTOMERS = 100;

export type CustomerStatus = "未対応" | "対応中" | "完了";

export type Customer = {
  id: string;
  name: string;
  email: string;
  orderNumber: string;
  createdAt: string;
  status: CustomerStatus;
};

export type CustomerInput = Pick<Customer, "name" | "email" | "orderNumber">;
