import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

interface MenuItem {
  id: string;
  name: string;
  price: number;
}

const MENU: MenuItem[] = [
  { id: '2', name: 'Pizza', price: 3000 },
  { id: '3', name: 'Burger', price: 2000 },
  { id: '4', name: 'Sushi', price: 5000 },
  { id: '5', name: 'Salad', price: 1500 },
  { id: '6', name: 'Pasta', price: 4000 },
  { id: '7', name: 'Jollof Rice', price: 5000 },
  { id: '8', name: 'Cake', price: 2500 },
  { id: '9', name: 'Ice Cream', price: 1000 },
  { id: '10', name: 'Soft Drink', price: 800 },
  { id: '11', name: 'Water', price: 500 },
  { id: '12', name: 'Fruit Juice', price: 1200 },
  { id: '13', name: 'Coffee', price: 1500 },
  { id: '14', name: 'Tea', price: 1000 },
  { id: '15', name: 'Cocktail', price: 3000 },
];

interface Session {
  currentOrder: string[];
  orderHistory: string[][];
}

const sessions: Record<string, Session> = {};

@Injectable()
export class ChatbotService {
  constructor(private configService: ConfigService) {}

  async initiatePayment(session: Session): Promise<{ reply: string }> {
    const secretKey = this.configService.get<string>('PAYSTACK_SECRET_KEY');
    const total = this.calculateTotal(session.currentOrder);

    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email: 'user@example.com',
        amount: total * 100,
        callback_url:
          'https://restaurant-chatbot-altschool.onrender.com/chat/pay/callback',
      },
      {
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
      },
    );

    return {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      reply: `💳 Click here to complete your payment: ${response.data.data.authorization_url}`,
    };
  }

  private calculateTotal(order: string[]): number {
    const MENU = [
      { id: '2', name: 'Pizza', price: 3000 },
      { id: '3', name: 'Burger', price: 2000 },
      { id: '4', name: 'Sushi', price: 5000 },
      { id: '5', name: 'Salad', price: 1500 },
      { id: '6', name: 'Pasta', price: 4000 },
      { id: '7', name: 'Jollof Rice', price: 5000 },
      { id: '8', name: 'Cake', price: 2500 },
      { id: '9', name: 'Ice Cream', price: 1000 },
      { id: '10', name: 'Soft Drink', price: 800 },
      { id: '11', name: 'Water', price: 500 },
      { id: '12', name: 'Fruit Juice', price: 1200 },
      { id: '13', name: 'Coffee', price: 1500 },
      { id: '14', name: 'Tea', price: 1000 },
      { id: '15', name: 'Cocktail', price: 3000 },
    ];

    return order.reduce((sum, id) => {
      const item = MENU.find((i) => i.id === id);
      return sum + (item?.price || 0);
    }, 0);
  }
  getMenu(): MenuItem[] {
    return MENU;
  }

  getSession(sessionId: string): Session {
    if (!sessions[sessionId]) {
      sessions[sessionId] = {
        currentOrder: [],
        orderHistory: [],
      };
    }

    return sessions[sessionId];
  }

  // chatbot.service.ts
  async verifyPayment(reference: string): Promise<any> {
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      },
    );

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (response.data.data.status === 'success') {
      // You can do more: update the order in session, etc.
      return response.data;
    } else {
      throw new Error('Payment verification failed');
    }
  }

  handleMessage(sessionId: string, message: string): { reply: string } {
    const session = this.getSession(sessionId);
    const trimmedMessage = message.trim();

    if (
      ['hi', 'hello', 'hey', 'start', 'menu', 'order'].includes(
        trimmedMessage.toLowerCase(),
      )
    ) {
      return {
        // reply: 'Welcome to our restaurant! Here is the menu: ' + this.getMenu().map(item => `${item.name} - $${item.price}`).join(', ');
        reply: this.getWelcomeMessage(),
      };
    }

    switch (trimmedMessage) {
      case '1':
        return {
          reply: this.getMenuMessage(),
        };

      case '97':
        return {
          reply: this.getCurrentOrderMessage(session),
        };

      case '98':
        return {
          reply: this.getOrderHistoryMessage(session),
        };

      case '99':
        return this.checkoutOrder(session);

      case '0':
        return this.cancelOrder(session);
    }

    const selectedItem = MENU.find((item) => item.id === trimmedMessage);
    if (selectedItem) {
      session.currentOrder.push(selectedItem.id);
      return {
        reply: `You have added ${selectedItem.name} to your order. \n\n${this.getCurrentOrderMessage(session)} \n\n Type '97' to view your current order or '99' to checkout or keep adding more items.`,
      };
    }
    //Fallback
    return {
      reply: `Invalid input. Please select one of the options below:\n\n ${this.getWelcomeMessage()}`,
    };
  }

  // Helper Functions

  private getWelcomeMessage(): string {
    return `
    Welcome to Hold-Belle Restaurant 🤖🍽️!
    Please choose an option:
    1 - Place an order
    97 - View current order
    98 - View order history
    99 - Checkout
    0 - Cancel current order
    `.trim();
  }

  private getMenuMessage(): string {
    return MENU.map(
      (item) => `${item.id} - ${item.name} - ₦${item.price}`,
    ).join('\n');
  }

  private getCurrentOrderMessage(session: Session): string {
    if (session.currentOrder.length === 0) {
      return 'You have no items in your current order.';
    }

    const items = session.currentOrder.map((id) => {
      const item = MENU.find((i) => i.id === id);
      return item ? `${item.name} - ₦${item.price}` : '';
    });

    // Calculate the total price
    const total = session.currentOrder.reduce((sum, id) => {
      const item = MENU.find((i) => i.id === id);
      return sum + (item?.price || 0);
    }, 0);

    return `🛒 Current Order:\n${items.join('\n')}\n\nTotal: ₦${total}`;
  }

  private getOrderHistoryMessage(session: Session): string {
    if (session.orderHistory.length === 0) {
      return 'You have no previous orders.';
    }

    return session.orderHistory
      .map((order, index) => {
        const items = order
          .map((id) => {
            const item = MENU.find((i) => i.id === id);
            return item ? item.name : '';
          })
          .join(', ');

        return `Order ${index + 1}: ${items}`;
      })
      .join('\n');
  }

  private checkoutOrder(session: Session): { reply: string } {
    if (session.currentOrder.length === 0) {
      return {
        reply: '❌ No order to place. Please start a new order by selecting 1.',
      };
    }

    const total = session.currentOrder.reduce((sum, id) => {
      const item = MENU.find((i) => i.id === id);
      return sum + (item?.price || 0);
    }, 0);

    return {
      reply: `✅ Order ready for payment!\nTotal: ₦${total}\n\nClick the button below to pay:\nPAY_NOW_BUTTON`,
    };
  }

  private cancelOrder(session: Session): { reply: string } {
    if (session.currentOrder.length === 0) {
      return { reply: 'There is no active order to cancel.' };
    }

    session.currentOrder = [];
    return {
      reply: '🗑️ Order cancelled. You can start a new one by selecting 1.',
    };
  }
}
