import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000/api';
const USER_TOKEN = __ENV.USER_TOKEN || '';
const ADMIN_TOKEN = __ENV.ADMIN_TOKEN || '';

const PRODUCT_ID = __ENV.PRODUCT_ID || '';
const CART_PRODUCT_ID = __ENV.CART_PRODUCT_ID || PRODUCT_ID || '';
const ORDER_ID = __ENV.ORDER_ID || '';
const RETURN_ORDER_ID = __ENV.RETURN_ORDER_ID || '';
const ADDRESS_ID = __ENV.ADDRESS_ID || '';
const SHIPPING_METHOD = __ENV.SHIPPING_METHOD || 'standard';

const ENABLE_ADMIN = toBool(__ENV.ENABLE_ADMIN, true);
const ENABLE_QUOTE = toBool(__ENV.ENABLE_QUOTE, false);
const ENABLE_TRACKING = toBool(__ENV.ENABLE_TRACKING, false);
const ENABLE_MUTATIONS = toBool(__ENV.ENABLE_MUTATIONS, false);
const ENABLE_NOTIFICATION_MUTATIONS = toBool(
  __ENV.ENABLE_NOTIFICATION_MUTATIONS,
  false,
);
const ENABLE_RETURN_MUTATIONS = toBool(__ENV.ENABLE_RETURN_MUTATIONS, false);
const ENABLE_CART_MUTATIONS = toBool(__ENV.ENABLE_CART_MUTATIONS, false);

export const options = {
  scenarios: {
    catalog_browsing: {
      executor: 'ramping-arrival-rate',
      startRate: 5,
      timeUnit: '1s',
      preAllocatedVUs: 20,
      maxVUs: 120,
      stages: [
        { target: 20, duration: '2m' },
        { target: 50, duration: '3m' },
        { target: 80, duration: '3m' },
        { target: 0, duration: '1m' },
      ],
      exec: 'catalogBrowsing',
    },
    user_account_flow: {
      executor: 'constant-vus',
      vus: 20,
      duration: '8m',
      exec: 'userAccountFlow',
    },
    admin_flow: {
      executor: 'constant-vus',
      vus: 8,
      duration: '8m',
      exec: 'adminFlow',
    },
    optional_write_flow: {
      executor: 'constant-vus',
      vus: 4,
      duration: '6m',
      exec: 'optionalWriteFlow',
      startTime: '30s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<900', 'p(99)<1800'],
    'http_req_duration{endpoint:products_list}': ['p(95)<500'],
    'http_req_duration{endpoint:product_detail}': ['p(95)<500'],
    'http_req_duration{endpoint:cart_get}': ['p(95)<600'],
    'http_req_duration{endpoint:cart_validate}': ['p(95)<700'],
    'http_req_duration{endpoint:addresses_list}': ['p(95)<600'],
    'http_req_duration{endpoint:orders_me}': ['p(95)<700'],
    'http_req_duration{endpoint:notifications_list}': ['p(95)<700'],
    'http_req_duration{endpoint:notifications_unread_count}': ['p(95)<500'],
    'http_req_duration{endpoint:returns_me}': ['p(95)<700'],
    'http_req_duration{endpoint:admin_overview}': ['p(95)<900'],
    'http_req_duration{endpoint:admin_returns_list}': ['p(95)<900'],
    'http_req_duration{endpoint:stock_adjustments_list}': ['p(95)<900'],
    'http_req_duration{endpoint:orders_quote}': ['p(95)<900'],
    'http_req_duration{endpoint:order_tracking}': ['p(95)<900'],
    'http_req_duration{endpoint:cart_add}': ['p(95)<900'],
    'http_req_duration{endpoint:cart_update_item}': ['p(95)<900'],
    'http_req_duration{endpoint:cart_remove_item}': ['p(95)<900'],
    'http_req_duration{endpoint:returns_create}': ['p(95)<1100'],
    'http_req_duration{endpoint:notifications_mark_all_read}': ['p(95)<700'],
  },
  summaryTrendStats: ['avg', 'min', 'med', 'p(90)', 'p(95)', 'p(99)', 'max'],
};

