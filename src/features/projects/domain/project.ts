export type Project = {
  id: string;
  name: string;
  createdAt: string;
};

export const DEFAULT_PROJECT_ID = "default";

export const DEFAULT_PROJECT: Project = {
  id: DEFAULT_PROJECT_ID,
  name: "既存プロジェクト",
  createdAt: new Date(0).toISOString(),
};
