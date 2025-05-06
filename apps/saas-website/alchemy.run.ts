import alchemy from "alchemy";
// It's good practice to include a 'naked' import for the cloudflare provider
// to ensure its resources are registered with Alchemy.
import "alchemy/cloudflare";
import { Vite, R2RestStateStore } from "alchemy/cloudflare";

// These environment variables MUST be set before running the script.
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const ALCHEMY_STATE_R2_BUCKET_NAME = process.env.ALCHEMY_STATE_R2_BUCKET_NAME;
const ALCHEMY_ENCRYPTION_PASSWORD = process.env.ALCHEMY_ENCRYPTION_PASSWORD;
const CLOUDFLARE_API_TOKEN_SECRET = alchemy.secret(process.env.CLOUDFLARE_API_TOKEN); // For API token-based auth

if (!CLOUDFLARE_ACCOUNT_ID) {
  console.error("Error: CLOUDFLARE_ACCOUNT_ID environment variable is not set. This is required.");
  process.exit(1);
}
if (!ALCHEMY_STATE_R2_BUCKET_NAME) {
  console.error("Error: ALCHEMY_STATE_R2_BUCKET_NAME environment variable is not set. This R2 bucket must exist for Alchemy state.");
  process.exit(1);
}
if (!ALCHEMY_ENCRYPTION_PASSWORD) {
  // It's crucial to have a password for state encryption, especially with remote state.
  // If not set, Alchemy might default to an insecure method or fail, depending on its implementation.
  // Forcing an error here if not set is a safer default.
  console.error("Error: ALCHEMY_ENCRYPTION_PASSWORD environment variable is not set. This is required for encrypting state in R2.");
  process.exit(1);
}

const app = await alchemy("saas-website-alchemy", {
  stage: process.env.USER ?? "dev", // Or a fixed stage like 'production', 'staging'
  phase: process.argv.includes("--destroy") ? "destroy" : "up",
  quiet: !process.argv.includes("--verbose"),
  password: ALCHEMY_ENCRYPTION_PASSWORD, // For state encryption

  // Configure R2 as the state store
  stateStore: (scope) => new R2RestStateStore(scope, {
    bucketName: ALCHEMY_STATE_R2_BUCKET_NAME,
    // accountId: CLOUDFLARE_ACCOUNT_ID, // The R2RestStateStore might pick this up from the environment or scope implicitly.
                                        // The example doesn't show it explicitly here, but it's required for R2 operations.
                                        // If issues arise, check if it needs to be passed here or if env vars are sufficient.
  }),
});

// Define the Vite application resource for deployment
export const website = await Vite("saas-app-vite", {
  name: "saas-website", // This should map to the Cloudflare Worker name
  command: "bun run build", // Script from package.json to build the Vite app
  assets: "./dist/client",  // Point to the BUILT worker script and client assets directory
  main: "./dist/saas_website/index.js", // Entrypoint for your Hono backend worker
  accountId: CLOUDFLARE_ACCOUNT_ID, // Explicitly set accountId for the Vite resource
  apiToken: CLOUDFLARE_API_TOKEN_SECRET
});

// Log the URL after deployment
// The actual URL will be available once 'alchemy up' (or bun ./alchemy.run.ts) completes.
console.log("SaaS Website URL (after deployment):", {
  url: website.url,
});

// Finalize the Alchemy app to apply changes or clean up resources
await app.finalize(); 