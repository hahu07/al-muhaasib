"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Gift, Calendar, CheckCircle, Clock, XCircle } from "lucide-react";
import {
  staffBonusService,
  type StaffBonus,
} from "@/services/staffFinancialService";
import { useToast } from "@/hooks/use-toast";
import type { StaffMember } from "@/types";

interface StaffBonusModalProps {
  open: boolean;
  onClose: () => void;
  staffMember: StaffMember;
}

export default function StaffBonusModal({
  open,
  onClose,
  staffMember,
}: StaffBonusModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [bonuses, setBonuses] = useState<StaffBonus[]>([]);
  const [showNewBonusForm, setShowNewBonusForm] = useState(false);
  const [editingBonus, setEditingBonus] = useState<StaffBonus | null>(null);
  const [filterStatus, setFilterStatus] = useState<
    "all" | "pending" | "paid" | "cancelled"
  >("all");

  const currentDate = new Date();
  const [formData, setFormData] = useState({
    amount: 0,
    reason: "",
    type: "performance" as "performance" | "holiday" | "special" | "other",
    month: currentDate.getMonth() + 1,
    year: currentDate.getFullYear(),
  });

  useEffect(() => {
    if (open) {
      loadBonuses();
    }
  }, [open]);

  const loadBonuses = async () => {
    setLoading(true);
    try {
      const staffBonuses = await staffBonusService.getByStaffId(staffMember.id);
      setBonuses(
        staffBonuses.sort(
          (a, b) =>
            new Date(Number(b.createdAt) / 1_000_000).getTime() - new Date(Number(a.createdAt) / 1_000_000).getTime(),
        ),
      );
    } catch (error) {
      console.error("Error loading bonuses:", error);
      toast({
        title: "Error",
        description: "Failed to load bonuses",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditBonus = (bonus: StaffBonus) => {
    setEditingBonus(bonus);
    setFormData({
      amount: bonus.amount,
      reason: bonus.reason,
      type: bonus.type,
      month: bonus.month,
      year: bonus.year,
    });
    setShowNewBonusForm(true);
  };

  const handleCreateBonus = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingBonus) {
        // Update existing bonus
        await staffBonusService.update(editingBonus.id, {
          amount: formData.amount,
          reason: formData.reason,
          type: formData.type,
          month: formData.month,
          year: formData.year,
          updatedAt: new Date().toISOString(),
        });

        toast({
          title: "Bonus Updated",
          description: `Bonus has been updated successfully`,
        });
      } else {
        // Create new bonus
        await staffBonusService.createBonus({
          staffId: staffMember.id,
          staffName: `${staffMember.firstname} ${staffMember.surname}`,
          staffNumber: staffMember.staffNumber,
          amount: formData.amount,
          reason: formData.reason,
          type: formData.type,
          month: formData.month,
          year: formData.year,
          status: "pending",
          approvedBy: "current-admin",
          approvedDate: new Date().toISOString(),
        });

        toast({
          title: "Bonus Created",
          description: `Bonus of ₦${formData.amount.toLocaleString()} has been approved`,
        });
      }

      setShowNewBonusForm(false);
      setEditingBonus(null);
      setFormData({
        amount: 0,
        reason: "",
        type: "performance",
        month: currentDate.getMonth() + 1,
        year: currentDate.getFullYear(),
      });
      loadBonuses();
    } catch (error) {
      console.error("Error saving bonus:", error);
      toast({
        title: "Error",
        description: editingBonus
          ? "Failed to update bonus"
          : "Failed to create bonus",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async (bonusId: string) => {
    try {
      await staffBonusService.markAsPaid(bonusId);
      toast({
        title: "Success",
        description: "Bonus marked as paid",
      });
      loadBonuses();
    } catch (error) {
      console.error("Error marking bonus as paid:", error);
      toast({
        title: "Error",
        description: "Failed to mark bonus as paid",
        variant: "destructive",
      });
    }
  };

  const handleCancelBonus = async (bonusId: string) => {
    try {
      await staffBonusService.cancelBonus(bonusId);
      toast({
        title: "Success",
        description: "Bonus cancelled",
      });
      loadBonuses();
    } catch (error) {
      console.error("Error cancelling bonus:", error);
      toast({
        title: "Error",
        description: "Failed to cancel bonus",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: StaffBonus["status"]) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "paid":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "cancelled":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: StaffBonus["status"]) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "paid":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getBonusTypeLabel = (type: StaffBonus["type"]) => {
    switch (type) {
      case "performance":
        return "Performance";
      case "holiday":
        return "Holiday";
      case "special":
        return "Special";
      case "other":
        return "Other";
      default:
        return type;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getMonthName = (month: number) => {
    return new Date(2000, month - 1).toLocaleString("default", {
      month: "long",
    });
  };

  const filteredBonuses = bonuses.filter((bonus) =>
    filterStatus === "all" ? true : bonus.status === filterStatus,
  );

  const totalBonuses = bonuses.reduce(
    (sum, bonus) => (bonus.status === "paid" ? sum + bonus.amount : sum),
    0,
  );

  const pendingBonuses = bonuses.filter((b) => b.status === "pending").length;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-5xl overflow-x-hidden overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Bonus Management - {staffMember.firstname} {staffMember.surname}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg border-2 border-green-200 bg-green-50 p-4 text-center shadow-sm dark:border-green-800 dark:bg-green-900/20">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Paid</p>
              <p className="mt-1 text-2xl font-bold text-green-700 dark:text-green-400">
                ₦{totalBonuses.toLocaleString()}
              </p>
            </div>
            <div className="rounded-lg border-2 border-yellow-200 bg-yellow-50 p-4 text-center shadow-sm dark:border-yellow-800 dark:bg-yellow-900/20">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Pending</p>
              <p className="mt-1 text-2xl font-bold text-yellow-700 dark:text-yellow-400">
                {pendingBonuses}
              </p>
            </div>
            <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4 text-center shadow-sm dark:border-blue-800 dark:bg-blue-900/20">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Bonuses</p>
              <p className="mt-1 text-2xl font-bold text-blue-700 dark:text-blue-400">
                {bonuses.length}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button
              onClick={() => setShowNewBonusForm(!showNewBonusForm)}
              disabled={loading}
              size="lg"
              className="w-full sm:w-auto"
            >
              <Gift className="mr-2 h-4 w-4" />
              {showNewBonusForm ? "Cancel" : "Create New Bonus"}
            </Button>
            <div className="flex gap-2">
              <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                Filter:
              </label>
              <Select
                value={filterStatus}
                onValueChange={(v) => setFilterStatus(v as 'all' | 'pending' | 'paid' | 'cancelled')}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">🕒 Pending</SelectItem>
                  <SelectItem value="paid">✓ Paid</SelectItem>
                  <SelectItem value="cancelled">✕ Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* New Bonus Form */}
          {showNewBonusForm && (
            <form
              onSubmit={handleCreateBonus}
              className="rounded-lg border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white p-6 shadow-md dark:border-blue-800 dark:from-blue-900/20 dark:to-gray-900"
            >
              <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-gray-100">
                <Gift className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                {editingBonus ? "Edit Bonus" : "Create New Bonus"}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount">Bonus Amount (₦) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    min="0"
                    step="1000"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        amount: parseFloat(e.target.value) || 0,
                      })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="type">Bonus Type *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(v) =>
                      setFormData({ ...formData, type: v as 'performance' | 'holiday' | 'special' | 'other' })
                    }
                  >
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="performance">Performance</SelectItem>
                      <SelectItem value="holiday">Holiday</SelectItem>
                      <SelectItem value="special">Special</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label htmlFor="reason">Reason *</Label>
                  <Textarea
                    id="reason"
                    value={formData.reason}
                    onChange={(e) =>
                      setFormData({ ...formData, reason: e.target.value })
                    }
                    placeholder="e.g., Exceptional sales performance in Q4, Holiday bonus, etc."
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="month">Month *</Label>
                  <Select
                    value={String(formData.month)}
                    onValueChange={(v) =>
                      setFormData({ ...formData, month: parseInt(v) })
                    }
                  >
                    <SelectTrigger id="month">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                        <SelectItem key={m} value={String(m)}>
                          {getMonthName(m)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="year">Year *</Label>
                  <Input
                    id="year"
                    type="number"
                    min="2020"
                    max="2099"
                    value={formData.year}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        year:
                          parseInt(e.target.value) || currentDate.getFullYear(),
                      })
                    }
                    required
                  />
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button type="submit" disabled={loading}>
                  {loading
                    ? editingBonus
                      ? "Updating..."
                      : "Creating..."
                    : editingBonus
                      ? "Update Bonus"
                      : "Create Bonus"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowNewBonusForm(false);
                    setEditingBonus(null);
                    setFormData({
                      amount: 0,
                      reason: "",
                      type: "performance",
                      month: currentDate.getMonth() + 1,
                      year: currentDate.getFullYear(),
                    });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {/* Bonus List */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b pb-2">
              <Calendar className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Bonus History
                <span className="ml-2 text-sm font-normal text-gray-600 dark:text-gray-400">
                  ({filteredBonuses.length} {filterStatus !== "all" && `${filterStatus} `}bonus{filteredBonuses.length !== 1 ? 'es' : ''})
                </span>
              </h3>
            </div>
            {filteredBonuses.length === 0 ? (
              <div className="py-12 text-center text-gray-500">
                <Gift className="mx-auto mb-4 h-12 w-12 opacity-50" />
                <p>No bonuses found</p>
              </div>
            ) : (
              filteredBonuses.map((bonus) => (
                <div
                  key={bonus.id}
                  className="rounded-lg border-2 border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-blue-300 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-700"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        {getStatusIcon(bonus.status)}
                        <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100">{bonus.reason}</h4>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Badge variant="outline" className="font-medium">
                          {getBonusTypeLabel(bonus.type)}
                        </Badge>
                        <span className="text-gray-600 dark:text-gray-400">•</span>
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          {getMonthName(bonus.month)} {bonus.year}
                        </span>
                      </div>
                      {bonus.paidDate && (
                        <p className="mt-1 text-xs text-gray-500">
                          Paid on:{" "}
                          {new Date(Number(bonus.paidDate) / 1_000_000).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="mb-2 text-3xl font-bold text-green-600 dark:text-green-400">
                        ₦{bonus.amount.toLocaleString()}
                      </p>
                      <Badge
                        className={`${getStatusColor(bonus.status)} border-2 px-3 py-1 text-xs font-bold uppercase`}
                        variant="secondary"
                      >
                        {bonus.status}
                      </Badge>
                    </div>
                  </div>

                  {/* Actions */}
                  {bonus.status === "pending" && (
                    <div className="mt-3 flex gap-2 border-t pt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditBonus(bonus)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleMarkAsPaid(bonus.id)}
                      >
                        <CheckCircle className="mr-1 h-4 w-4" />
                        Mark as Paid
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleCancelBonus(bonus.id)}
                      >
                        <XCircle className="mr-1 h-4 w-4" />
                        Cancel
                      </Button>
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="mt-3 border-t pt-3 text-xs text-gray-500">
                    <div className="flex justify-between">
                      <span>Approved by: {bonus.approvedBy}</span>
                      <span>
                        Created:{" "}
                        {new Date(Number(bonus.createdAt) / 1_000_000).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
