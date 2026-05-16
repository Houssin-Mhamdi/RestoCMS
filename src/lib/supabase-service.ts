import { supabase } from "./supabase"
import type { OrderItem, Client, Product, RestaurantTable, TableStatus, Reservation } from "./store"

export interface DbClient {
  id: string
  user_id: string
  restaurant_id: string
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
  restaurant_id: string
  items: OrderItem[]
  total: number
  created_at: string
}

export async function loadClients(restaurantId: string): Promise<Client[]> {
  const { data: dbClients, error: clientErr } = await supabase
    .from("clients")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("created_at", { ascending: false })

  if (clientErr) throw clientErr

  const { data: dbOrders, error: orderErr } = await supabase
    .from("orders")
    .select("*")
    .eq("restaurant_id", restaurantId)
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
  client: Omit<Client, "orders" | "createdAt"> & { orders?: Client["orders"] },
  restaurantId: string
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
      restaurant_id: restaurantId,
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
      }, restaurantId)
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
}, restaurantId: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const { error } = await supabase.from("orders").insert({
    id: order.id,
    client_id: order.clientId,
    user_id: user.id,
    restaurant_id: restaurantId,
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

export async function loadProducts(restaurantId: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })

  if (error) throw error

  return (data || []).map((p: any) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    imageUrl: p.image_url || "",
    category: p.category || "",
    sortOrder: p.sort_order ?? 0,
    description: p.description || "",
    tag: p.tag || "",
    isSignature: p.is_signature || false,
    available: p.available ?? true,
    featured: p.featured || false,
    prepTime: p.prep_time ?? 0,
    stock: p.stock ?? -1,
    unit: p.unit || "",
    costPrice: p.cost_price ?? 0,
    minStock: p.min_stock ?? 0,
    allergens: p.allergens || "",
    dietary: p.dietary || "",
    createdAt: p.created_at,
  }))
}

export async function createProductOnSupabase(product: {
  id: string
  name: string
  price: number
  imageUrl: string
  category: string
  sortOrder: number
  description: string
  tag: string
  isSignature: boolean
  available: boolean
  featured: boolean
  prepTime: number
  stock: number
  unit: string
  costPrice: number
  minStock: number
  allergens: string
  dietary: string
}, restaurantId: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const { error } = await supabase.from("products").insert({
    id: product.id,
    user_id: user.id,
    restaurant_id: restaurantId,
    name: product.name,
    price: product.price,
    image_url: product.imageUrl,
    category: product.category,
    sort_order: product.sortOrder,
    description: product.description,
    tag: product.tag,
    is_signature: product.isSignature,
    available: product.available,
    featured: product.featured,
    prep_time: product.prepTime,
    stock: product.stock,
    unit: product.unit,
    cost_price: product.costPrice,
    min_stock: product.minStock,
    allergens: product.allergens,
    dietary: product.dietary,
  })
  if (error) throw error
}

export async function updateProductOnSupabase(product: {
  id: string
  name: string
  price: number
  imageUrl: string
  category: string
  sortOrder: number
  description: string
  tag: string
  isSignature: boolean
  available: boolean
  featured: boolean
  prepTime: number
  stock: number
  unit: string
  costPrice: number
  minStock: number
  allergens: string
  dietary: string
}) {
  const { error } = await supabase
    .from("products")
    .update({
      name: product.name,
      price: product.price,
      image_url: product.imageUrl,
      category: product.category,
      sort_order: product.sortOrder,
      description: product.description,
      tag: product.tag,
      is_signature: product.isSignature,
      available: product.available,
      featured: product.featured,
      prep_time: product.prepTime,
      stock: product.stock,
      unit: product.unit,
      cost_price: product.costPrice,
      min_stock: product.minStock,
      allergens: product.allergens,
      dietary: product.dietary,
    })
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

/* ───── Category CRUD ───── */

export async function loadCategories(restaurantId: string): Promise<{ id: string; name: string }[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("name", { ascending: true })

  if (error) throw error

  return (data || []).map((c: any) => ({
    id: c.id,
    name: c.name,
  }))
}

export async function createCategoryOnSupabase(name: string, restaurantId: string): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const { data, error } = await supabase
    .from("categories")
    .insert({ name, user_id: user.id, restaurant_id: restaurantId })
    .select("id")
    .single()

  if (error) throw error
  return data.id
}

export async function deleteCategoryOnSupabase(categoryId: string) {
  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", categoryId)
  if (error) throw error
}

/* ───── Table CRUD ───── */

export async function loadTables(restaurantId: string): Promise<RestaurantTable[]> {
  const { data, error } = await supabase
    .from("restaurant_tables")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("number", { ascending: true })

  if (error) throw error

  return (data || []).map((t: any) => ({
    id: t.id,
    number: t.number,
    capacity: t.capacity,
    status: t.status as TableStatus,
    customerName: t.customer_name || "",
  }))
}

