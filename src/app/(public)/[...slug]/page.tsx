import { notFound } from "next/navigation";
import { isKnownPublicPath } from "@/config/routes";

interface CatchAllPageProps {
  params: Promise<{ slug: string[] }>;
}

export default async function CatchAllPage({ params }: CatchAllPageProps) {
  const { slug } = await params;
  const pathname = `/${slug.join("/")}`;

  if (!isKnownPublicPath(pathname)) {
    notFound();
  }

  return null;
}
