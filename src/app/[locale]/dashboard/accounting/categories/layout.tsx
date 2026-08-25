"use client";

import { PageLayout } from "@/components/common/page-layout";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePathname, useRouter } from "next/navigation";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

export default function IncomeExpenseCategoriesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  // Extract locale from pathname (e.g., /en/dashboard/...)
  const locale = pathname.split("/")[1];

  // Determine active tab based on pathname
  const activeTab = pathname.includes("/expense")
    ? "expense"
    : "income";

  const handleTabChange = (value: string) => {
    router.push(`/${locale}/dashboard/accounting/categories/${value}`);
  };

  return (
    <PageLayout
      title="Income & Expense Categories"
      description="Manage category classifications for income and expense transactions."
      maxWidth="full"
    >
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="income" className="flex items-center gap-2">
              <ArrowDownRight className="h-4 w-4 text-emerald-500" />
              Income Categories
            </TabsTrigger>
            <TabsTrigger value="expense" className="flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4 text-rose-500" />
              Expense Categories
            </TabsTrigger>
          </TabsList>
        </div>
        {/* Render the specific category page content */}
        <div className="mt-4">{children}</div>
      </Tabs>
    </PageLayout>
  );
}