function toBool(value, defaultValue) {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }
  return String(value).toLowerCase() === 'true';
}

function authHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

function shouldSkipToken(token) {
  return !token || token.trim().length < 10;
}

function checkExpectedResponse(res, label = 'status is 2xx/3xx') {
  check(res, {
    [label]: (r) => r.status >= 200 && r.status < 400,
  });
  return res;
}

function safeGet(url, params) {
  return checkExpectedResponse(http.get(url, params));
}

function safePost(url, body, params) {
  return checkExpectedResponse(http.post(url, body, params));
}

function safePatch(url, body, params) {
  return checkExpectedResponse(http.patch(url, body, params));
}

function safeDelete(url, params) {
  return checkExpectedResponse(http.del(url, null, params));
}

function readJson(res) {
  try {
    return res.json();
  } catch {
    return null;
  }
}

function extractFirstProductId(listResponse) {
  const body = readJson(listResponse);
  return (
    body?.items?.[0]?.id ||
    body?.data?.items?.[0]?.id ||
    body?.data?.[0]?.id ||
    null
  );
}

function extractFirstOrderId(ordersResponse) {
  const body = readJson(ordersResponse);
  return (
    body?.items?.[0]?.id ||
    body?.data?.items?.[0]?.id ||
    body?.data?.[0]?.id ||
    null
  );
}

function extractFirstNotificationId(notificationsResponse) {
  const body = readJson(notificationsResponse);
  return (
    body?.items?.[0]?.id ||
    body?.data?.items?.[0]?.id ||
    body?.data?.[0]?.id ||
    null
  );
}

function extractFirstCartItemId(cartResponse) {
  const body = readJson(cartResponse);
  return body?.items?.[0]?.id || body?.data?.items?.[0]?.id || null;
}

export function catalogBrowsing() {
  const token = shouldSkipToken(USER_TOKEN) ? ADMIN_TOKEN : USER_TOKEN;
  if (shouldSkipToken(token)) {
    sleep(1);
    return;
  }

  const productsList = safeGet(`${BASE_URL}/products?page=1&limit=12`, {
    headers: authHeaders(token),
    tags: { endpoint: 'products_list' },
  });

  const productId = PRODUCT_ID || extractFirstProductId(productsList);
  if (productId) {
    safeGet(`${BASE_URL}/products/${productId}`, {
      headers: authHeaders(token),
      tags: { endpoint: 'product_detail' },
    });
  }

  sleep(0.3);
}

export function userAccountFlow() {
  if (shouldSkipToken(USER_TOKEN)) {
    sleep(1);
    return;
  }

  safeGet(`${BASE_URL}/cart`, {
    headers: authHeaders(USER_TOKEN),
    tags: { endpoint: 'cart_get' },
  });

  safePost(`${BASE_URL}/cart/validate`, null, {
    headers: authHeaders(USER_TOKEN),
    tags: { endpoint: 'cart_validate' },
  });

  safeGet(`${BASE_URL}/addresses`, {
    headers: authHeaders(USER_TOKEN),
    tags: { endpoint: 'addresses_list' },
  });

  const ordersRes = safeGet(`${BASE_URL}/orders/me?page=1&limit=10`, {
    headers: authHeaders(USER_TOKEN),
    tags: { endpoint: 'orders_me' },
  });

  safeGet(`${BASE_URL}/notifications?page=1&limit=10`, {
    headers: authHeaders(USER_TOKEN),
    tags: { endpoint: 'notifications_list' },
  });

  safeGet(`${BASE_URL}/notifications/unread-count`, {
    headers: authHeaders(USER_TOKEN),
    tags: { endpoint: 'notifications_unread_count' },
  });

  safeGet(`${BASE_URL}/returns/me`, {
    headers: authHeaders(USER_TOKEN),
    tags: { endpoint: 'returns_me' },
  });

  const dynamicOrderId = ORDER_ID || extractFirstOrderId(ordersRes);
  if (ENABLE_TRACKING && dynamicOrderId) {
    safeGet(`${BASE_URL}/orders/${dynamicOrderId}/tracking`, {
      headers: authHeaders(USER_TOKEN),
      tags: { endpoint: 'order_tracking' },
    });
  }

  if (ENABLE_QUOTE && ADDRESS_ID) {
    safePost(
      `${BASE_URL}/orders/quote`,
      JSON.stringify({
        addressId: ADDRESS_ID,
        shippingMethod: SHIPPING_METHOD,
      }),
      {
        headers: authHeaders(USER_TOKEN),
        tags: { endpoint: 'orders_quote' },
      },
    );
  }

  sleep(0.5);
}

