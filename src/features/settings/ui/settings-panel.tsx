import { maskSecret } from "../application/settings";
import {
  ProjectSecrets,
  ProjectSettings,
} from "../domain/project-settings";

export function SettingsPanel({
  onReset,
  onSave,
  onSecretsChange,
  onSettingsChange,
  secrets,
  settings,
}: {
  onReset: () => void;
  onSave: () => void;
  onSecretsChange: (patch: Partial<ProjectSecrets>) => void;
  onSettingsChange: (patch: Partial<ProjectSettings>) => void;
  secrets: ProjectSecrets;
  settings: ProjectSettings;
}) {
  return (
    <section className="mt-6 space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div>
            <p className="text-sm font-bold text-indigo-600">ADMIN SETTINGS</p>
            <h2 className="mt-1 text-xl font-bold">プロジェクト設定</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              接続先、送信元、送信制御、メール表示をプロジェクト単位で管理します。
            </p>
          </div>
          <div className="flex gap-2">
            <button
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold"
              onClick={onReset}
              type="button"
            >
              初期値に戻す
            </button>
            <button
              className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-bold text-white"
              onClick={onSave}
              type="button"
            >
              設定を保存
            </button>
          </div>
        </div>
      </div>

      <SettingsSection
        description="現在はローカル送信を使用します。Resendを選択しても、サーバーAPI実装までは実メールを送信しません。"
        title="メール送信サービス"
      >
        <SelectField
          label="送信プロバイダー"
          onChange={(value) =>
            onSettingsChange({
              mailProvider: value as ProjectSettings["mailProvider"],
            })
          }
          options={[
            ["local", "ローカルシミュレーション"],
            ["resend", "Resend（接続準備）"],
          ]}
          value={settings.mailProvider}
        />
        <TextField
          label="Resend APIキー"
          note={`現在：${maskSecret(secrets.resendApiKey)}／セッション終了時に消去`}
          onChange={(value) => onSecretsChange({ resendApiKey: value })}
          placeholder="re_..."
          type="password"
          value={secrets.resendApiKey}
        />
        <TextField
          label="Webhook署名シークレット"
          note={`現在：${maskSecret(secrets.resendWebhookSecret)}／セッション終了時に消去`}
          onChange={(value) =>
            onSecretsChange({ resendWebhookSecret: value })
          }
          placeholder="whsec_..."
          type="password"
          value={secrets.resendWebhookSecret}
        />
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-900 md:col-span-2">
          秘密情報はLocalStorageへ保存しません。ローカルMVPではSessionStorageにのみ保持します。本番では管理者専用APIを経由し、サーバー側の暗号化ストレージへ保存してください。
        </div>
      </SettingsSection>

      <SettingsSection
        description="受信者に表示される差出人と返信先を設定します。"
        title="送信元"
      >
        <TextField
          label="送信元名"
          onChange={(value) => onSettingsChange({ fromName: value })}
          placeholder="〇〇ショップ"
          value={settings.fromName}
        />
        <TextField
          label="送信元メールアドレス"
          onChange={(value) => onSettingsChange({ fromEmail: value })}
          placeholder="contact@example.com"
          type="email"
          value={settings.fromEmail}
        />
        <TextField
          label="返信先メールアドレス"
          onChange={(value) => onSettingsChange({ replyTo: value })}
          placeholder="support@example.com"
          type="email"
          value={settings.replyTo}
        />
        <TextField
          label="件名の共通接頭辞"
          onChange={(value) => onSettingsChange({ subjectPrefix: value })}
          placeholder="[〇〇ショップ]"
          value={settings.subjectPrefix}
        />
      </SettingsSection>

      <SettingsSection
        description="送信負荷と誤配信を抑えるための既定値です。"
        title="送信制御"
      >
        <NumberField
          label="1回の処理件数"
          max={100}
          min={1}
          onChange={(value) => onSettingsChange({ batchSize: value })}
          value={settings.batchSize}
        />
        <NumberField
          label="送信間隔（ミリ秒）"
          max={60000}
          min={0}
          onChange={(value) => onSettingsChange({ delayMs: value })}
          value={settings.delayMs}
        />
        <CheckField
          checked={settings.testMode}
          description="実送信サービス接続後も、明示的に解除するまでテスト動作にします。"
          label="テストモード"
          onChange={(value) => onSettingsChange({ testMode: value })}
        />
        <CheckField
          checked={settings.includeUnsubscribeFooter}
          description="将来の配信停止URLをフッターへ自動挿入します。"
          label="配信停止案内を付ける"
          onChange={(value) =>
            onSettingsChange({ includeUnsubscribeFooter: value })
          }
        />
      </SettingsSection>

      <SettingsSection
        description="署名と共通フッターをメール本文へ追加するための設定です。"
        title="メール表示"
      >
        <TextAreaField
          label="共通署名"
          onChange={(value) => onSettingsChange({ signature: value })}
          placeholder={"〇〇ショップ\n担当：山田"}
          value={settings.signature}
        />
        <TextAreaField
          label="共通フッター"
          onChange={(value) => onSettingsChange({ footer: value })}
          placeholder="会社住所・お問い合わせ先など"
          value={settings.footer}
        />
      </SettingsSection>

      <SettingsSection
        description="現在はLocalStorageを使用します。Supabaseを選択してもRepository実装までは切り替わりません。"
        title="データ保存"
      >
        <SelectField
          label="データプロバイダー"
          onChange={(value) =>
            onSettingsChange({
              dataProvider: value as ProjectSettings["dataProvider"],
            })
          }
          options={[
            ["local", "LocalStorage"],
            ["supabase", "Supabase（接続準備）"],
          ]}
          value={settings.dataProvider}
        />
        <TextField
          label="Supabase Project URL"
          onChange={(value) => onSettingsChange({ supabaseUrl: value })}
          placeholder="https://xxxx.supabase.co"
          type="url"
          value={settings.supabaseUrl}
        />
        <TextField
          label="Supabase anon key"
          note="公開クライアント用キーのみ。service_roleキーは入力しないでください。"
          onChange={(value) => onSettingsChange({ supabaseAnonKey: value })}
          placeholder="eyJ..."
          type="password"
          value={settings.supabaseAnonKey}
        />
      </SettingsSection>
    </section>
  );
}

