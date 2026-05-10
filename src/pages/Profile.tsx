import { useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../lib/supabase"
import { useAuth } from "../lib/auth"
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
} from "lucide-react"

export default function Profile() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)

  // Password state
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [pwError, setPwError] = useState<string | null>(null)
  const [pwLoading, setPwLoading] = useState(false)
  const [pwDone, setPwDone] = useState(false)

  // Avatar state
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    user?.user_metadata?.avatar_url || null
  )
  const [uploading, setUploading] = useState(false)

  const handleLogout = async () => {
    await signOut()
    navigate("/login")
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwError(null)
    setPwDone(false)

    if (newPassword.length < 6) {
      setPwError("Le mot de passe doit contenir au moins 6 caractères")
      return
    }
    if (newPassword !== confirmPassword) {
      setPwError("Les mots de passe ne correspondent pas")
      return
    }

    setPwLoading(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setPwLoading(false)

    if (error) {
      setPwError(error.message)
    } else {
      setPwDone(true)
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
    <div className="min-h-screen bg-stone-100 p-4">
      <div className="max-w-lg mx-auto space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <CardTitle className="text-lg text-stone-800">Profil</CardTitle>
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
                    {user?.email?.charAt(0).toUpperCase()}
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
                <p className="text-xs text-muted">Upload en cours...</p>
              )}
            </div>

            <div className="rounded-lg bg-surface-alt p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm text-stone-700">
                <Mail className="h-4 w-4 text-muted" />
                {user?.email}
              </div>
              <div className="flex items-center gap-2 text-sm text-stone-700">
                <Calendar className="h-4 w-4 text-muted" />
                Inscrit le{" "}
                {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString("fr-FR")
                  : "—"}
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-sm font-semibold text-stone-700 mb-3 flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-primary" />
                Changer le mot de passe
              </h3>
              <form onSubmit={handleChangePassword} className="space-y-3">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-stone-600">
                    Nouveau mot de passe
                  </label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-stone-600">
                    Confirmer le mot de passe
                  </label>
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
                    Mot de passe mis à jour !
                  </p>
                )}
                <Button
                  type="submit"
                  size="sm"
                  disabled={pwLoading}
                  className="w-full"
                >
                  <KeyRound className="h-3 w-3" />
                  {pwLoading ? "Mise à jour..." : "Mettre à jour"}
                </Button>
              </form>
            </div>

            <Separator />

            <Button
              variant="destructive"
              onClick={handleLogout}
              className="w-full"
            >
              <LogOut className="h-4 w-4" />
              Se déconnecter
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