export async function createTableOnSupabase(
  table: { number: number; capacity: number; status: TableStatus; customerName?: string },
  restaurantId: string
): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const { data, error } = await supabase
    .from("restaurant_tables")
    .insert({
      number: table.number,
      capacity: table.capacity,
      status: table.status,
      customer_name: table.customerName || "",
      user_id: user.id,
      restaurant_id: restaurantId,
    })
    .select("id")
    .single()

  if (error) throw error
  return data.id
}

export async function updateTableOnSupabase(table: RestaurantTable) {
  const { error } = await supabase
    .from("restaurant_tables")
    .update({
      number: table.number,
      capacity: table.capacity,
      status: table.status,
      customer_name: table.customerName,
    })
    .eq("id", table.id)
  if (error) throw error
}

export async function deleteTableOnSupabase(tableId: string) {
  const { error } = await supabase
    .from("restaurant_tables")
    .delete()
    .eq("id", tableId)
  if (error) throw error
}

/* ───── Calendar Events CRUD ───── */

export interface CalendarEvent {
  id: string
  date: string
  title: string
  note: string
  remindDays: number
  createdAt: string
}

export async function loadCalendarEvents(restaurantId: string): Promise<CalendarEvent[]> {
  const { data, error } = await supabase
    .from("calendar_events")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("date", { ascending: false })

  if (error) throw error

  return (data || []).map((e: any) => ({
    id: e.id,
    date: e.date,
    title: e.title,
    note: e.note || "",
    remindDays: e.remind_days ?? 0,
    createdAt: e.created_at,
  }))
}

export async function createCalendarEventOnSupabase(event: {
  id: string
  date: string
  title: string
  note: string
  remindDays: number
}, restaurantId: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const { error } = await supabase.from("calendar_events").insert({
    id: event.id,
    user_id: user.id,
    restaurant_id: restaurantId,
    date: event.date,
    title: event.title,
    note: event.note,
    remind_days: event.remindDays,
  })
  if (error) throw error
}

export async function deleteCalendarEventOnSupabase(eventId: string) {
  const { error } = await supabase
    .from("calendar_events")
    .delete()
    .eq("id", eventId)
  if (error) throw error
}

export async function updateCalendarEventOnSupabase(event: {
  id: string
  date: string
  title: string
  note: string
  remindDays: number
}) {
  const { error } = await supabase
    .from("calendar_events")
    .update({
      date: event.date,
      title: event.title,
      note: event.note,
      remind_days: event.remindDays,
    })
    .eq("id", event.id)
  if (error) throw error
}

/* ───── Reservation CRUD ───── */

export async function loadReservations(restaurantId: string): Promise<Reservation[]> {
  const { data, error } = await supabase
    .from("reservations")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("created_at", { ascending: false })

  if (error) throw error

    return (data || []).map((r: any) => ({
    id: r.id,
    tableId: r.table_id || "",
    tableNumber: r.table_number || 0,
    guestName: r.guest_name || "",
    email: r.email || "",
    phone: r.phone || "",
    date: r.date,
    time: r.time || "",
    guests: r.guests || 1,
    restaurantName: r.restaurant_name || "",
    status: r.status || "pending",
    createdAt: r.created_at,
  }))
}

export async function updateReservationOnSupabase(reservation: Reservation) {
  const { error } = await supabase
    .from("reservations")
    .update({
      status: reservation.status,
    })
    .eq("id", reservation.id)
  if (error) throw error
}

/* ───── Restaurant CRUD ───── */

export interface DbRestaurant {
  id: string
  name: string
  currency: string
  color: string
  logo: string
  table_count: number
  dark_mode: boolean
}

export async function loadRestaurants(): Promise<DbRestaurant[]> {
  const { data, error } = await supabase
    .from("restaurants")
    .select("*")
    .order("created_at", { ascending: true })
  if (error) throw error
  return (data || []).map((r: any) => ({
    id: r.id,
    name: r.name,
    currency: r.currency,
    color: r.color,
    logo: r.logo || "",
    table_count: r.table_count ?? 0,
    dark_mode: r.dark_mode ?? false,
  }))
}

export async function createRestaurantOnSupabase(r: {
  id: string
  name: string
  currency: string
  color: string
  logo: string
  tableCount: number
  darkMode: boolean
}) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")
  const { error } = await supabase.from("restaurants").insert({
    id: r.id,
    user_id: user.id,
    name: r.name,
    currency: r.currency,
    color: r.color,
    logo: r.logo,
    table_count: r.tableCount,
    dark_mode: r.darkMode,
  })
  if (error) throw error
}

