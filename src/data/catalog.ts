/**
 * The tests' view of the seeded EXELYNT catalog: published courses, their
 * lessons and the assessment answer key. Mirrors app/seed.js.
 */
export interface QuestionKey {
  question: string;
  correct: string;
  incorrect: string;
}

export interface SeededCourse {
  id: string;
  title: string;
  category: string;
  lessons: readonly string[];
  assessment: readonly QuestionKey[];
}

export const projectManagement: SeededCourse = {
  id: 'project-management-foundations',
  title: 'Foundations of Project Management',
  category: 'Business',
  lessons: ['What is a project?', 'Planning and scheduling'],
  assessment: [
    { question: 'Which document formally authorises a project?', correct: 'Project charter', incorrect: 'Risk register' },
    {
      question: 'What does the critical path determine?',
      correct: 'The shortest possible project duration',
      incorrect: 'The project budget'
    },
    { question: 'Which of these is part of the classic triple constraint?', correct: 'Scope', incorrect: 'Team morale' }
  ]
};

export const dataAnalysis: SeededCourse = {
  id: 'data-analysis-intro',
  title: 'Introduction to Data Analysis',
  category: 'Technology',
  lessons: ['Asking the right question', 'Cleaning data', 'Visualising results'],
  assessment: [
    { question: 'Which chart best shows change over time?', correct: 'Line chart', incorrect: 'Pie chart' },
    { question: 'What is the median of 2, 4 and 9?', correct: '4', incorrect: '9' },
    {
      question: 'Which step usually comes first in an analysis?',
      correct: 'Defining the question',
      incorrect: 'Presenting results'
    }
  ]
};

export const workplaceCommunication: SeededCourse = {
  id: 'workplace-communication',
  title: 'Workplace Communication Essentials',
  category: 'Soft skills',
  lessons: ['Active listening', 'Writing clear emails'],
  assessment: [
    { question: 'What should a clear email lead with?', correct: 'The request', incorrect: 'A signature' },
    { question: 'Paraphrasing a speaker helps to', correct: 'confirm understanding', incorrect: 'change the topic' }
  ]
};

export const publishedCourses: readonly SeededCourse[] = [projectManagement, dataAnalysis, workplaceCommunication];

export const PASS_MARK = 70;
