// /app/team/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  UserPlus,
  Search,
  Filter,
  Trash2,
  MoreVertical,
  Mail,
  Loader2,
  Eye,
} from "lucide-react";
import { InviteMemberModal } from "@/components/team/InviteMemberModal";
import { TeamRole } from "@/types/team";
import { EmailPreview } from "@/components/email/EmailPreview";

interface PendingInvite {
  id: string;
  email: string;
  role: TeamRole;
  sentAt: Date;
  expiresAt: Date;
  status: "pending" | "expired";
}

interface TeamMember {
  id: string;
  publicKey: string;
  role: "admin" | "creator";
  addedAt: Date;
  lastActive: Date;
}

// Simulate API delay
const simulateDelay = () => new Promise((resolve) => setTimeout(resolve, 1000));

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  memberKey: string;
  isLoading: boolean;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  memberKey,
  isLoading,
}) => {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !isLoading && !open && onClose()}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm Removal</DialogTitle>
          <DialogDescription>
            Are you sure you want to remove the team member with public key{" "}
            <span className="font-mono">{memberKey}</span>? This action cannot
            be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex space-x-2 justify-end">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Remove Member
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (key: string, role: "admin" | "creator") => Promise<void>;
  isLoading: boolean;
}

const AddMemberModal: React.FC<AddMemberModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  isLoading,
}) => {
  const [newMemberKey, setNewMemberKey] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<"admin" | "creator">(
    "creator"
  );

  const handleSubmit = () => {
    if (!newMemberKey) return;
    onAdd(newMemberKey, newMemberRole);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !isLoading && !open && onClose()}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Team Member</DialogTitle>
          <DialogDescription>
            Enter the public key and role for the new team member.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Input
            placeholder="Solana Public Key"
            value={newMemberKey}
            onChange={(e) => setNewMemberKey(e.target.value)}
            disabled={isLoading}
          />
          <Select
            value={newMemberRole}
            onValueChange={(value: "admin" | "creator") =>
              setNewMemberRole(value)
            }
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="creator">Creator</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add Member
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default function TeamManagementPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "creator">(
    "all"
  );
  const [showAddMember, setShowAddMember] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [isDeletingMember, setIsDeletingMember] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    memberId: string;
    memberKey: string;
  }>({ isOpen: false, memberId: "", memberKey: "" });

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [showInviteMember, setShowInviteMember] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);

  // Simulate initial data fetching
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        await simulateDelay();
        setTeamMembers([
          {
            id: "1",
            publicKey: "GZx4Fq...j9u",
            role: "admin",
            addedAt: new Date("2024-01-01"),
            lastActive: new Date("2024-02-20"),
          },
          {
            id: "2",
            publicKey: "7LP9i2...k3m",
            role: "creator",
            addedAt: new Date("2024-02-01"),
            lastActive: new Date("2024-02-22"),
          },
        ]);
      } catch (error) {
        console.error("Error fetching members:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMembers();
  }, []);

  const filteredMembers = teamMembers.filter((member) => {
    const matchesSearch = member.publicKey
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || member.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleAddMember = async (
    publicKey: string,
    role: "admin" | "creator"
  ) => {
    setIsAddingMember(true);
    try {
      await simulateDelay();
      const newMember: TeamMember = {
        id: Math.random().toString(),
        publicKey,
        role,
        addedAt: new Date(),
        lastActive: new Date(),
      };
      setTeamMembers([...teamMembers, newMember]);
      setShowAddMember(false);
    } catch (error) {
      console.error("Error adding member:", error);
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleRemoveMember = async (id: string) => {
    setIsDeletingMember(true);
    try {
      await simulateDelay();
      setTeamMembers(teamMembers.filter((member) => member.id !== id));
      setDeleteModal({ isOpen: false, memberId: "", memberKey: "" });
    } catch (error) {
      console.error("Error removing member:", error);
    } finally {
      setIsDeletingMember(false);
    }
  };

  // Handle invite submission
  const handleInviteMember = async (email: string, role: TeamRole) => {
    setIsInviting(true);
    try {
      const response = await fetch("/api/team/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          role,
          teamId: "your-team-id", // You'll need to get this from your app context
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Add to pending invites
        setPendingInvites((prev) => [
          ...prev,
          {
            id: data.invite.id,
            email: data.invite.email,
            role: data.invite.role,
            sentAt: new Date(),
            expiresAt: new Date(data.invite.expiresAt),
            status: "pending",
          },
        ]);
        setShowInviteMember(false);
      } else {
        // Handle error
        console.error("Failed to send invite:", data.error);
      }
    } catch (error) {
      console.error("Error sending invite:", error);
    } finally {
      setIsInviting(false);
    }
  };

  const [showEmailPreview, setShowEmailPreview] = useState(false);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Team Management</h1>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowAddMember(true)}
            className="flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Add Member
          </Button>
          <Button
            onClick={() => setShowInviteMember(true)}
            className="flex items-center gap-2"
            variant="outline"
          >
            <Mail className="w-4 h-4" />
            Invite Member
          </Button>
          <Button
            onClick={() => setShowEmailPreview(true)}
            variant="ghost"
            className="flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            Preview Email
          </Button>
        </div>
      </div>

      <EmailPreview
        isOpen={showEmailPreview}
        onClose={() => setShowEmailPreview(false)}
      />

      {/* Pending Invites Section */}
      {pendingInvites.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-xl font-semibold mb-4">Pending Invites</h2>
            <div className="rounded-lg border border-border">
              <div className="grid grid-cols-4 gap-4 p-4 bg-muted/50 border-b text-sm font-medium text-muted-foreground">
                <div>Email</div>
                <div>Role</div>
                <div>Sent</div>
                <div>Expires</div>
              </div>
              <div className="divide-y divide-border">
                {pendingInvites.map((invite) => (
                  <div
                    key={invite.id}
                    className="grid grid-cols-4 gap-4 p-4 items-center hover:bg-gray-50/5"
                  >
                    <div>{invite.email}</div>
                    <div>
                      <Badge
                        variant={
                          invite.role === "admin" ? "default" : "secondary"
                        }
                      >
                        {invite.role}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-500">
                      {invite.sentAt.toLocaleDateString()}
                    </div>
                    <div className="text-sm text-gray-500">
                      {invite.expiresAt.toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing team members card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center mb-6">
            <div className="relative w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
              <Input
                placeholder="Search by public key..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <Select
                value={roleFilter}
                onValueChange={(value: "all" | "admin" | "creator") =>
                  setRoleFilter(value)
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admins</SelectItem>
                  <SelectItem value="creator">Creators</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-lg border border-border">
            <div className="grid grid-cols-5 gap-4 p-4 bg-muted/50 border-b text-sm font-medium text-muted-foreground">
              <div>Public Key</div>
              <div>Role</div>
              <div>Added</div>
              <div>Last Active</div>
              <div>Actions</div>
            </div>

            <div className="divide-y divide-border">
              {isLoading ? (
                <div className="p-8 text-center text-gray-500">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                  Loading team members...
                </div>
              ) : (
                <>
                  {filteredMembers.map((member) => (
                    <div
                      key={member.id}
                      className="grid grid-cols-5 gap-4 p-4 items-center hover:bg-gray-50/5"
                    >
                      <div className="font-mono text-sm">
                        {member.publicKey}
                      </div>
                      <div>
                        <Badge
                          variant={
                            member.role === "admin" ? "default" : "secondary"
                          }
                        >
                          {member.role}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-500">
                        {member.addedAt.toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {member.lastActive.toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setDeleteModal({
                              isOpen: true,
                              memberId: member.id,
                              memberKey: member.publicKey,
                            })
                          }
                          className="text-red-400 hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {filteredMembers.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                      No team members found matching your filters
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add the new invite modal */}
      <InviteMemberModal
        isOpen={showInviteMember}
        onClose={() => setShowInviteMember(false)}
        onInvite={handleInviteMember}
        isLoading={isInviting}
      />

      <AddMemberModal
        isOpen={showAddMember}
        onClose={() => setShowAddMember(false)}
        onAdd={handleAddMember}
        isLoading={isAddingMember}
      />

      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() =>
          setDeleteModal({ isOpen: false, memberId: "", memberKey: "" })
        }
        onConfirm={() => handleRemoveMember(deleteModal.memberId)}
        memberKey={deleteModal.memberKey}
        isLoading={isDeletingMember}
      />
    </div>
  );
}
