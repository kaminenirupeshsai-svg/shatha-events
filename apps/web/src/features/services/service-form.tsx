'use client';

import { useState } from 'react';
import { useForm, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CreateServiceInputSchema,
  SERVICE_CATEGORY_LABELS,
  ServiceCategorySchema,
  type CreateServiceInput,
} from '@app/shared';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface ServiceFormValues extends CreateServiceInput {
  isActive?: boolean;
}

export interface ServiceFormProps {
  defaultValues?: Partial<ServiceFormValues>;
  onSubmit: (values: ServiceFormValues) => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  showActiveToggle?: boolean;
}

export function ServiceForm({
  defaultValues,
  onSubmit,
  isSubmitting,
  submitLabel = 'Save service',
  showActiveToggle = false,
}: ServiceFormProps) {
  const {
    register,
    handleSubmit,
    setFocus,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateServiceInput>({
    resolver: zodResolver(CreateServiceInputSchema),
    mode: 'onBlur',
    defaultValues: {
      title: defaultValues?.title ?? '',
      category: defaultValues?.category ?? 'decor_styling',
      description: defaultValues?.description ?? '',
      priceRange: defaultValues?.priceRange ?? { min: 0, max: 0 },
    },
  });

  void watch;
  const [isActive, setIsActive] = useState(defaultValues?.isActive ?? true);

  const onInvalid = (formErrors: FieldErrors<CreateServiceInput>) => {
    const first = Object.keys(formErrors)[0];
    if (first === 'priceRange') {
      setFocus('priceRange.max');
    } else if (first) {
      setFocus(first as keyof CreateServiceInput);
    }
  };

  const submit = handleSubmit((values) => {
    onSubmit({ ...values, isActive });
  }, onInvalid);

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input id="title" invalid={Boolean(errors.title)} {...register('title')} />
        {errors.title && <p className="mt-1.5 text-sm text-terracotta">{errors.title.message}</p>}
      </div>

      <div>
        <Label htmlFor="category">Category</Label>
        <Select
          defaultValue={defaultValues?.category ?? 'decor_styling'}
          onValueChange={(value) => setValue('category', value as CreateServiceInput['category'], { shouldValidate: true })}
        >
          <SelectTrigger id="category" invalid={Boolean(errors.category)}>
            <SelectValue placeholder="Choose a category" />
          </SelectTrigger>
          <SelectContent>
            {ServiceCategorySchema.options.map((category) => (
              <SelectItem key={category} value={category}>
                {SERVICE_CATEGORY_LABELS[category]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="priceMin">Minimum price (USD)</Label>
          <Input
            id="priceMin"
            type="number"
            min={0}
            invalid={Boolean(errors.priceRange?.min)}
            {...register('priceRange.min', { valueAsNumber: true })}
          />
          {errors.priceRange?.min && (
            <p className="mt-1.5 text-sm text-terracotta">{errors.priceRange.min.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="priceMax">Maximum price (USD)</Label>
          <Input
            id="priceMax"
            type="number"
            min={0}
            invalid={Boolean(errors.priceRange?.max)}
            {...register('priceRange.max', { valueAsNumber: true })}
          />
          {errors.priceRange?.max && (
            <p className="mt-1.5 text-sm text-terracotta">{errors.priceRange.max.message}</p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" invalid={Boolean(errors.description)} {...register('description')} />
        {errors.description && <p className="mt-1.5 text-sm text-terracotta">{errors.description.message}</p>}
      </div>

      {showActiveToggle && (
        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 rounded border-line text-emerald focus-visible:ring-2 focus-visible:ring-amber"
          />
          Listing is active and visible to clients
        </label>
      )}

      <Button type="submit" className="w-full" isLoading={isSubmitting}>
        {submitLabel}
      </Button>
    </form>
  );
}
