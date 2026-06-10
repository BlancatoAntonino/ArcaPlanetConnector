export interface CronJobRequest {
  uri: string
  method: string
  headers?: any
  body?: any
}

export interface CronJobItemRes {
  id: string
  workspace: string
  app: string
  request: CronJobRequest
  endDate: string
}

export interface CronJobScheduler {
  endDate: string
  expression: string
}

export interface CreateCronJobReq {
  request: CronJobRequest
  scheduler: CronJobScheduler
  retry?: {
    delay: {
      addMinutes: number
      addHours: number
      addDays: number
    },
    times: number
    backOffRate: number
  }
}
