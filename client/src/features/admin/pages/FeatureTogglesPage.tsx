import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/api/endpoints/admin';
import { AdminHeader } from '../components/AdminHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/providers/ToastProvider';
import { Loader2, RotateCcw, Settings2 } from 'lucide-react';
import type { FeatureToggle } from '@/types/admin';

const categoryColors: Record<string, string> = {
  general: 'bg-blue-100 text-blue-700',
  payment: 'bg-green-100 text-green-700',
  social: 'bg-purple-100 text-purple-700',
  ai: 'bg-orange-100 text-orange-700',
  communication: 'bg-teal-100 text-teal-700',
  security: 'bg-red-100 text-red-700',
};

export function FeatureTogglesPage() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const { data: featuresRes, isLoading } = useQuery({
    queryKey: ['admin', 'features'],
    queryFn: () => adminApi.getFeatures().then(r => r.data),
  });

  const updateMutation = useMutation({
    mutationFn: ({ key, enabled }: { key: string; enabled: boolean }) => adminApi.updateFeature(key, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'features'] });
      addToast({ title: 'Feature updated', variant: 'success' });
    },
    onError: () => addToast({ title: 'Failed to update feature', variant: 'error' }),
  });

  const seedMutation = useMutation({
    mutationFn: () => adminApi.seedFeatures(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'features'] });
      addToast({ title: 'Features reset to defaults', variant: 'success' });
    },
    onError: () => addToast({ title: 'Failed to seed features', variant: 'error' }),
  });

  const features = featuresRes?.data as FeatureToggle[] | undefined;
  const grouped = features?.reduce<Record<string, FeatureToggle[]>>((acc, f) => {
    if (!acc[f.category]) acc[f.category] = [];
    acc[f.category].push(f);
    return acc;
  }, {}) || {};

  if (isLoading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <AdminHeader title="Feature Toggles" description="Enable or disable platform features" />
        <Button variant="outline" size="sm" onClick={() => seedMutation.mutate()} disabled={seedMutation.isPending}>
          <RotateCcw className="mr-1 h-4 w-4" /> Reset to Defaults
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {Object.entries(grouped).map(([category, toggles]) => (
          <Card key={category}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Settings2 className="h-4 w-4" />
                <span className="capitalize">{category}</span>
                <Badge variant="outline" className="text-xs ml-auto">{toggles.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {toggles.map((feature) => (
                <div
                  key={feature.key}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{feature.name}</p>
                      <Badge variant="outline" className={`text-xs ${categoryColors[feature.category] || ''}`}>
                        {feature.category}
                      </Badge>
                    </div>
                    {feature.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{feature.description}</p>
                    )}
                  </div>
                  <Switch
                    checked={feature.enabled}
                    onCheckedChange={(checked) => updateMutation.mutate({ key: feature.key, enabled: checked })}
                    disabled={updateMutation.isPending}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
