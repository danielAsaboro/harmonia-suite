// /components/editor/context/TeamContext.tsx
"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { useUserAccount } from "./account";

interface Team {
  id: string;
  name: string;
  role: string;
}

interface TeamContextType {
  teams: Team[];
  selectedTeamId: string | null;
  setSelectedTeamId: (teamId: string | null) => void;
  isTeamAdmin: (teamId: string) => boolean;
}

const TeamContext = createContext<TeamContextType | undefined>(undefined);

export function TeamProvider({ children }: { children: React.ReactNode }) {
  const { id: userId, teamMemberships } = useUserAccount();
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  // Transform teamMemberships to teams array
  useEffect(() => {
    if (userId && teamMemberships) {
      // First, add user's personal account as a team
      const userTeam: Team = {
        id: userId,
        name: "Personal", // Or use the name from userAccount
        role: "admin", // User is always admin of their personal team
      };

      // Map team memberships to team format
      const memberTeams = teamMemberships.map((membership) => ({
        id: membership.team.id,
        name: membership.team.name,
        role: membership.role,
      }));

      setTeams([userTeam, ...memberTeams]);

      // Default to user's personal team if no team is selected
      if (!selectedTeamId) {
        setSelectedTeamId(userId);
      }
    }
  }, [userId, teamMemberships, selectedTeamId]);

  // Function to check if user is admin of a team
  const isTeamAdmin = (teamId: string): boolean => {
    if (teamId === userId) return true; // User is always admin of personal team

    const team = teamMemberships.find((t) => t.team.id === teamId);
    return team?.role === "admin";
  };

  return (
    <TeamContext.Provider
      value={{
        teams,
        selectedTeamId,
        setSelectedTeamId,
        isTeamAdmin,
      }}
    >
      {children}
    </TeamContext.Provider>
  );
}

export function useTeam() {
  const context = useContext(TeamContext);
  if (context === undefined) {
    throw new Error("useTeam must be used within a TeamProvider");
  }
  return context;
}
