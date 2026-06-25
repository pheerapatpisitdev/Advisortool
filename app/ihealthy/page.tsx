"use client";

import { useEffect } from "react";
import DetailedBenefits from "@/components/detailed-benefits";
import { LanguageProvider, useLanguage } from "@/context/language-context";
import { Toaster } from "@/components/ui/toaster";

function IHealthyContent() {
  const { t, language } = useLanguage();

  // Manually sync document meta here because this route owns its LanguageProvider; the root layout's metadata export can't reach the language context.
  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    document.title = t("meta_title");
    document.documentElement.lang = language;

    const description = t("meta_description");
    const metaTag = document.querySelector('meta[name="description"]');
    if (metaTag) {
      metaTag.setAttribute("content", description);
    } else {
      const meta = document.createElement("meta");
      meta.name = "description";
      meta.content = description;
      document.head.appendChild(meta);
    }
  }, [language, t]);

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      <div className="container mx-auto px-2 py-4 md:px-4 md:py-16 flex-grow max-w-full">
        <header className="text-center mb-4 md:mb-12 relative print:hidden">
          <h1 className="text-xl md:text-5xl font-bold text-primary font-headline tracking-tight">
            {t("page_title")}
          </h1>
          <p className="mt-2 md:mt-4 text-xs md:text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("page_description")}
          </p>
        </header>

        <div className="space-y-4 md:space-y-12">
          <DetailedBenefits />
        </div>
      </div>

      <footer className="w-full border-t border-amber-100/60 bg-gradient-to-b from-amber-50/40 via-white to-white print:hidden">
        <div className="mx-auto max-w-3xl px-4 pt-4 text-center text-[11px] leading-relaxed text-muted-foreground md:text-sm">
          <p>
            ข้อมูลนี้จัดทำขึ้นเพื่อให้ความรู้ทั่วไปเท่านั้น
            ไม่ถือเป็นคำแนะนำทางการเงินหรือการประกันภัยเฉพาะบุคคล
          </p>
          <p className="mt-2">
            เงื่อนไขความคุ้มครองเป็นไปตามที่ระบุในกรมธรรม์ของบริษัทประกันภัย
          </p>
          <p className="mt-2">
            ผู้สนใจควรศึกษารายละเอียดเพิ่มเติมหรือปรึกษาตัวแทนก่อนตัดสินใจ
          </p>
        </div>
      </footer>
    </main>
  );
}

export default function IHealthyPage() {
  return (
    <div className="ihealthy-scope">
      <LanguageProvider>
        <IHealthyContent />
        <Toaster />
      </LanguageProvider>
    </div>
  );
}
