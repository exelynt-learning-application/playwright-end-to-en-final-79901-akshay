'use strict';
/**
 * Seeded catalog for the EXELYNT reference application.
 * `answer` is the zero-based index of the correct option.
 * Keep in sync with src/data/catalog.ts (the tests' view of this data).
 */
const categories = ['Business', 'Technology', 'Soft skills', 'Compliance'];

const courses = [
  {
    id: 'project-management-foundations',
    title: 'Foundations of Project Management',
    description: 'Learn how projects are started, planned and delivered on time.',
    category: 'Business',
    lessons: [
      {
        id: 'pm-what-is-a-project',
        title: 'What is a project?',
        body: 'A project is a temporary endeavour undertaken to create a unique product, service or result.'
      },
      {
        id: 'pm-planning-and-scheduling',
        title: 'Planning and scheduling',
        body: 'The critical path is the longest chain of dependent tasks and sets the shortest possible duration.'
      }
    ],
    assessment: {
      questions: [
        {
          id: 'pm-q1',
          text: 'Which document formally authorises a project?',
          options: ['Risk register', 'Project charter', 'Lessons learned log'],
          answer: 1
        },
        {
          id: 'pm-q2',
          text: 'What does the critical path determine?',
          options: ['The project budget', 'The team size', 'The shortest possible project duration'],
          answer: 2
        },
        {
          id: 'pm-q3',
          text: 'Which of these is part of the classic triple constraint?',
          options: ['Scope', 'Office location', 'Team morale'],
          answer: 0
        }
      ]
    }
  },
  {
    id: 'data-analysis-intro',
    title: 'Introduction to Data Analysis',
    description: 'Turn raw data into clear answers with simple statistics and charts.',
    category: 'Technology',
    lessons: [
      {
        id: 'da-asking-questions',
        title: 'Asking the right question',
        body: 'Every analysis starts with a clear, answerable question.'
      },
      {
        id: 'da-cleaning-data',
        title: 'Cleaning data',
        body: 'Remove duplicates, fix types and handle missing values before analysing.'
      },
      {
        id: 'da-visualising-results',
        title: 'Visualising results',
        body: 'Line charts show change over time; bar charts compare categories.'
      }
    ],
    assessment: {
      questions: [
        {
          id: 'da-q1',
          text: 'Which chart best shows change over time?',
          options: ['Pie chart', 'Line chart', 'Word cloud'],
          answer: 1
        },
        {
          id: 'da-q2',
          text: 'What is the median of 2, 4 and 9?',
          options: ['4', '5', '9'],
          answer: 0
        },
        {
          id: 'da-q3',
          text: 'Which step usually comes first in an analysis?',
          options: ['Building a dashboard', 'Presenting results', 'Defining the question'],
          answer: 2
        }
      ]
    }
  },
  {
    id: 'workplace-communication',
    title: 'Workplace Communication Essentials',
    description: 'Listen actively and write messages colleagues can act on.',
    category: 'Soft skills',
    lessons: [
      {
        id: 'wc-active-listening',
        title: 'Active listening',
        body: 'Paraphrase what you heard to confirm understanding.'
      },
      {
        id: 'wc-clear-emails',
        title: 'Writing clear emails',
        body: 'Lead with the request, keep it short and state any deadline.'
      }
    ],
    assessment: {
      questions: [
        {
          id: 'wc-q1',
          text: 'What should a clear email lead with?',
          options: ['A long introduction', 'The request', 'A signature'],
          answer: 1
        },
        {
          id: 'wc-q2',
          text: 'Paraphrasing a speaker helps to',
          options: ['confirm understanding', 'end the conversation', 'change the topic'],
          answer: 0
        }
      ]
    }
  }
];

module.exports = { categories, courses };
