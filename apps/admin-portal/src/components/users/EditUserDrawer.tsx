'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input, Label } from '@medichainlk/ui';
import { useTenants } from '@/hooks/useTenants';
import {
  useUpdateUser,
  useDeactivateUser,
  useReactivateUser,
  useDeleteUser,
  type User,
} from '@/hooks/useUsers';

const SL_DISTRICTS = [
  'Ampara','Anuradhapura','Badulla','Batticaloa','Colombo','Galle','Gampaha',
  'Hambantota','Jaffna','Kalutara','Kandy','Kegalle','Kilinochchi','Kurunegala',
  'Mannar','Matale','Matara','Monaragala','Mullaitivu','Nuwara Eliya','Polonnaruwa',
  'Puttalam','Ratnapura','Trincomalee','Vavuniya',
];

const schema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  role: z.enum(['system_admin', 'pharmacy_staff', 'customer']).optional(),
  tenantId: z.string().optional(),
  nic: z.string().optional(),
  birthday: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  height: z.coerce.number().optional(),
  weight: z.coerce.number().optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  addressLine3: z.string().optional(),
  district: z.string().optional(),
  postalCode: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  user: User | null;
  open: boolean;
  onClose: () => void;
}

export function EditUserDrawer({ user, open, onClose }: Props) {
  const { data: tenants } = useTenants();
  const updateUser = useUpdateUser();
  const deactivateUser = useDeactivateUser();
  const reactivateUser = useReactivateUser();
  const deleteUser = useDeleteUser();

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteEmail, setDeleteEmail] = useState('');
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (user) {
      reset({
        firstName: user.firstName ?? '',
        lastName: user.lastName ?? '',
        phone: user.phone ?? '',
        role: (user.role as 'system_admin' | 'pharmacy_staff' | 'customer') ?? 'customer',
        tenantId: user.tenantId ?? '',
        nic: user.nic ?? '',
        birthday: user.birthday ? user.birthday.split('T')[0] : '',
        gender: (user.gender as 'MALE' | 'FEMALE' | 'OTHER') ?? undefined,
        height: user.height ?? undefined,
        weight: user.weight ?? undefined,
        addressLine1: user.addressLine1 ?? '',
        addressLine2: user.addressLine2 ?? '',
        addressLine3: user.addressLine3 ?? '',
        district: user.district ?? '',
        postalCode: user.postalCode ?? '',
      });
    }
  }, [user, reset]);

  const selectedRole = watch('role');

  const onSubmit = async (data: FormData) => {
    if (!user) return;
    await updateUser.mutateAsync({ id: user.id, payload: data });
    onClose();
  };

  const handleDeactivate = async () => {
    if (!user) return;
    await deactivateUser.mutateAsync(user.id);
    setConfirmDeactivate(false);
    onClose();
  };

  const handleReactivate = async () => {
    if (!user) return;
    await reactivateUser.mutateAsync(user.id);
    onClose();
  };

  const handleDelete = async () => {
    if (!user || deleteEmail !== user.email) return;
    await deleteUser.mutateAsync(user.id);
    setConfirmDelete(false);
    onClose();
  };

  const handleClose = () => {
    reset();
    setConfirmDelete(false);
    setDeleteEmail('');
    setConfirmDeactivate(false);
    onClose();
  };

  if (!open || !user) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/40" onClick={handleClose} />

      {/* Drawer */}
      <aside className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-background border-l shadow-xl flex flex-col overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-semibold">Edit User</h2>
          <button
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Personal Info */}
          <section>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Personal Information
            </h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="ed-firstName">First name</Label>
                  <Input id="ed-firstName" {...register('firstName')} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="ed-lastName">Last name</Label>
                  <Input id="ed-lastName" {...register('lastName')} />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="ed-phone">Phone</Label>
                <Input id="ed-phone" type="tel" {...register('phone')} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="ed-nic">NIC</Label>
                <Input id="ed-nic" {...register('nic')} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="ed-birthday">Date of birth</Label>
                  <Input id="ed-birthday" type="date" {...register('birthday')} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="ed-gender">Gender</Label>
                  <select
                    id="ed-gender"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    {...register('gender')}
                  >
                    <option value="">—</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="ed-height">Height (cm)</Label>
                  <Input id="ed-height" type="number" step="0.1" {...register('height')} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="ed-weight">Weight (kg)</Label>
                  <Input id="ed-weight" type="number" step="0.1" {...register('weight')} />
                </div>
              </div>
            </div>
          </section>

          {/* Address */}
          <section>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Address
            </h3>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="ed-addr1">Address line 1</Label>
                <Input id="ed-addr1" {...register('addressLine1')} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="ed-addr2">Address line 2</Label>
                <Input id="ed-addr2" {...register('addressLine2')} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="ed-addr3">Address line 3</Label>
                <Input id="ed-addr3" {...register('addressLine3')} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="ed-district">District</Label>
                  <select
                    id="ed-district"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    {...register('district')}
                  >
                    <option value="">—</option>
                    {SL_DISTRICTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="ed-postal">Postal code</Label>
                  <Input id="ed-postal" {...register('postalCode')} />
                </div>
              </div>
            </div>
          </section>

          {/* Account Settings */}
          <section>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Account Settings
            </h3>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="ed-role">Role</Label>
                <select
                  id="ed-role"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  {...register('role')}
                >
                  <option value="system_admin">System Admin</option>
                  <option value="pharmacy_staff">Pharmacy Staff</option>
                  <option value="customer">Customer</option>
                </select>
                {errors.role && <p className="text-xs text-destructive">{errors.role.message}</p>}
              </div>

              {selectedRole === 'pharmacy_staff' && (
                <div className="space-y-1">
                  <Label htmlFor="ed-tenant">Pharmacy (Tenant)</Label>
                  <select
                    id="ed-tenant"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    {...register('tenantId')}
                  >
                    <option value="">—</option>
                    {tenants?.map((t: { id: string; name: string }) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </section>

          {(updateUser.error) && (
            <p className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2">
              Failed to save changes. Please try again.
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting || !isDirty}>
              {isSubmitting ? 'Saving…' : 'Save changes'}
            </Button>
          </div>

          {/* Danger Zone */}
          <section className="border border-destructive/40 rounded-lg p-4 space-y-3">
            <h3 className="text-sm font-semibold text-destructive uppercase tracking-wide">
              Danger Zone
            </h3>

            {user.isActive ? (
              <>
                {!confirmDeactivate ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-destructive/40 text-destructive hover:bg-destructive/10"
                    onClick={() => setConfirmDeactivate(true)}
                  >
                    Deactivate Account
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      This will prevent the user from signing in. You can reactivate later.
                    </p>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" className="flex-1" onClick={() => setConfirmDeactivate(false)}>
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        className="flex-1"
                        onClick={handleDeactivate}
                        disabled={deactivateUser.isPending}
                      >
                        {deactivateUser.isPending ? 'Deactivating…' : 'Confirm Deactivate'}
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleReactivate}
                disabled={reactivateUser.isPending}
              >
                {reactivateUser.isPending ? 'Reactivating…' : 'Reactivate Account'}
              </Button>
            )}

            {!confirmDelete ? (
              <Button
                type="button"
                variant="destructive"
                className="w-full"
                onClick={() => setConfirmDelete(true)}
              >
                Delete Account Permanently
              </Button>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Type <span className="font-mono font-semibold">{user.email}</span> to confirm permanent deletion. This cannot be undone.
                </p>
                <Input
                  value={deleteEmail}
                  onChange={(e) => setDeleteEmail(e.target.value)}
                  placeholder="Type email to confirm"
                  className="border-destructive"
                />
                <div className="flex gap-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => { setConfirmDelete(false); setDeleteEmail(''); }}>
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    className="flex-1"
                    disabled={deleteEmail !== user.email || deleteUser.isPending}
                    onClick={handleDelete}
                  >
                    {deleteUser.isPending ? 'Deleting…' : 'Delete Forever'}
                  </Button>
                </div>
              </div>
            )}
          </section>
        </form>
      </aside>
    </>
  );
}
