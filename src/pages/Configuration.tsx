
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const Configuration = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuration</h1>
        <p className="text-muted-foreground">
          System settings and preferences
        </p>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="mb-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Configure general system settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <Label htmlFor="dark-mode">Dark Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable dark mode for the interface
                  </p>
                </div>
                <Switch id="dark-mode" />
              </div>
              
              <div className="flex justify-between items-center">
                <div>
                  <Label htmlFor="auto-save">Auto Save</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically save changes in forms
                  </p>
                </div>
                <Switch id="auto-save" defaultChecked />
              </div>
              
              <div className="flex justify-between items-center">
                <div>
                  <Label htmlFor="analytics">Usage Analytics</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow collection of usage data
                  </p>
                </div>
                <Switch id="analytics" defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Configure notification preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <Label htmlFor="email-notify">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications via email
                  </p>
                </div>
                <Switch id="email-notify" defaultChecked />
              </div>
              
              <div className="flex justify-between items-center">
                <div>
                  <Label htmlFor="system-notify">System Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive in-app notifications
                  </p>
                </div>
                <Switch id="system-notify" defaultChecked />
              </div>
              
              <div className="flex justify-between items-center">
                <div>
                  <Label htmlFor="deadline-alerts">Deadline Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Get alerts for approaching deadlines
                  </p>
                </div>
                <Switch id="deadline-alerts" defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Configure security and access settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <Label htmlFor="2fa">Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">
                      Enhance account security with 2FA
                    </p>
                  </div>
                  <Switch id="2fa" />
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <Label htmlFor="session-timeout">Session Timeout</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically log out after inactivity
                    </p>
                  </div>
                  <Switch id="session-timeout" defaultChecked />
                </div>
                
                <div className="flex items-center justify-end mt-6">
                  <Button>Save Settings</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="integrations">
          <Card>
            <CardHeader>
              <CardTitle>Integrations</CardTitle>
              <CardDescription>
                Connect with external systems and services
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <Label htmlFor="api-integration">API Access</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable API access for integrations
                    </p>
                  </div>
                  <Switch id="api-integration" defaultChecked />
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <Label htmlFor="erp-integration">ERP Integration</Label>
                    <p className="text-sm text-muted-foreground">
                      Connect with enterprise resource planning system
                    </p>
                  </div>
                  <Switch id="erp-integration" />
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <Label htmlFor="scada-integration">SCADA Integration</Label>
                    <p className="text-sm text-muted-foreground">
                      Connect with SCADA systems
                    </p>
                  </div>
                  <Switch id="scada-integration" />
                </div>
                
                <div className="flex items-center justify-end mt-6">
                  <Button>Save Settings</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Configuration;
