import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import AdminProducts from "./Products";
import AdminOrders from "./Orders";

export default function Manage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"product" | "orders">("product");

  useEffect(() => {
    if (location.pathname.includes("/product")) setTab("product");
    else if (location.pathname.includes("/orders")) setTab("orders");
    else navigate("/admin/manage/product", { replace: true });
  }, [location.pathname, navigate]);

  return (
    <div className="container py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Manage Contents</h1>
      </div>

      <div className="mb-4 flex space-x-2">
        <NavLink
          to="/admin/manage/product"
          className={({ isActive }) =>
            `px-4 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-primary text-primary-foreground' : 'bg-muted/20 text-muted-foreground'}`
          }
        >
          Products
        </NavLink>

        <NavLink
          to="/admin/manage/orders"
          className={({ isActive }) =>
            `px-4 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-primary text-primary-foreground' : 'bg-muted/20 text-muted-foreground'}`
          }
        >
          Orders
        </NavLink>
      </div>

      <div>
        {tab === "product" ? <AdminProducts /> : <AdminOrders />}
      </div>
    </div>
  );
}
