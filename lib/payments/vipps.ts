import axios, { AxiosInstance } from 'axios';

interface VippsConfig {
  clientId: string;
  clientSecret: string;
  merchantSerialNumber: string;
  subscriptionKey: string;
  environment: 'test' | 'production';
}

interface VippsAccessToken {
  access_token: string;
  expires_in: number;
  token_type: string;
}

interface CreatePaymentRequest {
  amount: number; // Amount in øre (NOK * 100)
  currency?: string;
  customerPhone?: string;
  orderId: string;
  returnUrl: string;
  description: string;
  metadata?: Record<string, string>;
}

interface VippsPaymentResponse {
  orderId: string;
  url: string; // Redirect URL for customer
}

class VippsClient {
  private axiosInstance: AxiosInstance;
  private config: VippsConfig;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(config?: VippsConfig) {
    this.config = config || {
      clientId: process.env.VIPPS_CLIENT_ID || '',
      clientSecret: process.env.VIPPS_CLIENT_SECRET || '',
      merchantSerialNumber: process.env.VIPPS_MERCHANT_SERIAL_NUMBER || '',
      subscriptionKey: process.env.VIPPS_SUBSCRIPTION_KEY || '',
      environment: (process.env.VIPPS_ENVIRONMENT as 'test' | 'production') || 'test',
    };

    const baseURL =
      this.config.environment === 'production'
        ? 'https://api.vipps.no'
        : 'https://apitest.vipps.no';

    this.axiosInstance = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': this.config.subscriptionKey,
        'Merchant-Serial-Number': this.config.merchantSerialNumber,
      },
    });
  }

  /**
   * Get OAuth 2.0 access token
   */
  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const response = await this.axiosInstance.post<VippsAccessToken>(
        '/accesstoken/get',
        {},
        {
          headers: {
            'client_id': this.config.clientId,
            'client_secret': this.config.clientSecret,
          },
        }
      );

      this.accessToken = response.data.access_token;
      // Set expiry to 5 minutes before actual expiry for safety
      this.tokenExpiry = Date.now() + (response.data.expires_in - 300) * 1000;

      return this.accessToken;
    } catch (error) {
      console.error('Failed to get Vipps access token:', error);
      throw new Error('Failed to authenticate with Vipps');
    }
  }

  /**
   * Create a payment (initiate ePayment)
   */
  async createPayment(request: CreatePaymentRequest): Promise<VippsPaymentResponse> {
    const token = await this.getAccessToken();

    try {
      const response = await this.axiosInstance.post(
        '/epayment/v1/payments',
        {
          amount: {
            value: request.amount,
            currency: request.currency || 'NOK',
          },
          customer: request.customerPhone
            ? {
                phoneNumber: request.customerPhone.replace(/\s/g, ''),
              }
            : undefined,
          reference: request.orderId,
          returnUrl: request.returnUrl,
          userFlow: 'WEB_REDIRECT',
          paymentDescription: request.description,
          metadata: request.metadata,
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Idempotency-Key': request.orderId, // Prevent duplicate payments
          },
        }
      );

      return {
        orderId: response.data.reference,
        url: response.data.redirectUrl,
      };
    } catch (error: any) {
      console.error('Failed to create Vipps payment:', error.response?.data || error);
      throw new Error('Failed to create Vipps payment');
    }
  }

  /**
   * Get payment details
   */
  async getPayment(orderId: string): Promise<any> {
    const token = await this.getAccessToken();

    try {
      const response = await this.axiosInstance.get(
        `/epayment/v1/payments/${orderId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Failed to get Vipps payment:', error.response?.data || error);
      throw new Error('Failed to get Vipps payment details');
    }
  }

  /**
   * Capture payment (for manual capture)
   */
  async capturePayment(orderId: string, amount?: number): Promise<any> {
    const token = await this.getAccessToken();

    try {
      const captureData: any = {};
      if (amount !== undefined) {
        captureData.amount = {
          value: amount,
          currency: 'NOK',
        };
      }

      const response = await this.axiosInstance.post(
        `/epayment/v1/payments/${orderId}/capture`,
        captureData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Idempotency-Key': `${orderId}-capture`,
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Failed to capture Vipps payment:', error.response?.data || error);
      throw new Error('Failed to capture Vipps payment');
    }
  }

  /**
   * Cancel payment (release authorization)
   */
  async cancelPayment(orderId: string): Promise<any> {
    const token = await this.getAccessToken();

    try {
      const response = await this.axiosInstance.post(
        `/epayment/v1/payments/${orderId}/cancel`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Failed to cancel Vipps payment:', error.response?.data || error);
      throw new Error('Failed to cancel Vipps payment');
    }
  }

  /**
   * Refund payment
   */
  async refundPayment(orderId: string, amount?: number): Promise<any> {
    const token = await this.getAccessToken();

    try {
      const refundData: any = {};
      if (amount !== undefined) {
        refundData.amount = {
          value: amount,
          currency: 'NOK',
        };
      }

      const response = await this.axiosInstance.post(
        `/epayment/v1/payments/${orderId}/refund`,
        refundData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Idempotency-Key': `${orderId}-refund-${Date.now()}`,
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Failed to refund Vipps payment:', error.response?.data || error);
      throw new Error('Failed to refund Vipps payment');
    }
  }
}

// Export singleton instance
export const vippsClient = new VippsClient();

export default VippsClient;
