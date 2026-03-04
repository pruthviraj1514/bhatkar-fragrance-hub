import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import AdminProducts from "./Products";
import AdminOrders from "./Orders";
import AdminShipments from "./Shipments";
import { cn } from "@/lib/utils";

export default function Manage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"products" | "orders" | "shipments">("products");

  useEffect(() => {
    if (location.pathname.includes("/product")) setTab("products");
    else if (location.pathname.includes("/shipments")) setTab("shipments");
    else if (location.pathname.includes("/orders")) setTab("orders");
    else navigate("/admin/manage/product", { replace: true });
  }, [location.pathname, navigate]);

  return (
    <AdminLayout
      title={tab === "products" ? "Inventory Management" : "Order Management"}
      activeTab={tab}
    >
      <div className="space-y-6">
        {/* Sub-navigation Tabs */}
        <div className="flex p-1 bg-card rounded-xl border border-border/50 w-fit">
          <button
            onClick={() => navigate("/admin/manage/product")}
            className={cn(
              "px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200",
              tab === "products"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Products
          </button>
          <button
            onClick={() => navigate("/admin/manage/orders")}
            className={cn(
              "px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200",
              tab === "orders"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Orders
          </button>
          <button
            onClick={() => navigate("/admin/manage/shipments")}
            className={cn(
              "px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200",
              tab === "shipments"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Shipments
          </button>
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          {tab === "products" ? <AdminProducts /> : tab === "shipments" ? <AdminShipments /> : <AdminOrders />}
        </div>
      </div>
    </AdminLayout>
  );
}
