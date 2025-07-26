export interface WordPressUser {
  ID: number;
  login: string;
  email: string;
  display_name: string;
  username: string;
  avatar_URL: string;
  profile_URL: string;
  site_count: number;
  verified: boolean;
}

export interface WordPressTokenSet {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type: string;
}

export interface UserProps extends Record<string, unknown> {
  claims: WordPressUser;
  tokenSet: WordPressTokenSet;
}
