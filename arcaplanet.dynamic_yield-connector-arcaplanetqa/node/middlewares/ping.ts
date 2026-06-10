export async function ping(ctx: Context, next: () => Promise<any>) {
  const timestamp = new Date().toISOString()
  console.info(`ping ${timestamp}`);

  ctx.status = 200;
  ctx.body = timestamp;
  
  await next();
}
