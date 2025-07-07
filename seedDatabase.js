const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eduquest', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Import your schemas (same as in server.js)
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

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: String, required: true },
  difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
  duration: { type: Number, required: true },
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
  overallProgress: { type: Number, default: 0 },
  timeSpent: { type: Number, default: 0 },
  lastAccessed: { type: Date, default: Date.now },
  isCompleted: { type: Boolean, default: false },
  completedAt: { type: Date }
});

const User = mongoose.model('User', userSchema);
const Course = mongoose.model('Course', courseSchema);
const Progress = mongoose.model('Progress', progressSchema);

// Demo Data
const demoUsers = [
  {
    username: 'alex_star',
    email: 'alex@example.com',
    password: 'password123',
    firstName: 'Alex',
    lastName: 'Star',
    role: 'student',
    profile: {
      bio: 'Passionate about web development and AI',
      learningStyle: 'visual'
    },
    gamification: {
      totalPoints: 2850,
      level: 29,
      badges: [
        { name: 'First Steps', description: 'Completed first module', icon: '🎯' },
        { name: 'Week Warrior', description: 'Completed 7 days streak', icon: '🔥' },
        { name: 'Course Completed', description: 'Completed a full course', icon: '🏆' },
        { name: 'Perfect Score', description: 'Got 100% on a quiz', icon: '💯' }
      ],
      streakDays: 15,
      lastActivityDate: new Date()
    }
  },
  {
    username: 'sarah_coding',
    email: 'sarah@example.com',
    password: 'password123',
    firstName: 'Sarah',
    lastName: 'Johnson',
    role: 'student',
    profile: {
      bio: 'Full-stack developer and lifelong learner',
      learningStyle: 'kinesthetic'
    },
    gamification: {
      totalPoints: 2450,
      level: 25,
      badges: [
        { name: 'First Steps', description: 'Completed first module', icon: '🎯' },
        { name: 'Week Warrior', description: 'Completed 7 days streak', icon: '🔥' },
        { name: 'Course Completed', description: 'Completed a full course', icon: '🏆' }
      ],
      streakDays: 8,
      lastActivityDate: new Date()
    }
  },
  {
    username: 'mike_tech',
    email: 'mike@example.com',
    password: 'password123',
    firstName: 'Michael',
    lastName: 'Chen',
    role: 'student',
    profile: {
      bio: 'Software engineering student',
      learningStyle: 'reading'
    },
    gamification: {
      totalPoints: 2100,
      level: 21,
      badges: [
        { name: 'First Steps', description: 'Completed first module', icon: '🎯' },
        { name: 'Perfect Score', description: 'Got 100% on a quiz', icon: '💯' }
      ],
      streakDays: 12,
      lastActivityDate: new Date()
    }
  },
  {
    username: 'emma_learn',
    email: 'emma@example.com',
    password: 'password123',
    firstName: 'Emma',
    lastName: 'Wilson',
    role: 'student',
    profile: {
      bio: 'Data science enthusiast',
      learningStyle: 'visual'
    },
    gamification: {
      totalPoints: 1950,
      level: 20,
      badges: [
        { name: 'First Steps', description: 'Completed first module', icon: '🎯' },
        { name: 'Week Warrior', description: 'Completed 7 days streak', icon: '🔥' }
      ],
      streakDays: 5,
      lastActivityDate: new Date()
    }
  },
  {
    username: 'david_code',
    email: 'david@example.com',
    password: 'password123',
    firstName: 'David',
    lastName: 'Brown',
    role: 'student',
    profile: {
      bio: 'Mobile app developer',
      learningStyle: 'auditory'
    },
    gamification: {
      totalPoints: 1750,
      level: 18,
      badges: [
        { name: 'First Steps', description: 'Completed first module', icon: '🎯' },
        { name: 'Course Completed', description: 'Completed a full course', icon: '🏆' }
      ],
      streakDays: 3,
      lastActivityDate: new Date()
    }
  },
  {
    username: 'lisa_dev',
    email: 'lisa@example.com',
    password: 'password123',
    firstName: 'Lisa',
    lastName: 'Davis',
    role: 'student',
    profile: {
      bio: 'Frontend developer and UI/UX designer',
      learningStyle: 'visual'
    },
    gamification: {
      totalPoints: 1600,
      level: 16,
      badges: [
        { name: 'First Steps', description: 'Completed first module', icon: '🎯' },
        { name: 'Perfect Score', description: 'Got 100% on a quiz', icon: '💯' }
      ],
      streakDays: 7,
      lastActivityDate: new Date()
    }
  },
  {
    username: 'john_instructor',
    email: 'john@example.com',
    password: 'password123',
    firstName: 'John',
    lastName: 'Smith',
    role: 'instructor',
    profile: {
      bio: 'Senior Software Engineer with 10 years experience',
      learningStyle: 'reading'
    },
    gamification: {
      totalPoints: 500,
      level: 5,
      badges: [
        { name: 'First Steps', description: 'Completed first module', icon: '🎯' }
      ],
      streakDays: 1,
      lastActivityDate: new Date()
    }
  },
  {
    username: 'jane_teacher',
    email: 'jane@example.com',
    password: 'password123',
    firstName: 'Jane',
    lastName: 'Williams',
    role: 'instructor',
    profile: {
      bio: 'AI and Machine Learning expert',
      learningStyle: 'visual'
    },
    gamification: {
      totalPoints: 300,
      level: 3,
      badges: [
        { name: 'First Steps', description: 'Completed first module', icon: '🎯' }
      ],
      streakDays: 2,
      lastActivityDate: new Date()
    }
  }
];

