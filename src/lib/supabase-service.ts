import { supabase } from "./supabase"
import type { OrderItem, Client, Product } from "./store"

export interface DbClient {
  id: string
  user_id: string
  name: string
  lastname: string
  phone: string
  location: string
  created_at: string
}

export interface DbOrder {
  id: string
  client_id: string
  user_id: string
  items: OrderItem[]
  total: number
  created_at: string
}

export async function loadClients(): Promise<Client[]> {
  const { data: dbClients, error: clientErr } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false })

  if (clientErr) throw clientErr

  const { data: dbOrders, error: orderErr } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })

  if (orderErr) throw orderErr

  const ordersByClient = new Map<string, DbOrder[]>()
  for (const o of dbOrders || []) {
    if (!ordersByClient.has(o.client_id)) {
      ordersByClient.set(o.client_id, [])
    }
    ordersByClient.get(o.client_id)!.push(o)
  }

  return (dbClients || []).map((c: DbClient) => ({
    id: c.id,
    name: c.name,
    lastname: c.lastname,
    phone: c.phone,
    location: c.location || "",
    createdAt: c.created_at,
    orders: (ordersByClient.get(c.id) || []).map((o: DbOrder) => ({
      id: o.id,
      items: o.items || [],
      date: o.created_at,
      total: o.total,
    })),
  }))
}

export async function createClientOnSupabase(
  client: Omit<Client, "orders" | "createdAt"> & { orders?: Client["orders"] }
): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const { data, error } = await supabase
    .from("clients")
    .insert({
      id: client.id,
      user_id: user.id,
      name: client.name,
      lastname: client.lastname,
      phone: client.phone,
      location: client.location,
    })
    .select("id")
    .single()

  if (error) throw error

  if (client.orders && client.orders.length > 0) {
    for (const order of client.orders) {
      await createOrderOnSupabase({
        id: order.id,
        clientId: client.id,
        items: order.items,
        total: order.total,
        date: order.date,
      })
    }
  }

  return data.id
}

export async function createOrderOnSupabase(order: {
  id: string
  clientId: string
  items: OrderItem[]
  total: number
  date: string
}) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const { error } = await supabase.from("orders").insert({
    id: order.id,
    client_id: order.clientId,
    user_id: user.id,
    items: order.items,
    total: order.total,
    created_at: order.date,
  })

  if (error) throw error
}

export async function updateClientOnSupabase(client: {
  id: string
  name: string
  lastname: string
  phone: string
  location: string
}) {
  const { error } = await supabase
    .from("clients")
    .update({
      name: client.name,
      lastname: client.lastname,
      phone: client.phone,
      location: client.location,
    })
    .eq("id", client.id)
  if (error) throw error
}

export async function deleteClientOnSupabase(clientId: string) {
  const { error } = await supabase
    .from("clients")
    .delete()
    .eq("id", clientId)
  if (error) throw error
}

export async function updateOrderOnSupabase(order: {
  id: string
  items: OrderItem[]
  total: number
}) {
  const { error } = await supabase
    .from("orders")
    .update({ items: order.items, total: order.total })
    .eq("id", order.id)
  if (error) throw error
}

export async function deleteOrderOnSupabase(orderId: string) {
  const { error } = await supabase
    .from("orders")
    .delete()
    .eq("id", orderId)
  if (error) throw error
}

/* ───── Product CRUD ───── */

export async function loadProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) throw error

  return (data || []).map((p: any) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    imageUrl: p.image_url || "",
    createdAt: p.created_at,
  }))
}

export async function createProductOnSupabase(product: {
  id: string
  name: string
  price: number
  imageUrl: string
}) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const { error } = await supabase.from("products").insert({
    id: product.id,
    user_id: user.id,
    name: product.name,
    price: product.price,
    image_url: product.imageUrl,
  })
  if (error) throw error
}

export async function updateProductOnSupabase(product: {
  id: string
  name: string
  price: number
  imageUrl: string
}) {
  const { error } = await supabase
    .from("products")
    .update({ name: product.name, price: product.price, image_url: product.imageUrl })
    .eq("id", product.id)
  if (error) throw error
}

export async function deleteProductOnSupabase(productId: string) {
  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", productId)
  if (error) throw error
}
