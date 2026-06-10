import { APP } from "@vtex/api";
import { LOGGER_ENTITY } from "./constants";

export async function wait(time: number = 500): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, time);
  })
}

export function isValid(field: any): Boolean {
  return field != undefined && field != null && field != "null" && field != "undefined" && field != " " && field != "" && field != !"-" && field != "_" &&
    (
      typeof field != 'object' ||
      (typeof field == 'object' && field.length == undefined) ||
      typeof field == 'object' && field.length > 0
    );
}

export function getRandomReference(): string {
  return (Math.floor(Math.random() * Date.now()) + "").substring(0, 200);
}

export const getCircularReplacer = () => {
  const seen = new WeakSet();
  return ({ }, value: any) => {
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) {
        return;
      }
      seen.add(value);
    }
    return value;
  };
}

export function stringify(data: any): string {
  return typeof data == "object" ? JSON.stringify(data, getCircularReplacer()) == "{}" ? data : JSON.stringify(data, getCircularReplacer()) : data;
}


//return a date with a delay in hours passed by parameter
export function getHoursDelayedDate(hoursDelay: number) {
  let date = new Date();
  date.setHours(date.getHours() + hoursDelay);
  let isoDate = date.toISOString().split("T")[0]
  return isoDate
}

export function getLocalDateTime(timeZone: string): Date {

  let currentDate = new Date().toLocaleDateString("it-IT", { timeZone: timeZone });
  let currentTime = new Date().toLocaleTimeString("it-IT", { timeZone: timeZone });

  let splittedDate = currentDate.split("/");
  splittedDate[1] = parseInt(splittedDate[1]) < 10 ? ("0" + splittedDate[1]) : (splittedDate[1]);
  splittedDate[0] = parseInt(splittedDate[0]) < 10 ? ("0" + splittedDate[0]) : (splittedDate[0]);

  let formattedDate = `${splittedDate[2]}-${splittedDate[1]}-${splittedDate[0]}T${currentTime}`;

  let currentDateTime = new Date(formattedDate);

  return currentDateTime

}

function formatMemoryUsage(data: number): string {
  return `${Math.round((data / 1024 / 1024) * 100) / 100} MB`;
}

export function getMemoryUsageInfo() {
  const memoryData = process.memoryUsage();

  const memoryUsage = {
    rss: `${formatMemoryUsage(
      memoryData.rss
    )} -> Resident Set Size - total memory allocated for the process execution`,
    heapTotal: `${formatMemoryUsage(
      memoryData.heapTotal
    )} -> total size of the allocated heap`,
    heapUsed: `${formatMemoryUsage(
      memoryData.heapUsed
    )} -> actual memory used during the execution`,
    external: `${formatMemoryUsage(memoryData.external)} -> V8 external memory`,
  };

  return memoryUsage;
}

export function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  let t: NodeJS.Timeout | undefined
  const timeout = new Promise<never>((_, reject) => {
    t = setTimeout(() => reject(new Error(`[TIMEOUT ${ms}ms] ${label}`)), ms)
  })
  return Promise.race([p, timeout]).finally(() => {
    if (t) clearTimeout(t)
  }) as Promise<T>
}

export async function safeLogToMasterdata(ctx: Context, message: string) {

  try {
    await withTimeout(
      ctx.clients.masterdata.createDocument({
        dataEntity: LOGGER_ENTITY,
        fields: {
          app: APP.NAME,
          message,
          sendAlert: true,
          severity: "error",
        },
      }),
      4000,
      "masterdata.createDocument LOGGER_ENTITY"
    )
  } catch (e) {

    ctx.state.logger.warn(`Franchise availability - Failed to write error log to Masterdata: ${(e as any)?.message}`)
  }
}

export function formatErr(error: any): string {
  const status = error?.response?.status
  const data = error?.response?.data
  const msg = error?.message
  const base = status ? `HTTP ${status}` : (msg ?? 'Unknown error')
  const tail = data ? ` - ${String(data).slice(0, 400)}` : ''
  return `${base}${tail}`
}