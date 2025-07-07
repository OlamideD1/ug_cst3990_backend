const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eduquest', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  role: { type: String, enum: ['student', 'instructor', 'admin'], default: 'student' },
  profile: {
    avatar: { type: String, default: '' },
    bio: { type: String, default: '' },
    learningStyle: { type: String, enum: ['visual', 'auditory', 'kinesthetic', 'reading'], default: 'visual' }
  },
  gamification: {
    totalPoints: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    badges: [{ 
      name: String, 
      description: String, 
      icon: String, 
      earnedAt: { type: Date, default: Date.now } 
    }],
    streakDays: { type: Number, default: 0 },
    lastActivityDate: { type: Date, default: Date.now }
  },
  enrolledCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
  completedCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Course Schema
const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: String, required: true },
  difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
  duration: { type: Number, required: true }, // in hours
  thumbnail: { type: String, default: '' },
  modules: [{
    title: { type: String, required: true },
    description: { type: String },
    content: { type: String },
    videoUrl: { type: String },
    order: { type: Number, required: true },
    quizzes: [{
      question: { type: String, required: true },
      options: [{ type: String }],
      correctAnswer: { type: Number, required: true },
      points: { type: Number, default: 10 }
    }],
    isCompleted: { type: Boolean, default: false }
  }],
  enrolledStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  ratings: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rating: { type: Number, min: 1, max: 5 },
    review: { type: String }
  }],
  averageRating: { type: Number, default: 0 },
  isPublished: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Progress Schema
const progressSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  completedModules: [{ type: Number }],
  quizScores: [{
    moduleIndex: { type: Number },
    quizIndex: { type: Number },
    score: { type: Number },
    maxScore: { type: Number },
    completedAt: { type: Date, default: Date.now }
  }],
  overallProgress: { type: Number, default: 0 }, // percentage
  timeSpent: { type: Number, default: 0 }, // in minutes
  lastAccessed: { type: Date, default: Date.now },
  isCompleted: { type: Boolean, default: false },
  completedAt: { type: Date }
});

// Analytics Schema
const analyticsSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true }, // login, course_start, module_complete, quiz_attempt, etc.
  details: { type: mongoose.Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now },
  sessionId: { type: String }
});

