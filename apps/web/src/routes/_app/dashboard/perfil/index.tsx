import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  updatePasswordSchema,
  type UpdatePasswordFormData,
} from '@/schemas/update-password'
import { updateUserAvatar } from '@/services/auth/avatar'
import { updatePassword } from '@/services/auth/password'
import { useUserStore } from '@/stores/user-store'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { AxiosError } from 'axios'
import { Camera, Eye, EyeOff, Save, X } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

export const Route = createFileRoute('/_app/dashboard/perfil/')({
  component: PerfilPage,
})

function PerfilPage() {
  const { user, setUser } = useUserStore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdatePasswordFormData>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      password: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  const handleFileSelect = (file: File) => {
    setSelectedFile(file)
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleSavePhoto = () => {
    if (selectedFile) {
      const formData = new FormData()
      formData.append('file', selectedFile)

      for (let [key, value] of formData.entries()) {
        console.log(key, value)
      }

      updateAvatarMutation.mutateAsync(formData)
      setIsModalOpen(false)
      setSelectedFile(null)
      setPreviewUrl(null)
    }
  }

  const handleCancelPhoto = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setIsModalOpen(false)
  }

  const onSubmitPassword = (data: UpdatePasswordFormData) => {
    updatePasswordMutation.mutateAsync(data)
  }

  const updatePasswordMutation = useMutation({
    mutationFn: updatePassword,
    onSuccess: () => {
      toast.success('Senha alterada com sucesso')
    },
    onError: error => {
      if (error instanceof AxiosError) {
        switch (error.response?.status) {
          case 400:
            toast.error('Senha inválida')
            break
          case 404:
            toast.error('Usuário não encontrado')
            break
          case 429:
            toast.error('Muitas requisições, tente novamente mais tarde')
            break
          default:
            toast.error('Algo deu errado, tente novamente mais tarde')
            break
        }
      } else {
        toast.error('Algo deu errado, tente novamente mais tarde')
      }
    },
  })

  const updateAvatarMutation = useMutation({
    mutationFn: updateUserAvatar,
    onSuccess: data => {
      toast.success('Foto de perfil atualizada com sucesso')
      setUser({
        name: user?.name || '',
        email: user?.email || '',
        avatar: data.avatarUrl || '',
      })
    },
    onError: error => {
      if (error instanceof AxiosError) {
        switch (error.response?.status) {
          case 400:
            toast.error('Erro ao atualizar foto de perfil')
            break
          case 401:
            toast.error('Token inválido ou expirado')
            break
          case 404:
            toast.error('Usuário não encontrado')
            break
          case 429:
            toast.error('Muitas requisições, tente novamente mais tarde')
            break
          default:
            toast.error('Algo deu errado, tente novamente mais tarde')
        }
      } else {
        toast.error('Algo deu errado, tente novamente mais tarde')
      }
    },
  })

  return (
    <div className="flex flex-1 justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="w-full max-w-6xl p-6">
        <div className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-8 text-white">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
              <Camera className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Meu Perfil</h1>
              <p className="text-blue-100">
                Gerencie suas informações pessoais e configurações
              </p>
            </div>
          </div>
          <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10"></div>
          <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-white/5"></div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card className="overflow-hidden border-0 shadow-xl">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 dark:from-blue-950/50 dark:to-indigo-950/50">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                      <Camera className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    Informações Pessoais
                  </CardTitle>
                  <CardDescription>
                    Suas informações básicas do perfil
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-col items-center space-y-4 sm:flex-row sm:space-y-0 sm:space-x-6">
                    <div className="group relative">
                      <Avatar
                        className="h-32 w-32 cursor-pointer shadow-lg ring-4 ring-white transition-all duration-300 hover:scale-105 hover:ring-blue-200 dark:ring-slate-800 dark:hover:ring-blue-800"
                        onClick={() => setIsModalOpen(true)}
                      >
                        <AvatarImage
                          src={user?.avatar || previewUrl || ''}
                          alt={user?.name}
                          className="object-cover"
                        />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-4xl font-bold text-white">
                          {user?.name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -right-2 -bottom-2 flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 shadow-lg transition-all duration-300 group-hover:scale-110">
                        <Camera className="h-5 w-5 text-white" />
                      </div>
                      <div className="absolute inset-0 rounded-full bg-black/0 transition-all duration-300 group-hover:bg-black/10"></div>
                    </div>

                    <div className="flex-1 space-y-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="name"
                          className="text-sm font-medium text-slate-700 dark:text-slate-300"
                        >
                          Nome Completo
                        </Label>
                        <Input
                          id="name"
                          value={user?.name || ''}
                          disabled
                          className="border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="email"
                          className="text-sm font-medium text-slate-700 dark:text-slate-300"
                        >
                          Endereço de E-mail
                        </Label>
                        <Input
                          id="email"
                          value={user?.email || ''}
                          disabled
                          className="border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800"
                        />
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => setIsModalOpen(true)}
                        className="w-full border-blue-200 text-blue-600 hover:bg-blue-50 sm:w-auto dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-950"
                      >
                        <Camera className="mr-2 h-4 w-4" />
                        Alterar Foto de Perfil
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="h-fit border-0 shadow-xl">
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-6 dark:from-emerald-950/50 dark:to-teal-950/50">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900">
                      <Save className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    Segurança
                  </CardTitle>
                  <CardDescription>Alterar sua senha de acesso</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <form
                    onSubmit={handleSubmit(onSubmitPassword)}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label
                        htmlFor="password"
                        className="text-sm font-medium text-slate-700 dark:text-slate-300"
                      >
                        Senha Atual
                      </Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showCurrentPassword ? 'text' : 'password'}
                          {...registerField('password')}
                          placeholder="Digite sua senha atual"
                          className="border-slate-200 bg-slate-50 pr-10 dark:border-slate-700 dark:bg-slate-800"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() =>
                            setShowCurrentPassword(!showCurrentPassword)
                          }
                        >
                          {showCurrentPassword ? (
                            <EyeOff className="h-4 w-4 text-slate-500" />
                          ) : (
                            <Eye className="h-4 w-4 text-slate-500" />
                          )}
                        </Button>
                      </div>
                      {errors.password && (
                        <p className="text-sm text-red-500">
                          {errors.password.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="newPassword"
                        className="text-sm font-medium text-slate-700 dark:text-slate-300"
                      >
                        Nova Senha
                      </Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showNewPassword ? 'text' : 'password'}
                          {...registerField('newPassword')}
                          placeholder="Digite sua nova senha"
                          className="border-slate-200 bg-slate-50 pr-10 dark:border-slate-700 dark:bg-slate-800"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? (
                            <EyeOff className="h-4 w-4 text-slate-500" />
                          ) : (
                            <Eye className="h-4 w-4 text-slate-500" />
                          )}
                        </Button>
                      </div>
                      {errors.newPassword && (
                        <p className="text-sm text-red-500">
                          {errors.newPassword.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="confirmPassword"
                        className="text-sm font-medium text-slate-700 dark:text-slate-300"
                      >
                        Confirmar Nova Senha
                      </Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          {...registerField('confirmPassword')}
                          placeholder="Confirme sua nova senha"
                          className="border-slate-200 bg-slate-50 pr-10 dark:border-slate-700 dark:bg-slate-800"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4 text-slate-500" />
                          ) : (
                            <Eye className="h-4 w-4 text-slate-500" />
                          )}
                        </Button>
                      </div>
                      {errors.confirmPassword && (
                        <p className="text-sm text-red-500">
                          {errors.confirmPassword.message}
                        </p>
                      )}
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg transition-all duration-300 hover:from-emerald-700 hover:to-teal-700 hover:shadow-xl"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      Salvar Nova Senha
                    </Button>
                  </form>
                </CardContent>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="border-0 shadow-2xl sm:max-w-lg">
          <DialogHeader className="text-center">
            <DialogTitle className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-2xl font-bold text-transparent">
              Alterar Foto do Perfil
            </DialogTitle>
            <DialogDescription className="text-slate-600 dark:text-slate-400">
              Selecione uma nova foto ou arraste uma imagem para cá
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div
              className={`relative rounded-2xl border-2 border-dashed p-12 text-center transition-all duration-300 ${
                isDragOver
                  ? 'scale-105 border-blue-400 bg-blue-50 dark:bg-blue-950/20'
                  : 'border-slate-300 hover:border-blue-300 dark:border-slate-600 dark:hover:border-blue-500'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              {previewUrl ? (
                <div className="space-y-6">
                  <div className="relative mx-auto h-40 w-40">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="h-full w-full rounded-full object-cover ring-4 ring-blue-200 dark:ring-blue-800"
                    />
                    <div className="absolute inset-0 rounded-full bg-black/0 transition-all duration-300 hover:bg-black/10"></div>
                  </div>
                  <div className="space-y-2">
                    <p className="font-medium text-slate-700 dark:text-slate-300">
                      Foto selecionada
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {selectedFile?.name}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {(selectedFile?.size &&
                        (selectedFile.size / 1024 / 1024).toFixed(2)) ||
                        '0'}{' '}
                      MB
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900">
                    <Camera className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-lg font-medium text-slate-700 dark:text-slate-300">
                      Arraste uma foto aqui
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      ou clique para selecionar um arquivo
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      PNG, JPG, GIF até 10MB
                    </p>
                  </div>
                </div>
              )}

              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
            </div>

            <div className="space-y-3">
              <Label
                htmlFor="photo-upload"
                className="text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Ou selecione um arquivo do seu dispositivo
              </Label>
              <Input
                id="photo-upload"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="file:mr-4 file:rounded-full file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-300 dark:hover:file:bg-blue-800"
              />
            </div>
          </div>

          <DialogFooter className="gap-3">
            <Button
              variant="outline"
              onClick={handleCancelPhoto}
              className="flex-1 border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
            <Button
              onClick={handleSavePhoto}
              disabled={!selectedFile}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transition-all duration-300 hover:from-blue-700 hover:to-purple-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save className="mr-2 h-4 w-4" />
              Salvar Foto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
