'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Button,
  Input,
  Label,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@medichainlk/ui';
import { useTenants } from '@/hooks/useTenants';
import { useInviteUser } from '@/hooks/useUsers';

const schema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'At least 8 characters'),
  role: z.enum(['system_admin', 'pharmacy_admin', 'pharmacy_staff', 'customer']),
  tenantId: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
}

export function InviteUserModal({ open, onClose }: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const { data: tenantsData } = useTenants();
  const tenants = tenantsData?.data ?? [];
  const inviteUser = useInviteUser();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const selectedRole = watch('role');

  const onSubmit = async (data: FormData) => {
    try {
      await inviteUser.mutateAsync(data);
      reset();
      onClose();
    } catch (err: unknown) {
      // Error displayed via inviteUser.error below
      console.error(err);
    }
  };

  const handleClose = () => {
    reset();
    inviteUser.reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite New User</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="firstName">First name</Label>
              <Input id="firstName" {...register('firstName')} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="lastName">Last name</Label>
              <Input id="lastName" {...register('lastName')} />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="inv-email">Email</Label>
            <Input id="inv-email" type="email" {...register('email')} aria-invalid={!!errors.email} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="inv-password">Temporary password</Label>
            <div className="relative">
              <Input
                id="inv-password"
                type={showPassword ? 'text' : 'password'}
                className="pr-10"
                {...register('password')}
                aria-invalid={!!errors.password}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="inv-role">Role</Label>
            <select
              id="inv-role"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
              {...register('role')}
            >
              <option value="">Select role…</option>
              <option value="system_admin">System Admin</option>
              <option value="pharmacy_admin">Pharmacy Admin</option>
              <option value="pharmacy_staff">Pharmacy Staff</option>
              <option value="customer">Customer</option>
            </select>
            {errors.role && <p className="text-xs text-destructive">{errors.role.message}</p>}
          </div>

          {(selectedRole === 'pharmacy_admin' || selectedRole === 'pharmacy_staff') && (
            <div className="space-y-1">
              <Label htmlFor="inv-tenant">Pharmacy (Tenant)</Label>
              <select
                id="inv-tenant"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                {...register('tenantId')}
              >
                <option value="">Select pharmacy…</option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          )}

          {inviteUser.error && (
            <p className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2">
              {(inviteUser.error as { message?: string })?.message ?? 'Failed to invite user.'}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Inviting…' : 'Invite'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
