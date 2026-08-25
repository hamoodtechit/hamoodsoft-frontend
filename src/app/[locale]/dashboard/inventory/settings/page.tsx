import { redirect } from "next/navigation";

export default async function InventorySettingsIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/dashboard/inventory/settings/brands`);
}
