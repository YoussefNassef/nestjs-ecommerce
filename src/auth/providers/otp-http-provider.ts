import { BadRequestException, Injectable } from '@nestjs/common';
import axios, { AxiosError } from 'axios';

@Injectable()
export class OtpHttpProvider {
  private readonly API_URL = 'https://api.authentica.sa/api/v2/send-otp';
  private readonly API_KEY = process.env.AUTHENTICA_API_KEY;

  async OtpHttp(data: {
    phone: string;
    otp?: string;
    template_id: number;
    fallback_email?: string;
  }) {
    try {
      const response = await axios.post(this.API_URL, data, {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-Authorization': this.API_KEY,
        },
      });
      return response;
    } catch (error) {
      const axiosError = error as AxiosError<{
        message?: string;
        error?: string;
      }>;
      const providerMessage =
        axiosError.response?.data?.message ??
        axiosError.response?.data?.error ??
        'Failed to send OTP';

      throw new BadRequestException(providerMessage);
    }
  }
}
