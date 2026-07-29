import { Project } from "../domain/project";

export function createProject(name: string): Project {
  return {
    id: crypto.randomUUID(),
    name: name.trim(),
    createdAt: new Date().toISOString(),
  };
}

export function projectStorageKey(namespace: string, projectId: string) {
  return `${namespace}.${projectId}`;
}
