export async function setDefaultHeaders(
  ctx: Context,
  next: () => Promise<void>
) {
  const { response } = ctx

  

  response.set('Access-Control-Allow-Origin', '*')
  response.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
  response.set(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, authorization'
  )
  response.set('Cache-Control', 'no-cache')

  await next()
}
