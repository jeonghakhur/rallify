'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Trash2 } from 'lucide-react';
import { format, formatDistanceToNow, isToday } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

interface Comment {
  _key: string;
  author: {
    _ref: string;
    name: string;
    username: string;
    image?: string;
  };
  text: string;
  createdAt?: string;
}

interface CommentSectionProps {
  comments?: Comment[];
  currentUserId: string;
  currentUser?: {
    name: string;
    username: string;
    image?: string;
  };
  onAddComment: (comment: Comment) => Promise<void>;
  onRemoveComment: (commentKey: string) => Promise<void>;
  placeholder?: string;
  title?: string;
  readOnly?: boolean;
}

export default function CommentSection({
  comments = [],
  currentUserId,
  currentUser,
  onAddComment,
  onRemoveComment,
  placeholder = '코멘트를 입력하세요...',
  title = '',
  readOnly = false,
}: CommentSectionProps) {
  const [commentText, setCommentText] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const { toast } = useToast();

  const formatCommentDate = (dateString: string) => {
    const date = new Date(dateString);

    if (isToday(date)) {
      // 오늘 작성된 코멘트는 시간:분 형식
      return format(date, 'HH:mm', { locale: ko });
    } else {
      // 이전 날짜는 상대적 시간 형식
      return formatDistanceToNow(date, { addSuffix: true, locale: ko });
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) {
      toast({
        title: '코멘트를 입력해주세요.',
        variant: 'destructive',
        duration: 1500,
      });
      return;
    }

    setCommentLoading(true);
    try {
      await onAddComment({
        _key: crypto.randomUUID(),
        author: {
          _ref: currentUserId,
          name: currentUser?.name || '현재 사용자',
          username: currentUser?.username || 'current_user',
          ...(currentUser?.image && { image: currentUser.image }),
        },
        text: commentText.trim(),
        createdAt: new Date().toISOString(),
      });

      setCommentText('');
    } catch (error) {
      console.error(error);
      toast({
        title: '코멘트 추가 중 오류가 발생했습니다.',
        description: '잠시 후 다시 시도해주세요.',
        variant: 'destructive',
        duration: 2000,
      });
    } finally {
      setCommentLoading(false);
    }
  };

  const handleRemoveComment = async (commentKey: string) => {
    const isConfirmed = confirm('코멘트를 삭제하시겠습니까?');
    if (!isConfirmed) {
      return;
    }

    setCommentLoading(true);
    try {
      await onRemoveComment(commentKey);
    } catch (error) {
      console.error(error);
      toast({
        title: '코멘트 삭제 중 오류가 발생했습니다.',
        description: '잠시 후 다시 시도해주세요.',
        variant: 'destructive',
        duration: 2000,
      });
    } finally {
      setCommentLoading(false);
    }
  };

  return (
    <div className="mt-6 mb-10">
      <h3 className="text-lg font-bold text-gray-800 mb-3">{title}</h3>

      {/* 코멘트 입력 - 읽기 전용이 아닐 때만 표시 */}
      {!readOnly && (
        <div className="fixed bottom-0 left-0 right-0 bg-white p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAddComment();
            }}
            className="flex gap-2"
          >
            <Input
              placeholder={placeholder}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={commentLoading || !commentText.trim()}
              className="px-4"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}

      {/* 코멘트 목록 */}
      <div className="flex flex-col gap-2">
        {comments && comments.length > 0 ? (
          comments.map((comment: Comment) => (
            <div
              key={comment._key}
              className="border rounded-lg p-3 bg-gray-50"
            >
              <div className="flex justify-between items-center">
                <div className="flex-1 flex items-center gap-2">
                  <div className="w-8 h-8 !bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold overflow-hidden">
                    {comment.author?.image ? (
                      <Image
                        src={comment.author.image}
                        alt={comment.author?.name || 'profile'}
                        width={32}
                        height={32}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      comment.author?.name?.charAt(0) || '?'
                    )}
                  </div>
                  <div className="flex justify-between items-center flex-1">
                    <div className="">
                      <p className="text-sm font-medium text-gray-800">
                        {comment.author?.name || '알 수 없는 사용자'}
                      </p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {comment.text}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500">
                      {comment.createdAt &&
                        formatCommentDate(comment.createdAt)}
                    </p>
                  </div>
                </div>
                {/* 삭제 버튼 - 읽기 전용이 아니고 본인이 작성한 댓글일 때만 표시 */}
                {!readOnly && comment.author?._ref === currentUserId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveComment(comment._key)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-center py-4">
            {readOnly
              ? '아직 코멘트가 없습니다.'
              : '아직 코멘트가 없습니다. 첫 번째 코멘트를 남겨보세요!'}
          </p>
        )}
      </div>
    </div>
  );
}
