import { Notification } from '../../notifications/core/notification/implementation';

export class AbortNotification extends Notification<'abort', any> {
  constructor(reason?: any) {
    super('abort', reason);
  }
}
