import handler from 'vinext/server/fetch-handler';

// Pages rendered by the Worker carry the same security headers as static files (public/_headers).
// Preview iframes are same-origin, so framing is limited to this site.
const securityHeaders: Record<string, string> = {
  'Content-Security-Policy': "frame-ancestors 'self'",
  'X-Frame-Options': 'SAMEORIGIN',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

export default {
  async fetch(request: Request, env: unknown, ctx: unknown): Promise<Response> {
    const response: Response = await (handler as { fetch(request: Request, env: unknown, ctx: unknown): Promise<Response> }).fetch(request, env, ctx);
    const secured = new Response(response.body, response);
    for (const [name, value] of Object.entries(securityHeaders)) if (!secured.headers.has(name)) secured.headers.set(name, value);
    return secured;
  },
};
