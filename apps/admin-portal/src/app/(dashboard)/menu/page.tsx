'use client';

import { MenuItemForm, type MenuFormSubmit } from '@/components/menu/MenuItemForm';
import { PageHeader } from '@/components/shared/PageHeader';
import {
  useCreateMenuItem,
  useDeleteMenuItem,
  useFullMenu,
  useReorderMenu,
  useUpdateMenuItem,
  type MenuChildNode,
  type MenuItemType,
  type MenuParentNode,
  type MenuScreenNode,
} from '@/hooks/useMenu';
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@medichainlk/ui';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ChevronDown,
  FileText,
  FolderTree,
  GripVertical,
  Layers,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';

// ─── Dialog state ────────────────────────────────────────────────────────────

type DialogState =
  | { mode: 'closed' }
  | { mode: 'add'; type: MenuItemType; parentId?: string; parentLabel?: string }
  | {
      mode: 'edit';
      type: MenuItemType;
      id: string;
      initial: { label: string; icon?: string | null; route?: string | null; permissionId?: string | null };
    };

const TYPE_LABEL: Record<MenuItemType, string> = {
  parent: 'Parent Menu',
  child: 'Child Menu',
  screen: 'Screen',
};

// dnd-kit sortable IDs are namespaced by level so a parent and a screen can
// never share an ID and a drag can never cross between sortable contexts.
const pid = (id: string) => `parent:${id}`;
const cid = (id: string) => `child:${id}`;
const sid = (id: string) => `screen:${id}`;
const stripId = (sortableId: string) => sortableId.split(':')[1];

