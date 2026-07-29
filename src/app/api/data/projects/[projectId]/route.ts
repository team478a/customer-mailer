import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  loadProjectSnapshot,
  saveProjectSnapshot,
} from "@/features/storage/infrastructure/supabase-project-snapshot-store";
import { ProjectSnapshot } from "@/features/storage/domain/project-snapshot";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { assertProjectAccess } from "@/lib/supabase/project-access";

type Context = { params: Promise<{ projectId: string }> };

export async function GET(_: Request, { params }: Context) {
  const { projectId } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "認証が必要です。" }, { status: 401 });
  try {
    const admin = createSupabaseAdminClient();
    await assertProjectAccess(admin, projectId, user.id);
    return NextResponse.json({ snapshot: await loadProjectSnapshot(admin, projectId) });
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
    const admin = createSupabaseAdminClient();
    await assertProjectAccess(admin, projectId, user.id);
    await saveProjectSnapshot(admin, input.snapshot, user.id);
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
  const admin = createSupabaseAdminClient();
  try {
    await assertProjectAccess(admin, projectId, user.id, true);
  } catch (accessError) {
    return NextResponse.json(
      { error: accessError instanceof Error ? accessError.message : "権限がありません。" },
      { status: 403 },
    );
  }
  const { error } = await admin.from("projects").delete().eq("id", projectId);
  if (error) return NextResponse.json({ error: error.message }, { status: 403 });
  return NextResponse.json({ deleted: true });
}
