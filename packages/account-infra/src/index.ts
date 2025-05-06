import alchemy, { type Scope } from "alchemy";
import { R2Bucket, R2RestStateStore } from "alchemy/cloudflare";

export interface AccountInfraConfig {
  cloudflareAccountId: string;
  cloudflareApiToken: string;
  customerAccountId: string;
  alchemyMainR2BucketName: string;
  alchemyPassword?: string; // This is the raw password string
  stage?: string;
  phase?: "up" | "destroy";
  verbose?: boolean;
}

export async function provisionCustomerR2Bucket({
  cloudflareAccountId,
  cloudflareApiToken,
  customerAccountId,
  alchemyMainR2BucketName,
  alchemyPassword, // Raw string password
  stage = "dev",
  phase = "up",
  verbose = false,
}: AccountInfraConfig) {
  console.log(`Provisioning R2 bucket for customer: ${customerAccountId}, Stage: ${stage}, Phase: ${phase}`);

  const app = await alchemy(`account-infra-${customerAccountId}`, {
    stage: stage,
    phase: phase,
    quiet: !verbose,
    stateStore: (scope: Scope) => new R2RestStateStore(scope, {
      bucketName: alchemyMainR2BucketName,
    }),
    // Pass the raw string password to the main Alchemy scope
    ...(alchemyPassword && { password: alchemyPassword }), 
  });

  const bucketNameSuffix = customerAccountId.toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 30);
  const customerR2BucketName = `customer-${bucketNameSuffix}-${app.stage}`;

  const customerBucket = await R2Bucket(customerR2BucketName, {
    name: customerR2BucketName,
    // If accountId and apiToken need to be passed explicitly to R2Bucket:
    // accountId: cloudflareAccountId,
    // apiToken: alchemy.secret(cloudflareApiToken), // Here, API token would be a Secret
  });

  await app.finalize();

  // The R2Bucket resource's 'name' property should be the string name.
  // An R2 bucket doesn't have a direct '.url' like a website. 
  // It has an S3 endpoint, or you can set up a custom domain.
  // We will return only the name for now, as `.url` is not a standard property of R2Bucket resource output.
  console.log(`R2 Bucket details for ${customerAccountId}:`);
  console.log({ bucketName: customerBucket.name });

  return {
    bucketName: customerBucket.name,
    // bucketUrl: customerBucket.url, // Removed as .url is not a standard direct property
  };
}
