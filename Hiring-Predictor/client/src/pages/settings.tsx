import { Layout } from "@/components/index";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, User, Eye, Globe, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocation } from "wouter";

interface UserSettings {
  security: {
    twoFactorAuth: boolean;
    loginNotifications: boolean;
  };
  account: {
    emailNotifications: boolean;
    profileAnalytics: boolean;
  };
  visibility: {
    publicProfile: boolean;
    showResume: boolean;
    showContact: boolean;
  };
  language: {
    preferred: string;
    autoDetect: boolean;
  };
}

const defaultSettings: UserSettings = {
  security: {
    twoFactorAuth: false,
    loginNotifications: true,
  },
  account: {
    emailNotifications: true,
    profileAnalytics: false,
  },
  visibility: {
    publicProfile: true,
    showResume: true,
    showContact: false,
  },
  language: {
    preferred: "en",
    autoDetect: false,
  },
};

export default function Settings() {
  const { logoutMutation } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [loading, setLoading] = useState(false);

  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsedSettings });
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }
  }, []);

  // Save settings to localStorage
  const saveSettings = async (newSettings: Partial<UserSettings>, sectionName: string) => {
    setLoading(true);
    try {
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);
      localStorage.setItem('userSettings', JSON.stringify(updatedSettings));

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));

      toast({
        title: `${sectionName} settings saved`,
        description: "Your preferences have been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to save ${sectionName.toLowerCase()} settings. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      setLocation("/");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to logout. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSecuritySave = () => {
    saveSettings({
      security: {
        twoFactorAuth: settings.security.twoFactorAuth,
        loginNotifications: settings.security.loginNotifications,
      }
    }, "Security");
  };

  const handleAccountSave = () => {
    saveSettings({
      account: {
        emailNotifications: settings.account.emailNotifications,
        profileAnalytics: settings.account.profileAnalytics,
      }
    }, "Account");
  };

  const handleVisibilitySave = () => {
    saveSettings({
      visibility: {
        publicProfile: settings.visibility.publicProfile,
        showResume: settings.visibility.showResume,
        showContact: settings.visibility.showContact,
      }
    }, "Profile Visibility");
  };

  const handleLanguageSave = () => {
    saveSettings({
      language: {
        preferred: settings.language.preferred,
        autoDetect: settings.language.autoDetect,
      }
    }, "Language");
  };

  const handleDataExport = async () => {
    setLoading(true);
    try {
      // Simulate data export
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Create a simple JSON file with user data
      const exportData = {
        settings,
        exportDate: new Date().toISOString(),
        version: "1.0"
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hirepulse-settings-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Data exported",
        description: "Your settings have been downloaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    {
      icon: Shield,
      label: "Security",
      description: "Manage your account security settings",
      key: "security",
      content: (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Two-Factor Authentication</Label>
              <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
            </div>
            <Switch
              checked={settings.security.twoFactorAuth}
              onCheckedChange={(checked) =>
                setSettings(prev => ({
                  ...prev,
                  security: { ...prev.security, twoFactorAuth: checked }
                }))
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Login Notifications</Label>
              <p className="text-sm text-muted-foreground">Get notified of new login attempts</p>
            </div>
            <Switch
              checked={settings.security.loginNotifications}
              onCheckedChange={(checked) =>
                setSettings(prev => ({
                  ...prev,
                  security: { ...prev.security, loginNotifications: checked }
                }))
              }
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSecuritySave} disabled={loading} size="sm">
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      )
    },
    {
      icon: User,
      label: "Account Control",
      description: "Control your account preferences and settings",
      key: "account",
      content: (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive notifications about job matches</p>
            </div>
            <Switch
              checked={settings.account.emailNotifications}
              onCheckedChange={(checked) =>
                setSettings(prev => ({
                  ...prev,
                  account: { ...prev.account, emailNotifications: checked }
                }))
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Profile Analytics</Label>
              <p className="text-sm text-muted-foreground">Allow anonymous usage analytics</p>
            </div>
            <Switch
              checked={settings.account.profileAnalytics}
              onCheckedChange={(checked) =>
                setSettings(prev => ({
                  ...prev,
                  account: { ...prev.account, profileAnalytics: checked }
                }))
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Data Export</Label>
              <p className="text-sm text-muted-foreground">Download your profile data</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleDataExport} disabled={loading}>
              {loading ? "Exporting..." : "Export Data"}
            </Button>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleAccountSave} disabled={loading} size="sm">
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      )
    },
    {
      icon: Eye,
      label: "Profile Visibility",
      description: "Manage who can see your profile",
      key: "visibility",
      content: (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Public Profile</Label>
              <p className="text-sm text-muted-foreground">Make your profile visible to employers</p>
            </div>
            <Switch
              checked={settings.visibility.publicProfile}
              onCheckedChange={(checked) =>
                setSettings(prev => ({
                  ...prev,
                  visibility: { ...prev.visibility, publicProfile: checked }
                }))
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Show Resume</Label>
              <p className="text-sm text-muted-foreground">Allow employers to view your resume</p>
            </div>
            <Switch
              checked={settings.visibility.showResume}
              onCheckedChange={(checked) =>
                setSettings(prev => ({
                  ...prev,
                  visibility: { ...prev.visibility, showResume: checked }
                }))
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Contact Information</Label>
              <p className="text-sm text-muted-foreground">Show email and contact details</p>
            </div>
            <Switch
              checked={settings.visibility.showContact}
              onCheckedChange={(checked) =>
                setSettings(prev => ({
                  ...prev,
                  visibility: { ...prev.visibility, showContact: checked }
                }))
              }
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={handleVisibilitySave} disabled={loading} size="sm">
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      )
    },
    {
      icon: Globe,
      label: "Language",
      description: "Change your language preferences",
      key: "language",
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="language">Preferred Language</Label>
            <Select
              value={settings.language.preferred}
              onValueChange={(value) =>
                setSettings(prev => ({
                  ...prev,
                  language: { ...prev.language, preferred: value }
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
                <SelectItem value="fr">French</SelectItem>
                <SelectItem value="de">German</SelectItem>
                <SelectItem value="hi">Hindi</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Auto-detect Language</Label>
              <p className="text-sm text-muted-foreground">Automatically detect your browser language</p>
            </div>
            <Switch
              checked={settings.language.autoDetect}
              onCheckedChange={(checked) =>
                setSettings(prev => ({
                  ...prev,
                  language: { ...prev.language, autoDetect: checked }
                }))
              }
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={handleLanguageSave} disabled={loading} size="sm">
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      )
    }
  ];

  return (
    <Layout>
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-display font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground mt-2">Manage your account and application preferences.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {menuItems.map((item) => (
              <Card key={item.label} className="transition-all duration-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{item.label}</h3>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                  <div className="border-t pt-4">
                    {item.content}
                  </div>
                </CardContent>
              </Card>
            ))}

            <Card className="cursor-pointer hover:shadow-md transition-shadow border-red-200" onClick={handleLogout}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-red-50">
                    <LogOut className="h-5 w-5 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-red-600">Logout</h3>
                    <p className="text-sm text-muted-foreground">Sign out of your account</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}