const demoCourses = [
  {
    title: 'JavaScript Fundamentals',
    description: 'Learn the basics of JavaScript programming language, including variables, functions, and DOM manipulation.',
    category: 'Web Development',
    difficulty: 'beginner',
    duration: 12,
    isPublished: true,
    modules: [
      {
        title: 'Introduction to JavaScript',
        description: 'Understanding what JavaScript is and its role in web development',
        content: `<h3>What is JavaScript?</h3>
        <p>JavaScript is a high-level, interpreted programming language that is primarily used for creating dynamic and interactive web content. It was created by Brendan Eich in 1995 and has since become one of the most popular programming languages in the world.</p>
        
        <h3>Key Features of JavaScript:</h3>
        <ul>
          <li>Dynamic typing</li>
          <li>First-class functions</li>
          <li>Prototype-based object-oriented programming</li>
          <li>Event-driven programming</li>
        </ul>
        
        <h3>Where JavaScript is Used:</h3>
        <p>JavaScript is used in various environments including web browsers, server-side development (Node.js), mobile applications, and desktop applications.</p>`,
        order: 1,
        quizzes: [
          {
            question: 'What year was JavaScript created?',
            options: ['1993', '1995', '1997', '1999'],
            correctAnswer: 1,
            points: 10
          },
          {
            question: 'Who created JavaScript?',
            options: ['Tim Berners-Lee', 'Brendan Eich', 'Douglas Crockford', 'John Resig'],
            correctAnswer: 1,
            points: 10
          }
        ]
      },
      {
        title: 'Variables and Data Types',
        description: 'Learn about JavaScript variables, primitive data types, and how to work with them',
        content: `<h3>JavaScript Variables</h3>
        <p>Variables are containers for storing data values. In JavaScript, you can declare variables using var, let, or const.</p>
        
        <h3>Variable Declaration:</h3>
        <pre><code>
let name = "John";
const age = 25;
var city = "New York";
        </code></pre>
        
        <h3>Data Types:</h3>
        <ul>
          <li><strong>String:</strong> Text data</li>
          <li><strong>Number:</strong> Numeric data</li>
          <li><strong>Boolean:</strong> true or false</li>
          <li><strong>Undefined:</strong> Variable declared but not assigned</li>
          <li><strong>Null:</strong> Intentional absence of value</li>
        </ul>`,
        order: 2,
        quizzes: [
          {
            question: 'Which keyword is used to declare a constant variable?',
            options: ['var', 'let', 'const', 'constant'],
            correctAnswer: 2,
            points: 10
          },
          {
            question: 'What data type is the value "Hello World"?',
            options: ['Number', 'String', 'Boolean', 'Object'],
            correctAnswer: 1,
            points: 10
          }
        ]
      },
      {
        title: 'Functions and Scope',
        description: 'Understanding JavaScript functions, parameters, and variable scope',
        content: `<h3>JavaScript Functions</h3>
        <p>Functions are reusable blocks of code that perform a specific task. They are one of the fundamental building blocks of JavaScript.</p>
        
        <h3>Function Declaration:</h3>
        <pre><code>
function greet(name) {
    return "Hello, " + name + "!";
}
        </code></pre>
        
        <h3>Function Expression:</h3>
        <pre><code>
const greet = function(name) {
    return "Hello, " + name + "!";
};
        </code></pre>
        
        <h3>Arrow Functions:</h3>
        <pre><code>
const greet = (name) => {
    return "Hello, " + name + "!";
};
        </code></pre>
        
        <h3>Scope:</h3>
        <p>Scope determines where variables can be accessed in your code. JavaScript has function scope and block scope.</p>`,
        order: 3,
        quizzes: [
          {
            question: 'Which of the following is the correct syntax for an arrow function?',
            options: ['=> function(x) { return x * 2; }', 'const double = x => x * 2;', 'function => (x) { return x * 2; }', 'const double = (x) function { return x * 2; }'],
            correctAnswer: 1,
            points: 10
          },
          {
            question: 'What is the scope of a variable declared with let inside a function?',
            options: ['Global scope', 'Function scope', 'Block scope', 'Module scope'],
            correctAnswer: 1,
            points: 10
          }
        ]
      },
      {
        title: 'DOM Manipulation',
        description: 'Learn how to interact with HTML elements using JavaScript',
        content: `<h3>What is the DOM?</h3>
        <p>The Document Object Model (DOM) is a programming interface for HTML documents. It represents the page so that programs can change the document structure, style, and content.</p>
        
        <h3>Selecting Elements:</h3>
        <pre><code>
// By ID
const element = document.getElementById('myId');

// By class name
const elements = document.getElementsByClassName('myClass');

// By CSS selector
const element = document.querySelector('.myClass');
const elements = document.querySelectorAll('div');
        </code></pre>
        
        <h3>Modifying Elements:</h3>
        <pre><code>
// Change text content
element.textContent = 'New text';

// Change HTML content
element.innerHTML = '<strong>Bold text</strong>';

// Change style
element.style.color = 'red';
element.style.fontSize = '20px';
        </code></pre>
        
        <h3>Event Handling:</h3>
        <pre><code>
element.addEventListener('click', function() {
    alert('Element clicked!');
});
        </code></pre>`,
        order: 4,
        quizzes: [
          {
            question: 'Which method is used to select an element by its ID?',
            options: ['document.querySelector()', 'document.getElementById()', 'document.getElementsByClassName()', 'document.select()'],
            correctAnswer: 1,
            points: 10
          },
          {
            question: 'Which property is used to change the text content of an element?',
            options: ['innerHTML', 'textContent', 'innerText', 'content'],
            correctAnswer: 1,
            points: 10
          }
        ]
      }
    ]
  },
  {
    title: 'React.js Complete Guide',
    description: 'Master React.js from basics to advanced concepts including hooks, state management, and modern React patterns.',
    category: 'Web Development',
    difficulty: 'intermediate',
    duration: 20,
    isPublished: true,
    modules: [
      {
        title: 'Introduction to React',
        description: 'Understanding React and its core concepts',
        content: `<h3>What is React?</h3>
        <p>React is a JavaScript library for building user interfaces, particularly web applications. It was created by Facebook and is now maintained by Facebook and the community.</p>
        
        <h3>Key Concepts:</h3>
        <ul>
          <li><strong>Components:</strong> Reusable pieces of UI</li>
          <li><strong>JSX:</strong> JavaScript XML syntax</li>
          <li><strong>Virtual DOM:</strong> Efficient DOM updates</li>
          <li><strong>Props:</strong> Data passed to components</li>
          <li><strong>State:</strong> Component's internal data</li>
        </ul>
        
        <h3>Why React?</h3>
        <p>React makes it easier to create interactive UIs with its component-based architecture and efficient rendering system.</p>`,
        order: 1,
        quizzes: [
          {
            question: 'What is JSX?',
            options: ['A JavaScript framework', 'A syntax extension for JavaScript', 'A CSS preprocessor', 'A database query language'],
            correctAnswer: 1,
            points: 10
          },
          {
            question: 'What is the Virtual DOM?',
            options: ['A real DOM element', 'A JavaScript representation of the real DOM', 'A CSS framework', 'A database'],
            correctAnswer: 1,
            points: 10
          }
        ]
      },
      {
        title: 'Components and Props',
        description: 'Learn how to create and use React components with props',
        content: `<h3>React Components</h3>
        <p>Components are the building blocks of React applications. They are reusable pieces of code that return JSX.</p>
        
        <h3>Functional Components:</h3>
        <pre><code>
function Welcome(props) {
    return <h1>Hello, {props.name}!</h1>;
}
        </code></pre>
        
        <h3>Class Components:</h3>
        <pre><code>
class Welcome extends React.Component {
    render() {
        return <h1>Hello, {this.props.name}!</h1>;
    }
}
        </code></pre>
        
        <h3>Props:</h3>
        <p>Props are arguments passed into React components. They are passed to components via HTML attributes.</p>
        
        <pre><code>
<Welcome name="Sarah" age={25} />
        </code></pre>`,
        order: 2,
        quizzes: [
          {
            question: 'How do you pass data to a React component?',
            options: ['Through state', 'Through props', 'Through context', 'Through refs'],
            correctAnswer: 1,
            points: 10
          },
          {
            question: 'What is the difference between functional and class components?',
            options: ['No difference', 'Functional components cannot use state', 'Class components are deprecated', 'Functional components are faster'],
            correctAnswer: 1,
            points: 10
          }
        ]
      },
      {
        title: 'State and Lifecycle',
        description: 'Understanding component state and lifecycle methods',
        content: `<h3>Component State</h3>
        <p>State is a way to store and manage data that can change over time in a React component.</p>
        
        <h3>useState Hook:</h3>
        <pre><code>
import React, { useState } from 'react';

function Counter() {
    const [count, setCount] = useState(0);
    
    return (
        <div>
            <p>Count: {count}</p>
            <button onClick={() => setCount(count + 1)}>
                Increment
            </button>
        </div>
    );
}
        </code></pre>
        
        <h3>useEffect Hook:</h3>
        <pre><code>
import React, { useState, useEffect } from 'react';

function Example() {
    const [count, setCount] = useState(0);
    
    useEffect(() => {
        document.title = \`You clicked \${count} times\`;
    });
    
    return (
        <div>
            <p>You clicked {count} times</p>
            <button onClick={() => setCount(count + 1)}>
                Click me
            </button>
        </div>
    );
}
        </code></pre>`,
        order: 3,
        quizzes: [
          {
            question: 'Which hook is used to manage state in functional components?',
            options: ['useContext', 'useState', 'useEffect', 'useReducer'],
            correctAnswer: 1,
            points: 10
          },
          {
            question: 'When does useEffect run by default?',
            options: ['Only on mount', 'Only on unmount', 'After every render', 'Only when state changes'],
            correctAnswer: 2,
            points: 10
          }
        ]
      }
    ]
  },
  {
    title: 'Python for Data Science',
    description: 'Learn Python programming with focus on data analysis, visualization, and machine learning basics.',
    category: 'Data Science',
    difficulty: 'beginner',
    duration: 15,
    isPublished: true,
    modules: [
      {
        title: 'Python Basics',
        description: 'Introduction to Python programming language',
        content: `<h3>What is Python?</h3>
        <p>Python is a high-level, interpreted programming language known for its simplicity and readability. It's widely used in data science, web development, automation, and artificial intelligence.</p>
        
        <h3>Python Features:</h3>
        <ul>
          <li>Easy to learn and use</li>
          <li>Extensive standard library</li>
          <li>Cross-platform compatibility</li>
          <li>Strong community support</li>
          <li>Versatile applications</li>
        </ul>
        
        <h3>Basic Syntax:</h3>
        <pre><code>
# Variables
name = "Alice"
age = 30
height = 5.6

# Print statement
print(f"Hello, {name}! You are {age} years old.")

# Lists
fruits = ["apple", "banana", "orange"]
print(fruits[0])  # Output: apple
        </code></pre>`,
        order: 1,
        quizzes: [
          {
            question: 'Which symbol is used for comments in Python?',
            options: ['//', '/* */', '#', '<!-- -->'],
            correctAnswer: 2,
            points: 10
          },
          {
            question: 'What is the correct way to create a list in Python?',
            options: ['list = {1, 2, 3}', 'list = [1, 2, 3]', 'list = (1, 2, 3)', 'list = 1, 2, 3'],
            correctAnswer: 1,
            points: 10
          }
        ]
      },
      {
        title: 'Data Structures',
        description: 'Working with lists, dictionaries, and other data structures',
        content: `<h3>Python Data Structures</h3>
        <p>Python provides several built-in data structures that are essential for data science work.</p>
        
        <h3>Lists:</h3>
        <pre><code>
# Creating and manipulating lists
numbers = [1, 2, 3, 4, 5]
numbers.append(6)
numbers.remove(2)
print(numbers)  # [1, 3, 4, 5, 6]
        </code></pre>
        
        <h3>Dictionaries:</h3>
        <pre><code>
# Creating dictionaries
person = {
    "name": "John",
    "age": 30,
    "city": "New York"
}
print(person["name"])  # John
person["age"] = 31
        </code></pre>
        
        <h3>Tuples:</h3>
        <pre><code>
# Tuples are immutable
coordinates = (10, 20)
x, y = coordinates  # Unpacking
print(f"X: {x}, Y: {y}")
        </code></pre>`,
        order: 2,
        quizzes: [
          {
            question: 'Which data structure is mutable in Python?',
            options: ['Tuple', 'String', 'List', 'Integer'],
            correctAnswer: 2,
            points: 10
          },
          {
            question: 'How do you access a value in a dictionary?',
            options: ['dict[key]', 'dict.get(key)', 'Both A and B', 'dict(key)'],
            correctAnswer: 2,
            points: 10
          }
        ]
      },
      {
        title: 'NumPy and Pandas',
        description: 'Introduction to NumPy arrays and Pandas DataFrames',
        content: `<h3>NumPy</h3>
        <p>NumPy is a library for working with arrays and mathematical operations. It's the foundation of most data science libraries in Python.</p>
        
        <h3>NumPy Arrays:</h3>
        <pre><code>
import numpy as np

# Creating arrays
arr1 = np.array([1, 2, 3, 4, 5])
arr2 = np.array([[1, 2, 3], [4, 5, 6]])

# Array operations
print(arr1 * 2)  # [2, 4, 6, 8, 10]
print(np.mean(arr1))  # 3.0
        </code></pre>
        
        <h3>Pandas</h3>
        <p>Pandas is a library for data manipulation and analysis. It provides data structures like DataFrame and Series.</p>
        
        <h3>DataFrames:</h3>
        <pre><code>
import pandas as pd

# Creating a DataFrame
data = {
    'Name': ['Alice', 'Bob', 'Charlie'],
    'Age': [25, 30, 35],
    'City': ['New York', 'London', 'Tokyo']
}
df = pd.DataFrame(data)
print(df)
        </code></pre>`,
        order: 3,
        quizzes: [
          {
            question: 'What is the main data structure in Pandas?',
            options: ['Array', 'DataFrame', 'List', 'Dictionary'],
            correctAnswer: 1,
            points: 10
          },
          {
            question: 'Which library is primarily used for numerical operations in Python?',
            options: ['Pandas', 'Matplotlib', 'NumPy', 'Scikit-learn'],
            correctAnswer: 2,
            points: 10
          }
        ]
      }
    ]
  },
  {
    title: 'Machine Learning Fundamentals',
    description: 'Introduction to machine learning concepts, algorithms, and practical applications using Python.',
    category: 'Artificial Intelligence',
    difficulty: 'advanced',
    duration: 25,
    isPublished: true,
    modules: [
      {
        title: 'What is Machine Learning?',
        description: 'Understanding the basics of machine learning and its applications',
        content: `<h3>Machine Learning Definition</h3>
        <p>Machine Learning is a subset of artificial intelligence that enables computers to learn and make decisions from data without being explicitly programmed for every task.</p>
        
        <h3>Types of Machine Learning:</h3>
        <ul>
          <li><strong>Supervised Learning:</strong> Learning with labeled data</li>
          <li><strong>Unsupervised Learning:</strong> Finding patterns in unlabeled data</li>
          <li><strong>Reinforcement Learning:</strong> Learning through trial and error</li>
        </ul>
        
        <h3>Common Applications:</h3>
        <ul>
          <li>Image recognition</li>
          <li>Natural language processing</li>
          <li>Recommendation systems</li>
          <li>Fraud detection</li>
          <li>Autonomous vehicles</li>
        </ul>
        
        <h3>Machine Learning Process:</h3>
        <ol>
          <li>Data collection and preparation</li>
          <li>Model selection and training</li>
          <li>Model evaluation and validation</li>
          <li>Deployment and monitoring</li>
        </ol>`,
        order: 1,
        quizzes: [
          {
            question: 'Which type of machine learning uses labeled data?',
            options: ['Unsupervised Learning', 'Supervised Learning', 'Reinforcement Learning', 'Deep Learning'],
            correctAnswer: 1,
            points: 10
          },
          {
            question: 'What is the first step in the machine learning process?',
            options: ['Model training', 'Data collection', 'Model evaluation', 'Deployment'],
            correctAnswer: 1,
            points: 10
          }
        ]
      },
      {
        title: 'Supervised Learning Algorithms',
        description: 'Learn about classification and regression algorithms',
        content: `<h3>Supervised Learning</h3>
        <p>Supervised learning uses labeled training data to learn a mapping from inputs to outputs.</p>
        
        <h3>Classification Algorithms:</h3>
        <ul>
          <li><strong>Logistic Regression:</strong> Binary and multi-class classification</li>
          <li><strong>Decision Trees:</strong> Rule-based classification</li>
          <li><strong>Random Forest:</strong> Ensemble of decision trees</li>
          <li><strong>Support Vector Machines:</strong> Finding optimal decision boundaries</li>
        </ul>
        
        <h3>Regression Algorithms:</h3>
        <ul>
          <li><strong>Linear Regression:</strong> Predicting continuous values</li>
          <li><strong>Polynomial Regression:</strong> Non-linear relationships</li>
          <li><strong>Ridge/Lasso Regression:</strong> Regularized linear regression</li>
        </ul>
        
        <h3>Example - Linear Regression:</h3>
        <pre><code>
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split
import numpy as np

# Sample data
X = np.array([[1], [2], [3], [4], [5]])
y = np.array([2, 4, 6, 8, 10])

# Split data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

# Train model
model = LinearRegression()
model.fit(X_train, y_train)

# Make predictions
predictions = model.predict(X_test)
        </code></pre>`,
        order: 2,
        quizzes: [
          {
            question: 'Which algorithm is best for binary classification?',
            options: ['Linear Regression', 'Logistic Regression', 'K-Means', 'PCA'],
            correctAnswer: 1,
            points: 10
          },
          {
            question: 'What is the main goal of regression algorithms?',
            options: ['Classify data into categories', 'Predict continuous values', 'Cluster similar data', 'Reduce dimensionality'],
            correctAnswer: 1,
            points: 10
          }
        ]
      }
    ]
  },
  {
    title: 'Web Design with CSS',
    description: 'Master CSS styling, layouts, animations, and responsive design principles.',
    category: 'Web Development',
    difficulty: 'beginner',
    duration: 10,
    isPublished: true,
    modules: [
      {
        title: 'CSS Fundamentals',
        description: 'Learn the basics of CSS styling and selectors',
        content: `<h3>What is CSS?</h3>
        <p>CSS (Cascading Style Sheets) is a stylesheet language used to describe the presentation of HTML documents. It controls the visual appearance of web pages.</p>
        
        <h3>CSS Syntax</h3>
        <p>CSS follows a simple syntax pattern where you select elements and apply styles to them.</p>
        <pre><code>
selector {
    property: value;
    property: value;
}
        </code></pre>
        
        <h3>Types of Selectors</h3>
        <p>CSS offers different ways to select HTML elements:</p>
        <ul>
          <li><strong>Element Selector:</strong> Targets all elements of a specific type (e.g., p, h1, div)</li>
          <li><strong>Class Selector:</strong> Targets elements with a specific class attribute using a dot (.)</li>
          <li><strong>ID Selector:</strong> Targets a unique element with a specific ID using a hash (#)</li>
          <li><strong>Universal Selector:</strong> Targets all elements using an asterisk (*)</li>
        </ul>
        
        <h3>Common CSS Properties</h3>
        <p>Here are some frequently used CSS properties:</p>
        <pre><code>
.example {
    color: #333;           /* Text color */
    font-size: 16px;       /* Font size */
    margin: 10px;          /* Outer spacing */
    padding: 20px;         /* Inner spacing */
    background-color: #f0f0f0; /* Background color */
    border: 1px solid #ccc;    /* Border style */
}
        </code></pre>
        
        <h3>Best Practices</h3>
        <p>When writing CSS, remember to:</p>
        <ul>
          <li>Use meaningful class names</li>
          <li>Keep your code organized and commented</li>
          <li>Avoid using too many nested selectors</li>
          <li>Test your styles across different browsers</li>
        </ul>`,
        order: 1,
        quizzes: [
          {
            question: 'Which selector targets elements with a specific class?',
            options: ['#class-name', '.class-name', 'class-name', 'element.class-name'],
            correctAnswer: 1,
            points: 10
          },
          {
            question: 'What does CSS stand for?',
            options: ['Computer Style Sheets', 'Creative Style Sheets', 'Cascading Style Sheets', 'Colorful Style Sheets'],
            correctAnswer: 2,
            points: 10
          }
        ]
      },
      {
        title: 'Layouts and Positioning',
        description: 'Understanding CSS layout techniques and positioning',
        content: `<h3>CSS Layout Models</h3>
        <p>CSS provides several layout models to control how elements are positioned and arranged on the page. Understanding these models is crucial for creating well-structured web layouts.</p>
        
        <h3>The Display Property</h3>
        <p>The display property is fundamental to CSS layout. It determines how an element is displayed:</p>
        <pre><code>
.block { display: block; }        /* Takes full width */
.inline { display: inline; }      /* Flows with text */
.inline-block { display: inline-block; } /* Hybrid approach */
.flex { display: flex; }          /* Flexible layout */
.grid { display: grid; }          /* Grid layout */
        </code></pre>
        
        <h3>Flexbox Layout</h3>
        <p>Flexbox is a powerful layout method that makes it easy to arrange items in rows or columns:</p>
        <pre><code>
.container {
    display: flex;
    justify-content: center;    /* Horizontal alignment */
    align-items: center;        /* Vertical alignment */
    flex-direction: row;        /* Direction of items */
}

.item {
    flex: 1;                    /* Flexible sizing */
    margin: 10px;
}
        </code></pre>
        
        <h3>CSS Grid Layout</h3>
        <p>CSS Grid is perfect for creating complex, two-dimensional layouts:</p>
        <pre><code>
.grid-container {
    display: grid;
    grid-template-columns: repeat(3, 1fr);  /* 3 equal columns */
    grid-gap: 20px;                         /* Space between items */
}

.grid-item {
    background-color: #f0f0f0;
    padding: 20px;
}
        </code></pre>
        
        <h3>Positioning</h3>
        <p>CSS positioning allows you to control exactly where elements appear:</p>
        <ul>
          <li><strong>Static:</strong> Default positioning, follows document flow</li>
          <li><strong>Relative:</strong> Positioned relative to its normal position</li>
          <li><strong>Absolute:</strong> Positioned relative to its nearest positioned ancestor</li>
          <li><strong>Fixed:</strong> Positioned relative to the viewport</li>
          <li><strong>Sticky:</strong> Toggles between relative and fixed positioning</li>
        </ul>`,
        order: 2,
        quizzes: [
          {
            question: 'Which display value is used for flexbox layouts?',
            options: ['flex', 'flexbox', 'flexible', 'flex-container'],
            correctAnswer: 0,
            points: 10
          },
          {
            question: 'What property is used to control the main axis alignment in flexbox?',
            options: ['align-items', 'justify-content', 'align-content', 'flex-direction'],
            correctAnswer: 1,
            points: 10
          }
        ]
      }
    ]
  }
];

