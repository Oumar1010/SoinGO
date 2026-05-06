import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import {
  CalendarIcon, UserGroupIcon, MapIcon, BoltIcon,
  ArrowTrendingUpIcon, ClockIcon, TruckIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface Stats {
  today: { visites: number; terminees: number; tauxCompletion: number };
  week:  { visites: number; distanceKm: number; tempsH: string };
  totaux: { patients: number; aidesSoignants: number };
  chart: { date: string; label: string; total: number; terminees: number; planifiees: number }[];
}

const FADE_UP = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.35 } },
};
const STAGGER = { show: { transition: { staggerChildren: 0.08 } } };
const PIE_COLORS = ['#2ECC71', '#E2E8F0'];

function StatCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string;
}) {
  return (
    <motion.div variants={FADE_UP} className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide truncate">{label}</p>
        <p className="text-2xl font-black text-gray-800 leading-tight">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </motion.div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-3 text-sm">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: <strong>{p.value}</strong></p>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  useEffect(() => {
    api.get('/stats/dashboard')
      .then(({ data }) => setStats(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const pieData = stats ? [
    { name: 'Terminées', value: stats.today.terminees },
    { name: 'Restantes', value: Math.max(0, stats.today.visites - stats.today.terminees) },
  ] : [];

  return (
    <div className="space-y-6">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-800">
            Bonjour, <span className="text-primary">{user?.nom?.split(' ')[0]}</span> 👋
          </h2>
          <p className="text-gray-400 text-sm capitalize mt-0.5">{today}</p>
        </div>
        <div className="flex gap-2">
          <Link to="/planning" className="btn-primary flex items-center gap-2 text-sm">
            <CalendarDaysIcon className="w-4 h-4" />
            Planning mensuel
          </Link>
          <Link to="/map" className="btn-accent flex items-center gap-2 text-sm">
            <BoltIcon className="w-4 h-4" />
            Optimiser
          </Link>
        </div>
      </motion.div>

      {/* KPI Cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-100 rounded-2xl" />
                <div className="space-y-2 flex-1">
                  <div className="h-3 bg-gray-100 rounded w-2/3" />
                  <div className="h-6 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <motion.div variants={STAGGER} initial="hidden" animate="show"
          className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Visites aujourd'hui"  value={stats?.today.visites ?? 0}
            sub={`${stats?.today.terminees ?? 0} terminée(s)`}
            icon={CalendarIcon} color="bg-primary" />
          <StatCard label="Taux de complétion"   value={`${stats?.today.tauxCompletion ?? 0}%`}
            sub="du planning du jour"
            icon={ArrowTrendingUpIcon} color="bg-success" />
          <StatCard label="Patients suivis"       value={stats?.totaux.patients ?? 0}
            sub="total actifs"
            icon={UserGroupIcon} color="bg-accent" />
          <StatCard label="Aides-soignants"        value={stats?.totaux.aidesSoignants ?? 0}
            sub={`${stats?.week.distanceKm ?? 0} km cette semaine`}
            icon={TruckIcon} color="bg-purple-500" />
        </motion.div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-3 gap-4">

        {/* Bar chart 7 jours */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-gray-800">Activité des 7 derniers jours</h3>
              <p className="text-xs text-gray-400">Visites planifiées vs terminées</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-primary/30 inline-block"/>Planifiées
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-success inline-block"/>Terminées
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats?.chart ?? []} barGap={3} barSize={16}>
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9CA3AF' }}
                axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#9CA3AF' }}
                axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F5F6FA', radius: 8 }} />
              <Bar dataKey="total"     name="Planifiées" fill="#2D8CFF"
                radius={[6,6,0,0]} opacity={0.3} />
              <Bar dataKey="terminees" name="Terminées"  fill="#2ECC71"
                radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Donut completion */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="card flex flex-col">
          <h3 className="font-bold text-gray-800 mb-0.5">Aujourd'hui</h3>
          <p className="text-xs text-gray-400 mb-3">Taux de complétion</p>
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-32 h-32 rounded-full bg-gray-100 animate-pulse" />
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="relative">
                <PieChart width={140} height={140}>
                  <Pie data={pieData} cx={65} cy={65} innerRadius={45} outerRadius={65}
                    startAngle={90} endAngle={-270} dataKey="value" strokeWidth={0}>
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                  </Pie>
                </PieChart>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-black text-gray-800">
                    {stats?.today.tauxCompletion ?? 0}%
                  </span>
                </div>
              </div>
              <p className="text-sm font-semibold text-gray-600 mt-1">
                {stats?.today.terminees}/{stats?.today.visites} visites
              </p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Semaine + Raccourcis */}
      <div className="grid grid-cols-3 gap-4">

        {/* Stats semaine */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card bg-gradient-to-br from-primary to-blue-500 text-white">
          <p className="text-xs font-semibold opacity-70 uppercase tracking-wide mb-4">Cette semaine</p>
          <div className="space-y-3">
            {[
              { icon: CalendarIcon, label: 'Visites', val: stats?.week.visites ?? 0 },
              { icon: TruckIcon,    label: 'Distance',val: `${stats?.week.distanceKm ?? 0} km` },
              { icon: ClockIcon,    label: 'Trajet',  val: stats?.week.tempsH ?? '0h00' },
            ].map(({ icon: Icon, label, val }) => (
              <div key={label}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 opacity-80">
                    <Icon className="w-4 h-4"/>
                    <span className="text-sm">{label}</span>
                  </div>
                  <span className="font-black text-xl">{val}</span>
                </div>
                <div className="h-px bg-white/20 mt-3" />
              </div>
            ))}
          </div>
        </motion.div>

        {/* Raccourcis */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }} className="col-span-2 card">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Actions rapides</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { to: '/planning',  label: 'Créer un planning',   Icon: CalendarDaysIcon, color: 'bg-purple-50 text-purple-600 hover:bg-purple-100 border border-purple-100' },
              { to: '/visits',    label: 'Visites du jour',     Icon: CalendarIcon,    color: 'bg-blue-50 text-primary hover:bg-blue-100 border border-blue-100' },
              { to: '/patients',  label: 'Gérer les patients',  Icon: UserGroupIcon,   color: 'bg-orange-50 text-accent hover:bg-orange-100 border border-orange-100' },
              { to: '/map',       label: 'Optimiser la tournée',Icon: MapIcon,         color: 'bg-green-50 text-success hover:bg-green-100 border border-green-100' },
            ].map(({ to, label, Icon, color }) => (
              <Link key={to} to={to}
                className={`flex items-center gap-3 p-4 rounded-xl transition-all ${color}`}>
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-semibold">{label}</span>
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
