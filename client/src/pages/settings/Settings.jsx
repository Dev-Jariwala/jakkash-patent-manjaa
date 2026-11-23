import BreadCrum from "@/components/breadcrum/BreadCrum";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProductDisplayOrderTab from "./components/ProductDisplayOrderTab";
import WhatsAppSettingsTab from "./components/WhatsAppSettingsTab";

const Settings = () => {
  return (
    <div>
      <div className="flex items-center justify-between px-5 border-b border-border py-3 mb-3">
        <div className="text-xl text-foreground font-semibold">
          <BreadCrum
            path={[
              { path: "/", label: "Dashboard" },
              { path: "/settings", label: "Settings" },
            ]}
          />
        </div>
      </div>

      <Tabs defaultValue="whatsapp" className="px-5">
        <TabsList className="w-full max-w-2xl gap-2 border-b pb-0 border-border">
          <TabsTrigger
            className="border-b-2 flex-1 border-transparent data-[state=active]:rounded-none data-[state=active]:border-b-indigo-500"
            variant="sliding"
            value="whatsapp"
          >
            WhatsApp
          </TabsTrigger>
          <TabsTrigger
            className="border-b-2 flex-1 border-transparent data-[state=active]:rounded-none data-[state=active]:border-b-indigo-500"
            variant="sliding"
            value="product-display-order"
          >
            Product display order
          </TabsTrigger>
        </TabsList>
        <TabsContent value="whatsapp" className="mt-4">
          <WhatsAppSettingsTab />
        </TabsContent>
        <TabsContent value="product-display-order" className="mt-4">
          <ProductDisplayOrderTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;