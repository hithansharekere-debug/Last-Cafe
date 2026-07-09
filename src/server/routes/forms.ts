import { Hono } from 'hono';
import type { UiResponse } from '@devvit/web/shared';

export const forms = new Hono();

forms.post('/example-submit', async (c) => {
  return c.json<UiResponse>({
    showToast: 'Feedback form submitted successfully!',
  }, 200);
});