// Leaderboard Schema
const leaderboardSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  points: { type: Number, default: 0 },
  rank: { type: Number },
  period: { type: String, enum: ['daily', 'weekly', 'monthly', 'all-time'], default: 'all-time' },
  updatedAt: { type: Date, default: Date.now }
});
// Feedback Schema
const feedbackSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  type: { type: String, enum: ['course', 'platform', 'feature', 'bug', 'suggestion'], required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  category: { type: String, enum: ['usability', 'content', 'gamification', 'performance', 'other'] },
  isAnonymous: { type: Boolean, default: false },
  status: { type: String, enum: ['pending', 'reviewed', 'resolved'], default: 'pending' },
  adminResponse: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Survey Schema
const surveySchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  type: { type: String, enum: ['pre-course', 'post-course', 'satisfaction', 'effectiveness'], required: true },
  questions: [{
    question: { type: String, required: true },
    type: { type: String, enum: ['likert', 'multiple-choice', 'text', 'rating'], required: true },
    options: [String], // For multiple-choice questions
    required: { type: Boolean, default: true }
  }],
  targetAudience: { type: String, enum: ['all', 'students', 'instructors'] },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

// Survey Response Schema
const surveyResponseSchema = new mongoose.Schema({
  survey: { type: mongoose.Schema.Types.ObjectId, ref: 'Survey', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  responses: [{
    questionIndex: { type: Number, required: true },
    answer: { type: mongoose.Schema.Types.Mixed, required: true } // Can be string, number, or array
  }],
  timeSpent: { type: Number }, // in seconds
  isCompleted: { type: Boolean, default: true },
  submittedAt: { type: Date, default: Date.now }
});

// A/B Testing Schema
const abTestSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  feature: { type: String, required: true }, // What feature is being tested
  variants: [{
    name: { type: String, required: true },
    description: { type: String },
    config: { type: mongoose.Schema.Types.Mixed } // Configuration for this variant
  }],
  allocation: { type: Number, default: 50 }, // Percentage split
  isActive: { type: Boolean, default: true },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

// A/B Test Assignment Schema
const abTestAssignmentSchema = new mongoose.Schema({
  test: { type: mongoose.Schema.Types.ObjectId, ref: 'ABTest', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  variant: { type: String, required: true },
  assignedAt: { type: Date, default: Date.now }
});

// Learning Effectiveness Schema
const learningEffectivenessSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  preAssessmentScore: { type: Number },
  postAssessmentScore: { type: Number },
  knowledgeImprovement: { type: Number }, // Percentage improvement
  engagementScore: { type: Number }, // Based on time spent, interactions, etc.
  satisfactionScore: { type: Number }, // From surveys
  retentionScore: { type: Number }, // Based on quiz performance over time
  gamificationImpact: {
    pointsEarned: { type: Number },
    badgesEarned: { type: Number },
    streakDays: { type: Number },
    motivationLevel: { type: Number } // From surveys
  },
  completionTime: { type: Number }, // Time to complete course in days
  lastUpdated: { type: Date, default: Date.now }
});

const Feedback = mongoose.model('Feedback', feedbackSchema);
const Survey = mongoose.model('Survey', surveySchema);
const SurveyResponse = mongoose.model('SurveyResponse', surveyResponseSchema);
const ABTest = mongoose.model('ABTest', abTestSchema);
const ABTestAssignment = mongoose.model('ABTestAssignment', abTestAssignmentSchema);
const LearningEffectiveness = mongoose.model('LearningEffectiveness', learningEffectivenessSchema);
const User = mongoose.model('User', userSchema);
const Course = mongoose.model('Course', courseSchema);
const Progress = mongoose.model('Progress', progressSchema);
const Analytics = mongoose.model('Analytics', analyticsSchema);
const Leaderboard = mongoose.model('Leaderboard', leaderboardSchema);



// Create Models

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// =============================================================================
// FEEDBACK ROUTES
// =============================================================================

// Submit Feedback
app.post('/api/feedback', authenticateToken, async (req, res) => {
  try {
    const { type, rating, subject, message, category, isAnonymous, courseId } = req.body;
    
    const feedback = new Feedback({
      user: req.user.userId,
      course: courseId,
      type,
      rating,
      subject,
      message,
      category,
      isAnonymous
    });

    await feedback.save();
    
    // Track analytics
    await trackAnalytics(req.user.userId, 'feedback_submitted', { 
      type, 
      rating, 
      category 
    });

    res.status(201).json({ message: 'Feedback submitted successfully', feedback });
  } catch (error) {
    console.error('Feedback submission error:', error);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

// Get User's Feedback
app.get('/api/feedback/my', authenticateToken, async (req, res) => {
  try {
    const feedback = await Feedback.find({ user: req.user.userId })
      .populate('course', 'title')
      .sort({ createdAt: -1 });
    
    res.json(feedback);
  } catch (error) {
    console.error('Feedback fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch feedback' });
  }
});

// Get All Feedback (Admin only)
app.get('/api/admin/feedback', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { type, status, rating } = req.query;
    let query = {};
    
    if (type) query.type = type;
    if (status) query.status = status;
    if (rating) query.rating = parseInt(rating);

    const feedback = await Feedback.find(query)
      .populate('user', 'firstName lastName email')
      .populate('course', 'title')
      .sort({ createdAt: -1 });

    res.json(feedback);
  } catch (error) {
    console.error('Admin feedback fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch feedback' });
  }
});

// =============================================================================
// SURVEY ROUTES
// =============================================================================

