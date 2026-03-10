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
});
