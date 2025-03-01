// app/(dashboard)/settings/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User,
  Settings as SettingsIcon,
  Bell,
  Lock,
  Twitter,
  Shield,
  Database,
} from "lucide-react";
import { useUserAccount } from "@/components/editor/context/account";
import { DisconnectTwitter } from "@/components/auth/DisconnectTwitter";
import Image from "next/image";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { cn } from "@/utils/ts-merge";

export default function SettingsPage() {
  const { handle, name, profileImageUrl } = useUserAccount();
  const [activeTab, setActiveTab] = useState("account");
  const wallet = useWallet();

  useEffect(() => {
    const fetchUserData = async () => {
      const response = await fetch("/api/users/profile");
      if (!response.ok) {
        throw new Error("Failed to update onboarding data");
      }
      console.log(" fetched details", await response.json());
    };

    fetchUserData();
  }, []);

  const AccountSection = () => (
    <div className="space-y-6">
      <Card className="border-neutral-800 bg-black shadow-lg">
        <CardHeader>
          <CardTitle className="text-white">Profile Information</CardTitle>
          <CardDescription className="text-neutral-400">Manage your personal details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            {profileImageUrl ? (
              <Image
                src={profileImageUrl}
                alt={name}
                className="w-16 h-16 rounded-full border-2 border-blue-500"
                width={48}
                height={48}
              />
            ) : (
              <div className="w-16 h-16 bg-neutral-900 rounded-full flex items-center justify-center border border-neutral-800">
                <User className="w-8 h-8 text-blue-400" />
              </div>
            )}
            <div>
              <p className="text-lg font-semibold text-white">{name}</p>
              {handle && <p className="text-neutral-400">{handle}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-neutral-300">First Name</Label>
              <Input 
                placeholder={name.split(" ")[0]} 
                className="bg-neutral-900 border-neutral-700 text-white placeholder:text-neutral-500 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-neutral-300">Last Name</Label>
              <Input 
                placeholder={name.split(" ")[1]} 
                className="bg-neutral-900 border-neutral-700 text-white placeholder:text-neutral-500 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-neutral-300">Email</Label>
              <Input 
                type="email" 
                placeholder={`${name}@gmail.com...`} 
                className="bg-neutral-900 border-neutral-700 text-white placeholder:text-neutral-500 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-neutral-800 bg-black shadow-lg">
        <CardHeader>
          <CardTitle className="text-white">Connected Accounts</CardTitle>
          <CardDescription className="text-neutral-400">
            Manage your social media connections
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Existing Twitter connection */}
          {handle ? (
            <DisconnectTwitter
              onDisconnectSuccess={() => {
                // Optional: handle successful disconnection
              }}
            />
          ) : (
            <div className="flex items-center justify-between p-4 bg-neutral-900 rounded-lg border border-neutral-800">
              <div className="flex items-center space-x-4">
                <Twitter className="w-12 h-12 text-blue-400" />
                <div>
                  <p className="font-semibold text-white">Twitter Account</p>
                  <p className="text-neutral-400">Not Connected</p>
                </div>
              </div>
              <Button className="bg-blue-500 text-white hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black rounded-full">
                Connect Twitter
              </Button>
            </div>
          )}

          {/* Solana Wallet Connection */}
          <div className="flex items-center justify-between p-4 bg-neutral-900 rounded-lg border border-neutral-800">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 flex items-center justify-center bg-[#9945FF] rounded-full">
                <Image
                  src="/solana-logo.png"
                  alt="Solana"
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              </div>
              <div>
                <p className="font-semibold text-white">Solana Wallet</p>
                <p className="text-neutral-400">
                  {wallet.connected ? (
                    <span className="text-green-400">
                      {wallet.publicKey?.toString().slice(0, 4)}...
                      {wallet.publicKey?.toString().slice(-4)}
                    </span>
                  ) : (
                    "Not Connected"
                  )}
                </p>
              </div>
            </div>
            <WalletMultiButton className="!bg-[#9945FF] !h-10 !rounded-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const NotificationsSection = () => (
    <Card className="border-neutral-800 bg-black shadow-lg">
      <CardHeader>
        <CardTitle className="text-white">Notification Preferences</CardTitle>
        <CardDescription className="text-neutral-400">
          Customize how you receive notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-neutral-900 rounded-lg border border-neutral-800">
          <div className="flex items-center space-x-4">
            <Bell className="w-6 h-6 text-blue-400" />
            <div>
              <p className="font-medium text-white">Email Notifications</p>
              <p className="text-sm text-neutral-400">Receive updates via email</p>
            </div>
          </div>
          <Switch className="data-[state=checked]:bg-blue-500" />
        </div>
        <div className="flex items-center justify-between p-4 bg-neutral-900 rounded-lg border border-neutral-800">
          <div className="flex items-center space-x-4">
            <Twitter className="w-6 h-6 text-blue-400" />
            <div>
              <p className="font-medium text-white">Twitter Notifications</p>
              <p className="text-sm text-neutral-400">Get updates on Twitter</p>
            </div>
          </div>
          <Switch className="data-[state=checked]:bg-blue-500" />
        </div>
      </CardContent>
    </Card>
  );

  const SecuritySection = () => (
    <div className="space-y-6">
      <Card className="border-neutral-800 bg-black shadow-lg">
        <CardHeader>
          <CardTitle className="text-white">Security Settings</CardTitle>
          <CardDescription className="text-neutral-400">Manage your account security</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-neutral-900 rounded-lg border border-neutral-800">
            <div className="flex items-center space-x-4">
              <Lock className="w-6 h-6 text-blue-400" />
              <div>
                <p className="font-medium text-white">Two-Factor Authentication</p>
                <p className="text-sm text-neutral-400">
                  Enhance your account security
                </p>
              </div>
            </div>
            <Switch className="data-[state=checked]:bg-blue-500" />
          </div>
          <div className="flex items-center justify-between p-4 bg-neutral-900 rounded-lg border border-neutral-800">
            <div className="flex items-center space-x-4">
              <Shield className="w-6 h-6 text-blue-400" />
              <div>
                <p className="font-medium text-white">Login Alerts</p>
                <p className="text-sm text-neutral-400">
                  Notify me of new login attempts
                </p>
              </div>
            </div>
            <Switch className="data-[state=checked]:bg-blue-500" />
          </div>
          <div className="space-y-2 p-4 bg-neutral-900 rounded-lg border border-neutral-800">
            <Label className="text-white">Change Password</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <Input 
                type="password" 
                placeholder="Current Password" 
                className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500 focus:border-blue-500 focus:ring-blue-500"
              />
              <Input 
                type="password" 
                placeholder="New Password" 
                className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <Button 
              className="mt-3 border border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white transition-colors rounded-full" 
              variant="outline"
            >
              Update Password
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const PreferencesSection = () => (
    <Card className="border-neutral-800 bg-black shadow-lg">
      <CardHeader>
        <CardTitle className="text-white">System Preferences</CardTitle>
        <CardDescription className="text-neutral-400">Customize your application experience</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-neutral-900 rounded-lg border border-neutral-800">
          <div className="flex items-center space-x-4">
            <Database className="w-6 h-6 text-blue-400" />
            <div>
              <p className="font-medium text-white">Data Retention</p>
              <p className="text-sm text-neutral-400">
                How long we keep your data
              </p>
            </div>
          </div>
          <select className="bg-neutral-800 border border-neutral-700 text-white rounded-md p-2 focus:ring-blue-500 focus:border-blue-500">
            <option>30 Days</option>
            <option>60 Days</option>
            <option>90 Days</option>
            <option>Indefinitely</option>
          </select>
        </div>
        <div className="flex items-center justify-between p-4 bg-neutral-900 rounded-lg border border-neutral-800">
          <div className="flex items-center space-x-4">
            <SettingsIcon className="w-6 h-6 text-blue-400" />
            <div>
              <p className="font-medium text-white">Default View</p>
              <p className="text-sm text-neutral-400">
                Choose your preferred default view
              </p>
            </div>
          </div>
          <select className="bg-neutral-800 border border-neutral-700 text-white rounded-md p-2 focus:ring-blue-500 focus:border-blue-500">
            <option>Dashboard</option>
            <option>Content Studio</option>
            <option>Calendar</option>
          </select>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto p-6 space-y-6 bg-black text-white">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4">
        <h1 className="text-2xl md:text-3xl font-semibold text-white">Settings</h1>
        <p className="text-neutral-400">Manage your account and application preferences</p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-4 bg-neutral-900 border-neutral-800 rounded-lg p-1">
          <TabsTrigger 
            value="account"
            className={cn(
              "flex items-center gap-2 rounded-md text-sm",
              activeTab === "account" 
                ? "bg-blue-500 text-white" 
                : "text-neutral-400 hover:text-white data-[state=active]:text-white data-[state=active]:bg-blue-500"
            )}
          >
            <User className="h-4 w-4" /> Account
          </TabsTrigger>
          <TabsTrigger 
            value="notifications"
            className={cn(
              "flex items-center gap-2 rounded-md text-sm",
              activeTab === "notifications" 
                ? "bg-blue-500 text-white" 
                : "text-neutral-400 hover:text-white data-[state=active]:text-white data-[state=active]:bg-blue-500"
            )}
          >
            <Bell className="h-4 w-4" /> Notifications
          </TabsTrigger>
          <TabsTrigger 
            value="security"
            className={cn(
              "flex items-center gap-2 rounded-md text-sm",
              activeTab === "security" 
                ? "bg-blue-500 text-white" 
                : "text-neutral-400 hover:text-white data-[state=active]:text-white data-[state=active]:bg-blue-500"
            )}
          >
            <Lock className="h-4 w-4" /> Security
          </TabsTrigger>
          <TabsTrigger 
            value="preferences"
            className={cn(
              "flex items-center gap-2 rounded-md text-sm",
              activeTab === "preferences" 
                ? "bg-blue-500 text-white" 
                : "text-neutral-400 hover:text-white data-[state=active]:text-white data-[state=active]:bg-blue-500"
            )}
          >
            <SettingsIcon className="h-4 w-4" /> Preferences
          </TabsTrigger>
        </TabsList>

        <TabsContent value="account">
          <AccountSection />
        </TabsContent>
        <TabsContent value="notifications">
          <NotificationsSection />
        </TabsContent>
        <TabsContent value="security">
          <SecuritySection />
        </TabsContent>
        <TabsContent value="preferences">
          <PreferencesSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}