import { http } from 'msw';
import { success } from '../helpers';

export const categoryHandlers = [
  http.get('/api/v1/categories', () => {
    return success([
      { _id: 'development', name: 'Development', slug: 'development', icon: 'code', isActive: true },
      { _id: 'data-science', name: 'Data Science', slug: 'data-science', icon: 'database', isActive: true },
      { _id: 'business', name: 'Business', slug: 'business', icon: 'briefcase', isActive: true },
      { _id: 'design', name: 'Design', slug: 'design', icon: 'palette', isActive: true },
    ]);
  }),
];