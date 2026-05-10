import { createContext, useContext, useReducer, type ReactNode } from "react"
import { generateId } from "./utils"

export interface Product {
  id: string
  name: string
  price: number
  imageUrl: string
  createdAt: string
}

export interface OrderItem {
  id: string
  name: string
  quantity: number
  price: number
}

export interface Order {
  id: string
  items: OrderItem[]
  date: string
  total: number
}

export interface Client {
  id: string
  name: string
  lastname: string
  phone: string
  location: string
  orders: Order[]
  createdAt: string
}

export interface AppState {
  clients: Client[]
  products: Product[]
  sidebarOpen: boolean
  rightSidebarOpen: boolean
  selectedClientId: string | null
}

type Action =
  | { type: "TOGGLE_SIDEBAR" }
  | { type: "TOGGLE_RIGHT_SIDEBAR"; payload?: boolean }
  | {
      type: "ADD_CLIENT"
      payload: Omit<Client, "orders" | "createdAt"> & { orders?: Order[] }
    }
  | { type: "ADD_ORDER"; payload: { clientId: string; items: OrderItem[] } }
  | { type: "SELECT_CLIENT"; payload: string | null }
  | { type: "LOAD_CLIENTS"; payload: Client[] }
  | { type: "UPDATE_CLIENT"; payload: { id: string; name: string; lastname: string; phone: string; location: string } }
  | { type: "DELETE_CLIENT"; payload: string }
  | { type: "DELETE_ORDER"; payload: { clientId: string; orderId: string } }
  | { type: "UPDATE_ORDER"; payload: { clientId: string; orderId: string; items: OrderItem[]; total: number } }
  | { type: "LOAD_PRODUCTS"; payload: Product[] }
  | { type: "ADD_PRODUCT"; payload: Product }
  | { type: "UPDATE_PRODUCT"; payload: Product }
  | { type: "DELETE_PRODUCT"; payload: string }

const initialState: AppState = {
  clients: [],
  products: [],
  sidebarOpen: true,
  rightSidebarOpen: false,
  selectedClientId: null,
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "TOGGLE_SIDEBAR":
      return { ...state, sidebarOpen: !state.sidebarOpen }
    case "TOGGLE_RIGHT_SIDEBAR":
      return {
        ...state,
        rightSidebarOpen: action.payload ?? !state.rightSidebarOpen,
      }
    case "ADD_CLIENT": {
      const newClient: Client = {
        ...action.payload,
        id: action.payload.id || generateId(),
        orders: action.payload.orders || [],
        createdAt: new Date().toISOString(),
      }
      return { ...state, clients: [...state.clients, newClient] }
    }
    case "ADD_ORDER": {
      const total = action.payload.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      )
      const newOrder: Order = {
        id: generateId(),
        items: action.payload.items,
        date: new Date().toISOString(),
        total,
      }
      return {
        ...state,
        clients: state.clients.map((c) =>
          c.id === action.payload.clientId
            ? { ...c, orders: [...c.orders, newOrder] }
            : c
        ),
      }
    }
    case "SELECT_CLIENT":
      return {
        ...state,
        selectedClientId: action.payload,
      }
    case "LOAD_CLIENTS":
      return { ...state, clients: action.payload }
    case "LOAD_PRODUCTS":
      return { ...state, products: action.payload }
    case "ADD_PRODUCT":
      return { ...state, products: [...state.products, action.payload] }
    case "DELETE_PRODUCT":
      return {
        ...state,
        products: state.products.filter((p) => p.id !== action.payload),
      }
    case "UPDATE_CLIENT":
      return {
        ...state,
        clients: state.clients.map((c) =>
          c.id === action.payload.id
            ? { ...c, name: action.payload.name, lastname: action.payload.lastname, phone: action.payload.phone, location: action.payload.location }
            : c
        ),
      }
    case "DELETE_CLIENT":
      return {
        ...state,
        clients: state.clients.filter((c) => c.id !== action.payload),
        selectedClientId:
          state.selectedClientId === action.payload
            ? null
            : state.selectedClientId,
      }
    case "DELETE_ORDER":
      return {
        ...state,
        clients: state.clients.map((c) =>
          c.id === action.payload.clientId
            ? { ...c, orders: c.orders.filter((o) => o.id !== action.payload.orderId) }
            : c
        ),
      }
    case "UPDATE_ORDER":
      return {
        ...state,
        clients: state.clients.map((c) =>
          c.id === action.payload.clientId
            ? {
                ...c,
                orders: c.orders.map((o) =>
                  o.id === action.payload.orderId
                    ? { ...o, items: action.payload.items, total: action.payload.total }
                    : o
                ),
              }
            : c
        ),
      }
    case "UPDATE_PRODUCT":
      return {
        ...state,
        products: state.products.map((p) =>
          p.id === action.payload.id ? action.payload : p
        ),
      }
    default:
      return state
  }
}

interface StoreContextType {
  state: AppState
  dispatch: React.Dispatch<Action>
}

const StoreContext = createContext<StoreContextType | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  return (
    <StoreContext.Provider value={{ state, dispatch }}>
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error("useStore must be used within StoreProvider")
  return ctx
}
