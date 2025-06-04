declare module 'midtrans-client' {
  export interface TransactionDetails {
    order_id: string;
    gross_amount: number;
  }

  export interface ItemDetails {
    id: string;
    price: number;
    quantity: number;
    name: string;
    brand?: string;
    category?: string;
    merchant_name?: string;
  }

  export interface CustomerDetails {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    billing_address?: {
      first_name?: string;
      last_name?: string;
      address?: string;
      city?: string;
      postal_code?: string;
      phone?: string;
      country_code?: string;
    };
    shipping_address?: {
      first_name?: string;
      last_name?: string;
      address?: string;
      city?: string;
      postal_code?: string;
      phone?: string;
      country_code?: string;
    };
  }

  export interface CreditCard {
    secure?: boolean;
    bank?: string;
    installment?: {
      required?: boolean;
      terms?: {
        [bank: string]: number[];
      };
    };
    whitelist_bins?: string[];
  }

  export interface Callbacks {
    finish?: string;
    error?: string;
    pending?: string;
  }

  export interface SnapParameter {
    transaction_details: TransactionDetails;
    item_details?: ItemDetails[];
    customer_details?: CustomerDetails;
    credit_card?: CreditCard;
    callbacks?: Callbacks;
    expiry?: {
      start_time?: string;
      unit?: string;
      duration?: number;
    };
    custom_field1?: string;
    custom_field2?: string;
    custom_field3?: string;
  }

  export interface SnapResponse {
    token: string;
    redirect_url: string;
  }

  export interface SnapConfig {
    isProduction: boolean;
    serverKey: string;
    clientKey: string;
  }

  export class Snap {
    constructor(config: SnapConfig);
    createTransaction(parameter: SnapParameter): Promise<SnapResponse>;
    createTransactionToken(parameter: SnapParameter): Promise<string>;
    createTransactionRedirectUrl(parameter: SnapParameter): Promise<string>;
  }

  export class CoreApi {
    constructor(config: SnapConfig);
    charge(parameter: any): Promise<any>;
    capture(parameter: any): Promise<any>;
    cardRegister(parameter: any): Promise<any>;
    cardToken(parameter: any): Promise<any>;
    cardPointInquiry(parameter: any): Promise<any>;
  }
}