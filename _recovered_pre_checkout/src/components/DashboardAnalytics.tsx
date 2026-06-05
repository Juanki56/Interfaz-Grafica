import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  Calendar,
  Filter,
  RefreshCw,
  BarChart3,
  DollarSign,
  Package,
  CreditCard,
  TrendingUp,
  Users,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { toast } from 'sonner';
import {
  dashboardAPI,
  type DashboardResumenData,
  type DashboardSerieBucket,
} from '../services/api';

type Preset = 'week' | 'month' | 'quarter' | 'year' | 'custom';

const PIE_COLORS = ['#22c55e', '#eab308', '#ef4444', '#3b82f6', '#a855f7', '#64748b'];

function toYMDLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDaysLocal(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function startOfMonthLocal(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function startOfQuarterLocal(d: Date): Date {
  const q = Math.floor(d.getMonth() / 3) * 3;
  return new Date(d.getFullYear(), q, 1);
}

function startOfYearLocal(d: Date): Date {
  return new Date(d.getFullYear(), 0, 1);
}

function resolvePresetRange(preset: Preset, customStart: string, customEnd: string): { desde: string; hasta: string } {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const hasta = toYMDLocal(today);

  if (preset === 'custom') {
    return {
      desde: customStart || toYMDLocal(addDaysLocal(today, -30)),
      hasta: customEnd || hasta,
    };
  }

  if (preset === 'week') {
    return { desde: toYMDLocal(addDaysLocal(today, -6)), hasta };
  }

  if (preset === 'month') {
    return { desde: toYMDLocal(startOfMonthLocal(today)), hasta };
  }

  if (preset === 'quarter') {
    return { desde: toYMDLocal(startOfQuarterLocal(today)), hasta };
  }

  /* year */
  return { desde: toYMDLocal(startOfYearLocal(today)), hasta };
}

function formatMoneyCOP(value: number): string {
  return `$${Math.round(Number(value || 0)).toLocaleString('es-CO')}`;
}

function formatBucketLabel(iso: string, agrupacion: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);

  if (agrupacion === 'day') {
    return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
  }

  if (agrupacion === 'week') {
    return `Sem. ${d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}`;
  }

  return d.toLocaleDateString('es-CO', { month: 'short', year: 'numeric' });
}

function estadoReservaColor(estado: string): string {
  const e = estado.trim().toLowerCase();
  if (e === 'confirmada') return '#22c55e';
  if (e === 'pendiente') return '#eab308';
  if (e === 'cancelada') return '#ef4444';
  if (e === 'completada') return '#3b82f6';
  return '#64748b';
}

function estadoVentaColor(estado: string): string {
  const e = estado.trim().toLowerCase();
  if (e === 'pagado') return '#22c55e';
  if (e === 'parcial') return '#eab308';
  if (e === 'pendiente') return '#94a3b8';
  if (e.includes('cancel')) return '#ef4444';
  return '#3b82f6';
}

function mapSerieToChart(
  rows: DashboardSerieBucket[],
  agrupacion: string,
  mapper: (r: DashboardSerieBucket) => Record<string, string | number | undefined>,
) {
  return rows.map((r) => ({
    label: formatBucketLabel(r.bucket_iso, agrupacion),
    ...mapper(r),
  }));
}

export function DashboardAnalytics() {
  const today = useMemo(() => {
    const t = new Date();
    t.setHours(12, 0, 0, 0);
    return t;
  }, []);

  const defaultCustomStart = useMemo(() => toYMDLocal(addDaysLocal(today, -30)), [today]);

  const [preset, setPreset] = useState<Preset>('month');
  const [customStart, setCustomStart] = useState(defaultCustomStart);
  const [customEnd, setCustomEnd] = useState(() => toYMDLocal(new Date()));

  const [agrupManual, setAgrupManual] = useState<'auto' | 'day' | 'week' | 'month'>('auto');

  const [data, setData] = useState<DashboardResumenData | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const period = useMemo(
    () => resolvePresetRange(preset, customStart, customEnd),
    [preset, customStart, customEnd],
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    setLastError(null);
    try {
      const res = await dashboardAPI.getResumen({
        fecha_inicio: period.desde,
        fecha_fin: period.hasta,
        agrupacion: agrupManual === 'auto' ? undefined : agrupManual,
      });
      setData(res);
    } catch (e: any) {
      const msg =
        e?.message ||
        'No se pudo cargar el resumen del dashboard. Verifica permiso dashboard.leer y el API.';
      setLastError(msg);
      toast.error(msg);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [period.desde, period.hasta, agrupManual]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const agrupacionEfectiva = data?.periodo?.agrupacion ?? 'month';

  const pieReservas = useMemo(() => {
    if (!data) return [];
    return data.reservas.por_estado
      .filter((x) => x.total > 0)
      .map((x, i) => ({
        name: x.estado,
        value: x.total,
        color: estadoReservaColor(x.estado) || PIE_COLORS[i % PIE_COLORS.length],
      }));
  }, [data]);

  const pieVentas = useMemo(() => {
    if (!data) return [];
    return data.ventas.por_estado_tabla
      .filter((x) => x.total > 0)
      .map((x, i) => ({
        name: x.estado_pago,
        value: x.total,
        color: estadoVentaColor(x.estado_pago) || PIE_COLORS[i % PIE_COLORS.length],
      }));
  }, [data]);

  const barReservas = useMemo(() => {
    if (!data) return [];
    return mapSerieToChart(data.reservas.serie_temporal, agrupacionEfectiva, (r) => ({
      reservas: r.total ?? 0,
      confirmadas: r.confirmadas ?? 0,
    }));
  }, [data, agrupacionEfectiva]);

  const barVentas = useMemo(() => {
    if (!data) return [];
    return mapSerieToChart(data.ventas.serie_temporal, agrupacionEfectiva, (r) => ({
      ventas: r.total ?? 0,
      monto: Number(r.monto_total ?? 0),
    }));
  }, [data, agrupacionEfectiva]);

  const lineIngresos = useMemo(() => {
    if (!data) return [];
    return mapSerieToChart(data.pagos.ingresos_serie, agrupacionEfectiva, (r) => ({
      ingresos: Number(r.monto_aprobado ?? 0),
    }));
  }, [data, agrupacionEfectiva]);

  const lineIngresosMensualExtra = useMemo(() => {
    if (!data || !data.pagos.ingresos_mensuales.length) return [];
    return data.pagos.ingresos_mensuales.map((m) => ({
      label: formatBucketLabel(m.bucket_iso, 'month'),
      mensual: m.monto_aprobado,
    }));
  }, [data]);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-green-800 tracking-tight">Dashboard</h2>
            <p className="text-gray-600 mt-1">
              Estadísticas en vivo de reservas, ventas e ingresos por abonos (según el período seleccionado).
            </p>
          </div>
          <Button
            variant="outline"
            disabled={loading}
            onClick={() => void fetchData()}
            className="border-green-600 text-green-700 hover:bg-green-50 shrink-0"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>

        <Card className="border-green-100 shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center gap-2">
            <Filter className="h-5 w-5 text-green-700" />
            <CardTitle className="text-lg text-green-900">Filtros de período</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <Label>Período</Label>
              <Select value={preset} onValueChange={(v) => setPreset(v as Preset)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Semanal (últimos 7 días)</SelectItem>
                  <SelectItem value="month">Mensual (mes en curso)</SelectItem>
                  <SelectItem value="quarter">Trimestral (trimestre en curso)</SelectItem>
                  <SelectItem value="year">Anual (año en curso)</SelectItem>
                  <SelectItem value="custom">Rango personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Agrupación de gráficas</Label>
              <Select value={agrupManual} onValueChange={(v) => setAgrupManual(v as typeof agrupManual)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Automática</SelectItem>
                  <SelectItem value="day">Por día</SelectItem>
                  <SelectItem value="week">Por semana</SelectItem>
                  <SelectItem value="month">Por mes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {preset === 'custom' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="dash-finicio">Desde</Label>
                  <Input id="dash-finicio" type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dash-ffin">Hasta</Label>
                  <Input id="dash-ffin" type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} />
                </div>
              </>
            )}
            {preset !== 'custom' && (
              <div className="md:col-span-2 lg:col-span-2 flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4 shrink-0 text-green-700" />
                <span>
                  <strong>Rango aplicado:</strong> {period.desde} → {period.hasta}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {lastError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
            {lastError}
          </div>
        )}

        {loading && !data && (
          <div className="text-center py-16 text-gray-500">Cargando métricas del dashboard...</div>
        )}

        {data && (
          <>
            {/* KPI */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <Card className="border-green-100">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Users className="w-4 h-4" /> Reservas (período)
                      </p>
                      <p className="text-2xl font-bold text-green-800 mt-1">{data.reservas.total}</p>
                      <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-600">
                        <span>
                          Pend. <strong className="text-amber-600">{data.reservas.pendientes}</strong>
                        </span>
                        <span>
                          Conf. <strong className="text-green-700">{data.reservas.confirmadas}</strong>
                        </span>
                        <span>
                          Canc. <strong className="text-red-600">{data.reservas.canceladas}</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-green-100">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Package className="w-4 h-4" /> Ventas totales (período)
                      </p>
                      <p className="text-2xl font-bold text-green-800 mt-1">{data.ventas.total_periodo}</p>
                      <p className="text-xs text-gray-600 mt-2 flex items-center gap-1 flex-wrap">
                        <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                        Este mes hasta fin de período:
                        <strong>{data.ventas.ventas_mes}</strong> ventas
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Facturación: <strong>{formatMoneyCOP(data.ventas.monto_total_periodo)}</strong> · Cobrado:{' '}
                        <strong>{formatMoneyCOP(data.ventas.monto_pagado_periodo)}</strong>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-green-100">
                <CardContent className="pt-6">
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <CreditCard className="w-4 h-4" /> Abonos / ingresos
                    </p>
                    <p className="text-lg font-semibold text-gray-700 mt-1">Estado ventas</p>
                    <div className="mt-2 space-y-1 text-xs">
                      {(data.ventas.por_estado_tabla ?? []).slice(0, 6).map((r) => (
                        <div key={r.estado_pago} className="flex justify-between border-b border-green-50 py-1">
                          <span>{r.estado_pago}</span>
                          <strong>{r.total}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-green-100 bg-gradient-to-br from-green-50/80 to-white">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <DollarSign className="w-4 h-4" /> Dinero recibido (abonos aprobados · período)
                  </p>
                  <p className="text-2xl font-bold text-green-900 mt-1">{formatMoneyCOP(data.pagos.dinero_recibido)}</p>
                  <div className="mt-4 text-xs text-gray-700 space-y-1">
                    <p>
                      Abonos pendientes: <strong>{data.pagos.abonos_pendientes_cantidad}</strong> (
                      <strong>{formatMoneyCOP(data.pagos.abonos_pendientes_monto)}</strong>)
                    </p>
                    <p className="text-muted-foreground">
                      Agrupación activa en gráficas: <strong>{data.periodo.agrupacion}</strong>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts row 1: pies */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-green-200">
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                  <CardTitle className="text-green-800 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Distribución por estado — Reservas
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  {!pieReservas.length ? (
                    <p className="text-sm text-gray-500 py-16 text-center">Sin datos para el período.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={320}>
                      <PieChart>
                        <Pie
                          data={pieReservas}
                          dataKey="value"
                          cx="50%"
                          cy="50%"
                          outerRadius={110}
                          label={({ name, percent }) =>
                            `${name} ${percent != null ? (percent * 100).toFixed(0) : 0}%`
                          }
                          labelLine={false}
                        >
                          {pieReservas.map((e, idx) => (
                            <Cell key={e.name + idx} fill={e.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: number) => [Number(v || 0), 'Cantidad']} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card className="border-green-200">
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                  <CardTitle className="text-green-800 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Distribución por estado — Ventas
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  {!pieVentas.length ? (
                    <p className="text-sm text-gray-500 py-16 text-center">Sin datos para el período.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={320}>
                      <PieChart>
                        <Pie
                          data={pieVentas}
                          dataKey="value"
                          cx="50%"
                          cy="50%"
                          outerRadius={110}
                          label={({ name, percent }) =>
                            `${name} ${percent != null ? (percent * 100).toFixed(0) : 0}%`
                          }
                          labelLine={false}
                        >
                          {pieVentas.map((e, idx) => (
                            <Cell key={e.name + idx} fill={e.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: number) => [Number(v || 0), 'Ventas']} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Line ingresos + monthly aggregate */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <Card className="border-green-200 xl:col-span-2">
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                  <CardTitle className="text-green-800">Ingresos / Abonos aprobados (línea)</CardTitle>
                  <p className="text-sm font-normal text-muted-foreground">
                    Por fecha de verificación del comprobante (o fecha de envío si aplica).
                  </p>
                </CardHeader>
                <CardContent className="pt-6">
                  {!lineIngresos.length ? (
                    <p className="text-sm text-gray-500 py-12 text-center">Sin ingresos aprobados en el período.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={320}>
                      <LineChart data={lineIngresos}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(Number(v) / 1e6).toFixed(1)}M`} />
                        <Tooltip
                          formatter={(v: number) => [formatMoneyCOP(Number(v || 0)), 'Ingreso']}
                          labelFormatter={(_, payload) =>
                            payload && payload[0]?.payload?.label ? String(payload[0].payload.label) : ''
                          }
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="ingresos"
                          name="Abonos aprobados"
                          stroke="#059669"
                          strokeWidth={2}
                          dot={{ r: 3 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card className="border-green-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-green-900">Ingresos mensuales (dentro del período)</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2 max-h-[360px] overflow-y-auto">
                  {!lineIngresosMensualExtra.length ? (
                    <p className="text-gray-500">Sin datos mensuales.</p>
                  ) : (
                    lineIngresosMensualExtra.map((row, i) => (
                      <div
                        key={i}
                        className="flex justify-between border-b border-green-100 py-1.5 last:border-0"
                      >
                        <span className="text-gray-700">{row.label}</span>
                        <span className="font-semibold text-green-800">{formatMoneyCOP(row.mensual)}</span>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Bars reservas y ventas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-green-200">
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                  <CardTitle className="text-green-800">Reservas por período (barras)</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  {!barReservas.length ? (
                    <p className="text-sm text-gray-500 py-12 text-center">Sin reservas en el período.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart data={barReservas}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={agrupacionEfectiva === 'day' ? 2 : 0} />
                        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="reservas" name="Total reservas" fill="#059669" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card className="border-green-200">
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                  <CardTitle className="text-green-800">Ventas por período (barras)</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  {!barVentas.length ? (
                    <p className="text-sm text-gray-500 py-12 text-center">Sin ventas en el período.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart data={barVentas}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={agrupacionEfectiva === 'day' ? 2 : 0} />
                        <YAxis yAxisId="left" orientation="left" tick={{ fontSize: 11 }} allowDecimals={false} />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          tick={{ fontSize: 11 }}
                          tickFormatter={(v) => `$${(Number(v) / 1e6).toFixed(1)}M`}
                        />
                        <Tooltip
                          formatter={(value: unknown, key: unknown) =>
                            key === 'monto' ? formatMoneyCOP(Number(value ?? 0)) : value
                          }
                        />
                        <Legend />
                        <Bar yAxisId="left" dataKey="ventas" name="Nº ventas" fill="#0369a1" radius={[4, 4, 0, 0]} />
                        <Bar yAxisId="right" dataKey="monto" name="Facturación" fill="#eab308" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
