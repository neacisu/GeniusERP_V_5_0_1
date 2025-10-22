/**
 * Analytics Alerts Page
 * 
 * Pagină pentru gestionarea alertelor analitice
 */

import React, { useState } from 'react';
import { useAnalyticsAlerts } from '../../hooks/useAnalyticsAlerts';
import { Link } from 'wouter';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertTriangle, 
  Search, 
  PlusCircle, 
  MoreVertical, 
  CheckCircle, 
  Edit, 
  Trash2, 
  Bell, 
  ArrowUpRight, 
  Clock, 
  Filter, 
  Calendar, 
  User, 
  RefreshCw
} from 'lucide-react';
import { AnalyticsEmptyState } from '../../components/common/AnalyticsEmptyState';
import { AnalyticsLayout } from '../../components/common/AnalyticsLayout';

export default function AlertsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  
  const { 
    alerts, 
    history, 
    totalAlerts,
    isLoadingAlerts, 
    isLoadingHistory, 
    deleteAlert, 
    isDeleting, 
    acknowledgeAlert, 
    isAcknowledging 
  } = useAnalyticsAlerts({
    severity: filterSeverity !== 'all' ? filterSeverity : undefined,
    status: filterStatus !== 'all' ? filterStatus : undefined,
    search: searchQuery,
    limit: 10
  });
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search este deja actualizat prin state
  };
  
  const handleAcknowledgeAlert = (id: string) => {
    acknowledgeAlert(id);
  };
  
  const handleDeleteAlert = (id: string) => {
    deleteAlert(id);
    setConfirmDeleteId(null);
  };
  
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return "bg-red-100 text-red-800 hover:bg-red-200";
      case 'high':
        return "bg-amber-100 text-amber-800 hover:bg-amber-200";
      case 'medium':
        return "bg-orange-100 text-orange-800 hover:bg-orange-200";
      case 'low':
        return "bg-blue-100 text-blue-800 hover:bg-blue-200";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return "bg-green-100 text-green-800 hover:bg-green-200";
      case 'triggered':
        return "bg-red-100 text-red-800 hover:bg-red-200";
      case 'acknowledged':
        return "bg-blue-100 text-blue-800 hover:bg-blue-200";
      case 'inactive':
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ro-RO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };
  
  return (
    <AnalyticsLayout activeTab="alerts">
      <div className="space-y-6">
        {/* Header and filters */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex-1 w-full md:w-auto">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Căutare alerte..."
                className="pl-9 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
            <div className="flex gap-2">
              <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Severitate" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toate severitățile</SelectItem>
                  <SelectItem value="critical">Critică</SelectItem>
                  <SelectItem value="high">Înaltă</SelectItem>
                  <SelectItem value="medium">Medie</SelectItem>
                  <SelectItem value="low">Scăzută</SelectItem>
                  <SelectItem value="info">Informativă</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toate statusurile</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="triggered">Declanșate</SelectItem>
                  <SelectItem value="acknowledged">Confirmate</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" className="flex gap-1" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
            
            <Button asChild>
              <Link href="/analytics/alerts/create">
                <PlusCircle className="h-4 w-4 mr-2" />
                Alertă nouă
              </Link>
            </Button>
          </div>
        </div>
        
        {/* Tabs */}
        <Tabs defaultValue="alerts" className="w-full">
          <TabsList className="w-full md:w-auto">
            <TabsTrigger value="alerts">Alerte active</TabsTrigger>
            <TabsTrigger value="history">Istoric alerte</TabsTrigger>
          </TabsList>
          
          <TabsContent value="alerts" className="mt-6">
            {isLoadingAlerts ? (
              <div className="flex justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : alerts.length === 0 ? (
              <AnalyticsEmptyState
                title="Nicio alertă găsită"
                description="Nu există alerte care să corespundă criteriilor de căutare sau nu a fost creată nicio alertă încă."
                icon={<AlertTriangle className="h-full w-full" />}
                action={{
                  label: "Creează alertă nouă",
                  href: "/analytics/alerts/create"
                }}
                variant="card"
              />
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[300px]">Nume alertă</TableHead>
                      <TableHead>Severitate</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Condiție</TableHead>
                      <TableHead>Ultima declanșare</TableHead>
                      <TableHead className="text-right">Acțiuni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alerts.map((alert) => (
                      <TableRow key={alert.id}>
                        <TableCell className="font-medium">
                          <Link href={`/analytics/alerts/${alert.id}`} className="hover:underline flex items-center">
                            <Bell className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span>{alert.name}</span>
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={getSeverityColor(alert.severity)}
                          >
                            {alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={getStatusColor(alert.status)}
                          >
                            {alert.status.charAt(0).toUpperCase() + alert.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm truncate max-w-xs">
                            {alert.condition.metricName || "Metric"} {' '}
                            {alert.condition.operator === 'gt' ? '>' : 
                              alert.condition.operator === 'lt' ? '<' : 
                              alert.condition.operator === 'eq' ? '=' : 
                              alert.condition.operator === 'gte' ? '>=' : 
                              alert.condition.operator === 'lte' ? '<=' : 
                              alert.condition.operator === 'neq' ? '!=' : 
                              alert.condition.operator} {' '}
                            {alert.condition.threshold}
                          </div>
                        </TableCell>
                        <TableCell>
                          {alert.lastTriggered ? (
                            <div className="flex items-center">
                              <Clock className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                              <span>{formatDate(alert.lastTriggered)}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Niciodată</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end items-center gap-1">
                            {alert.status === 'triggered' && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleAcknowledgeAlert(alert.id)}
                                disabled={isAcknowledging}
                              >
                                <CheckCircle className="h-4 w-4" />
                                <span className="sr-only">Confirmă</span>
                              </Button>
                            )}
                            
                            <Button variant="ghost" size="icon" asChild>
                              <Link href={`/analytics/alerts/${alert.id}`}>
                                <ArrowUpRight className="h-4 w-4" />
                                <span className="sr-only">Vizualizare</span>
                              </Link>
                            </Button>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                  <span className="sr-only">Acțiuni</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Acțiuni</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                  <Link href={`/analytics/alerts/${alert.id}/edit`} className="cursor-pointer">
                                    <Edit className="h-4 w-4 mr-2" />
                                    <span>Editează</span>
                                  </Link>
                                </DropdownMenuItem>
                                {alert.status === 'active' ? (
                                  <DropdownMenuItem>
                                    <Bell className="h-4 w-4 mr-2 text-muted-foreground" />
                                    <span>Dezactivează</span>
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem>
                                    <Bell className="h-4 w-4 mr-2 text-green-600" />
                                    <span>Activează</span>
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => setConfirmDeleteId(alert.id)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  <span>Șterge</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="history" className="mt-6">
            {isLoadingHistory ? (
              <div className="flex justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : history.length === 0 ? (
              <AnalyticsEmptyState
                title="Niciun istoric de alerte"
                description="Nu a fost înregistrată nicio alertă în istoric."
                icon={<Clock className="h-full w-full" />}
                variant="card"
              />
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Alertă</TableHead>
                      <TableHead>Severitate</TableHead>
                      <TableHead>Declanșată la</TableHead>
                      <TableHead>Confirmată la</TableHead>
                      <TableHead>Rezolvată la</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-medium">
                          <Link href={`/analytics/alerts/${entry.alertId}`} className="hover:underline flex items-center">
                            <AlertTriangle className={`h-4 w-4 mr-2 ${
                              entry.severity === 'critical' ? 'text-red-600' : 
                              entry.severity === 'high' ? 'text-amber-600' : 
                              entry.severity === 'medium' ? 'text-orange-600' : 
                              entry.severity === 'low' ? 'text-blue-600' : 
                              'text-gray-600'
                            }`} />
                            <span>{entry.alertName}</span>
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={getSeverityColor(entry.severity)}
                          >
                            {entry.severity.charAt(0).toUpperCase() + entry.severity.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Calendar className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                            <span>{formatDate(entry.triggeredAt)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {entry.acknowledgedAt ? (
                            <div className="flex items-center">
                              <Clock className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                              <span>{formatDate(entry.acknowledgedAt)}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {entry.resolvedAt ? (
                            <div className="flex items-center">
                              <CheckCircle className="h-3.5 w-3.5 mr-1.5 text-green-600" />
                              <span>{formatDate(entry.resolvedAt)}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={
                              entry.resolvedAt 
                                ? "bg-green-100 text-green-800" 
                                : entry.acknowledgedAt
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-red-100 text-red-800"
                            }
                          >
                            {entry.resolvedAt 
                              ? "Rezolvată" 
                              : entry.acknowledgedAt
                                ? "Confirmată"
                                : "Declanșată"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        {/* Delete confirmation dialog */}
        <Dialog open={!!confirmDeleteId} onOpenChange={(open) => !open && setConfirmDeleteId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmare ștergere</DialogTitle>
              <DialogDescription>
                Sunteți sigur că doriți să ștergeți această alertă? Această acțiune nu poate fi anulată.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setConfirmDeleteId(null)}
                disabled={isDeleting}
              >
                Anulează
              </Button>
              <Button
                variant="destructive"
                onClick={() => confirmDeleteId && handleDeleteAlert(confirmDeleteId)}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    <span>Ștergere...</span>
                  </>
                ) : (
                  'Șterge alerta'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AnalyticsLayout>
  );
}