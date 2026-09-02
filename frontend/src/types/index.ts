export type WorkplaceType = "REMOTE" | "HYBRID" | "ONSITE";
export type JobStatus = "DRAFT" | "ACTIVE" | "CLOSED";
export type ApplicationStatus = "APPLIED" | "SCREENING" | "INTERVIEW" | "OFFER" | "HIRED" | "REJECTED";

export interface Resume { id: string; candidate_id: string; raw_text?: string | null; file_url?: string | null; parsed_skills: string[]; work_history: WorkHistory[]; education: Education[]; embedding_vector_id?: string | null; created_at: string; }
export interface WorkHistory { company: string; role: string; start_date?: string; end_date?: string; summary?: string; }
export interface Education { institution: string; degree?: string; field?: string; graduation_year?: number; }
export interface Candidate { id: string; first_name: string; last_name: string; email: string; phone?: string | null; headline?: string | null; location?: string | null; bio?: string | null; experience_years: number; skills: string[]; created_at: string; updated_at: string; resumes?: Resume[]; applications?: Application[]; }
export interface JobOpening { id: string; title: string; department: string; location: string; workplace_type: WorkplaceType; status: JobStatus; description: string; required_skills: string[]; nice_to_have_skills: string[]; min_experience_years: number; salary_range?: string | null; created_at: string; updated_at: string; applicants?: ApplicantSummary[]; }
export interface Application { id: string; candidate_id: string; job_id: string; status: ApplicationStatus; ai_match_score?: number | null; ai_summary?: string | null; notes?: string | null; applied_at: string; }
export interface ApplicantSummary { id: string; candidate_id: string; status: ApplicationStatus; ai_match_score?: number | null; applied_at: string; candidate_name?: string | null; }
export interface MatchResult { overall_score: number; skill_score: number; experience_score: number; semantic_score: number; matched_skills: string[]; missing_skills: string[]; ai_critique: string; }
export type InterviewQuestionType = "TECHNICAL" | "BEHAVIORAL" | "SYSTEM_DESIGN";
export interface InterviewQuestion { question: string; question_type: InterviewQuestionType; target_skill: string; expected_answer_points: string[]; evaluation_rubric: string; }
export interface InterviewKit { candidate_name: string; job_title: string; questions: InterviewQuestion[]; }
export interface JobEnrichment { title: string; polished_description: string; required_skills: string[]; nice_to_have_skills: string[]; recommended_min_experience: number; suggested_salary_range: string; }
export interface CandidateComparison { candidate_id: string; candidate_name: string; fit_score: number; key_strengths: string[]; potential_gaps: string[]; verdict: string; }
export interface CompareCandidatesResponse { job_title: string; comparisons: CandidateComparison[]; executive_summary: string; recommended_candidate_id?: string | null; }
export interface OutreachEmail { subject_line: string; email_body: string; key_highlights: string[]; }
export interface Scorecard { id: string; application_id: string; interviewer_name: string; round_name: string; rating: number; recommendation: "STRONG_YES" | "YES" | "NEUTRAL" | "NO" | "STRONG_NO"; notes: string; created_at: string; }
export interface AnalyticsSummary { total_candidates: number; active_jobs: number; total_applications: number; applications_by_stage: Record<ApplicationStatus, number>; top_candidate_skills: { skill: string; count: number }[]; }
