import { useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../lib/supabase"
import { useAuth } from "../lib/auth"
import { useI18n, LOCALE_MAP } from "../lib/i18n"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Separator } from "../components/ui/separator"
import {
  ArrowLeft,
  Mail,
  Calendar,
  LogOut,
  KeyRound,
  Camera,
  CheckCircle,
  User,
  ChevronDown,
  ChevronRight,
} from "lucide-react"

export default function Profile() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const { t, lang } = useI18n()
  const fileRef = useRef<HTMLInputElement>(null)

  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [pwError, setPwError] = useState<string | null>(null)
  const [pwLoading, setPwLoading] = useState(false)
  const [pwDone, setPwDone] = useState(false)

  const [displayName, setDisplayName] = useState(user?.user_metadata?.name || "")
  const [nameSaving, setNameSaving] = useState(false)
  const [nameDone, setNameDone] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)

  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    user?.user_metadata?.avatar_url || null
  )
  const [uploading, setUploading] = useState(false)

  const [nameOpen, setNameOpen] = useState(true)
  const [pwOpen, setPwOpen] = useState(false)

  const locale = LOCALE_MAP[lang]

  const handleLogout = async () => {
    await signOut()
    navigate("/login")
  }

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault()
    setNameError(null)
    setNameDone(false)
    if (!displayName.trim()) {
      setNameError(t("nameErrorEmpty"))
      return
    }
    setNameSaving(true)
    const { error } = await supabase.auth.updateUser({
      data: { name: displayName.trim() },
    })
    setNameSaving(false)
    if (error) {
      setNameError(error.message)
    } else {
      setNameDone(true)
      setTimeout(() => setNameDone(false), 3000)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwError(null)
    setPwDone(false)

    if (!oldPassword) {
      setPwError(t("passwordIncorrect"))
      return
    }
    if (newPassword.length < 6) {
      setPwError(t("passwordMinLength"))
      return
    }
    if (newPassword !== confirmPassword) {
      setPwError(t("passwordMismatch"))
      return
    }

    setPwLoading(true)

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user?.email || "",
      password: oldPassword,
    })

    if (signInError) {
      setPwError(t("passwordIncorrect"))
      setPwLoading(false)
      return
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setPwLoading(false)

    if (error) {
      setPwError(error.message)
    } else {
      setPwDone(true)
      setOldPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setTimeout(() => setPwDone(false), 3000)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const fileExt = file.name.split(".").pop()
      const fileName = `${user?.id}_${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(fileName)

      await supabase.auth.updateUser({
        data: { avatar_url: publicUrl },
      })

      setAvatarUrl(publicUrl)
    } catch (err) {
      console.error("Upload failed:", err)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface p-4">
      <div className="max-w-lg mx-auto space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <CardTitle className="text-lg text-text">{t("profile")}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="relative">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="h-20 w-20 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-2xl font-bold text-white">
                    {(displayName || user?.email || "?").charAt(0).toUpperCase()}
                  </div>
                )}
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white hover:bg-primary-hover transition-colors disabled:opacity-50"
                >
                  <Camera className="h-3.5 w-3.5" />
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </div>
              {uploading && (
                <p className="text-xs text-muted">{t("uploading")}</p>
              )}
              {displayName && (
                <p className="text-sm font-semibold text-text">{displayName}</p>
              )}
            </div>

            <div className="rounded-lg bg-surface-alt p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm text-text">
                <Mail className="h-4 w-4 text-muted" />
                {user?.email}
              </div>
              <div className="flex items-center gap-2 text-sm text-text">
                <Calendar className="h-4 w-4 text-muted" />
                {t("memberSince")}{" "}
                {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString(locale)
                  : "—"}
              </div>
            </div>

            <Separator />

            <div>
              <button
                type="button"
                onClick={() => setNameOpen(!nameOpen)}
                className="flex w-full items-center justify-between text-sm font-semibold text-text mb-1"
              >
                <span className="flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  {t("displayName")}
                </span>
                {nameOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
              {nameOpen && (
                <form onSubmit={handleUpdateName} className="space-y-3 pt-2">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted">{t("displayName")}</label>
                    <Input
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder={t("namePlaceholder")}
                      required
                    />
                  </div>
                  {nameError && (
                    <p className="text-xs text-danger">{nameError}</p>
                  )}
                  {nameDone && (
                    <p className="text-xs text-success flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      {t("nameUpdated")}
                    </p>
                  )}
                  <Button
                    type="submit"
                    size="sm"
                    disabled={nameSaving}
                    className="w-full"
                  >
                    <User className="h-3 w-3" />
                    {nameSaving ? t("updateLoading") : t("save")}
                  </Button>
                </form>
              )}
            </div>

            <Separator />

            <div>
              <button
                type="button"
                onClick={() => setPwOpen(!pwOpen)}
                className="flex w-full items-center justify-between text-sm font-semibold text-text mb-1"
              >
                <span className="flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-primary" />
                  {t("changePassword")}
                </span>
                {pwOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
              {pwOpen && (
                <form onSubmit={handleChangePassword} className="space-y-3 pt-2">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted">{t("oldPassword")}</label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted">{t("newPassword")}</label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted">{t("confirmPassword")}</label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                  {pwError && (
                    <p className="text-xs text-danger">{pwError}</p>
                  )}
                  {pwDone && (
                    <p className="text-xs text-success flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      {t("passwordUpdated")}
                    </p>
                  )}
                  <Button
                    type="submit"
                    size="sm"
                    disabled={pwLoading}
                    className="w-full"
                  >
                    <KeyRound className="h-3 w-3" />
                    {pwLoading ? t("updateLoading") : t("update")}
                  </Button>
                </form>
              )}
            </div>

            <Separator />

            <Button
              variant="destructive"
              onClick={handleLogout}
              className="w-full"
            >
              <LogOut className="h-4 w-4" />
              {t("logout")}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