// Create Survey (Admin only)
app.post('/api/surveys', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const survey = new Survey({
      ...req.body,
      createdBy: req.user.userId
    });

    await survey.save();
    res.status(201).json(survey);
  } catch (error) {
    console.error('Survey creation error:', error);
    res.status(500).json({ error: 'Failed to create survey' });
  }
});

// Get Active Surveys for User
app.get('/api/surveys/active', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    // Find surveys user hasn't completed
    const completedSurveys = await SurveyResponse.find({ user: req.user.userId }).distinct('survey');
    
    const surveys = await Survey.find({
      isActive: true,
      _id: { $nin: completedSurveys },
      $or: [
        { targetAudience: 'all' },
        { targetAudience: user.role === 'instructor' ? 'instructors' : 'students' }
      ]
    }).sort({ createdAt: -1 });

    res.json(surveys);
  } catch (error) {
    console.error('Active surveys fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch surveys' });
  }
});

// Submit Survey Response
app.post('/api/surveys/:id/response', authenticateToken, async (req, res) => {
  try {
    const { responses, timeSpent, courseId } = req.body;
    
    const surveyResponse = new SurveyResponse({
      survey: req.params.id,
      user: req.user.userId,
      course: courseId,
      responses,
      timeSpent
    });

    await surveyResponse.save();
    
    // Track analytics
    await trackAnalytics(req.user.userId, 'survey_completed', { 
      surveyId: req.params.id,
      timeSpent 
    });

    res.status(201).json({ message: 'Survey response submitted successfully' });
  } catch (error) {
    console.error('Survey response error:', error);
    res.status(500).json({ error: 'Failed to submit survey response' });
  }
});

// =============================================================================
// ANALYTICS & EFFECTIVENESS ROUTES
// =============================================================================

// Get Learning Effectiveness Data
app.get('/api/analytics/effectiveness', authenticateToken, async (req, res) => {
  try {
    const { courseId, timeframe = '30' } = req.query;
    
    let query = {};
    if (req.user.role === 'student') {
      query.user = req.user.userId;
    }
    if (courseId) {
      query.course = courseId;
    }

    const effectiveness = await LearningEffectiveness.find(query)
      .populate('user', 'firstName lastName')
      .populate('course', 'title')
      .sort({ lastUpdated: -1 });

    res.json(effectiveness);
  } catch (error) {
    console.error('Effectiveness data error:', error);
    res.status(500).json({ error: 'Failed to fetch effectiveness data' });
  }
});

// Update Learning Effectiveness (called after course completion)
app.post('/api/analytics/effectiveness/update', authenticateToken, async (req, res) => {
  try {
    const { courseId, postAssessmentScore, satisfactionScore } = req.body;
    
    let effectiveness = await LearningEffectiveness.findOne({
      user: req.user.userId,
      course: courseId
    });

    if (!effectiveness) {
      effectiveness = new LearningEffectiveness({
        user: req.user.userId,
        course: courseId
      });
    }

    // Update scores
    if (postAssessmentScore) effectiveness.postAssessmentScore = postAssessmentScore;
    if (satisfactionScore) effectiveness.satisfactionScore = satisfactionScore;

    // Calculate improvement
    if (effectiveness.preAssessmentScore && effectiveness.postAssessmentScore) {
      effectiveness.knowledgeImprovement = 
        ((effectiveness.postAssessmentScore - effectiveness.preAssessmentScore) / 
         effectiveness.preAssessmentScore) * 100;
    }

    // Get user's gamification data
    const user = await User.findById(req.user.userId);
    effectiveness.gamificationImpact = {
      pointsEarned: user.gamification.totalPoints,
      badgesEarned: user.gamification.badges.length,
      streakDays: user.gamification.streakDays,
      motivationLevel: satisfactionScore // Can be updated from surveys
    };

    effectiveness.lastUpdated = new Date();
    await effectiveness.save();

    res.json(effectiveness);
  } catch (error) {
    console.error('Effectiveness update error:', error);
    res.status(500).json({ error: 'Failed to update effectiveness data' });
  }
});

