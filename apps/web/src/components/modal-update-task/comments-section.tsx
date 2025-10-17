import { createTaskComment } from '@/services/task/comments'
import { useUserStore } from '@/stores/user-store'
import data from '@emoji-mart/data'
import i18n from '@emoji-mart/data/i18n/pt.json'
import Picker from '@emoji-mart/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { Send } from 'lucide-react'
import { useLayoutEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Skeleton } from '../ui/skeleton'

type Props = {
  taskId: string
  commentsData: any
  isLoadingComments: boolean
  activeTab: string
  isModalOpen: boolean
}

export function CommentsSection({
  taskId,
  commentsData,
  isLoadingComments,
  activeTab,
  isModalOpen,
}: Props) {
  const [newComment, setNewComment] = useState('')
  const [isEmojiOpen, setIsEmojiOpen] = useState(false)
  const commentsContainerRef = useRef<HTMLDivElement | null>(null)
  const commentsEndRef = useRef<HTMLDivElement | null>(null)
  const commentInputRef = useRef<HTMLInputElement | null>(null)

  const { user } = useUserStore()
  const queryClient = useQueryClient()

  const createCommentMutation = useMutation({
    mutationFn: (content: string) => createTaskComment(taskId, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-comments', taskId] })
      setNewComment('')
      toast.success('Comentário adicionado com sucesso!')
      setTimeout(() => {
        if (commentsEndRef.current) {
          try {
            commentsEndRef.current.scrollIntoView({
              behavior: 'smooth',
              block: 'end',
            })
          } catch (_) {
            if (commentsContainerRef.current) {
              commentsContainerRef.current.scrollTop =
                commentsContainerRef.current.scrollHeight
            }
          }
        }
      }, 0)
    },
    onError: error => {
      if (error instanceof AxiosError) {
        switch (error.response?.status) {
          case 401:
            console.error('Comentário inválido')
            break
          case 404:
            toast.error('Tarefa não encontrada')
            break
        }
        toast.error('Algo deu errado, tente novamente mais tarde')
      } else {
        toast.error('Algo deu errado, tente novamente mais tarde')
      }
    },
  })

  useLayoutEffect(() => {
    if (activeTab !== 'comments') return
    const scrollToBottom = () => {
      if (commentsEndRef.current) {
        try {
          commentsEndRef.current.scrollIntoView({
            behavior: 'auto',
            block: 'end',
          })
          return
        } catch (_) {
          console.log('Error scrolling to bottom')
        }
      }
      if (commentsContainerRef.current) {
        commentsContainerRef.current.scrollTop =
          commentsContainerRef.current.scrollHeight
      }
    }
    const id = setTimeout(scrollToBottom, 0)
    return () => clearTimeout(id)
  }, [activeTab, isModalOpen, isLoadingComments, commentsData?.data?.length])

  const handleAddComment = () => {
    if (newComment.trim()) {
      createCommentMutation.mutate(newComment.trim())
    }
  }

  const handleEmojiSelect = (emoji: { native: string }) => {
    const input = commentInputRef.current
    const emojiChar = emoji?.native || ''
    if (!input) {
      setNewComment(prev => prev + emojiChar)
      setIsEmojiOpen(false)
      return
    }
    const start = input.selectionStart ?? newComment.length
    const end = input.selectionEnd ?? newComment.length
    const before = newComment.slice(0, start)
    const after = newComment.slice(end)
    const next = `${before}${emojiChar}${after}`
    setNewComment(next)
    requestAnimationFrame(() => {
      input.focus()
      const caretPos = start + emojiChar.length
      input.setSelectionRange(caretPos, caretPos)
    })
    setIsEmojiOpen(false)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div
        ref={commentsContainerRef}
        className="min-h-0 flex-1 space-y-3 overflow-y-auto"
      >
        {isLoadingComments ? (
          <div className="space-y-3 py-2">
            {[...Array(6)].map((_, idx) => (
              <div key={idx} className="flex gap-3 p-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-5 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : commentsData?.data?.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">Nenhum comentário ainda</p>
          </div>
        ) : (
          commentsData?.data
            ?.sort(
              (a: any, b: any) =>
                new Date(a.createdAt).getTime() -
                new Date(b.createdAt).getTime(),
            )
            .map((comment: any) => {
              const isCurrentUser = user?.email === comment.user.email

              return (
                <div
                  key={comment.id}
                  className={`flex gap-3 rounded-lg p-3 ${
                    isCurrentUser ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage
                      src={comment.user?.avatar || ''}
                      alt={comment.user?.name || 'Usuário'}
                    />
                    <AvatarFallback className="text-xs">
                      {(comment.user?.name || 'U').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={`min-w-0 flex-1 ${isCurrentUser ? 'text-right' : 'text-left'}`}
                  >
                    <div
                      className={`mb-1 flex items-center gap-2 ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      <span className="text-sm font-medium">
                        {comment.user?.name || 'Usuário'}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {new Date(comment.createdAt).toLocaleDateString(
                          'pt-BR',
                          {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          },
                        )}
                      </span>
                    </div>
                    <div
                      className={`rounded-lg p-2 ${
                        isCurrentUser
                          ? 'bg-primary text-primary-foreground ml-auto'
                          : 'bg-muted/30'
                      }`}
                    >
                      <p className="text-sm">{comment.content}</p>
                    </div>
                  </div>
                </div>
              )
            })
        )}
        <div ref={commentsEndRef} />
      </div>

      <div className="flex-shrink-0 space-y-2 border-t pt-4">
        <Label htmlFor="new-comment">Adicionar comentário</Label>
        <div className="relative flex items-start gap-2">
          <Input
            id="new-comment"
            placeholder="Digite seu comentário..."
            ref={commentInputRef}
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleAddComment()
              }
            }}
            disabled={createCommentMutation.isPending}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsEmojiOpen(prev => !prev)}
            disabled={createCommentMutation.isPending}
          >
            😊
          </Button>
          {isEmojiOpen && (
            <div className="absolute right-0 bottom-12 z-[70]">
              <Picker
                data={data}
                onEmojiSelect={handleEmojiSelect}
                i18n={i18n as any}
                previewPosition="none"
                theme="dark"
                set="native"
              />
            </div>
          )}
          <Button
            type="button"
            onClick={handleAddComment}
            disabled={!newComment.trim() || createCommentMutation.isPending}
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
