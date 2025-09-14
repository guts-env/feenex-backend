import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { EXPENSE_EVENTS } from '@/common/constants/events';
import { ModuleRoutes } from '@/common/constants/routes';
import { JWT_SECRET_CONFIG_KEY } from '@/config/keys.config';
import { type IUserPassport } from '@/modules/auth/types/auth';

@WebSocketGateway({
  namespace: ModuleRoutes.Expenses.Main,
  cors: {
    origin: true,
    credentials: true,
  },
})
export default class ExpenseEventsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server!: Server;

  private readonly logger = new Logger(ExpenseEventsGateway.name);
  private userSockets = new Map<string, Set<string>>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  notifyCreatedExpense(
    orgId: string,
    userId: string,
    expense: {
      id: string;
      organization_id: string;
      merchant_name: string;
      amount: number;
    },
  ) {
    if (orgId !== expense.organization_id) {
      return;
    }

    const creatorSocketIds = this.userSockets.get(userId) || new Set();

    this.server
      .to(`org:${orgId}`)
      .except([...creatorSocketIds])
      .emit(EXPENSE_EVENTS.CREATED, {
        id: expense.id,
        user: userId,
        merchantName: expense.merchant_name,
        amount: expense.amount,
      });
  }

  notifyProcessedExpense(
    orgId: string,
    userId: string,
    expense: {
      id: string;
      organization_id: string;
      merchant_name: string;
      amount: number;
    },
  ) {
    if (orgId !== expense.organization_id) {
      return;
    }

    this.server.to(`org:${orgId}`).emit(EXPENSE_EVENTS.PROCESSED, {
      id: expense.id,
      user: userId,
      merchantName: expense.merchant_name,
      amount: expense.amount,
    });
  }

  notifyVerifiedExpense(
    orgId: string,
    userId: string,
    expense: {
      id: string;
      organization_id: string;
      merchant_name: string;
      amount: number;
    },
  ) {
    if (orgId !== expense.organization_id) {
      return;
    }

    const creatorSocketIds = this.userSockets.get(userId) || new Set();

    this.server
      .to(`org:${orgId}`)
      .except([...creatorSocketIds])
      .emit(EXPENSE_EVENTS.VERIFIED, {
        id: expense.id,
        user: userId,
        merchantName: expense.merchant_name,
        amount: expense.amount,
      });
  }

  notifyDeletedExpense(
    orgId: string,
    userId: string,
    expense: {
      id: string;
      organization_id: string;
    },
  ) {
    if (orgId !== expense.organization_id) {
      return;
    }

    const creatorSocketIds = this.userSockets.get(userId) || new Set();

    this.server
      .to(`org:${orgId}`)
      .except([...creatorSocketIds])
      .emit(EXPENSE_EVENTS.DELETED, {
        id: expense.id,
        user: userId,
      });
  }

  async handleConnection(socket: Socket) {
    try {
      const token = socket.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        socket.disconnect();
        return;
      }

      const payload: IUserPassport = this.jwtService.verify(token, {
        secret: this.configService.get<string>(JWT_SECRET_CONFIG_KEY),
      });

      const userId = payload.sub;
      const orgId = payload.organization.id;

      const socketData = socket.data as { userId: string; orgId: string };
      socketData.userId = userId;
      socketData.orgId = orgId;

      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(socket.id);

      console.log(this.userSockets);

      await socket.join(`org:${orgId}`);
    } catch (error) {
      this.logger.error(
        'Socket connection failed:',
        error instanceof Error ? error.message : 'Unknown error',
      );
      socket.disconnect();
    }
  }

  async handleDisconnect(socket: Socket) {
    const socketData = socket.data as { userId: string; orgId: string };

    const orgId = socketData.orgId;
    if (orgId) {
      await socket.leave(`org:${orgId}`);
    }

    const userId = socketData.userId;
    if (userId && this.userSockets.has(userId)) {
      this.userSockets.get(userId)?.delete(socket.id);

      if (this.userSockets.get(userId)?.size === 0) {
        this.userSockets.delete(userId);
      }
    }
  }
}