// Get Platform Analytics (Admin only)
app.get('/api/admin/analytics/platform', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // User engagement metrics
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({
      'gamification.lastActivityDate': { $gte: thirtyDaysAgo }
    });

    // Course completion rates
    const totalEnrollments = await Progress.countDocuments();
    const completedCourses = await Progress.countDocuments({ isCompleted: true });

    // Gamification effectiveness
    const avgPoints = await User.aggregate([
      { $group: { _id: null, avgPoints: { $avg: '$gamification.totalPoints' } } }
    ]);

    const avgSatisfaction = await Feedback.aggregate([
      { $group: { _id: null, avgRating: { $avg: '$rating' } } }
    ]);

    // Learning effectiveness
    const effectivenessData = await LearningEffectiveness.aggregate([
      {
        $group: {
          _id: null,
          avgImprovement: { $avg: '$knowledgeImprovement' },
          avgSatisfaction: { $avg: '$satisfactionScore' },
          avgEngagement: { $avg: '$engagementScore' }
        }
      }
    ]);

    res.json({
      users: {
        total: totalUsers,
        active: activeUsers,
        engagementRate: ((activeUsers / totalUsers) * 100).toFixed(1)
      },
      courses: {
        totalEnrollments,
        completedCourses,
        completionRate: ((completedCourses / totalEnrollments) * 100).toFixed(1)
      },
      gamification: {
        avgPoints: avgPoints[0]?.avgPoints || 0,
        avgSatisfaction: avgSatisfaction[0]?.avgRating || 0
      },
      effectiveness: effectivenessData[0] || {
        avgImprovement: 0,
        avgSatisfaction: 0,
        avgEngagement: 0
      }
    });
  } catch (error) {
    console.error('Platform analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch platform analytics' });
  }
});

// =============================================================================
// DEFAULT SURVEYS DATA
// =============================================================================

// Function to create default surveys (call this after seeding)
async function createDefaultSurveys() {
  try {
    // Pre-course survey
    const preCourse = new Survey({
      title: 'Pre-Course Assessment',
      description: 'Help us understand your learning goals and current knowledge level',
      type: 'pre-course',
      targetAudience: 'students',
      questions: [
        {
          question: 'How would you rate your current knowledge of this subject?',
          type: 'likert',
          options: ['Very Poor', 'Poor', 'Fair', 'Good', 'Excellent']
        },
        {
          question: 'What is your primary learning goal for this course?',
          type: 'text'
        },
        {
          question: 'How motivated are you to complete this course?',
          type: 'rating'
        }
      ]
    });

    // Post-course survey
    const postCourse = new Survey({
      title: 'Post-Course Evaluation',
      description: 'Share your experience and help us improve',
      type: 'post-course',
      targetAudience: 'students',
      questions: [
        {
          question: 'How would you rate the overall quality of this course?',
          type: 'rating'
        },
        {
          question: 'How much did the gamification elements (points, badges, leaderboard) motivate you?',
          type: 'likert',
          options: ['Not at all', 'Slightly', 'Moderately', 'Very much', 'Extremely']
        },
        {
          question: 'Which gamification feature did you find most engaging?',
          type: 'multiple-choice',
          options: ['Points system', 'Badges', 'Leaderboard', 'Progress tracking', 'Streaks']
        },
        {
          question: 'How likely are you to recommend this course to others?',
          type: 'rating'
        },
        {
          question: 'What improvements would you suggest?',
          type: 'text'
        }
      ]
    });

    // Platform satisfaction survey
    const platformSurvey = new Survey({
      title: 'Platform User Experience Survey',
      description: 'Help us improve the EduQuest platform',
      type: 'satisfaction',
      targetAudience: 'all',
      questions: [
        {
          question: 'How easy is it to navigate the platform?',
          type: 'likert',
          options: ['Very Difficult', 'Difficult', 'Neutral', 'Easy', 'Very Easy']
        },
        {
          question: 'How satisfied are you with the quiz experience?',
          type: 'rating'
        },
        {
          question: 'How well does the platform meet your learning needs?',
          type: 'rating'
        },
        {
          question: 'What features would you like to see added?',
          type: 'text'
        }
      ]
    });

    await Survey.insertMany([preCourse, postCourse, platformSurvey]);
    console.log('✅ Default surveys created successfully');
  } catch (error) {
    console.error('Error creating default surveys:', error);
  }
}

