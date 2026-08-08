/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from "react";
import { notificationService } from "../services/notificationService";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Sprout,
  Wheat,
  Package,
  Users,
  ChevronDown,
  Rabbit,
  Menu,
  LayoutDashboard ,
  X,
  Factory,
  Workflow,
  LogOut,
  ShoppingCart,
} from "lucide-react";
import { authService } from "../services/authService";

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  children?: MenuItem[];
}

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [user, setUser] = useState(authService.getUser());

  // Empêcher le scroll du body quand la sidebar est ouverte sur mobile
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    // Cleanup
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileOpen]);

  const menuItems: MenuItem[] = [
    {
      id: "dash",
      label: "Dashboard",
      icon: <LayoutDashboard  className="w-4 h-4" />,
      path: "/dashboard",
    },
    {
      id: "prod",
      label: "Production",
      icon: <Factory className="w-5 h-5" />,
      path: "/prod",
      children: [
        {
          id: "vent",
          label: "Vente",
          icon: <Package className="w-4 h-4" />,
          path: "/sale",
        },
        {
          id: "rp",
          label: "Recette et Production",
          icon: <Workflow className="w-4 h-4" />,
          path: "/recipe",
        },
      ],
    },
    {
      id: "farm",
      label: "Gestion Agricole",
      icon: <Sprout className="w-5 h-5" />,
      path: "/farm",
      children: [
        {
          id: "crops",
          label: "Cultures",
          icon: <Wheat className="w-4 h-4" />,
          path: "/culture",
        },
        {
          id: "livestock",
          label: "Élevage",
          icon: <Rabbit className="w-4 h-4" />,
          path: "/animal",
        },
      ],
    },
    {
      id: "inventory",
      label: "Inventaire",
      icon: <Package className="w-5 h-5" />,
      path: "/inventory",
      children: [
        {
          id: "products",
          label: "Produits",
          icon: <Package className="w-4 h-4" />,
          path: "/produit",
        },
        {
          id: "achat",
          label: "Achat",
          icon: <ShoppingCart className="w-4 h-4" />,
          path: "/achats",
        },
      ],
    },
    {
      id: "equipe",
      label: "Equipe",
      icon: <Users className="w-4 h-4" />,
      path: "/utilisateur",
    },
  ];

  const toggleExpand = (itemId: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const isActive = (path: string) => {
    return (
      location.pathname === path || location.pathname.startsWith(path + "/")
    );
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsMobileOpen(false);
  };

  const handleLogout = () => {
    try {
      authService.logout();
      setUser(null);
      navigate("/");
      setIsMobileOpen(false);
    } catch (error) {
      notificationService.error("Erreur lors de la déconnexion");
    }
  };

  const renderMenuItem = (item: MenuItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.id);
    const active = isActive(item.path);

    return (
      <div key={item.id}>
        <div
          className={`
            flex items-center px-4 py-3 cursor-pointer transition-all duration-200
            ${
              active
                ? "bg-[var(--color-primary)] text-white"
                : "text-[var(--color-text)] hover:bg-[var(--color-accent)]"
            }
            ${level > 0 ? `pl-${8 + level * 4}` : ""}
            border-b border-[var(--color-input-border)] last:border-b-0
          `}
          onClick={() => {
            if (hasChildren) {
              toggleExpand(item.id);
            } else {
              handleNavigation(item.path);
            }
          }}
        >
          <div
            className={`mr-3 ${
              active ? "text-white" : "text-[var(--color-text)]"
            }`}
          >
            {item.icon}
          </div>
          <span className="flex-1 font-medium text-sm">{item.label}</span>
          {hasChildren && (
            <ChevronDown
              className={`w-4 h-4 transform transition-transform duration-200 ${
                isExpanded ? "rotate-180" : ""
              }`}
            />
          )}
        </div>

        {hasChildren && isExpanded && (
          <div className="bg-[var(--color-input-bg)]">
            {item.children!.map((child) => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Bouton hamburger pour mobile */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-[var(--color-primary)] text-white rounded-md shadow-lg"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Menu className="w-6 h-6" />
        )}
      </button>

      {/* Overlay flou pour mobile */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 backdrop-blur-xs bg-white/10 z-30"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar - TOUJOURS FIXE même sur desktop */}
      <div
        className={`
        fixed top-0 left-0
        w-64 bg-[var(--color-card-bg)] border-r border-[var(--color-input-border)] 
        h-screen flex flex-col shadow-lg z-40
        transform transition-transform duration-300 ease-in-out
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      >
        {/* Header */}
        <div className="p-4 lg:p-6 border-b border-[var(--color-input-border)] flex-shrink-0">
          <div className="flex items-center justify-center lg:justify-start">
            <div className="flex items-center justify-center">
              <img
                src="/logo.png"
                alt="Farm Management Logo"
                className="w-12 h-12"
              />
            </div>
            {/* Texte caché sur mobile, visible sur desktop */}
            <div className="hidden lg:block ml-3">
              <h1 className="text-lg font-bold text-[var(--color-text)]">
                Farm Management
              </h1>
              {user && (
                <p className="text-sm text-[var(--color-text-secondary)]">
                  {user.name}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Navigation - avec scroll */}
        <nav className="flex-1 py-2 bg-[var(--color-card-bg)] overflow-hidden">
          <div className="h-full overflow-y-auto">
            {menuItems.map((item) => renderMenuItem(item))}
          </div>
        </nav>

        {/* Section utilisateur et déconnexion fixée en bas */}
        <div className="p-4 border-t border-[var(--color-input-border)] flex-shrink-0 bg-[var(--color-card-bg)]">
          {/* Bouton de déconnexion */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-red-500 text-white hover:bg-red-600 rounded-lg transition-all duration-200 font-medium shadow-md"
          >
            <LogOut className="w-5 h-5" />
            <span>Déconnexion</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
