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
  Copy,
  Check,
} from "lucide-react";
import { InviteMemberModal } from "@/components/team/InviteMemberModal";
import { TeamRole } from "@/types/team";
import { EmailPreview } from "@/components/email/EmailPreview";
import toast from "react-hot-toast";

interface PendingInvite {
  id: string;
  email: string;
  role: TeamRole;
  sentAt: Date;
  expiresAt: Date;
  status: "pending" | "expired";
  inviteLink?: string; // Added invite link property
  token?: string; // Token to construct link
}

interface TeamMember {
  id: string;
  handle: string;
  publicKey?: string;
  role: "admin" | "creator";
  addedAt: Date;
  lastActive: Date;
}

interface TeamInvite {
  id: string;
  email: string;
  role: TeamRole;
  teamId: string;
  status: "pending" | "accepted" | "expired" | "revoked";
  token: string;
  createdAt: string;
  expiresAt: string;
  acceptedAt?: string;
  createdBy: string;
}

interface TeamMemberData {
  id: string;
  teamId: string;
  userId: string;
  role: "admin" | "creator";
  joinedAt: string;
  user: {
    name: string;
    username: string;
    profileImageUrl?: string;
    walletAddress?: string;
  };
}

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
  const [currentTeamId, setCurrentTeamId] = useState<string | null>(null);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    memberId: string;
    memberKey: string;
  }>({ isOpen: false, memberId: "", memberKey: "" });

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [showInviteMember, setShowInviteMember] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);

  // Function to copy invite link to clipboard
  const copyInviteLink = async (inviteLink: string, inviteId: string) => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopiedLinkId(inviteId);
      toast.success("Invite link copied to clipboard!");

      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setCopiedLinkId(null);
      }, 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      toast.error("Failed to copy invite link. Please try again.");
    }
  };

  useEffect(() => {
    const fetchTeamData = async () => {
      setIsLoading(true);
      try {
        // Fetch team members
        const membersResponse = await fetch("/api/team/members");
        if (!membersResponse.ok)
          throw new Error("Failed to fetch team members");
        const membersData = await membersResponse.json();

        // NEW: Extract team ID from the response
        const teamId = membersData.team?.id;

        // Store team ID in state
        setCurrentTeamId(teamId);

        // Transform API data to match your component's expected format
        const formattedMembers = membersData.members.map(
          (member: TeamMemberData) => ({
            id: member.id,
            publicKey: member.user.walletAddress, //
            handle: member.user.username,
            role: member.role,
            addedAt: new Date(member.joinedAt),
            lastActive: new Date(),
          })
        );

        setTeamMembers(formattedMembers);

        // Fetch pending invites
        const invitesResponse = await fetch("/api/team/invite");
        if (!invitesResponse.ok) throw new Error("Failed to fetch invites");
        const invitesData = await invitesResponse.json();

        // Transform invites data
        const formattedInvites = invitesData.invites.map(
          (invite: TeamInvite) => ({
            id: invite.id,
            email: invite.email,
            role: invite.role,
            sentAt: new Date(invite.createdAt),
            expiresAt: new Date(invite.expiresAt),
            status: invite.status,
            token: invite.token,
            // Create the full invite link
            inviteLink: `${window.location.origin}/team/join?token=${invite.token}`,
          })
        );

        setPendingInvites(formattedInvites);
      } catch (error) {
        console.error("Error fetching team data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeamData();
  }, []);

  const filteredMembers = teamMembers.filter((member) => {
    const matchesSearch = member.handle
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
      const response = await fetch("/api/team/members", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: publicKey,
          role,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add team member");
      }

      const data = await response.json();

      // Format the new member data and add to state
      const newMember: TeamMember = {
        id: data.member.id,
        handle: data.member.user.username,
        publicKey: data.member.user.username,
        role: data.member.role,
        addedAt: new Date(data.member.joinedAt),
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

  const handleRemoveMember = async (memberId: string) => {
    setIsDeletingMember(true);
    try {
      const response = await fetch(`/api/team/members/${memberId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to remove team member");
      }

      // If successful, update the local state
      setTeamMembers(teamMembers.filter((member) => member.id !== memberId));
      setDeleteModal({ isOpen: false, memberId: "", memberKey: "" });
    } catch (error) {
      console.error("Error removing member:", error);
      // You might want to add error notification here
    } finally {
      setIsDeletingMember(false);
    }
  };

  const handleInviteMember = async (email: string, role: TeamRole) => {
    // Check if team ID is available
    if (!currentTeamId) {
      console.error("No team ID available");
      return;
    }

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
          teamId: currentTeamId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        console.log(" data invite , ", data);
        // Add to pending invites with invite link
        setPendingInvites((prev) => [
          ...prev,
          {
            id: data.invite.teamId,
            email: data.invite.email,
            role: data.invite.role,
            sentAt: new Date(),
            expiresAt: new Date(data.invite.expiresAt),
            status: "pending",
            token: data.invite.token,
            inviteLink: `${window.location.origin}/team/join?token=${data.invite.token}`,
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

      {/* Pending Invites Section - Updated with Invite Link column */}
      {pendingInvites.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-xl font-semibold mb-4">Pending Invites</h2>
            <div className="rounded-lg border border-border">
              <div className="grid grid-cols-5 gap-4 p-4 bg-muted/50 border-b text-sm font-medium text-muted-foreground">
                <div>Email</div>
                <div>Role</div>
                <div>Sent</div>
                <div>Expires</div>
                <div>Invite Link</div> {/* New column for invite link */}
              </div>
              <div className="divide-y divide-border">
                {pendingInvites.map((invite) => (
                  <div
                    key={invite.id}
                    className="grid grid-cols-5 gap-4 p-4 items-center hover:bg-gray-50/5"
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
                    <div className="flex items-center">
                      <div className="relative flex-1 truncate text-xs font-mono bg-muted p-2 rounded mr-2">
                        {invite.inviteLink}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          invite.inviteLink &&
                          copyInviteLink(invite.inviteLink, invite.id)
                        }
                        className="flex-shrink-0"
                      >
                        {copiedLinkId === invite.id ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
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
            <div className="grid grid-cols-6 gap-4 p-4 bg-muted/50 border-b text-sm font-medium text-muted-foreground">
              <div>Twitter Handle</div>
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
                      className="grid grid-cols-6 gap-4 p-4 items-center hover:bg-gray-50/5"
                    >
                      <div className="text-sm text-gray-500">
                        {member.handle}
                      </div>
                      <div className="font-mono text-sm">
                        {member.publicKey
                          ? `${member.publicKey.slice(0, 6)}...${member.publicKey.slice(-4)}`
                          : "Not added yet"}
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
                              memberKey: member.publicKey!,
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
{/* lol */}
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
