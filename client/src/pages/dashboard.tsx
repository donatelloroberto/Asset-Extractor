import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Activity,
  Database,
  Zap,
  Copy,
  ExternalLink,
  RefreshCw,
  Server,
  Clock,
  Layers,
  BarChart3,
  CheckCircle2,
  XCircle,
  Trash2,
} from "lucide-react";
import type { AddonStatus } from "@shared/schema";

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (days > 0) return `${days}d ${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h ${mins}m ${secs}s`;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

export default function Dashboard() {
  const { toast } = useToast();

  const { data: status, isLoading, refetch } = useQuery<AddonStatus>({
    queryKey: ["/api/status"],
    refetchInterval: 5000,
  });

  const clearCacheMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/cache/clear"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/status"] });
      toast({ title: "Cache cleared", description: "All cached data has been removed." });
    },
  });

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const manifestUrl = `${baseUrl}/manifest.json`;
  const stremioInstallUrl = `stremio://${window.location.host}/manifest.json`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: `${label} copied to clipboard.` });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        <header className="space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary/10">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight" data-testid="text-addon-title">
                GXtapes Stremio Add-on
              </h1>
              <p className="text-muted-foreground text-sm">
                Cloudstream 3 extension converted to Stremio add-on
              </p>
            </div>
          </div>
        </header>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-8 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : status ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Activity className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Status</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                    <span className="text-lg font-semibold" data-testid="text-status">Online</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Uptime</span>
                  </div>
                  <span className="text-lg font-semibold" data-testid="text-uptime">
                    {formatUptime(status.uptime)}
                  </span>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Layers className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Catalogs</span>
                  </div>
                  <span className="text-lg font-semibold" data-testid="text-catalogs">
                    {status.catalogs}
                  </span>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Database className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Cache</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-semibold" data-testid="text-cache-keys">
                      {status.cacheStats.keys} keys
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
                  <CardTitle className="text-base font-semibold">Install in Stremio</CardTitle>
                  <Server className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Manifest URL</label>
                    <div className="flex items-center gap-2">
                      <code
                        className="flex-1 text-xs bg-muted px-3 py-2 rounded-md overflow-x-auto font-mono"
                        data-testid="text-manifest-url"
                      >
                        {manifestUrl}
                      </code>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => copyToClipboard(manifestUrl, "Manifest URL")}
                        data-testid="button-copy-manifest"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button
                      variant="default"
                      onClick={() => window.open(stremioInstallUrl, "_blank")}
                      data-testid="button-install-stremio"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open in Stremio
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Or paste the manifest URL into Stremio's add-on search bar.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
                  <CardTitle className="text-base font-semibold">Cache Statistics</CardTitle>
                  <BarChart3 className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                        <span className="text-xs text-muted-foreground">Hits</span>
                      </div>
                      <span className="text-xl font-bold" data-testid="text-cache-hits">
                        {status.cacheStats.hits}
                      </span>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <XCircle className="w-3 h-3 text-orange-500" />
                        <span className="text-xs text-muted-foreground">Misses</span>
                      </div>
                      <span className="text-xl font-bold" data-testid="text-cache-misses">
                        {status.cacheStats.misses}
                      </span>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Database className="w-3 h-3 text-blue-500" />
                        <span className="text-xs text-muted-foreground">Keys</span>
                      </div>
                      <span className="text-xl font-bold">
                        {status.cacheStats.keys}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => refetch()}
                      data-testid="button-refresh-stats"
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Refresh
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => clearCacheMutation.mutate()}
                      disabled={clearCacheMutation.isPending}
                      data-testid="button-clear-cache"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Clear Cache
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
                <CardTitle className="text-base font-semibold">API Endpoints</CardTitle>
                <Zap className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {status.endpoints.map((ep) => (
                    <div
                      key={ep.path}
                      className="flex items-center justify-between gap-2 py-2 border-b last:border-b-0"
                      data-testid={`row-endpoint-${ep.path.replace(/\//g, "-")}`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <Badge variant="secondary" className="text-xs shrink-0">GET</Badge>
                        <code className="text-xs font-mono text-muted-foreground truncate">{ep.path}</code>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0 hidden sm:block">
                        {ep.description}
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          const testPath = ep.path
                            .replace("{catalogId}", "gxtapes-latest")
                            .replace("{id}", "test");
                          window.open(`${baseUrl}${testPath}`, "_blank");
                        }}
                        data-testid={`button-test-${ep.path.replace(/\//g, "-")}`}
                      >
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
                <CardTitle className="text-base font-semibold">Available Catalogs</CardTitle>
                <Layers className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <CatalogList baseUrl={baseUrl} />
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <XCircle className="w-12 h-12 text-destructive mx-auto mb-3" />
              <p className="text-lg font-semibold">Unable to connect</p>
              <p className="text-sm text-muted-foreground mt-1">
                The add-on server is not responding. Please check the logs.
              </p>
              <Button variant="outline" className="mt-4" onClick={() => refetch()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function CatalogList({ baseUrl }: { baseUrl: string }) {
  const { data: catalogs, isLoading } = useQuery<Array<{ type: string; id: string; name: string }>>({
    queryKey: ["/api/catalogs"],
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (!catalogs || catalogs.length === 0) {
    return <p className="text-sm text-muted-foreground">No catalogs available.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
      {catalogs.map((cat) => (
        <div
          key={cat.id}
          className="flex items-center justify-between gap-2 p-3 rounded-md border"
          data-testid={`card-catalog-${cat.id}`}
        >
          <div className="min-w-0 flex-1">
            <span className="text-sm font-medium truncate block">{cat.name}</span>
            <span className="text-xs text-muted-foreground font-mono">{cat.id}</span>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => {
              window.open(`${baseUrl}/catalog/movie/${cat.id}.json`, "_blank");
            }}
            data-testid={`button-test-catalog-${cat.id}`}
          >
            <ExternalLink className="w-3 h-3" />
          </Button>
        </div>
      ))}
    </div>
  );
}
