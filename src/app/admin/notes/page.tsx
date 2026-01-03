"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Trash2, Edit, Star, StarOff } from "lucide-react";
import {
  Button,
  Input,
  Textarea,
  Select,
  Card,
  CardContent,
  Badge,
  Spinner,
  EmptyState,
  Modal,
  ConfirmDialog,
  useToast,
} from "@/components/ui";
import { formatDate } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { Note, Tenant } from "@/types";

export default function NotesPage() {
  const { addToast } = useToast();

  const [notes, setNotes] = useState<Note[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    flat_number: "",
    tenant_id: "",
    is_important: false,
  });

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    try {
      const supabase = createClient();

      const [notesRes, tenantsRes] = await Promise.all([
        supabase
          .from("notes")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase.from("tenants").select("*").eq("is_active", true),
      ]);

      setNotes(notesRes.data || []);
      setTenants(tenantsRes.data || []);
    } catch (error) {
      console.error("Error loading data:", error);
      addToast({ type: "error", title: "Failed to load notes" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (note?: Note) => {
    if (note) {
      setEditingNote(note);
      setFormData({
        title: note.title,
        content: note.content,
        flat_number: note.flat_number || "",
        tenant_id: note.tenant_id || "",
        is_important: note.is_important,
      });
    } else {
      setEditingNote(null);
      setFormData({
        title: "",
        content: "",
        flat_number: "",
        tenant_id: "",
        is_important: false,
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.content.trim()) {
      addToast({ type: "error", title: "Title and content are required" });
      return;
    }

    setIsSaving(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const noteData = {
        title: formData.title,
        content: formData.content,
        flat_number: formData.flat_number || null,
        tenant_id: formData.tenant_id || null,
        is_important: formData.is_important,
        recorded_by: user?.id,
        landlord_id: user?.id,
      };

      if (editingNote) {
        const { error } = await supabase
          .from("notes")
          .update(noteData)
          .eq("id", editingNote.id);

        if (error) throw error;
        addToast({ type: "success", title: "Note updated" });
      } else {
        const { error } = await supabase.from("notes").insert(noteData);

        if (error) throw error;
        addToast({ type: "success", title: "Note added" });
      }

      setIsModalOpen(false);
      loadData();
    } catch (error) {
      console.error("Error saving note:", error);
      addToast({ type: "error", title: "Failed to save note" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("notes")
        .delete()
        .eq("id", deleteId);

      if (error) throw error;

      setNotes(notes.filter((n) => n.id !== deleteId));
      addToast({ type: "success", title: "Note deleted" });
    } catch (error) {
      console.error("Error deleting note:", error);
      addToast({ type: "error", title: "Failed to delete note" });
    } finally {
      setDeleteId(null);
    }
  };

  const toggleImportant = async (note: Note) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("notes")
        .update({ is_important: !note.is_important })
        .eq("id", note.id);

      if (error) throw error;

      setNotes(
        notes.map((n) =>
          n.id === note.id ? { ...n, is_important: !n.is_important } : n
        )
      );
    } catch (error) {
      console.error("Error updating note:", error);
    }
  };

  const filteredNotes = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (n.flat_number &&
        n.flat_number.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Sort: important first
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (a.is_important && !b.is_important) return -1;
    if (!a.is_important && b.is_important) return 1;
    return 0;
  });

  const tenantOptions = tenants.map((t) => ({
    value: t.id,
    label: `${t.full_name} (${t.flat_number})`,
  }));

  if (isLoading) {
    return (
      <div className='flex items-center justify-center py-20'>
        <Spinner size='lg' />
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>Notes</h1>
          <p className='text-gray-500'>{notes.length} notes</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className='h-4 w-4 mr-2' />
          Add Note
        </Button>
      </div>

      {/* Search */}
      <div className='relative max-w-md'>
        <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
        <Input
          placeholder='Search notes...'
          className='pl-10'
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Notes Grid */}
      {sortedNotes.length === 0 ? (
        <EmptyState
          title='No notes found'
          description='Add notes to keep track of important information'
          action={
            <Button onClick={() => handleOpenModal()}>
              <Plus className='h-4 w-4 mr-2' />
              Add Note
            </Button>
          }
        />
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {sortedNotes.map((note) => (
            <Card
              key={note.id}
              variant='bordered'
              className={
                note.is_important ? "border-yellow-300 bg-yellow-50" : ""
              }
            >
              <CardContent className='py-4'>
                <div className='flex items-start justify-between mb-2'>
                  <h3 className='font-medium text-gray-900'>{note.title}</h3>
                  <button
                    onClick={() => toggleImportant(note)}
                    className='text-yellow-500 hover:text-yellow-600'
                  >
                    {note.is_important ? (
                      <Star className='h-5 w-5 fill-current' />
                    ) : (
                      <StarOff className='h-5 w-5' />
                    )}
                  </button>
                </div>
                <p className='text-sm text-gray-600 mb-3 line-clamp-3'>
                  {note.content}
                </p>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    {note.flat_number && (
                      <Badge variant='outline'>Flat {note.flat_number}</Badge>
                    )}
                    <span className='text-xs text-gray-400'>
                      {formatDate(note.created_at)}
                    </span>
                  </div>
                  <div className='flex gap-1'>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => handleOpenModal(note)}
                    >
                      <Edit className='h-4 w-4' />
                    </Button>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => setDeleteId(note.id)}
                    >
                      <Trash2 className='h-4 w-4 text-red-500' />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingNote ? "Edit Note" : "Add Note"}
        size='md'
      >
        <form onSubmit={handleSubmit} className='space-y-4'>
          <Input
            label='Title'
            placeholder='Note title'
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            required
          />

          <Textarea
            label='Content'
            placeholder='Write your note here...'
            value={formData.content}
            onChange={(e) =>
              setFormData({ ...formData, content: e.target.value })
            }
            rows={4}
            required
          />

          <div className='grid grid-cols-2 gap-4'>
            <Input
              label='Flat Number (optional)'
              placeholder='e.g., A-101'
              value={formData.flat_number}
              onChange={(e) =>
                setFormData({ ...formData, flat_number: e.target.value })
              }
            />
            <Select
              label='Tenant (optional)'
              options={[
                { value: "", label: "Select tenant" },
                ...tenantOptions,
              ]}
              value={formData.tenant_id}
              onChange={(e) =>
                setFormData({ ...formData, tenant_id: e.target.value })
              }
            />
          </div>

          <label className='flex items-center gap-2 cursor-pointer'>
            <input
              type='checkbox'
              checked={formData.is_important}
              onChange={(e) =>
                setFormData({ ...formData, is_important: e.target.checked })
              }
              className='rounded border-gray-300 text-indigo-600 focus:ring-indigo-500'
            />
            <span className='text-sm text-gray-700'>Mark as important</span>
          </label>

          <div className='flex gap-3 pt-4'>
            <Button
              type='button'
              variant='outline'
              className='flex-1'
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type='submit' className='flex-1' isLoading={isSaving}>
              {editingNote ? "Update" : "Add"} Note
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title='Delete Note'
        message='Are you sure you want to delete this note? This action cannot be undone.'
        confirmText='Delete'
      />
    </div>
  );
}
