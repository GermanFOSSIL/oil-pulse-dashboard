import { Database as DatabaseIcon, FileDown, FileUp, RefreshCw, TableProperties, List, Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import BatchITRUpload from "@/components/BatchITRUpload";

const Database = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Database</h1>
        <p className="text-muted-foreground">
          Database management and tools
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Database Status</CardTitle>
            <CardDescription>Current database status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Status</span>
              <span className="text-sm text-green-500 font-medium">Connected</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Version</span>
              <span className="text-sm">5.7.38</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Uptime</span>
              <span className="text-sm">15d 7h 23m</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Last Backup</span>
              <span className="text-sm">2025-04-04 03:00</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Storage Usage</CardTitle>
            <CardDescription>Database storage metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-2">
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Total Usage</span>
                <span className="text-sm">375 GB / 500 GB</span>
              </div>
              <Progress value={75} className="h-2" />
            </div>
            <div className="mb-2">
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Project Data</span>
                <span className="text-sm">210 GB</span>
              </div>
              <Progress value={42} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">ITR Records</span>
                <span className="text-sm">145 GB</span>
              </div>
              <Progress value={29} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Quick Actions</CardTitle>
            <CardDescription>Common database operations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" className="w-full flex items-center">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" size="sm" className="w-full flex items-center">
                <FileDown className="h-4 w-4 mr-2" />
                Backup
              </Button>
              <Button variant="outline" size="sm" className="w-full flex items-center">
                <FileUp className="h-4 w-4 mr-2" />
                Restore
              </Button>
              <Button variant="outline" size="sm" className="w-full flex items-center">
                <TableProperties className="h-4 w-4 mr-2" />
                Optimize
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="tables">
        <TabsList className="mb-4">
          <TabsTrigger value="tables">Tables</TabsTrigger>
          <TabsTrigger value="backups">Backups</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="batch-upload">Carga Masiva ITR</TabsTrigger>
        </TabsList>

        <TabsContent value="tables">
          <Card>
            <CardHeader>
              <CardTitle>Database Tables</CardTitle>
              <CardDescription>
                View and manage database tables and records
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-3 text-left text-sm">Table Name</th>
                      <th className="p-3 text-left text-sm">Records</th>
                      <th className="p-3 text-left text-sm">Size</th>
                      <th className="p-3 text-left text-sm">Last Updated</th>
                      <th className="p-3 text-left text-sm">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <tr>
                      <td className="p-3 text-sm">projects</td>
                      <td className="p-3 text-sm">124</td>
                      <td className="p-3 text-sm">15.2 MB</td>
                      <td className="p-3 text-sm">2025-04-05</td>
                      <td className="p-3 text-sm">
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">Healthy</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 text-sm">systems</td>
                      <td className="p-3 text-sm">542</td>
                      <td className="p-3 text-sm">28.5 MB</td>
                      <td className="p-3 text-sm">2025-04-05</td>
                      <td className="p-3 text-sm">
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">Healthy</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 text-sm">subsystems</td>
                      <td className="p-3 text-sm">1,845</td>
                      <td className="p-3 text-sm">57.3 MB</td>
                      <td className="p-3 text-sm">2025-04-05</td>
                      <td className="p-3 text-sm">
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">Healthy</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 text-sm">itrs</td>
                      <td className="p-3 text-sm">12,456</td>
                      <td className="p-3 text-sm">145.8 MB</td>
                      <td className="p-3 text-sm">2025-04-05</td>
                      <td className="p-3 text-sm">
                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">Needs Optimization</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 text-sm">users</td>
                      <td className="p-3 text-sm">87</td>
                      <td className="p-3 text-sm">3.2 MB</td>
                      <td className="p-3 text-sm">2025-04-02</td>
                      <td className="p-3 text-sm">
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">Healthy</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 text-sm">reports</td>
                      <td className="p-3 text-sm">524</td>
                      <td className="p-3 text-sm">78.1 MB</td>
                      <td className="p-3 text-sm">2025-04-04</td>
                      <td className="p-3 text-sm">
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">Healthy</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backups">
          <Card>
            <CardHeader>
              <CardTitle>Database Backups</CardTitle>
              <CardDescription>
                Manage database backups and restoration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between mb-4">
                <Button variant="outline" className="flex items-center">
                  <FileDown className="h-4 w-4 mr-2" />
                  Create Backup
                </Button>
                <Button variant="outline" className="flex items-center">
                  <FileUp className="h-4 w-4 mr-2" />
                  Upload Backup
                </Button>
              </div>
              <div className="border rounded-md">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-3 text-left text-sm">Backup Name</th>
                      <th className="p-3 text-left text-sm">Date</th>
                      <th className="p-3 text-left text-sm">Size</th>
                      <th className="p-3 text-left text-sm">Type</th>
                      <th className="p-3 text-left text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <tr>
                      <td className="p-3 text-sm">daily_backup_20250405</td>
                      <td className="p-3 text-sm">2025-04-05 03:00</td>
                      <td className="p-3 text-sm">2.1 GB</td>
                      <td className="p-3 text-sm">Automatic</td>
                      <td className="p-3 text-sm">
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm">Restore</Button>
                          <Button variant="ghost" size="sm">Download</Button>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 text-sm">daily_backup_20250404</td>
                      <td className="p-3 text-sm">2025-04-04 03:00</td>
                      <td className="p-3 text-sm">2.0 GB</td>
                      <td className="p-3 text-sm">Automatic</td>
                      <td className="p-3 text-sm">
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm">Restore</Button>
                          <Button variant="ghost" size="sm">Download</Button>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 text-sm">pre_update_backup</td>
                      <td className="p-3 text-sm">2025-04-03 15:42</td>
                      <td className="p-3 text-sm">1.9 GB</td>
                      <td className="p-3 text-sm">Manual</td>
                      <td className="p-3 text-sm">
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm">Restore</Button>
                          <Button variant="ghost" size="sm">Download</Button>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 text-sm">weekly_backup_2025w14</td>
                      <td className="p-3 text-sm">2025-04-01 00:00</td>
                      <td className="p-3 text-sm">1.9 GB</td>
                      <td className="p-3 text-sm">Automatic</td>
                      <td className="p-3 text-sm">
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm">Restore</Button>
                          <Button variant="ghost" size="sm">Download</Button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Database Logs</CardTitle>
              <CardDescription>
                View database logs and activity history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md p-4 bg-muted/30 font-mono text-xs h-[400px] overflow-y-auto">
                <p className="mb-1">[2025-04-05 08:32:15] INFO: Automatic optimization completed for table 'reports'</p>
                <p className="mb-1">[2025-04-05 08:30:00] INFO: Daily maintenance tasks started</p>
                <p className="mb-1">[2025-04-05 07:45:22] INFO: User 'john.doe' executed query on 'itrs' table</p>
                <p className="mb-1">[2025-04-05 07:42:15] INFO: User 'jane.smith' executed query on 'projects' table</p>
                <p className="mb-1">[2025-04-05 07:30:18] INFO: User 'michael.brown' executed query on 'systems' table</p>
                <p className="mb-1">[2025-04-05 06:15:45] INFO: Backup verification completed successfully</p>
                <p className="mb-1">[2025-04-05 03:00:00] INFO: Daily backup started</p>
                <p className="mb-1">[2025-04-05 03:00:32] INFO: Daily backup completed successfully</p>
                <p className="mb-1">[2025-04-04 22:15:12] INFO: User 'sarah.johnson' executed query on 'subsystems' table</p>
                <p className="mb-1">[2025-04-04 21:30:45] INFO: User 'david.wilson' executed query on 'itrs' table</p>
                <p className="mb-1">[2025-04-04 18:12:33] WARNING: High CPU usage detected (85%)</p>
                <p className="mb-1">[2025-04-04 18:14:22] INFO: CPU usage returned to normal (45%)</p>
                <p className="mb-1">[2025-04-04 15:42:15] INFO: Manual backup 'pre_update_backup' created by user 'admin'</p>
                <p className="mb-1">[2025-04-04 15:40:00] INFO: System update preparation started</p>
                <p className="mb-1">[2025-04-04 14:30:22] INFO: User 'anna.lee' executed query on 'users' table</p>
                <p className="mb-1">[2025-04-04 12:15:46] INFO: Connection pool optimized</p>
                <p className="mb-1">[2025-04-04 10:22:33] INFO: Query cache cleared</p>
                <p className="mb-1">[2025-04-04 08:30:00] INFO: Daily maintenance tasks started</p>
                <p className="mb-1">[2025-04-04 03:00:00] INFO: Daily backup started</p>
                <p className="mb-1">[2025-04-04 03:01:15] INFO: Daily backup completed successfully</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="batch-upload">
          <BatchITRUpload />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Database;
