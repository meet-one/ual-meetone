import { UALError, UALErrorType } from 'universal-authenticator-library'

import { Name } from './interfaces'

export class UALMeetOneError extends UALError {
  constructor(message: string, type: UALErrorType, cause: Error | null) {
    super(message, type, cause, Name)
  }
}
