import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  loadProjectSnapshot,
  saveProjectSnapshot,
} from "@/features/storage/infrastructure/supabase-project-snapshot-store";
import { ProjectSnapshot } from "@/features/storage/domain/project-snapshot";

type Context = { params: Promise<{ projectId: string }> };

export async function GET(_: Request, { params }: Context) {
  const { projectId } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "認証が必要です。" }, { status: 401 });
  try {
    return NextResponse.json({ snapshot: await loadProjectSnapshot(supabase, projectId) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "データを取得できませんでした。" },
      { status: 404 },
    );
  }
}

export async function PUT(request: Request, { params }: Context) {
  const { projectId } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "認証が必要です。" }, { status: 401 });
  const input = await request.json().catch(() => null) as { snapshot?: ProjectSnapshot } | null;
  if (!input?.snapshot || input.snapshot.project.id !== projectId) {
    return NextResponse.json({ error: "プロジェクトIDが一致しません。" }, { status: 400 });
  }
  try {
    await saveProjectSnapshot(supabase, input.snapshot, user.id);
    return NextResponse.json({ saved: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "データを保存できませんでした。" },
      { status: 500 },
    );
  }
}

export async function DELETE(_: Request, { params }: Context) {
  const { projectId } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "認証が必要です。" }, { status: 401 });
  const { error } = await supabase.from("projects").delete().eq("id", projectId);
  if (error) return NextResponse.json({ error: error.message }, { status: 403 });
  return NextResponse.json({ deleted: true });
}
