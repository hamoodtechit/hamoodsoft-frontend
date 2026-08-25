"use client";

import { PageLayout } from "@/components/common/page-layout";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { Building2, FolderTree, Scale, Tags } from "lucide-react";
import { useAuth } from "@/lib/hooks/use-auth";
import { useEffect, useState } from "react";

export default function InventorySettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations("inventorySettings");
  const pathname = usePathname();
  const router = useRouter();
  
  // Extract locale from pathname (e.g., /en/dashboard/...)
  const locale = pathname.split("/")[1];

  // Determine active tab based on pathname
  const activeTab = pathname.includes("/brands")
    ? "brands"
    : pathname.includes("/categories")
    ? "categories"
    : pathname.includes("/units")
    ? "units"
    : pathname.includes("/attributes")
    ? "attributes"
    : "brands";

  const handleTabChange = (value: string) => {
    router.push(`/${locale}/dashboard/inventory/settings/${value}`);
  };

  return (
    <PageLayout
      title="Inventory Settings"
      description="Manage brands, categories, units, and attributes."
      maxWidth="full"
    >
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="brands" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Brands
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center gap-2">
              <FolderTree className="h-4 w-4" />
              Categories
            </TabsTrigger>
            <TabsTrigger value="units" className="flex items-center gap-2">
              <Scale className="h-4 w-4" />
              Units
            </TabsTrigger>
            <TabsTrigger value="attributes" className="flex items-center gap-2">
              <Tags className="h-4 w-4" />
              Attributes
            </TabsTrigger>
          </TabsList>
        </div>
        {/* Render the specific page content */}
        <div className="mt-4">{children}</div>
      </Tabs>
    </PageLayout>
  );
}
