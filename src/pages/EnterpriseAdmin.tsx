import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
    Building2,
    Users,
    Key,
    Webhook,
    FileText,
    Settings,
    Plus,
    Trash2,
    Mail,
    Shield,
    Palette,
    Globe,
    Loader2,
    Copy,
    Eye,
    EyeOff,
    Clock
} from 'lucide-react';

interface Tenant {
    id: string;
    slug: string;
    name: string;
    logo_url: string | null;
    primary_color: string;
    custom_domain: string | null;
    user_limit: number;
    status: string;
    features: Record<string, boolean> | unknown;
}

interface EnterpriseUser {
    id: string;
    email: string;
    full_name: string | null;
    role: string;
    status: string;
    last_login_at: string | null;
    created_at: string;
}

interface AuditLog {
    id: string;
    action: string;
    resource_type: string | null;
    details: Record<string, unknown> | unknown;
    created_at: string;
    user_id?: string;
}

interface ApiKey {
    id: string;
    name: string;
    key_prefix: string;
    scopes: string[];
    last_used_at: string | null;
    is_active: boolean;
    created_at: string;
}

const EnterpriseAdmin: React.FC = () => {
    const { user, session } = useAuth();

    // State
    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [users, setUsers] = useState<EnterpriseUser[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Invite dialog
    const [showInviteDialog, setShowInviteDialog] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('member');
    const [isInviting, setIsInviting] = useState(false);

    // API key dialog
    const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
    const [newApiKeyName, setNewApiKeyName] = useState('');
    const [newApiKey, setNewApiKey] = useState<string | null>(null);
    const [isCreatingKey, setIsCreatingKey] = useState(false);

    useEffect(() => {
        if (user) {
            loadTenantData();
        }
    }, [user]);

    const callEnterpriseApi = async (action: string, data?: Record<string, unknown>) => {
        const tenantId = tenant?.id;
        const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/enterprise-admin`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action,
                    tenant_id: tenantId,
                    data,
                }),
            }
        );
        return response.json();
    };

    const loadTenantData = async () => {
        setIsLoading(true);
        try {
            // Get user's tenant membership
            const { data: membership, error } = await supabase
                .from('enterprise_users')
                .select('tenant_id, role')
                .eq('user_id', user?.id)
                .eq('status', 'active')
                .single();

            if (error || !membership) {
                // User is not part of any enterprise tenant
                setIsLoading(false);
                return;
            }

            setUserRole(membership.role);

            // Get tenant details
            const { data: tenantData } = await supabase
                .from('enterprise_tenants')
                .select('*')
                .eq('id', membership.tenant_id)
                .single();

            if (tenantData) {
                setTenant(tenantData as Tenant);

                // Load users
                const { data: usersData } = await supabase
                    .from('enterprise_users')
                    .select('*')
                    .eq('tenant_id', membership.tenant_id)
                    .neq('status', 'deactivated')
                    .order('created_at', { ascending: false });

                setUsers(usersData || []);

                // Load audit logs (admins only)
                if (['owner', 'admin'].includes(membership.role)) {
                    const { data: logsData } = await supabase
                        .from('enterprise_audit_logs')
                        .select('*')
                        .eq('tenant_id', membership.tenant_id)
                        .order('created_at', { ascending: false })
                        .limit(50);

                    setAuditLogs((logsData || []) as AuditLog[]);

                    // Load API keys
                    const { data: keysData } = await supabase
                        .from('enterprise_api_keys')
                        .select('*')
                        .eq('tenant_id', membership.tenant_id)
                        .eq('is_active', true)
                        .order('created_at', { ascending: false });

                    setApiKeys(keysData || []);
                }
            }
        } catch (error) {
            console.error('Error loading tenant data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInviteUser = async () => {
        if (!inviteEmail.trim()) {
            toast.error('Please enter an email address');
            return;
        }

        setIsInviting(true);
        try {
            const result = await callEnterpriseApi('invite_user', {
                email: inviteEmail,
                role: inviteRole,
            });

            if (!result.success) {
                throw new Error(result.error);
            }

            toast.success('Invitation sent!', {
                description: `Invite link: ${result.invitation_link}`,
            });

            setShowInviteDialog(false);
            setInviteEmail('');
            setInviteRole('member');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to send invitation');
        } finally {
            setIsInviting(false);
        }
    };

    const handleRemoveUser = async (userId: string, email: string) => {
        if (!confirm(`Remove ${email} from this organization?`)) return;

        try {
            const result = await callEnterpriseApi('remove_user', { user_id: userId });

            if (!result.success) {
                throw new Error(result.error);
            }

            toast.success('User removed');
            setUsers(users.filter(u => u.id !== userId));
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to remove user');
        }
    };

    const handleCreateApiKey = async () => {
        if (!newApiKeyName.trim()) {
            toast.error('Please enter a name for the API key');
            return;
        }

        setIsCreatingKey(true);
        try {
            const result = await callEnterpriseApi('create_api_key', {
                name: newApiKeyName,
                scopes: ['read', 'write'],
            });

            if (!result.success) {
                throw new Error(result.error);
            }

            setNewApiKey(result.api_key);
            toast.success('API key created');
            loadTenantData(); // Refresh keys list
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to create API key');
        } finally {
            setIsCreatingKey(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard');
    };

    const getRoleBadgeColor = (role: string) => {
        const colors: Record<string, string> = {
            owner: 'bg-purple-100 text-purple-800',
            admin: 'bg-red-100 text-red-800',
            manager: 'bg-blue-100 text-blue-800',
            member: 'bg-green-100 text-green-800',
            viewer: 'bg-gray-100 text-gray-800',
        };
        return colors[role] || colors.member;
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!tenant) {
        return (
            <div className="container mx-auto px-4 py-16 max-w-2xl text-center">
                <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h1 className="text-2xl font-bold mb-2">Enterprise Not Available</h1>
                <p className="text-muted-foreground mb-6">
                    You are not part of an enterprise organization. Contact sales to set up your enterprise account.
                </p>
                <Button>Contact Sales</Button>
            </div>
        );
    }

    const isAdmin = ['owner', 'admin'].includes(userRole || '');

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    {tenant.logo_url ? (
                        <img src={tenant.logo_url} alt={tenant.name} className="h-12 w-12 rounded" />
                    ) : (
                        <div
                            className="h-12 w-12 rounded flex items-center justify-center text-white font-bold text-xl"
                            style={{ backgroundColor: tenant.primary_color }}
                        >
                            {tenant.name.charAt(0)}
                        </div>
                    )}
                    <div>
                        <h1 className="text-2xl font-bold">{tenant.name}</h1>
                        <p className="text-muted-foreground text-sm">
                            {tenant.slug}.flowai.studio
                            {tenant.custom_domain && ` • ${tenant.custom_domain}`}
                        </p>
                    </div>
                </div>
                <Badge className={tenant.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                    {tenant.status}
                </Badge>
            </div>

            <Tabs defaultValue="team" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="team">
                        <Users className="h-4 w-4 mr-2" />
                        Team
                    </TabsTrigger>
                    <TabsTrigger value="branding">
                        <Palette className="h-4 w-4 mr-2" />
                        Branding
                    </TabsTrigger>
                    {isAdmin && (
                        <>
                            <TabsTrigger value="api">
                                <Key className="h-4 w-4 mr-2" />
                                API Keys
                            </TabsTrigger>
                            <TabsTrigger value="audit">
                                <FileText className="h-4 w-4 mr-2" />
                                Audit Log
                            </TabsTrigger>
                        </>
                    )}
                </TabsList>

                {/* Team Tab */}
                <TabsContent value="team" className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold">Team Members</h2>
                            <p className="text-sm text-muted-foreground">
                                {users.length} of {tenant.user_limit} seats used
                            </p>
                        </div>
                        {['owner', 'admin', 'manager'].includes(userRole || '') && (
                            <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
                                <DialogTrigger asChild>
                                    <Button>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Invite User
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Invite Team Member</DialogTitle>
                                        <DialogDescription>
                                            Send an invitation to join {tenant.name}
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label>Email Address</Label>
                                            <Input
                                                type="email"
                                                placeholder="colleague@company.com"
                                                value={inviteEmail}
                                                onChange={(e) => setInviteEmail(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Role</Label>
                                            <Select value={inviteRole} onValueChange={setInviteRole}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="viewer">Viewer (read-only)</SelectItem>
                                                    <SelectItem value="member">Member (create content)</SelectItem>
                                                    <SelectItem value="manager">Manager (invite users)</SelectItem>
                                                    {isAdmin && <SelectItem value="admin">Admin (full access)</SelectItem>}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
                                            Cancel
                                        </Button>
                                        <Button onClick={handleInviteUser} disabled={isInviting}>
                                            {isInviting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Mail className="h-4 w-4 mr-2" />}
                                            Send Invitation
                                        </Button>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>

                    <div className="space-y-2">
                        {users.map((member) => (
                            <Card key={member.id}>
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Avatar>
                                            <AvatarFallback>{member.email.charAt(0).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-medium">{member.full_name || member.email}</p>
                                            <p className="text-sm text-muted-foreground">{member.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Badge className={getRoleBadgeColor(member.role)}>
                                            {member.role}
                                        </Badge>
                                        {isAdmin && member.role !== 'owner' && (
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="text-destructive"
                                                onClick={() => handleRemoveUser(member.id, member.email)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                {/* Branding Tab */}
                <TabsContent value="branding" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Brand Settings</CardTitle>
                            <CardDescription>Customize the look and feel of your enterprise portal</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>Primary Color</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            type="color"
                                            value={tenant.primary_color}
                                            className="w-16 h-10 p-1"
                                            disabled={!isAdmin}
                                        />
                                        <Input value={tenant.primary_color} disabled className="flex-1" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Logo URL</Label>
                                    <Input value={tenant.logo_url || ''} placeholder="https://..." disabled={!isAdmin} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Custom Domain</Label>
                                <div className="flex gap-2">
                                    <Input value={tenant.custom_domain || ''} placeholder="studio.yourcompany.com" disabled={!isAdmin} />
                                    <Button variant="outline" disabled={!isAdmin}>
                                        <Globe className="h-4 w-4 mr-2" />
                                        Setup Domain
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* API Keys Tab */}
                {isAdmin && (
                    <TabsContent value="api" className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold">API Keys</h2>
                                <p className="text-sm text-muted-foreground">
                                    Manage API access for integrations
                                </p>
                            </div>
                            <Dialog open={showApiKeyDialog} onOpenChange={(open) => {
                                setShowApiKeyDialog(open);
                                if (!open) setNewApiKey(null);
                            }}>
                                <DialogTrigger asChild>
                                    <Button>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Create Key
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Create API Key</DialogTitle>
                                        <DialogDescription>
                                            API keys allow external services to access your FlowAI data
                                        </DialogDescription>
                                    </DialogHeader>
                                    {newApiKey ? (
                                        <div className="space-y-4 py-4">
                                            <div className="p-4 bg-green-50 rounded-lg">
                                                <p className="text-sm text-green-800 mb-2 font-medium">
                                                    ✓ API Key Created
                                                </p>
                                                <div className="flex items-center gap-2">
                                                    <code className="flex-1 p-2 bg-white rounded text-sm break-all">
                                                        {newApiKey}
                                                    </code>
                                                    <Button size="icon" variant="outline" onClick={() => copyToClipboard(newApiKey)}>
                                                        <Copy className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                                <p className="text-xs text-green-700 mt-2">
                                                    Save this key now. It won't be shown again.
                                                </p>
                                            </div>
                                            <Button className="w-full" onClick={() => setShowApiKeyDialog(false)}>
                                                Done
                                            </Button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="space-y-4 py-4">
                                                <div className="space-y-2">
                                                    <Label>Key Name</Label>
                                                    <Input
                                                        placeholder="e.g., Production API"
                                                        value={newApiKeyName}
                                                        onChange={(e) => setNewApiKeyName(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex justify-end gap-2">
                                                <Button variant="outline" onClick={() => setShowApiKeyDialog(false)}>
                                                    Cancel
                                                </Button>
                                                <Button onClick={handleCreateApiKey} disabled={isCreatingKey}>
                                                    {isCreatingKey && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                                                    Create Key
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                </DialogContent>
                            </Dialog>
                        </div>

                        <div className="space-y-2">
                            {apiKeys.length === 0 ? (
                                <Card className="p-8 text-center">
                                    <Key className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                    <p className="text-muted-foreground">No API keys yet</p>
                                </Card>
                            ) : (
                                apiKeys.map((key) => (
                                    <Card key={key.id}>
                                        <CardContent className="p-4 flex items-center justify-between">
                                            <div>
                                                <p className="font-medium">{key.name}</p>
                                                <p className="text-sm text-muted-foreground font-mono">
                                                    {key.key_prefix}...
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {key.last_used_at
                                                        ? new Date(key.last_used_at).toLocaleDateString()
                                                        : 'Never used'}
                                                </span>
                                                <Badge variant="outline">{key.scopes.join(', ')}</Badge>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>
                    </TabsContent>
                )}

                {/* Audit Log Tab */}
                {isAdmin && (
                    <TabsContent value="audit" className="space-y-6">
                        <div>
                            <h2 className="text-lg font-semibold">Audit Log</h2>
                            <p className="text-sm text-muted-foreground">
                                Activity history for compliance and security
                            </p>
                        </div>

                        <ScrollArea className="h-[400px]">
                            <div className="space-y-2">
                                {auditLogs.map((log) => (
                                    <Card key={log.id}>
                                        <CardContent className="p-3 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Shield className="h-4 w-4 text-muted-foreground" />
                                                <div>
                                                    <p className="text-sm font-medium">{log.action}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {log.user_id ? 'User action' : 'System'} • {log.resource_type || 'N/A'}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="text-xs text-muted-foreground">
                                                {new Date(log.created_at).toLocaleString()}
                                            </span>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </ScrollArea>
                    </TabsContent>
                )}
            </Tabs>
        </div>
    );
};

export default EnterpriseAdmin;
