import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  listRemoteProjects,
  saveProjectSnapshot,
} from "@/features/storage/infrastructure/supabase-project-snapshot-store";
import { ProjectSnapshot } from "@/features/storage/domain/project-snapshot";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "認証が必要です。" }, { status: 401 });
  try {
    return NextResponse.json({ projects: await listRemoteProjects(supabase) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "プロジェクトを取得できませんでした。" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "認証が必要です。" }, { status: 401 });
  const input = await request.json().catch(() => null) as { snapshot?: ProjectSnapshot } | null;
  if (!input?.snapshot?.project?.name?.trim()) {
    return NextResponse.json({ error: "プロジェクトデータが不正です。" }, { status: 400 });
  }
  const { data: project, error } = await supabase
    .from("projects")
    .insert({ name: input.snapshot.project.name.trim(), created_by: user.id })
    .select("id,name,created_at")
    .single();
  if (error || !project) {
    return NextResponse.json({ error: error?.message ?? "プロジェクトを作成できませんでした。" }, { status: 500 });
  }
  const snapshot: ProjectSnapshot = {
    ...input.snapshot,
    project: {
      id: project.id,
      name: project.name,
      createdAt: project.created_at,
    },
    settings: { ...input.snapshot.settings, dataProvider: "supabase" },
  };
  try {
    await saveProjectSnapshot(supabase, snapshot, user.id);
    return NextResponse.json({ snapshot }, { status: 201 });
  } catch (saveError) {
    await supabase.from("projects").delete().eq("id", project.id);
    return NextResponse.json(
      { error: saveError instanceof Error ? saveError.message : "データを移行できませんでした。" },
      { status: 500 },
    );
  }
}
