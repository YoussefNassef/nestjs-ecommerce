import request from 'supertest';

const baseUrl = process.env.E2E_BASE_URL ?? 'http://localhost:3000';
const userToken = process.env.E2E_USER_TOKEN ?? '';
const adminToken = process.env.E2E_ADMIN_TOKEN ?? '';

const adminAuditOrderId = process.env.E2E_ADMIN_AUDIT_ORDER_ID ?? '';
const paymentOrderId = process.env.E2E_PAYMENT_ORDER_ID ?? '';
const returnOrderId = process.env.E2E_RETURN_ORDER_ID ?? '';
const trackingOrderId = process.env.E2E_TRACKING_ORDER_ID ?? '';

const hasCoreAuth = Boolean(userToken && adminToken);
const runCoreSuite = Boolean(process.env.E2E_BASE_URL && hasCoreAuth);

const runIf = (condition: boolean) => (condition ? it : it.skip);

describe('Critical Flows (E2E)', () => {
  let e2eSupportTicketId: string | null = null;

  beforeAll(() => {
    if (!runCoreSuite) {
      // eslint-disable-next-line no-console
      console.warn(
        '[E2E] Skipping critical flows: set E2E_BASE_URL, E2E_USER_TOKEN, E2E_ADMIN_TOKEN',
      );
    }
  });

  runIf(runCoreSuite)(
    'user can access core protected endpoints (orders + notifications)',
    async () => {
      const [ordersRes, notificationsRes] = await Promise.all([
        request(baseUrl)
          .get('/api/orders/me?page=1&limit=5')
          .set('Authorization', `Bearer ${userToken}`),
        request(baseUrl)
          .get('/api/notifications?page=1&limit=5')
          .set('Authorization', `Bearer ${userToken}`),
      ]);

      expect(ordersRes.status).toBe(200);
      expect(ordersRes.body).toHaveProperty('success', true);
      expect(ordersRes.body).toHaveProperty('data.items');

      expect(notificationsRes.status).toBe(200);
      expect(notificationsRes.body).toHaveProperty('success', true);
      expect(notificationsRes.body).toHaveProperty('data.items');
    },
  );

  runIf(runCoreSuite && Boolean(adminAuditOrderId))(
    'admin can add note and read order audit trail',
    async () => {
      const note = `E2E note ${Date.now()}`;

      const noteRes = await request(baseUrl)
        .post(`/api/admin/orders/${adminAuditOrderId}/notes`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ note });

      expect([200, 201]).toContain(noteRes.status);
      expect(noteRes.body).toHaveProperty('success', true);

      const auditRes = await request(baseUrl)
        .get(`/api/admin/orders/${adminAuditOrderId}/audit?page=1&limit=20`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(auditRes.status).toBe(200);
      expect(auditRes.body).toHaveProperty('success', true);
      expect(Array.isArray(auditRes.body.data.items)).toBe(true);

      const hasNewNote = (auditRes.body.data.items as Array<{ note?: string }>).some(
        (item) => item.note === note,
      );
      expect(hasNewNote).toBe(true);
    },
  );

  runIf(runCoreSuite && Boolean(trackingOrderId))(
    'admin order action endpoint can update order workflow',
    async () => {
      const actionRes = await request(baseUrl)
        .post(`/api/admin/orders/${trackingOrderId}/actions`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          action: 'update_order_status',
          orderStatus: 'in_progress',
          note: `E2E delivery update ${Date.now()}`,
        });

      expect([200, 201]).toContain(actionRes.status);
      expect(actionRes.body).toHaveProperty('success', true);
      expect(actionRes.body).toHaveProperty('data.id', trackingOrderId);
    },
  );

  runIf(runCoreSuite && Boolean(paymentOrderId))(
    'payment create is idempotent per idempotency-key for same order',
    async () => {
      const idemKey = `e2e:${paymentOrderId}:${Date.now()}`;
      const payload = {
        orderId: paymentOrderId,
        name: 'John Doe',
        number: '4111111111111111',
        month: 12,
        year: 2029,
        cvc: '123',
      };

      const first = await request(baseUrl)
        .post('/api/payments/create')
        .set('Authorization', `Bearer ${userToken}`)
        .set('idempotency-key', idemKey)
        .send(payload);

      expect([200, 201]).toContain(first.status);
      expect(first.body).toHaveProperty('success', true);
      expect(first.body).toHaveProperty('data.paymentUrl');

      const second = await request(baseUrl)
        .post('/api/payments/create')
        .set('Authorization', `Bearer ${userToken}`)
        .set('idempotency-key', idemKey)
        .send(payload);

      expect([200, 201]).toContain(second.status);
      expect(second.body).toHaveProperty('success', true);
      expect(second.body).toHaveProperty('data.paymentUrl');
      expect(second.body.data.paymentUrl).toBe(first.body.data.paymentUrl);
    },
  );

  runIf(runCoreSuite && Boolean(returnOrderId))(
    'user can create return request for eligible order',
    async () => {
      const returnRes = await request(baseUrl)
        .post('/api/returns')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          orderId: returnOrderId,
          reason: 'other',
          reasonDetails: `E2E return ${Date.now()}`,
        });

      expect([200, 201]).toContain(returnRes.status);
      expect(returnRes.body).toHaveProperty('success', true);
      expect(returnRes.body).toHaveProperty('data.orderId', returnOrderId);
    },
  );

  runIf(runCoreSuite)(
    'support ticket conversation works across user and admin',
    async () => {
      const createTicketRes = await request(baseUrl)
        .post('/api/support/tickets')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          subject: `E2E support ${Date.now()}`,
          message: 'I need help with this order',
        });

      expect([200, 201]).toContain(createTicketRes.status);
      expect(createTicketRes.body).toHaveProperty('success', true);
      expect(createTicketRes.body).toHaveProperty('data.id');
      e2eSupportTicketId = createTicketRes.body.data.id;

      const listAdminRes = await request(baseUrl)
        .get('/api/admin/support/tickets?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(listAdminRes.status).toBe(200);
      expect(listAdminRes.body).toHaveProperty('success', true);
      expect(Array.isArray(listAdminRes.body.data.items)).toBe(true);

      const assignRes = await request(baseUrl)
        .patch(`/api/admin/support/tickets/${e2eSupportTicketId}/assign-me`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(assignRes.status).toBe(200);
      expect(assignRes.body).toHaveProperty('success', true);
      expect(assignRes.body).toHaveProperty(
        'data.assignedAdminUserId',
        expect.any(Number),
      );

      const adminReplyRes = await request(baseUrl)
        .post(`/api/admin/support/tickets/${e2eSupportTicketId}/messages`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ message: 'Thanks, we are checking this for you' });

      expect([200, 201]).toContain(adminReplyRes.status);
      expect(adminReplyRes.body).toHaveProperty('success', true);

      const userTicketRes = await request(baseUrl)
        .get(`/api/support/tickets/${e2eSupportTicketId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(userTicketRes.status).toBe(200);
      expect(userTicketRes.body).toHaveProperty('success', true);
      expect(Array.isArray(userTicketRes.body.data.messages)).toBe(true);
      const hasAdminReply = (
        userTicketRes.body.data.messages as Array<{ authorRole?: string }>
      ).some((message) => message.authorRole === 'admin');
      expect(hasAdminReply).toBe(true);

      const userReplyRes = await request(baseUrl)
        .post(`/api/support/tickets/${e2eSupportTicketId}/messages`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ message: 'Thanks, waiting for update.' });

      expect([200, 201]).toContain(userReplyRes.status);
      expect(userReplyRes.body).toHaveProperty('success', true);

      const resolveRes = await request(baseUrl)
        .patch(`/api/admin/support/tickets/${e2eSupportTicketId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'resolved' });

      expect(resolveRes.status).toBe(200);
      expect(resolveRes.body).toHaveProperty('success', true);
      expect(resolveRes.body).toHaveProperty('data.status', 'resolved');

      const reopenRes = await request(baseUrl)
        .post(`/api/support/tickets/${e2eSupportTicketId}/reopen`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({});

      expect(reopenRes.status).toBe(200);
      expect(reopenRes.body).toHaveProperty('success', true);
      expect(reopenRes.body).toHaveProperty('data.status', 'open');

      const closeRes = await request(baseUrl)
        .post(`/api/support/tickets/${e2eSupportTicketId}/close`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({});

      expect(closeRes.status).toBe(200);
      expect(closeRes.body).toHaveProperty('success', true);
      expect(closeRes.body).toHaveProperty('data.status', 'closed');
    },
  );
});
