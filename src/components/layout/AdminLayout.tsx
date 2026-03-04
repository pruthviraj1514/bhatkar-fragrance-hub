import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    BarChart3,
    Package,
    ShoppingCart,
    Star,
    LogOut,
    Menu,
    X,
    ChevronRight,
    User,
    Settings,
    Bell
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface AdminLayoutProps {
    children: ReactNode;
    activeTab?: string;
    title?: string;
}

export function AdminLayout({ children, activeTab, title }: AdminLayoutProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const { logout, user, admin } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const navItems = [
        { id: "dashboard", label: "Dashboard", icon: BarChart3, href: "/admin/dashboard" },
        { id: "products", label: "Inventory", icon: Package, href: "/admin/manage/product" },
        { id: "orders", label: "Orders", icon: ShoppingCart, href: "/admin/manage/orders" },
        { id: "shipments", label: "Shipments", icon: Package, href: "/admin/manage/shipments" },
        { id: "reviews", label: "Reviews", icon: Star, href: "/admin/reviews" },
    ];

    const handleLogout = () => {
        logout();
        navigate("/");
    };

    return (
        <div className="min-h-screen bg-background flex overflow-hidden">
            {/* Sidebar */}
            <AnimatePresence mode="wait">
                <motion.aside
                    initial={false}
                    animate={{ width: isSidebarOpen ? 280 : 80 }}
                    className="fixed left-0 top-0 bottom-0 bg-sidebar border-r border-border/50 z-50 flex flex-col shadow-sm"
                >
                    {/* Sidebar Header - Logo */}
                    <div className="h-20 flex items-center px-6 border-b border-border/40">
                        <Link to="/admin/dashboard" className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-primary/20 shrink-0">
                                B
                            </div>
                            {isSidebarOpen && (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="font-display font-bold text-lg tracking-tight text-foreground truncate"
                                >
                                    Admin Central
                                </motion.div>
                            )}
                        </Link>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
                        {navItems.map((item) => {
                            const isActive = location.pathname.includes(item.id) || activeTab === item.id;
                            return (
                                <Link
                                    key={item.id}
                                    to={item.href}
                                    className={cn(
                                        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative",
                                        isActive
                                            ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 font-medium"
                                            : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                                    )}
                                >
                                    <item.icon className={cn("h-5 w-5 shrink-0", isActive ? "text-primary-foreground" : "group-hover:text-primary")} />
                                    {isSidebarOpen && (
                                        <motion.span
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="whitespace-nowrap"
                                        >
                                            {item.label}
                                        </motion.span>
                                    )}
                                    {isActive && isSidebarOpen && (
                                        <motion.div
                                            layoutId="sidebar-active-indicator"
                                            className="absolute right-2 w-1.5 h-1.5 rounded-full bg-white/50 dark:bg-white/30"
                                        />
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Sidebar Footer */}
                    <div className="p-4 border-t border-border/40">
                        <div className={cn("bg-secondary/30 rounded-2xl p-4 flex items-center gap-3 mb-4", !isSidebarOpen && "justify-center px-2")}>
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                                {(user?.firstname || admin?.email || 'A').charAt(0).toUpperCase()}
                            </div>
                            {isSidebarOpen && (
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold truncate text-foreground">
                                        {user ? `${user.firstname} ${user.lastname}` : 'Administrator'}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate opacity-70">
                                        {admin?.email || user?.email}
                                    </p>
                                </div>
                            )}
                        </div>

                        <Button
                            variant="ghost"
                            onClick={handleLogout}
                            className={cn(
                                "w-full justify-start text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors px-4 py-3 rounded-xl",
                                !isSidebarOpen && "justify-center"
                            )}
                        >
                            <LogOut className="h-5 w-5 shrink-0" />
                            {isSidebarOpen && <span className="ml-3">Logout</span>}
                        </Button>
                    </div>
                </motion.aside>
            </AnimatePresence>

            {/* Main Content Area */}
            <main className={cn(
                "flex-1 flex flex-col min-w-0 transition-all duration-300",
                isSidebarOpen ? "ml-[280px]" : "ml-[80px]"
            )}>
                {/* Top Header */}
                <header className="h-20 bg-white/80 dark:bg-background/80 backdrop-blur-md border-b border-border/40 sticky top-0 z-40 px-8 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="text-muted-foreground hover:text-primary transition-colors"
                        >
                            {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </Button>
                        <div>
                            <h2 className="text-xl font-bold font-display text-foreground">{title || "Management"}</h2>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Quick Actions */}
                        <div className="hidden sm:flex items-center gap-2 mr-4 text-xs font-medium text-muted-foreground">
                            <span className="bg-secondary/50 px-2 py-1 rounded">Alt + P</span> New Product
                            <span className="bg-secondary/50 px-2 py-1 rounded ml-2">Alt + O</span> View Orders
                        </div>

                        <Button variant="ghost" size="icon" className="relative text-muted-foreground">
                            <Bell className="h-5 w-5" />
                            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary border-2 border-white" />
                        </Button>

                        <Button variant="ghost" size="icon" className="text-muted-foreground">
                            <Settings className="h-5 w-5" />
                        </Button>
                    </div>
                </header>

                {/* Dynamic Page Content */}
                <div className="p-8 pb-16">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                        >
                            {children}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
}
