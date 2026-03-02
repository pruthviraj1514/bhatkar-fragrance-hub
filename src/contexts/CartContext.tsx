import React, { createContext, useContext, useReducer, useEffect, ReactNode } from "react";

// ─── Cart Item ────────────────────────────────────────────────────────────────
export interface CartItem {
  product: {
    id: string | number;
    name: string;
    brand?: string;
    images?: string[];
    image_url?: string;
    [key: string]: any;
  };
  quantity: number;
  selectedSize: number;
  selectedPrice: number;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
}

type CartAction =
  | { type: "ADD_ITEM"; payload: { product: any; size: number; price: number; quantity?: number } }
  | { type: "REMOVE_ITEM"; payload: { productId: string | number; size: number } }
  | { type: "UPDATE_QUANTITY"; payload: { productId: string | number; size: number; quantity: number } }
  | { type: "CLEAR_CART" }
  | { type: "TOGGLE_CART" }
  | { type: "OPEN_CART" }
  | { type: "CLOSE_CART" }
  | { type: "HYDRATE"; payload: CartItem[] };

const CART_STORAGE_KEY = "cart_items";

// ─── Load from localStorage ───────────────────────────────────────────────────
function loadCartFromStorage(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Validate each item has required fields
    return parsed.filter(
      (item: any) =>
        item &&
        item.product &&
        typeof item.quantity === "number" &&
        typeof item.selectedPrice === "number"
    );
  } catch {
    return [];
  }
}

const initialState: CartState = {
  items: loadCartFromStorage(), // Hydrate instantly from localStorage
  isOpen: false,
};

// ─── Reducer ──────────────────────────────────────────────────────────────────
function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "HYDRATE":
      return { ...state, items: action.payload };

    case "ADD_ITEM": {
      const existingIndex = state.items.findIndex(
        (item) =>
          String(item.product.id) === String(action.payload.product.id) &&
          item.selectedSize === action.payload.size
      );
      const qty = action.payload.quantity || 1;

      if (existingIndex > -1) {
        const updated = [...state.items];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + qty,
        };
        return { ...state, items: updated, isOpen: true };
      }

      return {
        ...state,
        items: [
          ...state.items,
          {
            product: action.payload.product,
            quantity: qty,
            selectedSize: action.payload.size,
            selectedPrice: Number(action.payload.price) || 0,
          },
        ],
        isOpen: true,
      };
    }

    case "REMOVE_ITEM":
      return {
        ...state,
        items: state.items.filter(
          (item) =>
            !(
              String(item.product.id) === String(action.payload.productId) &&
              item.selectedSize === action.payload.size
            )
        ),
      };

    case "UPDATE_QUANTITY": {
      if (action.payload.quantity <= 0) {
        return {
          ...state,
          items: state.items.filter(
            (item) =>
              !(
                String(item.product.id) === String(action.payload.productId) &&
                item.selectedSize === action.payload.size
              )
          ),
        };
      }
      return {
        ...state,
        items: state.items.map((item) =>
          String(item.product.id) === String(action.payload.productId) &&
            item.selectedSize === action.payload.size
            ? { ...item, quantity: action.payload.quantity }
            : item
        ),
      };
    }

    case "CLEAR_CART":
      return { ...state, items: [] };

    case "TOGGLE_CART":
      return { ...state, isOpen: !state.isOpen };

    case "OPEN_CART":
      return { ...state, isOpen: true };

    case "CLOSE_CART":
      return { ...state, isOpen: false };

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────
interface CartContextType {
  state: CartState;
  addItem: (product: any, size: number, price: number, quantity?: number) => void;
  removeItem: (productId: string | number, size: number) => void;
  updateQuantity: (productId: string | number, size: number, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // ── Persist cart to localStorage on every change ──────────────────────────
  useEffect(() => {
    try {
      // Don't persist isOpen — only persist the items
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.items));
    } catch {
      // Storage might be full or unavailable; fail silently
    }
  }, [state.items]);

  const addItem = (product: any, size: number, price: number, quantity?: number) =>
    dispatch({ type: "ADD_ITEM", payload: { product, size, price, quantity } });

  const removeItem = (productId: string | number, size: number) =>
    dispatch({ type: "REMOVE_ITEM", payload: { productId, size } });

  const updateQuantity = (productId: string | number, size: number, quantity: number) =>
    dispatch({ type: "UPDATE_QUANTITY", payload: { productId, size, quantity } });

  const clearCart = () => dispatch({ type: "CLEAR_CART" });
  const toggleCart = () => dispatch({ type: "TOGGLE_CART" });
  const openCart = () => dispatch({ type: "OPEN_CART" });
  const closeCart = () => dispatch({ type: "CLOSE_CART" });

  // ── Safe total calculation — never NaN, never incorrect after refresh ──────
  const totalItems = state.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const totalPrice = state.items.reduce(
    (sum, item) => sum + (Number(item.selectedPrice) || 0) * (item.quantity || 0),
    0
  );

  return (
    <CartContext.Provider
      value={{
        state,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        toggleCart,
        openCart,
        closeCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
