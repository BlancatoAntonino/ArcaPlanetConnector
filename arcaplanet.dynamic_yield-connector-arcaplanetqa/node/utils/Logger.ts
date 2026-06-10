import { APP, LINKED, Logger, LogLevel } from "@vtex/api";
import { LOGGER_ENTITY } from "./constants";

export class CustomLogger extends Logger {
  ctx: Context
  constructor(ctx: any) {
    super(ctx)
    this.ctx = ctx;
    this.info = (msg: any) => this.writeLog(msg, LogLevel.Info);
    this.warn = (msg: any) => this.writeLog(msg, LogLevel.Warn);
    this.debug = (msg: any) => this.writeLog(msg, LogLevel.Debug);
    this.error = (msg: any) => this.writeLog(msg, LogLevel.Error);
  }

  writeLog(message: any, severity: LogLevel) {

    let body = {
      app: APP.NAME,
      message: typeof message == "object" ? JSON.stringify(message, this.getCircularReplacer()) : message,
      severity: severity,
      timestamp: new Date().toISOString()
    }
    
    LINKED ? 
      console[severity](body) : 
      this.ctx.clients.masterdata.createDocument({
        dataEntity: LOGGER_ENTITY,
        fields: body
      }).then(() => console.log(`log ${severity}: OK`), (err: any) => console.error(err))
  }

  getCircularReplacer = () => {
    const seen = new WeakSet();
    return ({ }, value: object | null) => {
      if (typeof value === "object" && value !== null) {
        if (seen.has(value)) {
          return;
        }
        seen.add(value);
      }
      return value;
    };
  }

}