export function adminFlow() {
  if (!ENABLE_ADMIN || shouldSkipToken(ADMIN_TOKEN)) {
    sleep(1);
    return;
  }

  safeGet(`${BASE_URL}/admin/dashboard/overview`, {
    headers: authHeaders(ADMIN_TOKEN),
    tags: { endpoint: 'admin_overview' },
  });

  safeGet(`${BASE_URL}/returns`, {
    headers: authHeaders(ADMIN_TOKEN),
    tags: { endpoint: 'admin_returns_list' },
  });

  const productId = PRODUCT_ID || CART_PRODUCT_ID;
  if (productId) {
    safeGet(`${BASE_URL}/products/${productId}/stock-adjustments?page=1&limit=20`, {
      headers: authHeaders(ADMIN_TOKEN),
      tags: { endpoint: 'stock_adjustments_list' },
    });
  }

  sleep(0.7);
}

export function optionalWriteFlow() {
  if (!ENABLE_MUTATIONS || shouldSkipToken(USER_TOKEN)) {
    sleep(1);
    return;
  }

  if (ENABLE_CART_MUTATIONS && CART_PRODUCT_ID) {
    safePost(
      `${BASE_URL}/cart/add`,
      JSON.stringify({
        productId: CART_PRODUCT_ID,
        quantity: 1,
      }),
      {
        headers: authHeaders(USER_TOKEN),
        tags: { endpoint: 'cart_add' },
      },
    );

    const cartRes = safeGet(`${BASE_URL}/cart`, {
      headers: authHeaders(USER_TOKEN),
      tags: { endpoint: 'cart_get' },
    });
    const cartItemId = extractFirstCartItemId(cartRes);

    if (cartItemId) {
      safePatch(
        `${BASE_URL}/cart/item/${cartItemId}`,
        JSON.stringify({ quantity: 1 }),
        {
          headers: authHeaders(USER_TOKEN),
          tags: { endpoint: 'cart_update_item' },
        },
      );

      safeDelete(`${BASE_URL}/cart/item/${cartItemId}`, {
        headers: authHeaders(USER_TOKEN),
        tags: { endpoint: 'cart_remove_item' },
      });
    }
  }

  if (ENABLE_NOTIFICATION_MUTATIONS) {
    const notificationsRes = safeGet(`${BASE_URL}/notifications?page=1&limit=10`, {
      headers: authHeaders(USER_TOKEN),
      tags: { endpoint: 'notifications_list' },
    });

    const notificationId = extractFirstNotificationId(notificationsRes);
    if (notificationId) {
      safePatch(
        `${BASE_URL}/notifications/${notificationId}/read`,
        null,
        {
          headers: authHeaders(USER_TOKEN),
          tags: { endpoint: 'notifications_mark_one_read' },
        },
      );
    }

    safePatch(`${BASE_URL}/notifications/mark-all-read`, null, {
      headers: authHeaders(USER_TOKEN),
      tags: { endpoint: 'notifications_mark_all_read' },
    });
  }

  if (ENABLE_RETURN_MUTATIONS && RETURN_ORDER_ID) {
    safePost(
      `${BASE_URL}/returns`,
      JSON.stringify({
        orderId: RETURN_ORDER_ID,
        reason: 'other',
        reasonDetails: 'Load test return creation',
      }),
      {
        headers: authHeaders(USER_TOKEN),
        tags: { endpoint: 'returns_create' },
      },
    );
  }

  sleep(1);
}

