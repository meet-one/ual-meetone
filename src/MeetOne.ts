import {
  Authenticator,
  ButtonStyle,
  Chain,
  UALError,
  UALErrorType,
  User
} from 'universal-authenticator-library'

import { Name } from './interfaces'
import { MeetOneLogo } from './MeetOneLogo'
import { MeetOneUser } from './MeetOneUser'
import { UALMeetOneError } from './UALMeetOneError'

import MeetBridge from 'meet-bridge'
const mt = new MeetBridge()

export class MeetOne extends Authenticator {
  private users: MeetOneUser[] = []
  private meetoneIsLoading: boolean = true
  private initError: UALError | null = null

  private readonly supportedChains = {
    // MEET.ONE wallet only supports EOS mainnet for now.
    aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906: {},
  }

  /**
   * MeetOne Constructor.
   * @param chains
   */
  constructor(chains: Chain[]) {
    super(chains)
  }

  private supportsAllChains(): boolean {
    if (this.chains.length < 1) {
      return false
    }

    for (const chain of this.chains) {
      if (!this.supportedChains.hasOwnProperty(chain.chainId)) {
        return false
      }
    }
    return true
  }

  /**
   * handle any async operations required to initialize the authenticator.
   * isLoading() should return true until all async operations in init are complete and the authenticator is ready to accept login/logout requests.
   */
  public async init(): Promise<void> {
    this.meetoneIsLoading = true
    try {
      // @ts-ignore
      if (window.scatter && !window.scatter.isInject) {
        throw new Error('Unable to connect')
      }
    } catch (e) {
      this.initError = new UALMeetOneError(
        'Error occurred during autologin',
        UALErrorType.Initialization,
        e)
    } finally {
      this.meetoneIsLoading = false
    }
  }

  public reset(): void {
    this.initError = null
    this.init()
  }

  // Gives you the ability to customize your Authenticator and how it is displayed to app users.
  public getStyle(): ButtonStyle {
    return {
      // An icon displayed to app users when selecting their authentication method
      icon: MeetOneLogo,
      // Name displayed to app users
      text: Name,
      // Color of text used on top the `backgound` property above
      textColor: '#FFFFFF',
      // Background color displayed to app users who select your authenticator
      background: '#4A4A4A'
    }
  }

  public shouldRender(): boolean {
    // @ts-ignore
    if (this.supportsAllChains() && this.isMeetOneWebview()) {
      return true
    }
    return false
  }

  public shouldAutoLogin(): boolean {
    // Always autologin if should render, since that should only be inside the meetone browser
    return this.shouldRender()
  }

  /**
   * Requests the currently active account from Meet.One, will throw a Login error if Meet.One
   * does not respond or errors out
   */
  public async login(): Promise<User[]> {
    if (this.users.length === 0) {
      try {
        const res = await mt.invokeAccountInfo()
        if (res.data) {
          this.users.push(new MeetOneUser(this.chains[0], {
            name: res.data.account,
            address: res.data.publicKey
          }))
        } else {
          throw new Error('No result returned')
        }
      } catch (e) {
        throw new UALMeetOneError(
          'Unable to get the current account during login',
          UALErrorType.Login,
          e)
      }
    }

    return this.users
  }

  /**
   * Clears the array of authenticated users
   * Note: The name - logout - is slightly misleading in this particular case
   * as calling this method will not log a user out of the Meet.One app but rather
   * refresh the user list on the authenticator
   */
  public async logout(): Promise<void> {
    this.users = []
  }

  public async shouldRequestAccountName(): Promise<boolean> {
    return false
  }

  public isLoading(): boolean {
    return this.meetoneIsLoading
  }

  public isErrored(): boolean {
    return !!this.initError
  }

  public getError(): UALError | null {
    return this.initError
  }

  public getOnboardingLink(): string {
    return 'https://meet.one/'
  }

  public requiresGetKeyConfirmation(): boolean {
    return false
  }

  public isMeetOneWebview(): boolean {
    const userAgent = window.navigator.userAgent
    return userAgent.toLowerCase().includes('meet.one')
  }

  /**
   * Returns the amount of seconds after the authentication will be invalid for logging in on new
   * browser sessions.  Setting this value to zero will cause users to re-attempt authentication on
   * every new browser session.  Please note that the invalidate time will be saved client-side and
   * should not be relied on for security.
   */
  public shouldInvalidateAfter(): number {
    return 86400;
  }
}
