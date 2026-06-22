import React, { useState, useEffect } from 'react';
import PageContainer from '../components/layout/PageContainer';
import { Award, Flame, FileText, Calendar, ArrowRight, BookOpen } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../services/api';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalNotes: 0,
    averageAccuracy: 0,
    studyStreak: 0,
    totalQuizzesAttempted: 0,
    studyActivity: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await api.get('/analytics');
      setStats(res.data);
    } catch (err) {
      console.error('Failed to load dashboard stats', err);
    } finally {
      setLoading(false);
    }
  };

  const activityData = stats.studyActivity.map(log => ({
    date: new Date(log.date).toLocaleDateString([], { month: 'short', day: 'numeric' }),
    Count: 1 // represents 1 activity log entry
  }));

  const recentLogs = stats.studyActivity.slice(0, 4);

  return (
    <PageContainer title="Student Dashboard" subtitle="Track your study streaks, notes, and AI quiz metrics.">
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Study Streak */}
            <div className="glass rounded-3xl p-6 border border-border/60 hover:shadow-lg transition-all duration-200 flex items-center gap-5">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Flame size={24} className="fill-amber-500/10" />
              </div>
              <div>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Study Streak</span>
                <span className="text-3xl font-extrabold tracking-tight mt-1 block">{stats.studyStreak} Days</span>
              </div>
            </div>

            {/* Total Notes */}
            <div className="glass rounded-3xl p-6 border border-border/60 hover:shadow-lg transition-all duration-200 flex items-center gap-5">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <FileText size={24} />
              </div>
              <div>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Total Notes</span>
                <span className="text-3xl font-extrabold tracking-tight mt-1 block">{stats.totalNotes}</span>
              </div>
            </div>

            {/* Quiz Accuracy */}
            <div className="glass rounded-3xl p-6 border border-border/60 hover:shadow-lg transition-all duration-200 flex items-center gap-5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <Award size={24} />
              </div>
              <div>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Quiz Accuracy</span>
                <span className="text-3xl font-extrabold tracking-tight mt-1 block">
                  {stats.averageAccuracy ? `${stats.averageAccuracy.toFixed(1)}%` : '0%'}
                </span>
              </div>
            </div>

            {/* Quizzes Attempted */}
            <div className="glass rounded-3xl p-6 border border-border/60 hover:shadow-lg transition-all duration-200 flex items-center gap-5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                <BookOpen size={24} />
              </div>
              <div>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Quizzes Done</span>
                <span className="text-3xl font-extrabold tracking-tight mt-1 block">{stats.totalQuizzesAttempted}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart Area */}
            <div className="glass rounded-3xl p-6 border border-border/60 lg:col-span-2 flex flex-col gap-4">
              <div>
                <h3 className="font-bold text-lg text-foreground">Study Progress</h3>
                <p className="text-xs text-muted-foreground">Activity logs aggregated over time</p>
              </div>

              <div className="h-64 w-full">
                {activityData.length === 0 ? (
                  <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">
                    Upload notes or complete quizzes to start visualizing activity data.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={activityData}>
                      <defs>
                        <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.25}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip />
                      <Area type="monotone" dataKey="Count" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorActivity)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Recent Logs & Quick Actions */}
            <div className="flex flex-col gap-6">
              {/* Quick Actions */}
              <div className="glass rounded-3xl p-6 border border-border/60 flex flex-col gap-4">
                <h3 className="font-bold text-lg text-foreground">Quick Actions</h3>
                <div className="flex flex-col gap-3">
                  <Link 
                    to="/notes" 
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-secondary hover:bg-muted text-foreground text-sm font-medium transition-all group"
                  >
                    <span>Upload Study Material</span>
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link 
                    to="/chat" 
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-secondary hover:bg-muted text-foreground text-sm font-medium transition-all group"
                  >
                    <span>Chat with AI Tutor</span>
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>

              {/* Study Log */}
              <div className="glass rounded-3xl p-6 border border-border/60 flex-1 flex flex-col gap-4">
                <h3 className="font-bold text-lg text-foreground">Recent Study Log</h3>
                <div className="flex flex-col gap-3.5">
                  {recentLogs.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-4 text-center">No study activity logged yet.</p>
                  ) : (
                    recentLogs.map((log, index) => (
                      <div key={index} className="flex items-center gap-3.5 text-sm">
                        <div className="w-8 h-8 rounded-xl bg-secondary text-muted-foreground flex items-center justify-center shrink-0">
                          <Calendar size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate uppercase text-xs tracking-wider">
                            {log.activityType.replace('_', ' ')}
                          </p>
                          <span className="text-[10px] text-muted-foreground block mt-0.5">
                            {new Date(log.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
};

export default Dashboard;