// Seeding function
async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');
    
    // COMPLETELY CLEAR the database
    console.log('🧹 Clearing ALL existing data...');
    await User.deleteMany({});
    await Course.deleteMany({});
    await Progress.deleteMany({});
    console.log('✅ Database completely cleared');

    // Create users
    const hashedUsers = await Promise.all(
      demoUsers.map(async (user) => {
        const hashedPassword = await bcrypt.hash(user.password, 12);
        return { ...user, password: hashedPassword };
      })
    );
    
    const createdUsers = await User.insertMany(hashedUsers);
    console.log(`👥 Created ${createdUsers.length} users`);

    // Find instructors
    const instructors = createdUsers.filter(user => user.role === 'instructor');
    
    // Create courses with instructor assignments
    const coursesWithInstructors = demoCourses.map((course, index) => ({
      ...course,
      instructor: instructors[index % instructors.length]._id
    }));
    
    const createdCourses = await Course.insertMany(coursesWithInstructors);
    console.log(`📚 Created ${createdCourses.length} courses`);

    // Create some enrollments and progress
    const students = createdUsers.filter(user => user.role === 'student');
    const progressData = [];
    
    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      const numCoursesToEnroll = Math.floor(Math.random() * 3) + 1; // 1-3 courses per student
      
      for (let j = 0; j < numCoursesToEnroll && j < createdCourses.length; j++) {
        const course = createdCourses[j];
        
        // Add student to course
        course.enrolledStudents.push(student._id);
        student.enrolledCourses.push(course._id);
        
        // Create progress
        const numCompletedModules = Math.floor(Math.random() * course.modules.length);
        const completedModules = Array.from({length: numCompletedModules}, (_, index) => index);
        
        progressData.push({
          user: student._id,
          course: course._id,
          completedModules: completedModules,
          overallProgress: (completedModules.length / course.modules.length) * 100,
          timeSpent: Math.floor(Math.random() * 300) + 60, // 60-360 minutes
          lastAccessed: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Random date within last week
        });
      }
    }
    
    // Save updated courses and users
    await Promise.all([
      ...createdCourses.map(course => course.save()),
      ...createdUsers.map(user => user.save())
    ]);
    
    // Create progress records
    if (progressData.length > 0) {
      await Progress.insertMany(progressData);
      console.log(`📈 Created ${progressData.length} progress records`);
    }

    console.log('✅ Database seeding completed successfully!');
    console.log(`
🎯 Summary:
- Database COMPLETELY cleared and recreated
- ${createdUsers.length} users created
- ${createdCourses.length} courses created with CLEAN content
- ${progressData.length} progress records created
- All quiz content is now properly separated from theory content

📊 Demo Users for Testing:
- alex@example.com (2850 points, Level 29)
- sarah@example.com (2450 points, Level 25)
- mike@example.com (2100 points, Level 21)
- emma@example.com (1950 points, Level 20)
- Password for all users: password123

🎉 Theory and Quiz are now properly separated!
📚 No quiz HTML embedded in content!
🎮 Quiz only appears when "Take Quiz" button is clicked!
    `);
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the seeder
seedDatabase();