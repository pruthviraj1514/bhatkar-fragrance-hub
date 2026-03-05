import { useEffect, useState } from "react";
import { Loader2, Calendar, User, Package, CreditCard, ChevronRight, Filter, Search, MoreVertical, ExternalLink, RefreshCw, AlertCircle, ShoppingBag } from "lucide-react";
import api from "@/lib/axios";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { formatPrice, getImageUrl, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Order {
  id: number;
  user_id: number;
  product_id: number;
  quantity: number;
  total_amount: string | number;
  razorpay_order_id: string;
  status: string;
  created_at: string;
  customer_email: string;
  customer_name: string;
  product_name: string;
  product_images: any[];
  shiprocket_order_id?: string;
  awb_code?: string;
  courier_name?: string;
  tracking_url?: string;
  shipment_status?: string;
}

export default function AdminShipments() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updateLoading, setUpdateLoading] = useState<number | null>(null);
  const [shiprocketConfigured, setShiprocketConfigured] = useState<boolean | null>(null);
  const [shiprocketConfigMsg, setShiprocketConfigMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) navigate("/");
  }, [isAdmin, navigate]);

  useEffect(() => {
    fetchOrders();
    checkConfig();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get("/orders");
      setOrders(res.data.data || []);
      setError("");
    } catch (err) {
      console.error("❌ Failed to fetch orders:", err);
      setError("Failed to load orders. Please ensure you are logged in as admin.");
    } finally {
      setLoading(false);
    }
  };

  const checkConfig = async () => {
    try {
      const res = await api.get('/shipments/config');
      setShiprocketConfigured(res.data.configured);
      setShiprocketConfigMsg(res.data.message || null);
    } catch (err: any) {
      console.error('Failed to fetch Shiprocket config', err);
      setShiprocketConfigured(false);
      setShiprocketConfigMsg('Could not verify credentials');
    }
  };

  const handleCreateShipment = async (orderId: number) => {
    if (shiprocketConfigured === false) {
      toast.error(shiprocketConfigMsg || 'Shiprocket credentials not configured');
      return;
    }

    try {
      setUpdateLoading(orderId);
      const res = await api.post(`/shipments/create/${orderId}`);
      const updated: Order = res.data.order;
      setOrders(prev => prev.map(o => o.id === orderId ? updated : o));
      toast.success(`Shipment ${updated.shiprocket_order_id || ''}`);
    } catch (err: any) {
      console.error("❌ Failed to create shipment:", err);
      toast.error(err.response?.data?.message || "Failed to create shipment");
    } finally {
      setUpdateLoading(null);
    }
  };

  const shippedOrders = orders.filter(o => o.shiprocket_order_id);
  const pendingOrders = orders.filter(o => !o.shiprocket_order_id && o.status === 'PAID');

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50 pb-20">
      {/* Header */}
      <div className="bg-background border-b border-border sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold font-display tracking-tight text-foreground flex items-center gap-2">
                <Package className="h-8 w-8 text-primary" />
                Shipment Management
              </h1>
              <p className="text-muted-foreground mt-1">
                Track Shiprocket shipments and create new ones for paid orders.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchOrders}
                disabled={loading}
                className="gap-2"
              >
                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-8">
        {shiprocketConfigured === false && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center gap-3">
            <AlertCircle className="h-5 w-5" />
            <p className="font-medium">
              Shiprocket credentials are not configured{shiprocketConfigMsg ? `: ${shiprocketConfigMsg}` : ''}
            </p>
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive flex items-center gap-3">
            <AlertCircle className="h-5 w-5" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground animate-pulse font-medium">Retrieving shipment list...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Card className="p-4 bg-background">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Orders</p>
                <p className="text-2xl font-bold mt-1 text-foreground">{orders.length}</p>
              </Card>
              <Card className="p-4 bg-background">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Shipped</p>
                <p className="text-2xl font-bold mt-1 text-green-600">{shippedOrders.length}</p>
              </Card>
              <Card className="p-4 bg-background">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pending</p>
                <p className="text-2xl font-bold mt-1 text-amber-600">{pendingOrders.length}</p>
              </Card>
              <Card className="p-4 bg-background">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Revenue</p>
                <p className="text-2xl font-bold mt-1 text-blue-600">
                  {formatPrice(shippedOrders.reduce((acc, o) => acc + Number(o.total_amount), 0))}
                </p>
              </Card>
            </div>

            {/* Shipments Table */}
            <Card className="overflow-hidden border-border bg-background shadow-sm rounded-xl">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-muted/30 border-b border-border">
                      <th className="text-left p-4 font-semibold text-sm text-muted-foreground uppercase tracking-wider">Order / Product</th>
                      <th className="text-left p-4 font-semibold text-sm text-muted-foreground uppercase tracking-wider">Customer</th>
                      <th className="text-left p-4 font-semibold text-sm text-muted-foreground uppercase tracking-wider">Amount</th>
                      <th className="text-left p-4 font-semibold text-sm text-muted-foreground uppercase tracking-wider">Shipment Info</th>
                      <th className="text-left p-4 font-semibold text-sm text-muted-foreground uppercase tracking-wider">Status</th>
                      <th className="text-left p-4 font-semibold text-sm text-muted-foreground uppercase tracking-wider">Date</th>
                      <th className="text-right p-4 font-semibold text-sm text-muted-foreground uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-12 text-center text-muted-foreground italic">
                          No orders found in the system yet.
                        </td>
                      </tr>
                    ) : (
                      orders.map((o) => (
                        <tr key={o.id} className="border-b border-border/50 hover:bg-muted/10 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-4">
                              <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden border border-border shrink-0">
                                <img
                                  src={getImageUrl(o.product_images)}
                                  alt={o.product_name}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                              <div>
                                <p className="font-semibold text-foreground leading-tight">#{o.id}</p>
                                <p className="text-sm text-muted-foreground truncate max-w-[150px]">{o.product_name}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col">
                              <span className="font-medium text-foreground">{o.customer_name || 'Anonymous'}</span>
                              <span className="text-xs text-muted-foreground">{o.customer_email}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <p className="font-bold text-foreground">{formatPrice(Number(o.total_amount))}</p>
                            <p className="text-[10px] text-muted-foreground tracking-tighter uppercase font-mono">{o.razorpay_order_id || 'LOCAL_ORDER'}</p>
                          </td>
                          <td className="p-4">
                            {o.shiprocket_order_id ? (
                              <div className="flex flex-col gap-1 text-xs">
                                <span>AWB: {o.awb_code}</span>
                                <span>Courier: {o.courier_name}</span>
                                {o.tracking_url && (
                                  <a href={o.tracking_url} target="_blank" rel="noopener noreferrer" className="underline text-primary">
                                    Track
                                  </a>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground italic">not created</span>
                            )}
                          </td>
                          <td className="p-4">
                            <Badge
                              variant="outline"
                              className={cn("px-2.5 py-0.5 rounded-full capitalize text-[11px] font-bold shadow-sm", getStatusColor(o.status))}
                            >
                              {o.status.toLowerCase()}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col gap-0.5 p-0 sm:gap-1 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1.5 underline-offset-4 decoration-muted-foreground/30 leading-none">
                                <Calendar className="h-3 w-3 shrink-0" />
                                {new Date(o.created_at).toLocaleDateString()}
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8" disabled={updateLoading === o.id}>
                                  {updateLoading === o.id ? <RefreshCw className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {shiprocketConfigured && shiprocketConfigured === true && !o.shiprocket_order_id && o.status === 'PAID' && (
                                  <DropdownMenuItem onClick={() => handleCreateShipment(o.id)}>
                                    <Package className="mr-2 h-4 w-4" />
                                    Create Shipment
                                  </DropdownMenuItem>
                                )}
                                {shiprocketConfigured && shiprocketConfigured === true && o.shiprocket_order_id && (
                                  <DropdownMenuItem onClick={() => handleCreateShipment(o.id)}>
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Refresh Shipment
                                  </DropdownMenuItem>
                                )}
                                {o.tracking_url && (
                                  <DropdownMenuItem asChild>
                                    <a href={o.tracking_url} target="_blank" rel="noopener noreferrer">
                                      <ExternalLink className="mr-2 h-4 w-4" />
                                      Open Tracking
                                    </a>
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

// reuse status color function from orders page
function getStatusColor(status: string) {
  switch (status.toUpperCase()) {
    case 'PAID':
    case 'COMPLETED':
      return 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400 border-green-200';
    case 'PENDING':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200';
    case 'FAILED':
    case 'CANCELLED':
      return 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400 border-red-200';
    case 'SHIPPED':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border-blue-200';
    default:
      return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-200';
  }
}
