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
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import {
  staffPenaltyService,
  type StaffPenalty,
} from "@/services/staffFinancialService";
import { useToast } from "@/hooks/use-toast";
import type { StaffMember } from "@/types";

interface StaffPenaltyModalProps {
  open: boolean;
  onClose: () => void;
  staffMember: StaffMember;
}

export default function StaffPenaltyModal({
  open,
  onClose,
  staffMember,
}: StaffPenaltyModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [penalties, setPenalties] = useState<StaffPenalty[]>([]);
  const [showNewPenaltyForm, setShowNewPenaltyForm] = useState(false);
  const [editingPenalty, setEditingPenalty] = useState<StaffPenalty | null>(
    null,
  );
  const [filterStatus, setFilterStatus] = useState<
    "all" | "pending" | "deducted" | "waived"
  >("all");

  const currentDate = new Date();
  const [formData, setFormData] = useState({
    amount: 0,
    reason: "",
    type: "lateness" as
      | "lateness"
      | "absence"
      | "misconduct"
      | "damage"
      | "other",
    month: currentDate.getMonth() + 1,
    year: currentDate.getFullYear(),
  });

  useEffect(() => {
    if (open) {
      loadPenalties();
    }
  }, [open]);

  const loadPenalties = async () => {
    setLoading(true);
    try {
      const staffPenalties = await staffPenaltyService.getByStaffId(
        staffMember.id,
      );
      setPenalties(
        staffPenalties.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
      );
    } catch (error) {
      console.error("Error loading penalties:", error);
      toast({
        title: "Error",
        description: "Failed to load penalties",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditPenalty = (penalty: StaffPenalty) => {
    setEditingPenalty(penalty);
    setFormData({
      amount: penalty.amount,
      reason: penalty.reason,
      type: penalty.type,
      month: penalty.month,
      year: penalty.year,
    });
    setShowNewPenaltyForm(true);
  };

  const handleCreatePenalty = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingPenalty) {
        // Update existing penalty
        await staffPenaltyService.update(editingPenalty.id, {
          amount: formData.amount,
          reason: formData.reason,
          type: formData.type,
          month: formData.month,
          year: formData.year,
          updatedAt: new Date().toISOString(),
        });

        toast({
          title: "Penalty Updated",
          description: `Penalty has been updated successfully`,
        });
      } else {
        // Create new penalty
        await staffPenaltyService.createPenalty({
          staffId: staffMember.id,
          staffName: `${staffMember.firstname} ${staffMember.surname}`,
          staffNumber: staffMember.staffNumber,
          amount: formData.amount,
          reason: formData.reason,
          type: formData.type,
          month: formData.month,
          year: formData.year,
          status: "pending",
          issuedBy: "current-admin",
          issuedDate: new Date().toISOString(),
        });

        toast({
          title: "Penalty Created",
          description: `Penalty of ₦${formData.amount.toLocaleString()} has been issued`,
        });
      }

      setShowNewPenaltyForm(false);
      setEditingPenalty(null);
      setFormData({
        amount: 0,
        reason: "",
        type: "lateness",
        month: currentDate.getMonth() + 1,
        year: currentDate.getFullYear(),
      });
      loadPenalties();
    } catch (error) {
      console.error("Error saving penalty:", error);
      toast({
        title: "Error",
        description: editingPenalty
          ? "Failed to update penalty"
          : "Failed to create penalty",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsDeducted = async (penaltyId: string) => {
    try {
      await staffPenaltyService.markAsDeducted(penaltyId);
      toast({
        title: "Success",
        description: "Penalty marked as deducted",
      });
      loadPenalties();
    } catch (error) {
      console.error("Error marking penalty as deducted:", error);
      toast({
        title: "Error",
        description: "Failed to mark penalty as deducted",
        variant: "destructive",
      });
    }
  };

  const handleWaivePenalty = async (penaltyId: string) => {
    try {
      await staffPenaltyService.waivePenalty(penaltyId);
      toast({
        title: "Success",
        description: "Penalty waived",
      });
      loadPenalties();
    } catch (error) {
      console.error("Error waiving penalty:", error);
      toast({
        title: "Error",
        description: "Failed to waive penalty",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: StaffPenalty["status"]) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "deducted":
        return <CheckCircle className="h-4 w-4 text-red-600" />;
      case "waived":
        return <XCircle className="h-4 w-4 text-green-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: StaffPenalty["status"]) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "deducted":
        return "bg-red-100 text-red-800";
      case "waived":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPenaltyTypeLabel = (type: StaffPenalty["type"]) => {
    switch (type) {
      case "lateness":
        return "Lateness";
      case "absence":
        return "Absence";
      case "misconduct":
        return "Misconduct";
      case "damage":
        return "Damage";
      case "other":
        return "Other";
      default:
        return type;
    }
  };

  const getPenaltyTypeColor = (type: StaffPenalty["type"]) => {
    switch (type) {
      case "lateness":
        return "bg-orange-100 text-orange-800";
      case "absence":
        return "bg-red-100 text-red-800";
      case "misconduct":
        return "bg-purple-100 text-purple-800";
      case "damage":
        return "bg-blue-100 text-blue-800";
      case "other":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
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

  const filteredPenalties = penalties.filter((penalty) =>
    filterStatus === "all" ? true : penalty.status === filterStatus,
  );

  const totalDeducted = penalties.reduce(
    (sum, penalty) =>
      penalty.status === "deducted" ? sum + penalty.amount : sum,
    0,
  );

  const pendingPenalties = penalties.filter(
    (p) => p.status === "pending",
  ).length;
  const waivedPenalties = penalties.filter((p) => p.status === "waived").length;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-5xl overflow-x-hidden overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Penalty Management - {staffMember.firstname} {staffMember.surname}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="rounded-lg border bg-red-50 p-4 text-center">
              <p className="text-sm text-gray-600">Total Deducted</p>
              <p className="text-2xl font-bold text-red-700">
                {formatCurrency(totalDeducted)}
              </p>
            </div>
            <div className="rounded-lg border bg-yellow-50 p-4 text-center">
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-700">
                {pendingPenalties}
              </p>
            </div>
            <div className="rounded-lg border bg-green-50 p-4 text-center">
              <p className="text-sm text-gray-600">Waived</p>
              <p className="text-2xl font-bold text-green-700">
                {waivedPenalties}
              </p>
            </div>
            <div className="rounded-lg border bg-blue-50 p-4 text-center">
              <p className="text-sm text-gray-600">Total Penalties</p>
              <p className="text-2xl font-bold text-blue-700">
                {penalties.length}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <Button
              onClick={() => setShowNewPenaltyForm(!showNewPenaltyForm)}
              disabled={loading}
              variant="destructive"
            >
              {showNewPenaltyForm ? "Cancel" : "Issue Penalty"}
            </Button>
            <div className="flex gap-2">
              <Select
                value={filterStatus}
                onValueChange={(v) => setFilterStatus(v as 'all' | 'pending' | 'deducted' | 'waived')}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="deducted">Deducted</SelectItem>
                  <SelectItem value="waived">Waived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* New Penalty Form */}
          {showNewPenaltyForm && (
            <form
              onSubmit={handleCreatePenalty}
              className="rounded-lg border border-red-200 bg-red-50 p-4"
            >
              <h3 className="mb-4 font-semibold text-red-900">
                {editingPenalty ? "Edit Penalty" : "Issue New Penalty"}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount">Penalty Amount (₦) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    min="0"
                    step="100"
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
                  <Label htmlFor="type">Penalty Type *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(v) =>
                      setFormData({ ...formData, type: v as 'lateness' | 'absence' | 'misconduct' | 'damage' | 'other' })
                    }
                  >
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lateness">Lateness</SelectItem>
                      <SelectItem value="absence">Absence</SelectItem>
                      <SelectItem value="misconduct">Misconduct</SelectItem>
                      <SelectItem value="damage">Damage</SelectItem>
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
                    placeholder="e.g., Late to work 5 times this month, Unauthorized absence, etc."
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
                <Button type="submit" disabled={loading} variant="destructive">
                  {loading
                    ? editingPenalty
                      ? "Updating..."
                      : "Issuing..."
                    : editingPenalty
                      ? "Update Penalty"
                      : "Issue Penalty"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowNewPenaltyForm(false);
                    setEditingPenalty(null);
                    setFormData({
                      amount: 0,
                      reason: "",
                      type: "lateness",
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

          {/* Penalty List */}
          <div className="space-y-4">
            <h3 className="font-semibold">
              Penalty History ({filteredPenalties.length}
              {filterStatus !== "all" && ` ${filterStatus}`})
            </h3>
            {filteredPenalties.length === 0 ? (
              <div className="py-12 text-center text-gray-500">
                <AlertCircle className="mx-auto mb-4 h-12 w-12 opacity-50" />
                <p>No penalties found</p>
              </div>
            ) : (
              filteredPenalties.map((penalty) => (
                <div
                  key={penalty.id}
                  className="rounded-lg border p-4 transition-shadow hover:shadow-md"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        <h4 className="font-semibold">{penalty.reason}</h4>
                        {getStatusIcon(penalty.status)}
                      </div>
                      <div className="mb-2 flex gap-2">
                        <Badge
                          className={getPenaltyTypeColor(penalty.type)}
                          variant="secondary"
                        >
                          {getPenaltyTypeLabel(penalty.type)}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          {getMonthName(penalty.month)} {penalty.year}
                        </span>
                      </div>
                      {penalty.deductedDate && (
                        <p className="mt-1 text-xs text-gray-500">
                          Deducted on:{" "}
                          {new Date(penalty.deductedDate).toLocaleDateString()}
                        </p>
                      )}
                      {penalty.waivedDate && (
                        <p className="mt-1 text-xs text-gray-500">
                          Waived on:{" "}
                          {new Date(penalty.waivedDate).toLocaleDateString()}
                          {penalty.waivedBy && ` by ${penalty.waivedBy}`}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-red-700">
                        {formatCurrency(penalty.amount)}
                      </p>
                      <Badge
                        className={getStatusColor(penalty.status)}
                        variant="secondary"
                      >
                        {penalty.status}
                      </Badge>
                    </div>
                  </div>

                  {/* Actions */}
                  {penalty.status === "pending" && (
                    <div className="mt-3 flex gap-2 border-t pt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditPenalty(penalty)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleMarkAsDeducted(penalty.id)}
                      >
                        <CheckCircle className="mr-1 h-4 w-4" />
                        Mark as Deducted
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleWaivePenalty(penalty.id)}
                      >
                        <XCircle className="mr-1 h-4 w-4" />
                        Waive Penalty
                      </Button>
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="mt-3 border-t pt-3 text-xs text-gray-500">
                    <div className="flex justify-between">
                      <span>Issued by: {penalty.issuedBy}</span>
                      <span>
                        Created:{" "}
                        {new Date(penalty.createdAt).toLocaleDateString()}
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
