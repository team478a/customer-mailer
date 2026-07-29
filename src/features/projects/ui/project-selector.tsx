import { Project } from "../domain/project";

export function ProjectSelector({
  currentProjectId,
  onCreate,
  onSelect,
  projects,
}: {
  currentProjectId: string;
  onCreate: () => void;
  onSelect: (id: string) => void;
  projects: Project[];
}) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-xs font-semibold text-slate-500">
        プロジェクト
        <select
          className="ml-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-800"
          onChange={(event) => onSelect(event.target.value)}
          value={currentProjectId}
        >
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </label>
      <button
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
        onClick={onCreate}
        type="button"
      >
        ＋ 新規
      </button>
    </div>
  );
}
