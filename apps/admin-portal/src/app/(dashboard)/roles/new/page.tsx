'use client';

import { PageHeader } from '@/components/shared/PageHeader';
import { RoleForm, type RoleFormValues } from '@/components/roles/RoleForm';
import { useCreateRole } from '@/hooks/useRoles';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function NewRolePage() {
  const router = useRouter();
  const createRole = useCreateRole();
  const [serverError, setServerError] = useState('');

  const onSubmit = async (values: RoleFormValues) => {
    setServerError('');
    try {
      const created = await createRole.mutateAsync({
        name: values.name,
        description: values.description || undefined,
        scope: values.scope,
        tenantId: values.tenantId ?? undefined,
        permissionIds: values.permissionIds,
        isActive: values.isActive,
      });
      router.push(`/roles/${created.id}`);
    } catch (err: unknown) {
      type ApiError = { response?: { data?: { error?: string; message?: string } } };
      const body = (err as ApiError)?.response?.data;
      setServerError(body?.error ?? body?.message ?? 'Failed to create role');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Role"
        breadcrumbs={[{ label: 'Roles', href: '/roles' }, { label: 'New Role' }]}
        description="Define a custom role and assign the screens it can access"
      />
      <RoleForm
        submitting={createRole.isPending}
        serverError={serverError}
        onSubmit={onSubmit}
        onCancel={() => router.push('/roles')}
      />
    </div>
  );
}