// Export for use in seeder
module.exports = {
  createDefaultSurveys,
  Feedback,
  Survey,
  SurveyResponse,
  LearningEffectiveness
};

// Create Models

// JWT Authentication Middleware


// Helper Functions
const calculateLevel = (points) => {
  return Math.floor(points / 100) + 1;
};

const awardBadge = async (userId, badgeName, description, icon) => {
  const user = await User.findById(userId);
  const existingBadge = user.gamification.badges.find(badge => badge.name === badgeName);
  
  if (!existingBadge) {
    user.gamification.badges.push({
      name: badgeName,
      description: description,
      icon: icon
    });
    await user.save();
    return true;
  }
  return false;
};

const updateStreak = async (userId) => {
  const user = await User.findById(userId);
  const today = new Date();
  const lastActivity = new Date(user.gamification.lastActivityDate);
  
  const daysDiff = Math.floor((today - lastActivity) / (1000 * 60 * 60 * 24));
  
  if (daysDiff === 1) {
    user.gamification.streakDays += 1;
  } else if (daysDiff > 1) {
    user.gamification.streakDays = 1;
  }
  
  user.gamification.lastActivityDate = today;
  await user.save();
  
  // Award streak badges
  if (user.gamification.streakDays === 7) {
    await awardBadge(userId, 'Week Warrior', 'Completed 7 days streak', '🔥');
  } else if (user.gamification.streakDays === 30) {
    await awardBadge(userId, 'Month Master', 'Completed 30 days streak', '⭐');
  }
};

const trackAnalytics = async (userId, action, details = {}, sessionId = null) => {
  const analytics = new Analytics({
    user: userId,
    action: action,
    details: details,
    sessionId: sessionId
  });
  await analytics.save();
};

