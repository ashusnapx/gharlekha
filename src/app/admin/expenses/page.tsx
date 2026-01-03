"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Trash2, Edit } from "lucide-react";
import {
  Button,
  Input,
  Select,
  Textarea,
  Card,
  CardContent,
  Badge,
  Spinner,
  EmptyState,
  Modal,
  ConfirmDialog,
  useToast,
} from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { CONFIG } from "@/config/config";
import { expenseSchema } from "@/lib/validators";
import type { Expense } from "@/types";

const categoryOptions = CONFIG.expenses.categories.map((c) => ({
  value: c.value,
  label: c.label,
}));

export default function ExpensesPage() {
  const { addToast } = useToast();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    category: "maintenance" as const,
    description: "",
    amount: "",
    flat_number: "",
    tenant_id: "",
  });

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("expenses")
        .select("*")
        .order("date", { ascending: false });

      setExpenses(data || []);
    } catch (error) {
      console.error("Error loading data:", error);
      addToast({ type: "error", title: "Failed to load expenses" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (expense?: Expense) => {
    if (expense) {
      setEditingExpense(expense);
      setFormData({
        date: expense.date,
        category: expense.category as typeof formData.category,
        description: expense.description,
        amount: expense.amount.toString(),
        flat_number: expense.flat_number || "",
        tenant_id: expense.tenant_id || "",
      });
    } else {
      setEditingExpense(null);
      setFormData({
        date: new Date().toISOString().split("T")[0],
        category: "maintenance",
        description: "",
        amount: "",
        flat_number: "",
        tenant_id: "",
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = expenseSchema.safeParse({
      ...formData,
      amount: Number(formData.amount),
    });

    if (!result.success) {
      addToast({ type: "error", title: result.error.issues[0].message });
      return;
    }

    setIsSaving(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const expenseData = {
        date: formData.date,
        category: formData.category,
        description: formData.description,
        amount: Number(formData.amount),
        flat_number: formData.flat_number || null,
        tenant_id: formData.tenant_id || null,
        recorded_by: user?.id,
        landlord_id: user?.id,
      };

      if (editingExpense) {
        const { error } = await supabase
          .from("expenses")
          .update(expenseData)
          .eq("id", editingExpense.id);

        if (error) throw error;
        addToast({ type: "success", title: "Expense updated" });
      } else {
        const { error } = await supabase.from("expenses").insert(expenseData);

        if (error) throw error;
        addToast({ type: "success", title: "Expense added" });
      }

      setIsModalOpen(false);
      loadData();
    } catch (error) {
      console.error("Error saving expense:", error);
      addToast({ type: "error", title: "Failed to save expense" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("expenses")
        .delete()
        .eq("id", deleteId);

      if (error) throw error;

      setExpenses(expenses.filter((e) => e.id !== deleteId));
      addToast({ type: "success", title: "Expense deleted" });
    } catch (error) {
      console.error("Error deleting expense:", error);
      addToast({ type: "error", title: "Failed to delete expense" });
    } finally {
      setDeleteId(null);
    }
  };

  const filteredExpenses = expenses.filter(
    (e) =>
      e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.flat_number &&
        e.flat_number.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

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
          <h1 className='text-2xl font-bold text-gray-900'>Expenses</h1>
          <p className='text-gray-500'>
            Total: {formatCurrency(totalExpenses)}
          </p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className='h-4 w-4 mr-2' />
          Add Expense
        </Button>
      </div>

      {/* Search */}
      <div className='relative max-w-md'>
        <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
        <Input
          placeholder='Search expenses...'
          className='pl-10'
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Expenses List */}
      {filteredExpenses.length === 0 ? (
        <EmptyState
          title='No expenses found'
          description='Start tracking your property expenses'
          action={
            <Button onClick={() => handleOpenModal()}>
              <Plus className='h-4 w-4 mr-2' />
              Add Expense
            </Button>
          }
        />
      ) : (
        <Card>
          <CardContent className='py-0'>
            <div className='divide-y divide-gray-100'>
              {filteredExpenses.map((expense) => (
                <div
                  key={expense.id}
                  className='py-4 flex items-center justify-between'
                >
                  <div className='flex items-center gap-4'>
                    <div>
                      <div className='flex items-center gap-2'>
                        <span className='font-medium text-gray-900'>
                          {expense.description}
                        </span>
                        <Badge variant='outline'>{expense.category}</Badge>
                      </div>
                      <p className='text-sm text-gray-500'>
                        {formatDate(expense.date)}
                        {expense.flat_number &&
                          ` • Flat ${expense.flat_number}`}
                      </p>
                    </div>
                  </div>
                  <div className='flex items-center gap-4'>
                    <span className='font-semibold text-gray-900'>
                      {formatCurrency(expense.amount)}
                    </span>
                    <div className='flex gap-1'>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => handleOpenModal(expense)}
                      >
                        <Edit className='h-4 w-4' />
                      </Button>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => setDeleteId(expense.id)}
                      >
                        <Trash2 className='h-4 w-4 text-red-500' />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingExpense ? "Edit Expense" : "Add Expense"}
        size='md'
      >
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='grid grid-cols-2 gap-4'>
            <Input
              label='Date'
              type='date'
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
              required
            />
            <Select
              label='Category'
              options={categoryOptions}
              value={formData.category}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  category: e.target.value as typeof formData.category,
                })
              }
              required
            />
          </div>

          <Textarea
            label='Description'
            placeholder='What was this expense for?'
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            rows={2}
            required
          />

          <Input
            label='Amount'
            type='number'
            placeholder='1000'
            value={formData.amount}
            onChange={(e) =>
              setFormData({ ...formData, amount: e.target.value })
            }
            required
          />

          <Input
            label='Flat Number (optional)'
            placeholder='e.g., A-101'
            value={formData.flat_number}
            onChange={(e) =>
              setFormData({ ...formData, flat_number: e.target.value })
            }
          />

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
              {editingExpense ? "Update" : "Add"} Expense
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title='Delete Expense'
        message='Are you sure you want to delete this expense? This action cannot be undone.'
        confirmText='Delete'
      />
    </div>
  );
}
