import CatchAllClient from "@/components/CatchAllClient";

export const dynamicParams = false;

export async function generateStaticParams() {
  return [
    { slug: ['funder'] },
    { slug: ['sponsor'] },
    { slug: ['create-goal'] },
    { slug: ['reputation'] },
    { slug: ['profile'] },
    { slug: ['verify'] }
  ];
}

export default async function CatchAllPage({
  params
}: {
  params: Promise<{ slug: string[] }>
}) {
  await params;
  return <CatchAllClient />;
}
