import { Input } from '@/components/ui/input'
import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'

interface PasswordInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string
}

export function PasswordInput({ id, ...props }: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false)

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  return (
    <div className="relative">
      <Input
        id={id}
        type={showPassword ? 'text' : 'password'}
        {...props}
        className="pr-10"
      />
      <button
        type="button"
        onClick={togglePasswordVisibility}
        className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
        aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
      >
        {showPassword ? (
          <EyeOff className="h-4 w-4" />
        ) : (
          <Eye className="h-4 w-4" />
        )}
      </button>
    </div>
  )
}
