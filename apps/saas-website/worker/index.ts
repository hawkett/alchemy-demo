import { Hono } from 'hono';
import { provisionCustomerR2Bucket, type AccountInfraConfig } from 'account-infra';

// Basic Env interface - can be expanded later for bindings
export interface Env {
  ASSETS: Fetcher; // For SPA serving, provided by @cloudflare/vite-plugin

  // Environment variables needed for account-infra
  CLOUDFLARE_ACCOUNT_ID: string;
  CLOUDFLARE_API_TOKEN: string;
  ALCHEMY_MAIN_R2_BUCKET_NAME: string;
  ALCHEMY_PASSWORD?: string; // Optional, for encrypting account-infra's Alchemy state
}

const app = new Hono<{ Bindings: Env }>();

// Replicate similar API behavior as the template
app.get('/api/hello', (c) => {
  console.log('Hono worker received request for /api/hello');
  return c.json({
    name: "Cloudflare (from Hono!)",
  });
});

// New route for provisioning
app.post('/api/provision', async (c) => {
  try {
    const body = await c.req.json<{ accountId: string }>();
    const customerAccountId = body.accountId;

    if (!customerAccountId) {
      return c.json({ success: false, message: "Missing accountId in request body." }, 400);
    }

    console.log(`API: Received provision request for customerAccountId: ${customerAccountId}`);

    // Prepare config for account-infra
    // These values MUST be set as environment variables/secrets for the saas-website worker
    const accountInfraConfig: AccountInfraConfig = {
      cloudflareAccountId: c.env.CLOUDFLARE_ACCOUNT_ID,
      cloudflareApiToken: c.env.CLOUDFLARE_API_TOKEN,
      customerAccountId: customerAccountId,
      alchemyMainR2BucketName: c.env.ALCHEMY_MAIN_R2_BUCKET_NAME,
      alchemyPassword: c.env.ALCHEMY_PASSWORD, // Will be undefined if not set, which is fine
      // stage, phase, verbose can use defaults or be configured if needed
    };
    
    console.log('API: Calling provisionCustomerR2Bucket with config:', 
      { ...accountInfraConfig, cloudflareApiToken: "[REDACTED]" } // Avoid logging actual token
    );

    const result = await provisionCustomerR2Bucket(accountInfraConfig);
    
    console.log('API: provisionCustomerR2Bucket successful:', result);
    return c.json({ success: true, data: result });

  } catch (error: any) {
    console.error('API: Error during provisioning:', error.message, error.stack);
    // Check if the error object has more details, e.g., from Alchemy
    const errorMessage = error.cause instanceof Error ? error.cause.message : error.message;
    return c.json({ success: false, message: "Provisioning failed.", error: errorMessage }, 500);
  }
});

// SPA Fallback (managed by @cloudflare/vite-plugin and its ASSETS binding)
// This should be the last route
app.get('*', (c) => c.env.ASSETS.fetch(c.req.raw));

// Hono automatically returns 404 for routes not defined.

// Default export for Cloudflare Workers
export default {
  fetch: app.fetch,
} satisfies ExportedHandler<Env>;
