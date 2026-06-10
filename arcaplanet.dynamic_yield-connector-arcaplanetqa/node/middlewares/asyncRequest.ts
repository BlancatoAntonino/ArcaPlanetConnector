
export async function asyncRequest(ctx: Context, next: () => Promise<any>) {
    try {

        ctx.status = 200;
        next();

    } catch (error) {
        ctx.state.logger.error({
            ctx,
            operation: "asyncRequest",
            message: `Error occurred during async request: ${error.message}`
        });
    }
}
