import { Body, Controller, Get, Post, Query, Res } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { Response } from 'express';

@Controller('chat')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post()
  handleChat(@Body() body: { sessionId: string; message: string }) {
    const { sessionId, message } = body;

    if (!sessionId || !message) {
      return { reply: '❌ Missing session ID or message.' };
    }

    const response = this.chatbotService.handleMessage(sessionId, message);
    return response;
  }

  @Post('checkout')
  async checkout(@Body() body: { sessionId: string }) {
    const session = this.chatbotService.getSession(body.sessionId);
    return this.chatbotService.initiatePayment(session);
  }

  @Get('pay/callback')
  async handlePaystackCallback(
    @Query('reference') reference: string,
    @Res() res: Response,
  ) {
    try {
      await this.chatbotService.verifyPayment(reference);

      // If needed later, you can still update the session/order here

      return res.redirect(
        `https://restaurant-chatbot-altschool.vercel.app/success.html?message=Payment%20Successful!`,
      );
    } catch (error) {
      console.error('Error verifying payment:', error);
      return res.redirect(
        `https://restaurant-chatbot-altschool.vercel.app/error.html?message=Payment%20Failed%20or%20Invalid%20Reference`,
      );
    }
  }
}
