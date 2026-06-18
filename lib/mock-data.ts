/**
 * Mock data for DEV_MODE — used when MongoDB is not connected.
 * Updated to match the production schema (fullName, adminId, etc.)
 */

export const MOCK_COURSES = [
  {
    _id: 'course_001',
    title: 'Complete Python for Beginners',
    description: 'Master Python from scratch with hands-on projects. Covers variables, loops, functions, OOP, file handling, and more.',
    thumbnail: '',
    slug: 'complete-python-beginners',
    category: 'Programming',
    level: 'Beginner',
    adminId: 'dev_user_admin',
    isPublished: true,
    totalStudents: 12,
    totalRevenue: 3600,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    chapterCount: 3,
    startingPrice: 300,
  },
  {
    _id: 'course_002',
    title: 'Full Stack Web Development',
    description: 'Build production-ready web apps with React, Node.js, Express, and MongoDB. Includes cloud deployment.',
    thumbnail: '',
    slug: 'full-stack-web-dev',
    category: 'Programming',
    level: 'Intermediate',
    adminId: 'dev_user_admin',
    isPublished: true,
    totalStudents: 8,
    totalRevenue: 4000,
    createdAt: new Date('2025-02-01'),
    updatedAt: new Date('2025-02-01'),
    chapterCount: 4,
    startingPrice: 500,
  },
  {
    _id: 'course_003',
    title: 'UI/UX Design Masterclass',
    description: 'Learn professional UI/UX design using Figma. Covers design systems, prototyping, and user research.',
    thumbnail: '',
    slug: 'uiux-design-masterclass',
    category: 'Design',
    level: 'All Levels',
    adminId: 'dev_user_admin',
    isPublished: true,
    totalStudents: 5,
    totalRevenue: 2000,
    createdAt: new Date('2025-03-01'),
    updatedAt: new Date('2025-03-01'),
    chapterCount: 2,
    startingPrice: 400,
  },
]

export const MOCK_CHAPTERS: Record<string, Array<{
  _id: string
  courseId: string
  title: string
  description: string
  videoUrl: string
  videoProvider: 'cloudinary' | 'external'
  cloudinaryPublicId: string
  duration: number
  order: number
  price: number
  isFree: boolean
  isPublished: boolean
  isPurchased: boolean
  createdAt: Date
  updatedAt: Date
}>> = {
  course_001: [
    { _id: 'ch_001', courseId: 'course_001', title: 'Introduction & Setup', description: 'Install Python and set up your dev environment.', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', videoProvider: 'external', cloudinaryPublicId: '', duration: 1800, order: 0, price: 0, isFree: true, isPublished: true, isPurchased: true, createdAt: new Date(), updatedAt: new Date() },
    { _id: 'ch_002', courseId: 'course_001', title: 'Variables & Data Types', description: 'Strings, integers, floats, booleans, and type conversion.', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', videoProvider: 'external', cloudinaryPublicId: '', duration: 2700, order: 1, price: 300, isFree: false, isPublished: true, isPurchased: true, createdAt: new Date(), updatedAt: new Date() },
    { _id: 'ch_003', courseId: 'course_001', title: 'Control Flow & Loops', description: 'if/else, for loops, while loops, and list comprehensions.', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', videoProvider: 'external', cloudinaryPublicId: '', duration: 3600, order: 2, price: 400, isFree: false, isPublished: true, isPurchased: true, createdAt: new Date(), updatedAt: new Date() },
  ],
  course_002: [
    { _id: 'ch_004', courseId: 'course_002', title: 'HTML & CSS Fundamentals', description: 'Semantic HTML5 and modern CSS3 with Flexbox/Grid.', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', videoProvider: 'external', cloudinaryPublicId: '', duration: 3600, order: 0, price: 0, isFree: true, isPublished: true, isPurchased: true, createdAt: new Date(), updatedAt: new Date() },
    { _id: 'ch_005', courseId: 'course_002', title: 'JavaScript Essentials', description: 'ES6+, DOM manipulation, async/await, and fetch API.', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', videoProvider: 'external', cloudinaryPublicId: '', duration: 5400, order: 1, price: 500, isFree: false, isPublished: true, isPurchased: true, createdAt: new Date(), updatedAt: new Date() },
    { _id: 'ch_006', courseId: 'course_002', title: 'React from Zero', description: 'Components, hooks, state management, and routing.', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', videoProvider: 'external', cloudinaryPublicId: '', duration: 7200, order: 2, price: 700, isFree: false, isPublished: true, isPurchased: true, createdAt: new Date(), updatedAt: new Date() },
    { _id: 'ch_007', courseId: 'course_002', title: 'Node.js & MongoDB Backend', description: 'REST APIs, Express.js, Mongoose, authentication.', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', videoProvider: 'external', cloudinaryPublicId: '', duration: 9000, order: 3, price: 800, isFree: false, isPublished: true, isPurchased: true, createdAt: new Date(), updatedAt: new Date() },
  ],
  course_003: [
    { _id: 'ch_008', courseId: 'course_003', title: 'Figma Basics & Design Thinking', description: 'Interface overview, frames, auto layout, and design systems.', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', videoProvider: 'external', cloudinaryPublicId: '', duration: 2700, order: 0, price: 0, isFree: true, isPublished: true, isPurchased: true, createdAt: new Date(), updatedAt: new Date() },
    { _id: 'ch_009', courseId: 'course_003', title: 'Prototyping & User Testing', description: 'Interactive prototypes, user flows, and usability testing.', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', videoProvider: 'external', cloudinaryPublicId: '', duration: 4500, order: 1, price: 600, isFree: false, isPublished: true, isPurchased: true, createdAt: new Date(), updatedAt: new Date() },
  ],
}

export const MOCK_PAYMENTS = [
  {
    _id: 'pay_001',
    userId: 'dev_user_admin',
    chapterId: { _id: 'ch_002', title: 'Variables & Data Types', price: 300 },
    method: 'easypaisa',
    amount: 300,
    transactionId: 'EP1234567890',
    screenshotUrl: 'https://i.imgur.com/ZdJSK29.png',
    status: 'approved',
    adminNote: 'Verified ✓',
    createdAt: new Date('2025-03-15'),
    updatedAt: new Date('2025-03-15'),
  },
  {
    _id: 'pay_002',
    userId: 'dev_user_admin',
    chapterId: { _id: 'ch_003', title: 'Control Flow & Loops', price: 400 },
    method: 'jazzcash',
    amount: 400,
    transactionId: 'JC9876543210',
    screenshotUrl: 'https://i.imgur.com/ZdJSK29.png',
    status: 'pending',
    adminNote: '',
    createdAt: new Date('2025-04-01'),
    updatedAt: new Date('2025-04-01'),
  },
]

export const MOCK_USERS = [
  { _id: 'u_001', clerkId: 'dev_user_admin', email: 'admin@maqbool.local', fullName: 'Dev Admin', role: 'admin', createdAt: new Date('2025-01-01') },
  { _id: 'u_002', clerkId: 'user_student_001', email: 'student1@gmail.com', fullName: 'Ahmed Khan', role: 'student', createdAt: new Date('2025-02-10') },
  { _id: 'u_003', clerkId: 'user_student_002', email: 'student2@gmail.com', fullName: 'Sara Ali', role: 'student', createdAt: new Date('2025-03-05') },
]
