"use client";

import { useEffect, useState } from "react";
import {
  TrendingUp,
  Users,
  Briefcase,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Award,
  Clock,
  Filter,
  Download,
  RefreshCw,
  Sparkles,
  Zap,
  BarChart3,
  PieChart,
  LineChart,
  GitBranch,
} from "lucide-react";
import { api } from "@/lib/api";
import { formatNumber } from "@/lib/utils";

interface AnalyticsData {
  total_candidates: number;
  active_jobs: number;
  total_applications: number;
  applications_by_stage: Record<string, number>;
  top_candidate_skills: { skill: string; count: number }[];
}

interface FunnelStage {
  stage: string;
  count: number;
  conversion_rate: number | null;
}

interface PipelineHealth {
  health_score: number;
  status: string;
  total_active_applications: number;
  applications_over_30_days: number;
  recommendations: string[];
}

interface SkillDemand {
  skill: string;
  demand_count: number;
  avg_match_score: number;
}

interface DepartmentBreakdown {
  department: string;
  total_jobs: number;
  active_jobs: number;
  total_applications: number;
  hired: number;
  in_progress: number;
  avg_match_score: number;
  hire_rate: number;
}

interface TrendData {
  metric: string;
  period: string;
  data: { date: string; value: number }[];
  total: number;
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [funnel, setFunnel] = useState<FunnelStage[]>([]);
  const [health, setHealth] = useState<PipelineHealth | null>(null);
  const [skills, setSkills] = useState<SkillDemand[]>([]);
  const [departments, setDepartments] = useState<DepartmentBreakdown[]>([]);
  const [trend, setTrend] = useState<TrendData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("30d");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [analyticsData, funnelData, healthData, skillsData, deptData, trendData] = await Promise.all([
        api.analytics().catch(() => null),
        fetch(`/api/v1/analytics/funnel?days=90`).then((r) => r.json()).catch(() => []),
        fetch(`/api/v1/analytics/pipeline-health`).then((r) => r.json()).catch(() => null),
        fetch(`/api/v1/analytics/skills-demand`).then((r) => r.json()).catch(() => []),
        fetch(`/api/v1/analytics/department-breakdown`).then((r) => r.json()).then((d) => d.departments || []).catch(() => []),
        fetch(`/api/v1/analytics/trend?metric=applications&period=${selectedPeriod}`).then((r) => r.json()).catch(() => null),
      ]);
      setAnalytics(analyticsData);
      setFunnel(funnelData);
      setHealth(healthData);
      setSkills(skillsData);
      setDepartments(deptData);
      setTrend(trendData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 rounded-2xl bg-white border border-sf-tertiary" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 rounded-2xl bg-white border border-sf-tertiary" />
          <div className="h-80 rounded-2xl bg-white border border-sf-tertiary" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-danger-50 flex items-center justify-center text-danger-500 mb-4">
          <Activity size={24} />
        </div>
        <h2 className="text-lg font-semibold text-tx-primary mb-2">Unable to load analytics</h2>
        <p className="text-sm text-tx-tertiary mb-4">{error}</p>
        <button onClick={loadData} className="btn-primary">
          <RefreshCw size={16} />
          Try Again
        </button>
      </div>
    );
  }

  const totalApplications = analytics ? Object.values(analytics.applications_by_stage).reduce((a, b) => a + b, 0) : 0;
  const hiredCount = analytics?.applications_by_stage?.HIRED || 0;
  const hireRate = totalApplications > 0 ? ((hiredCount / totalApplications) * 100).toFixed(1) : 0;

  const healthScore = health?.health_score || 75;
  const healthColor = healthScore >= 80 ? "success" : healthScore >= 50 ? "warning" : "danger";

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="eyebrow">
            <BarChart3 size={12} />
            Intelligence Dashboard
          </div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-tx-primary tracking-tight">
            Recruitment Analytics
          </h1>
          <p className="mt-1 text-sm text-tx-tertiary">
            Comprehensive insights into your hiring pipeline and candidate intelligence.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="select-field w-32"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <button className="btn-secondary" onClick={loadData}>
            <RefreshCw size={16} />
            Refresh
          </button>
          <button className="btn-secondary">
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-brand-50 text-brand-600">
              <Users size={24} />
            </div>
            <div className="flex items-center gap-1 text-success-600 text-xs font-medium">
              <ArrowUpRight size={14} />
              +12%
            </div>
          </div>
          <p className="mt-4 text-3xl font-bold text-tx-primary">{formatNumber(analytics?.total_candidates || 0)}</p>
          <p className="mt-1 text-sm text-tx-tertiary">Total Candidates</p>
        </div>

        <div className="card p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-success-50 text-success-600">
              <Briefcase size={24} />
            </div>
            <div className="flex items-center gap-1 text-success-600 text-xs font-medium">
              <ArrowUpRight size={14} />
              +5%
            </div>
          </div>
          <p className="mt-4 text-3xl font-bold text-tx-primary">{analytics?.active_jobs || 0}</p>
          <p className="mt-1 text-sm text-tx-tertiary">Active Jobs</p>
        </div>

        <div className="card p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-warning-50 text-warning-600">
              <Activity size={24} />
            </div>
            <div className="flex items-center gap-1 text-danger-600 text-xs font-medium">
              <ArrowDownRight size={14} />
              -3%
            </div>
          </div>
          <p className="mt-4 text-3xl font-bold text-tx-primary">{formatNumber(analytics?.total_applications || 0)}</p>
          <p className="mt-1 text-sm text-tx-tertiary">Applications</p>
        </div>

        <div className="card p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-purple-50 text-purple-600">
              <Target size={24} />
            </div>
            <span className="px-2 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-medium">
              {hireRate}% hire rate
            </span>
          </div>
          <p className="mt-4 text-3xl font-bold text-tx-primary">{hiredCount}</p>
          <p className="mt-1 text-sm text-tx-tertiary">Successful Hires</p>
        </div>
      </div>

      {/* Pipeline Health & Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline Health */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${
                healthColor === "success" ? "bg-success-50 text-success-600" :
                healthColor === "warning" ? "bg-warning-50 text-warning-600" :
                "bg-danger-50 text-danger-600"
              }`}>
                <Zap size={20} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-tx-primary">Pipeline Health</h3>
                <p className="text-xs text-tx-tertiary">Overall pipeline status</p>
              </div>
            </div>
          </div>

          {/* Health Score */}
          <div className="relative mb-6">
            <div className="flex items-center justify-center">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  fill="none"
                  stroke="#E5E7EB"
                  strokeWidth="12"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  fill="none"
                  stroke={healthColor === "success" ? "#10B981" : healthColor === "warning" ? "#F59E0B" : "#EF4444"}
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={`${(healthScore / 100) * 352} 352`}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-3xl font-bold text-tx-primary">{healthScore}</span>
                <span className="text-xs text-tx-tertiary">Health Score</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-3 rounded-xl bg-sf-secondary">
              <p className="text-xs text-tx-tertiary">Active Apps</p>
              <p className="text-lg font-semibold text-tx-primary">{health?.total_active_applications || 0}</p>
            </div>
            <div className="p-3 rounded-xl bg-sf-secondary">
              <p className="text-xs text-tx-tertiary">Stale (&gt;30d)</p>
              <p className="text-lg font-semibold text-warning-600">{health?.applications_over_30_days || 0}</p>
            </div>
          </div>

          {/* Recommendations */}
          {health?.recommendations && health.recommendations.length > 0 && (
            <div className="p-3 rounded-xl bg-warning-50 border border-warning-100">
              <p className="text-xs font-medium text-warning-700 mb-2">Recommendations</p>
              <ul className="space-y-1">
                {health.recommendations.map((rec, i) => (
                  <li key={i} className="text-xs text-warning-600 flex items-start gap-2">
                    <span className="w-1 h-1 rounded-full bg-warning-500 mt-1.5 flex-shrink-0" />
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Hiring Funnel */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand-50 text-brand-600">
                <GitBranch size={20} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-tx-primary">Hiring Funnel</h3>
                <p className="text-xs text-tx-tertiary">Conversion through pipeline stages</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {[
              { key: "APPLIED", label: "Applied", color: "bg-slate-400" },
              { key: "SCREENING", label: "Screening", color: "bg-blue-500" },
              { key: "INTERVIEW", label: "Interview", color: "bg-brand-500" },
              { key: "OFFER", label: "Offer", color: "bg-warning-500" },
              { key: "HIRED", label: "Hired", color: "bg-success-500" },
            ].map((stage, idx) => {
              const data = funnel.find((f) => f.stage === stage.key);
              const count = data?.count || 0;
              const maxCount = Math.max(...funnel.map((f) => f.count), 1);
              const width = (count / maxCount) * 100;
              const convRate = data?.conversion_rate;

              return (
                <div key={stage.key} className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                      <span className="text-sm font-medium text-tx-primary">{stage.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {convRate !== null && convRate !== undefined && (
                        <span className="text-xs text-tx-tertiary">
                          {convRate.toFixed(0)}% conversion
                        </span>
                      )}
                      <span className="text-sm font-bold text-tx-primary">{count}</span>
                    </div>
                  </div>
                  <div className="h-3 rounded-full bg-sf-secondary overflow-hidden">
                    <div
                      className={`h-full rounded-full ${stage.color} transition-all duration-700 ease-out`}
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Conversion Summary */}
          <div className="mt-6 pt-6 border-t border-sf-tertiary">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-tx-tertiary">Average time to hire</p>
                <p className="text-lg font-semibold text-tx-primary">24 days</p>
              </div>
              <div>
                <p className="text-xs text-tx-tertiary">Fastest stage</p>
                <p className="text-lg font-semibold text-success-600">Screening</p>
              </div>
              <div>
                <p className="text-xs text-tx-tertiary">Slowest stage</p>
                <p className="text-lg font-semibold text-warning-600">Interview</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Skills & Departments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Skills */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand-50 text-brand-600">
                <Sparkles size={20} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-tx-primary">In-Demand Skills</h3>
                <p className="text-xs text-tx-tertiary">Most requested in job requirements</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {skills.slice(0, 8).map((skill, idx) => (
              <div key={skill.skill} className="flex items-center gap-4">
                <span className="w-6 h-6 rounded-lg bg-sf-secondary flex items-center justify-center text-[10px] font-bold text-tx-tertiary">
                  {idx + 1}
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-tx-primary">{skill.skill}</span>
                    <span className="text-xs text-tx-tertiary">{skill.demand_count} jobs</span>
                  </div>
                  <div className="h-2 rounded-full bg-sf-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-400"
                      style={{ width: `${(skill.demand_count / (skills[0]?.demand_count || 1)) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Departments */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-success-50 text-success-600">
                <PieChart size={20} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-tx-primary">By Department</h3>
                <p className="text-xs text-tx-tertiary">Hiring metrics per department</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {departments.slice(0, 5).map((dept) => (
              <div key={dept.department} className="p-4 rounded-xl bg-sf-secondary hover:bg-sf-tertiary/50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-tx-primary">{dept.department}</span>
                  <span className="text-xs font-medium text-success-600">{dept.hire_rate}% hire rate</span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div>
                    <p className="text-lg font-bold text-tx-primary">{dept.active_jobs}</p>
                    <p className="text-[10px] text-tx-tertiary">Open</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-tx-primary">{dept.total_applications}</p>
                    <p className="text-[10px] text-tx-tertiary">Apps</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-tx-primary">{dept.in_progress}</p>
                    <p className="text-[10px] text-tx-tertiary">Active</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-success-600">{dept.hired}</p>
                    <p className="text-[10px] text-tx-tertiary">Hired</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Skills Overview */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-purple-50 text-purple-600">
              <Award size={20} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-tx-primary">Candidate Skills Matrix</h3>
              <p className="text-xs text-tx-tertiary">Top skills across your talent pool</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {(analytics?.top_candidate_skills || []).slice(0, 15).map((item) => (
            <div
              key={item.skill}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sf-secondary border border-sf-tertiary hover:border-brand-200 hover:bg-brand-50 transition-colors cursor-pointer"
            >
              <span className="text-xs font-medium text-tx-primary">{item.skill}</span>
              <span className="px-1.5 py-0.5 rounded-full bg-brand-100 text-brand-700 text-[10px] font-bold">
                {item.count}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