export async function updateRestaurantOnSupabase(r: {
  id: string
  name: string
  currency: string
  color: string
  logo: string
  tableCount: number
  darkMode: boolean
}) {
  const { error } = await supabase
    .from("restaurants")
    .update({
      name: r.name,
      currency: r.currency,
      color: r.color,
      logo: r.logo,
      table_count: r.tableCount,
      dark_mode: r.darkMode,
    })
    .eq("id", r.id)
  if (error) throw error
}

export async function deleteRestaurantOnSupabase(id: string) {
  const { error } = await supabase
    .from("restaurants")
    .delete()
    .eq("id", id)
  if (error) throw error
}

/* ───── SEO Settings CRUD ───── */

export interface DbSeoSettings {
  id: string
  page: string
  meta_title: string
  meta_description: string
  og_title: string
  og_description: string
  og_image: string
  keywords: string
  h1_heading: string
}

export interface SeoSettingsInput {
  page: string
  metaTitle: string
  metaDescription: string
  ogTitle: string
  ogDescription: string
  ogImage: string
  keywords: string
  h1Heading: string
}

export async function loadSeoSettings(restaurantId: string): Promise<SeoSettingsInput[]> {
  const { data, error } = await supabase
    .from("seo_settings")
    .select("*")
    .eq("restaurant_id", restaurantId)

  if (error) throw error

  return (data || []).map((s: DbSeoSettings) => ({
    page: s.page,
    metaTitle: s.meta_title || "",
    metaDescription: s.meta_description || "",
    ogTitle: s.og_title || "",
    ogDescription: s.og_description || "",
    ogImage: s.og_image || "",
    keywords: s.keywords || "",
    h1Heading: s.h1_heading || "",
  }))
}

export async function saveSeoSetting(
  restaurantId: string,
  input: SeoSettingsInput
) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const { error } = await supabase.from("seo_settings").upsert(
    {
      user_id: user.id,
      restaurant_id: restaurantId,
      page: input.page,
      meta_title: input.metaTitle,
      meta_description: input.metaDescription,
      og_title: input.ogTitle,
      og_description: input.ogDescription,
      og_image: input.ogImage,
      keywords: input.keywords,
      h1_heading: input.h1Heading,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "restaurant_id, page" }
  )
  if (error) throw error
}

/* ───── Subscription CRUD ───── */

export interface Subscription {
  id: string
  userId: string
  plan: string
  status: string
  trialEndsAt: string | null
  stripeCustomerId: string
  stripeSubscriptionId: string
  currentPeriodStart: string | null
  currentPeriodEnd: string | null
}

export async function loadSubscription(): Promise<Subscription | null> {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .single()

  if (error && error.code !== "PGRST116") throw error
  if (!data) return null

  return {
    id: data.id,
    userId: data.user_id,
    plan: data.plan || "free",
    status: data.status || "trialing",
    trialEndsAt: data.trial_ends_at || null,
    stripeCustomerId: data.stripe_customer_id || "",
    stripeSubscriptionId: data.stripe_subscription_id || "",
    currentPeriodStart: data.current_period_start || null,
    currentPeriodEnd: data.current_period_end || null,
  }
}

export async function createFreeSubscription(userId: string) {
  const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
  const { error } = await supabase.from("subscriptions").upsert(
    {
      user_id: userId,
      plan: "free",
      status: "trialing",
      trial_ends_at: trialEndsAt,
    },
    { onConflict: "user_id" }
  )
  if (error) throw error
}

export async function updateSubscriptionLocally(sub: Subscription) {
  const { error } = await supabase
    .from("subscriptions")
    .update({
      plan: sub.plan,
      status: sub.status,
      stripe_customer_id: sub.stripeCustomerId,
      stripe_subscription_id: sub.stripeSubscriptionId,
      current_period_start: sub.currentPeriodStart,
      current_period_end: sub.currentPeriodEnd,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", sub.userId)
  if (error) throw error
}

/* ───── Availability Settings ───── */

export interface AvailabilitySettings {
  openingHours: Record<string, { open: string; close: string } | null>
  maxGuestsPerSlot: number
  slotInterval: number
}

export async function loadAvailabilitySettings(restaurantId: string): Promise<AvailabilitySettings> {
  const { data, error } = await supabase
    .from("restaurants")
    .select("opening_hours, max_guests_per_slot, slot_interval")
    .eq("id", restaurantId)
    .single()

  if (error) throw error

  return {
    openingHours: data.opening_hours || {},
    maxGuestsPerSlot: data.max_guests_per_slot ?? 20,
    slotInterval: data.slot_interval ?? 60,
  }
}

export async function saveAvailabilitySettings(
  restaurantId: string,
  settings: AvailabilitySettings
) {
  const { error } = await supabase
    .from("restaurants")
    .update({
      opening_hours: settings.openingHours,
      max_guests_per_slot: settings.maxGuestsPerSlot,
      slot_interval: settings.slotInterval,
    })
    .eq("id", restaurantId)
  if (error) throw error
}