// AUTH ROUTES
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new user
    const user = new User({
      username,
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: role || 'student'
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // Track registration
    await trackAnalytics(user._id, 'user_register', { role: user.role });

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        profile: user.profile,
        gamification: user.gamification,
        enrolledCourses: user.enrolledCourses || [],
        completedCourses: user.completedCourses || []
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user and populate enrolled courses
    const user = await User.findOne({ email })
      .populate('enrolledCourses', 'title')
      .populate('completedCourses', 'title');
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update streak
    await updateStreak(user._id);

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // Track login
    await trackAnalytics(user._id, 'user_login');

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        profile: user.profile,
        gamification: user.gamification,
        enrolledCourses: user.enrolledCourses.map(course => course._id),
        completedCourses: user.completedCourses.map(course => course._id)
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// USER ROUTES
app.get('/api/users/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .select('-password')
      .populate('enrolledCourses', 'title thumbnail')
      .populate('completedCourses', 'title thumbnail');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Convert populated courses back to just IDs for frontend compatibility
    const userResponse = user.toObject();
    userResponse.enrolledCourses = user.enrolledCourses.map(course => course._id);
    userResponse.completedCourses = user.completedCourses.map(course => course._id);

    res.json(userResponse);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/users/profile', authenticateToken, async (req, res) => {
  try {
    const { firstName, lastName, profile } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { 
        firstName, 
        lastName, 
        profile,
        updatedAt: new Date()
      },
      { new: true }
    ).select('-password');

    res.json(user);
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// COURSE ROUTES
app.get('/api/courses', async (req, res) => {
  try {
    const { category, difficulty, search } = req.query;
    let query = { isPublished: true };

    if (category) query.category = category;
    if (difficulty) query.difficulty = difficulty;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const courses = await Course.find(query)
      .populate('instructor', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.json(courses);
  } catch (error) {
    console.error('Courses fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/courses/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('instructor', 'firstName lastName profile.avatar')
      .populate('ratings.user', 'firstName lastName');

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json(course);
  } catch (error) {
    console.error('Course fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/courses', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'instructor' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only instructors can create courses' });
    }

    const courseData = {
      ...req.body,
      instructor: req.user.userId
    };

    const course = new Course(courseData);
    await course.save();

    res.status(201).json(course);
  } catch (error) {
    console.error('Course creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/courses/:id/enroll', authenticateToken, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    const user = await User.findById(req.user.userId);

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user is already enrolled
    const isAlreadyEnrolled = user.enrolledCourses.some(courseId => 
      courseId.toString() === course._id.toString()
    );
    
    const isAlreadyCompleted = user.completedCourses.some(courseId => 
      courseId.toString() === course._id.toString()
    );

    if (isAlreadyEnrolled) {
      return res.status(400).json({ error: 'Already enrolled in this course' });
    }

    if (isAlreadyCompleted) {
      return res.status(400).json({ error: 'You have already completed this course' });
    }

    // Add user to course
    if (!course.enrolledStudents.includes(user._id)) {
      course.enrolledStudents.push(user._id);
      await course.save();
    }

    // Add course to user
    user.enrolledCourses.push(course._id);
    await user.save();

    // Create progress record
    const existingProgress = await Progress.findOne({
      user: user._id,
      course: course._id
    });

    if (!existingProgress) {
      const progress = new Progress({
        user: user._id,
        course: course._id
      });
      await progress.save();
    }

    // Track enrollment
    await trackAnalytics(user._id, 'course_enroll', { courseId: course._id });

    res.json({ message: 'Successfully enrolled in course', courseId: course._id });
  } catch (error) {
    console.error('Enrollment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PROGRESS ROUTES
app.get('/api/progress/:courseId', authenticateToken, async (req, res) => {
  try {
    const progress = await Progress.findOne({
      user: req.user.userId,
      course: req.params.courseId
    }).populate('course', 'title modules');

    if (!progress) {
      return res.status(404).json({ error: 'Progress not found' });
    }

    res.json(progress);
  } catch (error) {
    console.error('Progress fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/progress/:courseId/module/:moduleIndex', authenticateToken, async (req, res) => {
  try {
    const { courseId, moduleIndex } = req.params;
    const moduleIdx = parseInt(moduleIndex);

    let progress = await Progress.findOne({
      user: req.user.userId,
      course: courseId
    });

    if (!progress) {
      return res.status(404).json({ error: 'Progress not found' });
    }

    const course = await Course.findById(courseId);
    
    // Mark module as completed
    if (!progress.completedModules.includes(moduleIdx)) {
      progress.completedModules.push(moduleIdx);
      
      // Award points
      const user = await User.findById(req.user.userId);
      user.gamification.totalPoints += 50;
      user.gamification.level = calculateLevel(user.gamification.totalPoints);
      await user.save();

      // Check for badges
      if (progress.completedModules.length === 1) {
        await awardBadge(req.user.userId, 'First Steps', 'Completed first module', '🎯');
      }
    }

    // Calculate overall progress
    progress.overallProgress = (progress.completedModules.length / course.modules.length) * 100;
    progress.lastAccessed = new Date();

    // Check if course is completed
    if (progress.completedModules.length === course.modules.length) {
      progress.isCompleted = true;
      progress.completedAt = new Date();

      // Move course to completed
      const user = await User.findById(req.user.userId);
      if (!user.completedCourses.includes(courseId)) {
        user.completedCourses.push(courseId);
        user.enrolledCourses.pull(courseId);
        await user.save();
      }

      // Award completion badge and points
      user.gamification.totalPoints += 200;
      user.gamification.level = calculateLevel(user.gamification.totalPoints);
      await user.save();
      
      await awardBadge(req.user.userId, 'Course Completed', 'Completed a full course', '🏆');
    }

    await progress.save();

    // Track module completion
    await trackAnalytics(req.user.userId, 'module_complete', {
      courseId: courseId,
      moduleIndex: moduleIdx
    });

    res.json(progress);
  } catch (error) {
    console.error('Module completion error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/progress/:courseId/quiz', authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.params;
    const { moduleIndex, quizIndex, score, maxScore } = req.body;

    let progress = await Progress.findOne({
      user: req.user.userId,
      course: courseId
    });

    if (!progress) {
      return res.status(404).json({ error: 'Progress not found' });
    }

    // Record quiz score
    progress.quizScores.push({
      moduleIndex: parseInt(moduleIndex),
      quizIndex: parseInt(quizIndex),
      score: score,
      maxScore: maxScore
    });

    await progress.save();

    // Award points based on score
    const user = await User.findById(req.user.userId);
    const pointsEarned = Math.floor((score / maxScore) * 20);
    user.gamification.totalPoints += pointsEarned;
    user.gamification.level = calculateLevel(user.gamification.totalPoints);
    await user.save();

    // Award perfect score badge
    if (score === maxScore) {
      await awardBadge(req.user.userId, 'Perfect Score', 'Got 100% on a quiz', '💯');
    }

    // Track quiz completion
    await trackAnalytics(req.user.userId, 'quiz_complete', {
      courseId: courseId,
      moduleIndex: moduleIndex,
      quizIndex: quizIndex,
      score: score,
      maxScore: maxScore
    });

    res.json({ message: 'Quiz score recorded', pointsEarned });
  } catch (error) {
    console.error('Quiz submission error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GAMIFICATION ROUTES
app.get('/api/leaderboard', authenticateToken, async (req, res) => {
  try {
    const { period = 'all-time' } = req.query;
    
    const users = await User.find({}, 'firstName lastName gamification.totalPoints gamification.level')
      .sort({ 'gamification.totalPoints': -1 })
      .limit(100);

    const leaderboard = users.map((user, index) => ({
      rank: index + 1,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        level: user.gamification.level
      },
      points: user.gamification.totalPoints
    }));

    res.json(leaderboard);
  } catch (error) {
    console.error('Leaderboard fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/badges', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    res.json(user.gamification.badges);
  } catch (error) {
    console.error('Badges fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ANALYTICS ROUTES
app.get('/api/analytics/dashboard', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Get user stats
    const user = await User.findById(userId);
    const enrolledCount = user.enrolledCourses.length;
    const completedCount = user.completedCourses.length;
    
    // Get recent activity
    const recentActivity = await Analytics.find({ user: userId })
      .sort({ timestamp: -1 })
      .limit(10);

    // Get progress stats
    const progressStats = await Progress.find({ user: userId });
    const avgProgress = progressStats.reduce((sum, p) => sum + p.overallProgress, 0) / progressStats.length || 0;

    res.json({
      user: {
        points: user.gamification.totalPoints,
        level: user.gamification.level,
        badges: user.gamification.badges.length,
        streak: user.gamification.streakDays
      },
      courses: {
        enrolled: enrolledCount,
        completed: completedCount,
        averageProgress: Math.round(avgProgress)
      },
      recentActivity: recentActivity
    });
  } catch (error) {
    console.error('Analytics dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ADMIN ROUTES
app.get('/api/admin/stats', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const totalUsers = await User.countDocuments();
    const totalCourses = await Course.countDocuments();
    const totalEnrollments = await Course.aggregate([
      { $group: { _id: null, total: { $sum: { $size: "$enrolledStudents" } } } }
    ]);

    const recentUsers = await User.find({}, 'firstName lastName createdAt')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      totalUsers,
      totalCourses,
      totalEnrollments: totalEnrollments[0]?.total || 0,
      recentUsers
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ERROR HANDLING
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});