import React from "react";
import { TwitterUserData } from "@/types/auth";

interface WelcomeStepProps {
  user: TwitterUserData;
}

const WelcomeStep = ({ user }: WelcomeStepProps) => {
  return (
    <div className="flex items-center gap-4 p-4 bg-gray-800 rounded-lg">
      <img
        src={user.profile_image_url}
        alt={user.name}
        className="w-12 h-12 rounded-full"
      />
      <div>
        <p className="font-medium text-gray-100">{user.name}</p>
        <p className="text-sm text-gray-400">@{user.username}</p>
      </div>
    </div>
  );
};

export default WelcomeStep;
