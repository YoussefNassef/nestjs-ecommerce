import { Injectable } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';

export type SupportEventName =
  | 'ticket_created'
  | 'ticket_assigned'
  | 'ticket_status_changed'
  | 'message_created';

export type SupportEventPayload = {
  event: SupportEventName;
  ticketId: string;
  userId: number;
  actorUserId?: number;
  isInternalMessage?: boolean;
  status?: string;
  createdAt: string;
};

@Injectable()
export class SupportEventsService {
  private readonly events$ = new Subject<SupportEventPayload>();

  emit(payload: SupportEventPayload): void {
    this.events$.next(payload);
  }

  stream(): Observable<SupportEventPayload> {
    return this.events$.asObservable();
  }
}