export default function MenuManagementPage() {
  const { data: tree = [], isLoading } = useFullMenu();
  const createItem = useCreateMenuItem();
  const updateItem = useUpdateMenuItem();
  const deleteItem = useDeleteMenuItem();
  const reorder = useReorderMenu();

  const [dialog, setDialog] = useState<DialogState>({ mode: 'closed' });
  const [serverError, setServerError] = useState('');
  // Tracks the row being dragged so we can render a DragOverlay clone.
  const [activeDrag, setActiveDrag] = useState<{ label: string; level: MenuItemType } | null>(null);

  // A small activation distance means a quick click on edit/delete still fires
  // as a click — the drag only starts once the pointer travels 6px.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const totals = {
    parents: tree.length,
    children: tree.reduce((n, p) => n + p.children.length, 0),
    screens: tree.reduce((n, p) => n + p.children.reduce((m, c) => m + c.screens.length, 0), 0),
  };

  // ─── Drag handlers ────────────────────────────────────────────────────────
  // Each SortableContext is one sibling group, so `over` and `active` are
  // always within the same parent — reorder can never move an item across
  // branches. We just compute the new order and POST it.

  const onDragStart = (e: DragStartEvent) => {
    const idStr = String(e.active.id);
    const [level, rawId] = idStr.split(':') as [MenuItemType, string];
    let label = '';
    if (level === 'parent') {
      label = tree.find((p) => p.id === rawId)?.label ?? '';
    } else if (level === 'child') {
      for (const p of tree) {
        const c = p.children.find((c) => c.id === rawId);
        if (c) { label = c.label; break; }
      }
    } else {
      for (const p of tree) {
        for (const c of p.children) {
          const s = c.screens.find((s) => s.id === rawId);
          if (s) { label = s.label; break; }
        }
      }
    }
    setActiveDrag({ label, level });
  };

  const onDragEnd = async (e: DragEndEvent) => {
    setActiveDrag(null);
    const { active, over } = e;
    if (!over || active.id === over.id) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    const [level] = activeId.split(':') as [MenuItemType];

    // Find the sibling list this drag belongs to.
    let siblings: { id: string }[] | null = null;

    if (level === 'parent') {
      siblings = tree.map((p) => ({ id: p.id }));
    } else if (level === 'child') {
      const rawActive = stripId(activeId);
      const parent = tree.find((p) => p.children.some((c) => c.id === rawActive));
      if (parent) siblings = parent.children.map((c) => ({ id: c.id }));
    } else {
      const rawActive = stripId(activeId);
      for (const p of tree) {
        const child = p.children.find((c) => c.screens.some((s) => s.id === rawActive));
        if (child) { siblings = child.screens.map((s) => ({ id: s.id })); break; }
      }
    }
    if (!siblings) return;

    const oldIndex = siblings.findIndex((s) => s.id === stripId(activeId));
    const newIndex = siblings.findIndex((s) => s.id === stripId(overId));
    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

    const reordered = arrayMove(siblings, oldIndex, newIndex);
    try {
      await reorder.mutateAsync(reordered.map((s, i) => ({ id: s.id, sortOrder: i })));
    } catch (err) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      alert(msg ?? 'Failed to reorder');
    }
  };

  // ─── CRUD handlers ────────────────────────────────────────────────────────

  const handleDelete = async (id: string, label: string, childCount: number) => {
    if (childCount > 0) {
      alert(`Cannot delete "${label}" — it has ${childCount} child item(s). Delete those first.`);
      return;
    }
    if (!confirm(`Delete "${label}"?`)) return;
    try {
      await deleteItem.mutateAsync(id);
    } catch (err) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      alert(msg ?? 'Failed to delete');
    }
  };

  const closeDialog = () => {
    setDialog({ mode: 'closed' });
    setServerError('');
  };

  const handleSubmit = async (values: MenuFormSubmit) => {
    setServerError('');
    try {
      if (dialog.mode === 'add') {
        await createItem.mutateAsync({
          type: dialog.type,
          label: values.label,
          icon: values.icon,
          parentId: dialog.parentId,
          route: values.route,
          permissionId: values.permissionId,
          newPermission: values.newPermission,
        });
      } else if (dialog.mode === 'edit') {
        await updateItem.mutateAsync({
          id: dialog.id,
          payload: {
            label: values.label,
            icon: values.icon,
            route: values.route,
            permissionId: values.permissionId,
          },
        });
      }
      closeDialog();
    } catch (err) {
      const msg = (err as { response?: { data?: { error?: string; message?: string } } })?.response?.data;
      setServerError(msg?.error ?? msg?.message ?? 'Failed to save menu item');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Menu Management"
        description={`${totals.parents} parents · ${totals.children} children · ${totals.screens} screens`}
        action={
          <Button
            className="gap-2 glow-blue rounded-xl"
            onClick={() => setDialog({ mode: 'add', type: 'parent' })}
          >
            <Plus className="w-4 h-4" />
            New Parent Menu
          </Button>
        }
      />

      {/* Info banner */}
      <div className="rounded-xl border border-blue-500/20 bg-blue-500/[0.06] px-4 py-3 text-sm text-blue-600 dark:text-blue-400 flex items-start gap-2">
        <FolderTree className="w-4 h-4 mt-0.5 shrink-0" />
        <span>
          The menu is a 2-level tree: <strong>Parent → Child → Screen</strong>. Drag the{' '}
          <GripVertical className="w-3.5 h-3.5 inline -mt-0.5" /> handle to reorder items within the same
          group. Screens link to a permission — when adding a screen you can pick an existing permission or
          create a new one (saved to the DB atomically). Sidebars across the platform are driven by this tree.
        </span>
      </div>

      {isLoading ? (
        <div className="section-glass flex items-center gap-2 text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading menu tree…
        </div>
      ) : tree.length === 0 ? (
        <div className="section-glass text-center py-16">
          <FolderTree className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400 mb-4">No menu items yet.</p>
          <Button className="gap-2 rounded-xl glow-blue" onClick={() => setDialog({ mode: 'add', type: 'parent' })}>
            <Plus className="w-4 h-4" /> Create the first parent menu
          </Button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onDragCancel={() => setActiveDrag(null)}
        >
          {/* Parents — one SortableContext scope */}
          <SortableContext
            items={tree.map((p) => pid(p.id))}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {tree.map((parent) => (
                <ParentRow
                  key={parent.id}
                  parent={parent}
                  reordering={reorder.isPending}
                  onAddChild={() =>
                    setDialog({ mode: 'add', type: 'child', parentId: parent.id, parentLabel: parent.label })
                  }
                  onEdit={() =>
                    setDialog({
                      mode: 'edit',
                      type: 'parent',
                      id: parent.id,
                      initial: { label: parent.label, icon: parent.icon },
                    })
                  }
                  onDelete={() => handleDelete(parent.id, parent.label, parent.children.length)}
                  onAddScreen={(child) =>
                    setDialog({ mode: 'add', type: 'screen', parentId: child.id, parentLabel: child.label })
                  }
                  onEditChild={(child) =>
                    setDialog({
                      mode: 'edit',
                      type: 'child',
                      id: child.id,
                      initial: { label: child.label, icon: child.icon },
                    })
                  }
                  onDeleteChild={(child) => handleDelete(child.id, child.label, child.screens.length)}
                  onEditScreen={(screen) =>
                    setDialog({
                      mode: 'edit',
                      type: 'screen',
                      id: screen.id,
                      initial: {
                        label: screen.label,
                        route: screen.route,
                        permissionId: screen.permissionId,
                      },
                    })
                  }
                  onDeleteScreen={(screen) => handleDelete(screen.id, screen.label, 0)}
                />
              ))}
            </div>
          </SortableContext>

          {/* Floating clone of whatever's being dragged */}
          <DragOverlay>
            {activeDrag ? (
              <div className="section-glass !py-2 !px-3 flex items-center gap-2 shadow-2xl ring-2 ring-violet-500/40">
                <GripVertical className="w-4 h-4 text-violet-500" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  {activeDrag.label}
                </span>
                <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-violet-500/10 text-violet-500 font-semibold">
                  {activeDrag.level}
                </span>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Add / Edit dialog */}
      <Dialog open={dialog.mode !== 'closed'} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {dialog.mode === 'add'
                ? `New ${TYPE_LABEL[dialog.type]}`
                : dialog.mode === 'edit'
                  ? `Edit ${TYPE_LABEL[dialog.type]}`
                  : ''}
              {dialog.mode === 'add' && dialog.parentLabel && (
                <span className="text-sm font-normal text-slate-400"> under “{dialog.parentLabel}”</span>
              )}
            </DialogTitle>
          </DialogHeader>
          {dialog.mode !== 'closed' && (
            <MenuItemForm
              type={dialog.type}
              isEdit={dialog.mode === 'edit'}
              initial={dialog.mode === 'edit' ? dialog.initial : undefined}
              submitting={createItem.isPending || updateItem.isPending}
              serverError={serverError}
              onSubmit={handleSubmit}
              onCancel={closeDialog}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Parent row (sortable) ───────────────────────────────────────────────────

function ParentRow({
  parent,
  reordering,
  onAddChild,
  onEdit,
  onDelete,
  onAddScreen,
  onEditChild,
  onDeleteChild,
  onEditScreen,
  onDeleteScreen,
}: {
  parent: MenuParentNode;
  reordering: boolean;
  onAddChild: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddScreen: (child: MenuChildNode) => void;
  onEditChild: (child: MenuChildNode) => void;
  onDeleteChild: (child: MenuChildNode) => void;
  onEditScreen: (screen: MenuScreenNode) => void;
  onDeleteScreen: (screen: MenuScreenNode) => void;
}) {
  const [open, setOpen] = useState(true);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: pid(parent.id),
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="section-glass !p-0 overflow-hidden">
      {/* Parent header */}
      <div className="flex items-center gap-2 px-4 py-3">
        <DragHandle attributes={attributes} listeners={listeners} disabled={reordering} />
        <button onClick={() => setOpen((v) => !v)} className="text-slate-400 hover:text-slate-200">
          <ChevronDown className={`w-4 h-4 transition-transform ${open ? '' : '-rotate-90'}`} />
        </button>
        <Layers className="w-4 h-4 text-violet-500 shrink-0" />
        <span className="font-semibold text-slate-800 dark:text-slate-200">{parent.label}</span>
        <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-violet-500/10 text-violet-500 font-semibold">
          Parent
        </span>
        {parent.icon && <span className="text-xs text-slate-400 font-mono">{parent.icon}</span>}
        <span className="text-xs text-slate-400">· {parent.children.length} children</span>

        <div className="flex-1" />
        <IconBtn title="Add child menu" onClick={onAddChild}><Plus className="w-3.5 h-3.5" /></IconBtn>
        <IconBtn title="Edit parent" onClick={onEdit}><Pencil className="w-3.5 h-3.5" /></IconBtn>
        <IconBtn title="Delete parent" onClick={onDelete} danger><Trash2 className="w-3.5 h-3.5" /></IconBtn>
      </div>

      {/* Children — their own SortableContext scope */}
      {open && (
        <div className="border-t border-white/10 dark:border-white/5">
          {parent.children.length === 0 ? (
            <p className="px-12 py-3 text-xs text-slate-400">
              No child menus. Use the <Plus className="w-3 h-3 inline -mt-0.5" /> button above to add one.
            </p>
          ) : (
            <SortableContext
              items={parent.children.map((c) => cid(c.id))}
              strategy={verticalListSortingStrategy}
            >
              {parent.children.map((child) => (
                <ChildRow
                  key={child.id}
                  child={child}
                  reordering={reordering}
                  onAddScreen={() => onAddScreen(child)}
                  onEdit={() => onEditChild(child)}
                  onDelete={() => onDeleteChild(child)}
                  onEditScreen={onEditScreen}
                  onDeleteScreen={onDeleteScreen}
                />
              ))}
            </SortableContext>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Child row (sortable) ────────────────────────────────────────────────────

function ChildRow({
  child,
  reordering,
  onAddScreen,
  onEdit,
  onDelete,
  onEditScreen,
  onDeleteScreen,
}: {
  child: MenuChildNode;
  reordering: boolean;
  onAddScreen: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onEditScreen: (screen: MenuScreenNode) => void;
  onDeleteScreen: (screen: MenuScreenNode) => void;
}) {
  const [open, setOpen] = useState(true);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: cid(child.id),
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="border-t border-white/[0.04] first:border-t-0">
      {/* Child header */}
      <div className="flex items-center gap-2 px-4 py-2.5 pl-6 bg-white/[0.02]">
        <DragHandle attributes={attributes} listeners={listeners} disabled={reordering} small />
        <button onClick={() => setOpen((v) => !v)} className="text-slate-400 hover:text-slate-200">
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? '' : '-rotate-90'}`} />
        </button>
        <FolderTree className="w-3.5 h-3.5 text-blue-500 shrink-0" />
        <span className="font-medium text-slate-700 dark:text-slate-300 text-sm">{child.label}</span>
        <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-500 font-semibold">
          Child
        </span>
        <span className="text-xs text-slate-400">· {child.screens.length} screens</span>

        <div className="flex-1" />
        <IconBtn title="Add screen" onClick={onAddScreen}><Plus className="w-3.5 h-3.5" /></IconBtn>
        <IconBtn title="Edit child" onClick={onEdit}><Pencil className="w-3.5 h-3.5" /></IconBtn>
        <IconBtn title="Delete child" onClick={onDelete} danger><Trash2 className="w-3.5 h-3.5" /></IconBtn>
      </div>

      {/* Screens — their own SortableContext scope */}
      {open && (
        <div className="pl-14 pr-4 py-1">
          {child.screens.length === 0 ? (
            <p className="py-2 text-xs text-slate-400">No screens yet.</p>
          ) : (
            <SortableContext
              items={child.screens.map((s) => sid(s.id))}
              strategy={verticalListSortingStrategy}
            >
              {child.screens.map((screen) => (
                <ScreenRow
                  key={screen.id}
                  screen={screen}
                  reordering={reordering}
                  onEdit={() => onEditScreen(screen)}
                  onDelete={() => onDeleteScreen(screen)}
                />
              ))}
            </SortableContext>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Screen row (sortable) ───────────────────────────────────────────────────

function ScreenRow({
  screen,
  reordering,
  onEdit,
  onDelete,
}: {
  screen: MenuScreenNode;
  reordering: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: sid(screen.id),
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 py-1.5 border-b border-white/[0.03] last:border-b-0"
    >
      <DragHandle attributes={attributes} listeners={listeners} disabled={reordering} small />
      <FileText className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
      <span className="text-sm text-slate-700 dark:text-slate-300">{screen.label}</span>
      {screen.route && <code className="text-[11px] text-slate-400 font-mono">{screen.route}</code>}
      {screen.permissionCode ? (
        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono">
          {screen.permissionCode}
        </span>
      ) : (
        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-500 font-medium">
          no permission
        </span>
      )}

      <div className="flex-1" />
      <IconBtn title="Edit screen" onClick={onEdit}><Pencil className="w-3 h-3" /></IconBtn>
      <IconBtn title="Delete screen" onClick={onDelete} danger><Trash2 className="w-3 h-3" /></IconBtn>
    </div>
  );
}

// ─── Small shared bits ───────────────────────────────────────────────────────

function DragHandle({
  attributes,
  listeners,
  disabled,
  small,
}: {
  attributes: React.HTMLAttributes<HTMLButtonElement>;
  listeners: Record<string, unknown> | undefined;
  disabled?: boolean;
  small?: boolean;
}) {
  return (
    <button
      type="button"
      title="Drag to reorder"
      disabled={disabled}
      {...attributes}
      {...listeners}
      className={`${small ? 'h-6 w-5' : 'h-7 w-6'} inline-flex items-center justify-center rounded-md text-slate-400 hover:text-slate-200 hover:bg-white/5 cursor-grab active:cursor-grabbing disabled:opacity-30 disabled:cursor-not-allowed touch-none`}
    >
      <GripVertical className={small ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
    </button>
  );
}

function IconBtn({
  title,
  onClick,
  danger,
  children,
}: {
  title: string;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`h-7 w-7 inline-flex items-center justify-center rounded-lg transition-colors ${
        danger
          ? 'text-slate-400 hover:text-red-500 hover:bg-red-500/10'
          : 'text-slate-400 hover:text-violet-500 hover:bg-violet-500/10'
      }`}
    >
      {children}
    </button>
  );
}
