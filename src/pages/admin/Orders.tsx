import { useEffect, useState } from "react";
import { Loader } from "lucide-react";
import api from "@/lib/axios";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Orders() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAdmin) navigate("/");
  }, [isAdmin, navigate]);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get("/orders");
      setOrders(res.data.data || []);
      setError("");
    } catch (err) {
      setError("Failed to load orders or endpoint not implemented yet.");
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="container py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Orders</h1>
        <p className="text-muted-foreground">View and manage customer orders.</p>
      </div>

      {error && <div className="mb-4 p-3 rounded bg-destructive/10 text-destructive">{error}</div>}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          {orders.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">No orders found.</div>
          ) : (
            <table className="w-full table-auto">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3">Order ID</th>
                  <th className="text-left p-3">Customer</th>
                  <th className="text-left p-3">Total</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-t">
                    <td className="p-3">{o.id}</td>
                    <td className="p-3">{o.customer_email || o.customer || '—'}</td>
                    <td className="p-3">₹{o.total?.toFixed?.(2) ?? o.total}</td>
                    <td className="p-3">{o.status || 'pending'}</td>
                    <td className="p-3">{o.created_on}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
