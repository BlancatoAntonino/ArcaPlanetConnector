export async function dynamicYieldPixelSettings(
  ctx: Context,
  next: () => Promise<any>
) {
  const dynamicYieldSectionId =
    ctx.state.adminSettings?.dynamicYield?.dynamicYieldSectionId?.trim() ?? ''

  ctx.status = 200
  ctx.body = {
    dynamicYieldSectionId,
  }

  await next()
}
