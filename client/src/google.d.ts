interface CredentialResponse {
  credential: string
  select_by: string
}

interface IdConfiguration {
  client_id: string
  callback: (response: CredentialResponse) => void
  auto_select?: boolean
}

interface GsiButtonConfiguration {
  theme?: 'outline' | 'filled_blue' | 'filled_black'
  size?: 'large' | 'medium' | 'small'
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
  shape?: 'rectangular' | 'pill' | 'circle' | 'square'
  width?: number
}

interface Google {
  accounts: {
    id: {
      initialize: (config: IdConfiguration) => void
      renderButton: (parent: HTMLElement, options: GsiButtonConfiguration) => void
      prompt: () => void
    }
  }
}

declare const google: Google
