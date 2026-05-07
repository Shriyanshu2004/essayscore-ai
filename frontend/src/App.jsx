import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Sidebar from './components/Sidebar'
import Login                from './pages/Login'
import StudentEnrollment    from './pages/StudentEnrollment'
import EssaySubmission      from './pages/EssaySubmission'
import FeedbackViewer       from './pages/FeedbackViewer'
import TeacherCalibration   from './pages/TeacherCalibration'
import RubricBuilder        from './pages/RubricBuilder'
import AnalyticsDashboard   from './pages/AnalyticsDashboard'
import ProgressTracking     from './pages/ProgressTracking'
import PeerReview           from './pages/PeerReview'
import Notifications        from './pages/Notifications'
import PlagiarismReport     from './pages/PlagiarismReport'
import StyleAnalyzer        from './pages/StyleAnalyzer'
import BatchScoring         from './pages/BatchScoring'
import BrowseEssays         from './pages/BrowseEssays'
import ReviewEssay          from './pages/ReviewEssay'

function ProtectedLayout() {
  const { currentUser } = useAuth()
  
  if (!currentUser) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Navigate to={currentUser.role === 'teacher' ? "/analytics" : "/submit"} replace />} />
          <Route path="/submit"      element={<EssaySubmission />} />
          <Route path="/feedback"    element={<FeedbackViewer />} />
          <Route path="/calibration" element={<TeacherCalibration />} />
          <Route path="/rubric"      element={<RubricBuilder />} />
          <Route path="/analytics"   element={<AnalyticsDashboard />} />
          <Route path="/progress"    element={<ProgressTracking />} />
          <Route path="/peer"        element={<PeerReview />} />
          <Route path="/browse-essays" element={<BrowseEssays />} />
          <Route path="/review-essay/:essayId" element={<ReviewEssay />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/plagiarism"  element={<PlagiarismReport />} />
          <Route path="/style"       element={<StyleAnalyzer />} />
          <Route path="/batch"       element={<BatchScoring />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/enroll" element={<StudentEnrollment />} />
          <Route path="/*" element={<ProtectedLayout />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
