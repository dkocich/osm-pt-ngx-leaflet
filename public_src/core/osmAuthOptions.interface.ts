export interface IOSMAuthOptions {
  oauth_consumer_key: string;
  oauth_secret: string;
  url?: string;
  auto?: boolean;
  loading?: () => any;
  done?: () => any;
  landing?: string;
  singlepage?: boolean;
}