function SettingsSection({
  children,
  description,
  title,
}: {
  children: React.ReactNode;
  description: string;
  title: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
      <div className="mt-5 grid gap-4 md:grid-cols-2">{children}</div>
    </div>
  );
}

function TextField({
  label,
  note,
  onChange,
  placeholder,
  type = "text",
  value,
}: {
  label: string;
  note?: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  value: string;
}) {
  return (
    <label className="block text-sm font-semibold">
      {label}
      <input
        autoComplete="off"
        className="field mt-2"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        value={value}
      />
      {note && (
        <span className="mt-1 block text-xs font-normal leading-5 text-slate-400">
          {note}
        </span>
      )}
    </label>
  );
}

function NumberField({
  label,
  max,
  min,
  onChange,
  value,
}: {
  label: string;
  max: number;
  min: number;
  onChange: (value: number) => void;
  value: number;
}) {
  return (
    <label className="block text-sm font-semibold">
      {label}
      <input
        className="field mt-2"
        max={max}
        min={min}
        onChange={(event) => onChange(Number(event.target.value))}
        type="number"
        value={value}
      />
    </label>
  );
}

function SelectField({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: [string, string][];
  value: string;
}) {
  return (
    <label className="block text-sm font-semibold">
      {label}
      <select
        className="field mt-2"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}

function CheckField({
  checked,
  description,
  label,
  onChange,
}: {
  checked: boolean;
  description: string;
  label: string;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-4">
      <input
        checked={checked}
        className="mt-1 h-4 w-4 accent-indigo-600"
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
      <span>
        <span className="block text-sm font-bold">{label}</span>
        <span className="mt-1 block text-xs leading-5 text-slate-500">
          {description}
        </span>
      </span>
    </label>
  );
}

function TextAreaField({
  label,
  onChange,
  placeholder,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <label className="block text-sm font-semibold">
      {label}
      <textarea
        className="field mt-2 min-h-32 resize-y"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </label>
  );
}
