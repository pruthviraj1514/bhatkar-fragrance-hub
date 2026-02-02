import { useNavigate } from "react-router-dom";
import { LogOut, Package, ShoppingCart, TrendingUp, Plus, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  // Mock data - replace with real API calls
  const stats = {
    totalProducts: 245,
    activeOrders: 18,
    monthlyRevenue: 45280,
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 border-b border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">Welcome back! Manage your store.</p>
          </div>
          <Button
            variant="destructive"
            onClick={handleLogout}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Statistics Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Products Card */}
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Products</p>
                <p className="text-3xl font-bold mt-2">{stats.totalProducts}</p>
                <p className="text-xs text-muted-foreground mt-2">Across all categories</p>
              </div>
              <div className="bg-primary/10 p-3 rounded-lg">
                <Package className="h-6 w-6 text-primary" />
              </div>
            </div>
          </Card>

          {/* Active Orders Card */}
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Orders</p>
                <p className="text-3xl font-bold mt-2">{stats.activeOrders}</p>
                <p className="text-xs text-muted-foreground mt-2">Pending fulfillment</p>
              </div>
              <div className="bg-blue-500/10 p-3 rounded-lg">
                <ShoppingCart className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </Card>

          {/* Monthly Revenue Card */}
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Monthly Revenue</p>
                <p className="text-3xl font-bold mt-2">₹{stats.monthlyRevenue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-2">This month</p>
              </div>
              <div className="bg-green-500/10 p-3 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Access Section */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Quick Access</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Products Management */}
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer hover:border-primary"
              onClick={() => navigate("/admin/products")}
            >
              <div className="flex items-center gap-4">
                <div className="bg-primary/10 p-4 rounded-lg">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Products</h3>
                  <p className="text-sm text-muted-foreground">Manage inventory</p>
                </div>
              </div>
            </Card>

            {/* Prices Management */}
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer hover:border-primary"
              onClick={() => navigate("/admin/prices")}
            >
              <div className="flex items-center gap-4">
                <div className="bg-blue-500/10 p-4 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-semibold">Prices</h3>
                  <p className="text-sm text-muted-foreground">Update pricing</p>
                </div>
              </div>
            </Card>

            {/* Photos Management */}
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer hover:border-primary"
              onClick={() => navigate("/admin/photos")}
            >
              <div className="flex items-center gap-4">
                <div className="bg-purple-500/10 p-4 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-purple-500" />
                </div>
                <div>
                  <h3 className="font-semibold">Photos</h3>
                  <p className="text-sm text-muted-foreground">Manage images</p>
                </div>
              </div>
            </Card>

            {/* Orders Management */}
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer hover:border-primary"
              onClick={() => navigate("/admin/orders")}
            >
              <div className="flex items-center gap-4">
                <div className="bg-green-500/10 p-4 rounded-lg">
                  <ShoppingCart className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <h3 className="font-semibold">Orders</h3>
                  <p className="text-sm text-muted-foreground">View all orders</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Recent Activity Placeholder */}
        <div className="mt-12 p-8 border border-dashed border-border rounded-lg bg-muted/50 text-center">
          <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="font-semibold text-lg mb-2">Additional Features Coming Soon</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            More admin features including analytics, reports, and advanced product management are being developed.
          </p>
        </div>
      </div>
    </div>
  );
}
