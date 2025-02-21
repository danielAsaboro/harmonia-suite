// app/(dashboard)/settings/page.tsx
"use client";

import React, { useState } from "react";
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

export default function SettingsPage() {
  const { handle, name, profileImageUrl } = useUserAccount();
  const [activeTab, setActiveTab] = useState("account");
  const wallet = useWallet();

  const AccountSection = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Manage your personal details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            {profileImageUrl ? (
              <Image
                src={profileImageUrl}
                alt={name}
                className="w-16 h-16 rounded-full border-2 border-primary"
                width={48}
                height={48}
              />
            ) : (
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-gray-500" />
              </div>
            )}
            <div>
              <p className="text-lg font-semibold">{name}</p>
              {handle && <p className="text-gray-500">{handle}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>First Name</Label>
              <Input placeholder={name.split(" ")[0]} />
            </div>
            <div className="space-y-2">
              <Label>Last Name</Label>
              <Input placeholder={name.split(" ")[1]} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" placeholder={`${name}@gmail.com...`} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Connected Accounts</CardTitle>
          <CardDescription>
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
            <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-gray-700">
              <div className="flex items-center space-x-4">
                <Twitter className="w-12 h-12 text-blue-400" />
                <div>
                  <p className="font-semibold text-white">Twitter Account</p>
                  <p className="text-gray-400">Not Connected</p>
                </div>
              </div>
              <Button>Connect Twitter</Button>
            </div>
          )}

          {/* New Solana Wallet Connection */}
          <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-gray-700">
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
                <p className="text-gray-400">
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
            <WalletMultiButton className="!bg-[#9945FF] !h-10" />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const NotificationsSection = () => (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>
          Customize how you receive notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Bell className="w-6 h-6 text-gray-500" />
            <div>
              <p className="font-medium">Email Notifications</p>
              <p className="text-sm text-gray-500">Receive updates via email</p>
            </div>
          </div>
          <Switch />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Twitter className="w-6 h-6 text-blue-500" />
            <div>
              <p className="font-medium">Twitter Notifications</p>
              <p className="text-sm text-gray-500">Get updates on Twitter</p>
            </div>
          </div>
          <Switch />
        </div>
      </CardContent>
    </Card>
  );

  const SecuritySection = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Security Settings</CardTitle>
          <CardDescription>Manage your account security</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Lock className="w-6 h-6 text-gray-500" />
              <div>
                <p className="font-medium">Two-Factor Authentication</p>
                <p className="text-sm text-gray-500">
                  Enhance your account security
                </p>
              </div>
            </div>
            <Switch />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Shield className="w-6 h-6 text-green-500" />
              <div>
                <p className="font-medium">Login Alerts</p>
                <p className="text-sm text-gray-500">
                  Notify me of new login attempts
                </p>
              </div>
            </div>
            <Switch />
          </div>
          <div className="space-y-2">
            <Label>Change Password</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input type="password" placeholder="Current Password" />
              <Input type="password" placeholder="New Password" />
            </div>
            <Button variant="outline" className="mt-2">
              Update Password
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const PreferencesSection = () => (
    <Card>
      <CardHeader>
        <CardTitle>System Preferences</CardTitle>
        <CardDescription>Customize your application experience</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Database className="w-6 h-6 text-blue-500" />
            <div>
              <p className="font-medium">Data Retention</p>
              <p className="text-sm text-gray-500">
                How long we keep your data
              </p>
            </div>
          </div>
          <select className="bg-background border rounded-md p-2">
            <option>30 Days</option>
            <option>60 Days</option>
            <option>90 Days</option>
            <option>Indefinitely</option>
          </select>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <SettingsIcon className="w-6 h-6 text-gray-500" />
            <div>
              <p className="font-medium">Default View</p>
              <p className="text-sm text-gray-500">
                Choose your preferred default view
              </p>
            </div>
          </div>
          <select className="bg-background border rounded-md p-2">
            <option>Dashboard</option>
            <option>Content Studio</option>
            <option>Calendar</option>
          </select>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-4 bg-background border">
          <TabsTrigger value="account">
            <User className="mr-2 h-4 w-4" /> Account
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="mr-2 h-4 w-4" /> Notifications
          </TabsTrigger>
          <TabsTrigger value="security">
            <Lock className="mr-2 h-4 w-4" /> Security
          </TabsTrigger>
          <TabsTrigger value="preferences">
            <SettingsIcon className="mr-2 h-4 w-4" /> Preferences
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
