import { readProductMedia } from "../../../lib/repository";

export async function GET(request: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  return readProductMedia(request, key);
}
