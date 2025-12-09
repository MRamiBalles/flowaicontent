import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
    Smartphone,
    Download,
    Wifi,
    Check,
    Apple,
    Cpu,
    Loader2
} from 'lucide-react';

interface MobileDevice {
    id: string;
    device_name: string;
    device_type: string;
    last_active_at: string;
    is_active: boolean;
}

const MobileApp = () => {
    const { user } = useAuth();
    const [devices, setDevices] = useState<MobileDevice[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (user) {
            loadDevices();
        } else {
            setIsLoading(false);
        }
    }, [user]);

    const loadDevices = async () => {
        try {
            const { data, error } = await (supabase as any)
                .from('mobile_devices')
                .select('*')
                .eq('user_id', user?.id)
                .order('last_active_at', { ascending: false });

            if (error) throw error;
            setDevices(data || []);
        } catch (error) {
            console.error('Error loading devices:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendLink = () => {
        toast.success('Download link sent to your email!');
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-5xl">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold flex items-center justify-center gap-3 mb-4">
                    <Smartphone className="h-10 w-10 text-primary" />
                    FlowAI Mobile App
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Take your creative studio anywhere. Manage streams, edit videos, and track analytics from your pocket.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
                {/* iOS Card */}
                <Card className="hover:border-primary/50 transition-all cursor-pointer group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 bg-primary/10 rounded-bl-xl">
                        <Badge>Coming Soon</Badge>
                    </div>
                    <CardHeader className="text-center">
                        <Apple className="h-16 w-16 mx-auto mb-4 text-foreground/80 group-hover:text-primary transition-colors" />
                        <CardTitle className="text-2xl">Download for iOS</CardTitle>
                        <CardDescription>iPhone & iPad</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center space-y-4">
                        <ul className="text-sm text-muted-foreground space-y-2 text-left max-w-[200px] mx-auto">
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Push Notifications</li>
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Live Stream Manager</li>
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Stats Dashboard</li>
                        </ul>
                        <Button className="w-full" onClick={handleSendLink}>
                            <Download className="h-4 w-4 mr-2" />
                            Get App Store Link
                        </Button>
                    </CardContent>
                </Card>

                {/* Android Card */}
                <Card className="hover:border-primary/50 transition-all cursor-pointer group">
                    <CardHeader className="text-center">
                        <div className="h-16 w-16 mx-auto mb-4 flex items-center justify-center">
                            <Cpu className="h-14 w-14 text-foreground/80 group-hover:text-green-500 transition-colors" />
                        </div>
                        <CardTitle className="text-2xl">Download for Android</CardTitle>
                        <CardDescription>Phones & Tablets</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center space-y-4">
                        <ul className="text-sm text-muted-foreground space-y-2 text-left max-w-[200px] mx-auto">
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Background Sync</li>
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Quick Actions</li>
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Creator Tools</li>
                        </ul>
                        <Button className="w-full" variant="outline" onClick={handleSendLink}>
                            <Download className="h-4 w-4 mr-2" />
                            Download APK
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Device Management */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Wifi className="h-5 w-5 text-primary" />
                        <CardTitle>Connected Devices</CardTitle>
                    </div>
                    <CardDescription>
                        Manage devices connected to your FlowAI account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                    ) : devices.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Smartphone className="h-12 w-12 mx-auto mb-3 opacity-20" />
                            <p>No mobile devices connected yet.</p>
                            <p className="text-sm">Download the app to get started!</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {devices.map((device) => (
                                <div key={device.id} className="flex items-center justify-between p-4 border rounded-lg">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                                            <Smartphone className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold">{device.device_name}</h4>
                                            <p className="text-sm text-muted-foreground">
                                                Last active: {new Date(device.last_active_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <Badge variant={device.is_active ? 'default' : 'secondary'}>
                                        {device.is_active ? 'Active' : 'Inactive'}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* PWA Install Guide */}
            <div className="mt-8 text-center bg-muted/30 p-6 rounded-xl">
                <h3 className="font-semibold mb-2">Prefer Web?</h3>
                <p className="text-sm text-muted-foreground">
                    You can also install FlowAI directly from your browser as a Progressive Web App (PWA).
                    Just open the menu and tap "Add to Home Screen".
                </p>
            </div>
        </div>
    );
};

export default MobileApp;
