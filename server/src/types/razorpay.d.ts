declare module 'razorpay' {
  interface RazorpayOrder {
    id: string;
    entity: string;
    amount: number;
    amount_paid: number;
    amount_due: number;
    currency: string;
    receipt: string;
    status: string;
    created_at: number;
  }

  interface RazorpayOptions {
    amount: number;
    currency: string;
    receipt: string;
  }

  interface RazorpayPayoutFundAccount {
    account_type: string;
    bank_account: {
      name: string;
      account_number: string;
      ifsc: string;
    };
    contact: {
      name: string;
      email: string;
    };
  }

  interface RazorpayPayoutOptions {
    account_number: string;
    fund_account: RazorpayPayoutFundAccount;
    amount: number;
    currency: string;
    mode: string;
    purpose: string;
    queue_if_low_balance: boolean;
  }

  interface RazorpayPayout {
    id: string;
    entity: string;
    fund_account_id: string;
    amount: number;
    currency: string;
    status: string;
    utr: string;
    mode: string;
    purpose: string;
    created_at: number;
  }

  class Razorpay {
    constructor(options: { key_id: string; key_secret: string });
    orders: {
      create(options: RazorpayOptions): Promise<RazorpayOrder>;
    };
    payouts: {
      create(options: RazorpayPayoutOptions): Promise<RazorpayPayout>;
    };
  }

  export default Razorpay;
}
