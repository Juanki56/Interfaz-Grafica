import React from 'react';
import { 
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  Route,
  TreePine,
  Percent,
  Calendar,
  Users,
  Edit,
  Eye,
  Download
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { DashboardGrid } from './DashboardLayout';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from './ui/table';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

interface SalesDashboardProps {
  salesData: {
    monthlyStats: Array<{
      month: string;
      rutas: number;
      paquetes: number;
      fincas: number;
      total: number;
    }>;
    productDistribution: Array<{
      name: string;
      value: number;
      color: string;
      percentage: number;
    }>;
    topSales: Array<{
      id: number;
      item: string;
      type: string;
      sales: number;
      units: number;
      growth: number;
    }>;
    kpis: {
      totalRevenue: number;
      monthlyGrowth: number;
      averageTicket: number;
      conversionRate: number;
      totalBookings: number;
      pendingPayments: number;
    };
  };
}

export function SalesDashboard({ salesData }: SalesDashboardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const salesKPIs = [
    {
      title: 'Ingresos Totales',
      value: formatCurrency(salesData.kpis.totalRevenue),
      change: `+${salesData.kpis.monthlyGrowth}%`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      trend: 'up'
    },
    {
      title: 'Ticket Promedio',
      value: formatCurrency(salesData.kpis.averageTicket),
      change: '+12%',
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      trend: 'up'
    },
    {
      title: 'Tasa Conversión',
      value: `${salesData.kpis.conversionRate}%`,
      change: '+3.2%',
      icon: Percent,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      trend: 'up'
    },
    {
      title: 'Reservas Activas',
      value: salesData.kpis.totalBookings.toString(),
      change: '+18%',
      icon: Calendar,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      trend: 'up'
    }
  ];

  const KPICard = ({ kpi }) => {
    const Icon = kpi.icon;
    const TrendIcon = kpi.trend === 'up' ? ArrowUpRight : ArrowDownRight;
    
    return (
      <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm text-gray-600">{kpi.title}</p>
              <p className="text-2xl lg:text-3xl font-semibold text-gray-900">{kpi.value}</p>
              <div className="flex items-center space-x-1">
                <TrendIcon className="w-3 h-3 text-green-600" />
                <span className="text-sm font-medium text-green-600">{kpi.change}</span>
                <span className="text-xs text-gray-500">vs mes anterior</span>
              </div>
            </div>
            <div className={`p-3 rounded-full ${kpi.bgColor}`}>
              <Icon className={`w-6 h-6 ${kpi.color}`} />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ruta':
        return <Route className="w-4 h-4 text-green-600" />;
      case 'paquete':
        return <Package className="w-4 h-4 text-blue-600" />;
      case 'finca':
        return <TreePine className="w-4 h-4 text-orange-600" />;
      default:
        return <Package className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'ruta':
        return 'bg-green-100 text-green-700';
      case 'paquete':
        return 'bg-blue-100 text-blue-700';
      case 'finca':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Panel de Ventas</h1>
          <p className="text-gray-600">Análisis completo de ventas por rutas, paquetes y fincas</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button size="sm">
            <TrendingUp className="w-4 h-4 mr-2" />
            Ver Reportes
          </Button>
        </div>
      </div>

      {/* KPIs Grid */}
      <DashboardGrid columns={4}>
        {salesKPIs.map((kpi, index) => (
          <KPICard key={index} kpi={kpi} />
        ))}
      </DashboardGrid>

      {/* Charts Grid */}
      <DashboardGrid columns={2}>
        {/* Monthly Sales Chart */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2">
              <BarChart className="w-5 h-5" />
              <span>Ventas Mensuales por Categoría</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesData.monthlyStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
                  />
                  <Tooltip 
                    formatter={(value) => formatCurrency(value as number)}
                    labelStyle={{ color: '#374151' }}
                    contentStyle={{ 
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="rutas" 
                    stackId="1"
                    stroke="#22c55e" 
                    fill="#22c55e"
                    fillOpacity={0.6}
                    name="Rutas"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="paquetes" 
                    stackId="1"
                    stroke="#3b82f6" 
                    fill="#3b82f6"
                    fillOpacity={0.6}
                    name="Paquetes"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="fincas" 
                    stackId="1"
                    stroke="#f59e0b" 
                    fill="#f59e0b"
                    fillOpacity={0.6}
                    name="Fincas"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Product Distribution Pie Chart */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5" />
              <span>Distribución de Ventas</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={salesData.productDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {salesData.productDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => formatCurrency(value as number)}
                    contentStyle={{ 
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4">
              {salesData.productDistribution.map((item, index) => (
                <div key={index} className="text-center">
                  <div className="flex items-center justify-center space-x-2 mb-1">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm font-medium">{item.percentage}%</span>
                  </div>
                  <p className="text-xs text-gray-600">{item.name}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </DashboardGrid>

      {/* Top Sales Table */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5" />
              <span>Top Ventas por Producto</span>
            </CardTitle>
            <Badge variant="secondary" className="text-xs">
              Últimos 30 días
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Ventas</TableHead>
                  <TableHead>Unidades</TableHead>
                  <TableHead>Crecimiento</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesData.topSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        {getTypeIcon(sale.type)}
                        <span className="font-medium">{sale.item}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${getTypeBadgeColor(sale.type)}`}
                      >
                        {sale.type.charAt(0).toUpperCase() + sale.type.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(sale.sales)}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {sale.units}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <ArrowUpRight className="w-3 h-3 text-green-600" />
                        <span className="text-sm font-medium text-green-600">
                          +{sale.growth}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-1">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Trend */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5" />
            <span>Tendencia de Ingresos</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesData.monthlyStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
                />
                <Tooltip 
                  formatter={(value) => formatCurrency(value as number)}
                  labelStyle={{ color: '#374151' }}
                  contentStyle={{ 
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#6366f1" 
                  strokeWidth={3}
                  dot={{ fill: '#6366f1', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#6366f1', strokeWidth: 2 }}
                  name="Total Ingresos"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}