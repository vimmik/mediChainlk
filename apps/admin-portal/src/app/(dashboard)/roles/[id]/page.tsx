'use client';

import { PageHeader } from '@/components/shared/PageHeader';
import { RoleForm, type RoleFormValues } from '@/components/roles/RoleForm';
import { useRole, useUpdateRole } from '@/hooks/useRoles';
import { Loader2 } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

export default function EditRolePage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const { data: role, isLoading, error } = useRole(id);
  const updateRole = useUpdateRole(id);
  const [serverError, setServerError] = useState('');

  const onSubmit = async (values: RoleFormValues) => {
    setServerError('');
    try {
      await updateRole.mutateAsync({
        name: values.name,
        description: values.description || undefined,
        permissionIds: values.permissionIds,
        isActive: values.isActive,
      });
      router.push('/roles');
    } catch (err: unknown) {
      type ApiError = { response?: { data?: { error?: string; message?: string } } };
      const body = (err as ApiError)?.response?.data;
      setServerError(body?.error ?? body?.message ?? 'Failed to update role');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-slate-400">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading role…
      </div>
    );
  }

  if (error || !role) {
    return (
      <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
        {error instanceof Error ? error.message : 'Role not found'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={role.name}
        breadcrumbs={[
          { label: 'Roles', href: '/roles' },
          { label: role.name },
        ]}
        description={
          role.isSystem
            ? 'System role — name and scope are immutable; permissions can be edited by system_admin.'
            : 'Edit the role’s name, description, status, and permissions.'
        }
      />

      <RoleForm
        initial={role}
        isEdit
        submitting={updateRole.isPending}
        serverError={serverError}
        onSubmit={onSubmit}
        onCancel={() => router.push('/roles')}
      />
    </div>
  );
}
