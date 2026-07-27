'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { StarRating } from '@/components/shared/star-rating';

export interface ReviewFormValues {
  rating: number;
  comment?: string;
}

export function ReviewForm({
  onSubmit,
  isSubmitting,
}: {
  onSubmit: (values: ReviewFormValues) => void;
  isSubmitting: boolean;
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [touched, setTouched] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (rating === 0 || isSubmitting) return;
    onSubmit({ rating, comment: comment.trim() || undefined });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Your rating</Label>
        <div className="mt-1.5">
          <StarRating value={rating} onChange={setRating} size="lg" />
        </div>
        {touched && rating === 0 && <p className="mt-1.5 text-sm text-terracotta">Select a rating</p>}
      </div>
      <div>
        <Label htmlFor="review-comment">Comment (optional)</Label>
        <Textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="How did it go?"
          maxLength={1000}
        />
      </div>
      <Button type="submit" isLoading={isSubmitting} className="w-full">
        Submit review
      </Button>
    </form>
  );
}
