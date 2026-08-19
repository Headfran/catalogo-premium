import type { Metadata } from "next";
import { Toaster } from "sonner";

export const metadata: Metadata = {
   title: "Administrador",
   description: "Panel de administración",
};

export default function AdminLayout({
   children,
}: {
   children: React.ReactNode;
}) {
   return (
      <>
         <Toaster richColors position="top-right" />
         {children}
      </>
   );
}
