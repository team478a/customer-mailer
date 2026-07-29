export type MailProvider = "local" | "resend";
export type DataProvider = "local" | "supabase";

export type ProjectSettings = {
  mailProvider: MailProvider;
  dataProvider: DataProvider;
  fromName: string;
  fromEmail: string;
  replyTo: string;
  subjectPrefix: string;
  signature: string;
  footer: string;
  includeUnsubscribeFooter: boolean;
  testMode: boolean;
  batchSize: number;
  delayMs: number;
  supabaseUrl: string;
  supabaseAnonKey: string;
};

export type ProjectSecrets = {
  resendApiKey: string;
  resendWebhookSecret: string;
};

export const DEFAULT_PROJECT_SETTINGS: ProjectSettings = {
  mailProvider: "local",
  dataProvider: "local",
  fromName: "MailSend",
  fromEmail: "",
  replyTo: "",
  subjectPrefix: "",
  signature: "",
  footer: "",
  includeUnsubscribeFooter: true,
  testMode: true,
  batchSize: 20,
  delayMs: 500,
  supabaseUrl: "",
  supabaseAnonKey: "",
};

export const EMPTY_PROJECT_SECRETS: ProjectSecrets = {
  resendApiKey: "",
  resendWebhookSecret: "",
};
