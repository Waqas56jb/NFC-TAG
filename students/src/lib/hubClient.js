import { createHub } from './hub'
import { rest } from './rest'

export const hub = createHub(rest)
