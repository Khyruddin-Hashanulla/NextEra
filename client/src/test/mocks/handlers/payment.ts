import { http, HttpResponse } from 'msw';
import { failure, jsonResponse, success } from '../helpers';

export const paymentHandlers = [
  http.post('/api/v1/student/payments/initiate', async ({ request }) => {
    const body = (await request.json()) as { courseId?: string };
    if (!body.courseId) return failure('Course is required', 400);
    return success({ orderId: 'order_123', amount: 1999, currency: 'INR' });
  }),

  http.post('/api/v1/student/payments/verify', async ({ request }) => {
    const body = (await request.json()) as { razorpayOrderId?: string };
    if (!body.razorpayOrderId) return failure('Invalid payment payload', 400);
    return success({ success: true });
  }),

  http.get('/api/v1/student/payments', () => {
    return success({ payments: [], total: 0, page: 1, totalPages: 1 });
  }),

  http.get('/api/v1/student/payments/:id', ({ params }) => {
    if (params.id === 'missing') return failure('Payment not found', 404);
    return success({ _id: params.id, amount: 1999, status: 'success' });
  }),
];

export const failureHandlers = [
  http.get('/api/v1/boom', () => failure('Internal server error', 500)),
  http.get('/api/v1/unauthorized', () => failure('Unauthorized', 401)),
  http.get('/api/v1/forbidden', () => failure('Forbidden', 403)),
  http.get('/api/v1/not-found', () => failure('Not found', 404)),
];

export const networkErrorHandlers = [
  http.get('/api/v1/network-error', () => {
    return HttpResponse.error();
  }),
];
