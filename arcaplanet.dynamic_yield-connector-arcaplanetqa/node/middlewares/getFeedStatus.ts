import { stringify } from "../utils/functions";

export async function getFeedStatus(ctx: Context, next: () => Promise<void>) {
  const {
    clients: { feedManager },
    query: { force = false },
  } = ctx

  try {

    if (!force) {

      const feedStatus = await feedManager.getStatus()
      if (feedStatus && !feedStatus.completed) {
        throw new Error("#GenerationOngoing")
      }

      if (!feedStatus) {
        await feedManager.updateStatus({
          completed: false,
          error: false,
          startedAt: new Date().toISOString(),
        })
      }

    }

    await next()

  } catch (error) {

    if (error.message == "#GenerationOngoing") {

      ctx.status = 200
      ctx.body = 'Feed generation in progress'

    } else {
      ctx.state.logger.error(`${getFeedStatus.name} --Details: ${stringify(error)}`);
      ctx.status = 500;
    }

  }
}
